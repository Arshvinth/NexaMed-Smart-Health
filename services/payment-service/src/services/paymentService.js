import Payment from "../models/Payment.js";
import stripe from "../config/stripe.js";
import axios from "axios";

const appointmentServiceUrl =
  process.env.APPOINTMENT_SERVICE_URL || "http://appointment-service:5003";

export async function createPaymentIntent({
  appointmentId,
  patientUserId,
  amount,
  currency = "usd",
}) {
  const existing = await Payment.findOne({ appointmentId });
  if (existing && existing.status === "completed") {
    const err = new Error("Payment already completed");
    err.statusCode = 409;
    throw err;
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency,
    metadata: { appointmentId, patientUserId },
  });

  let payment = await Payment.findOne({ appointmentId });

  if (payment) {
    payment.status = "pending";
    payment.stripePaymentIntentId = paymentIntent.id;
    payment.amount = amount;
    await payment.save();
  } else {
    payment = await Payment.create({
      appointmentId,
      patientUserId,
      amount,
      status: "pending",
      stripePaymentIntentId: paymentIntent.id,
      refundNotAllowed: true,
    });
  }
  return {
    clientSecret: paymentIntent.client_secret,
    paymentId: payment._id,
    refundNotAllowed: true,
  };
}

export async function confirmPayment(paymentIntentId) {
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (paymentIntent.status !== "succeeded") {
    const err = new Error("Payment not successful");
    err.statusCode = 400;
    throw err;
  }

  const payment = await Payment.findOneAndUpdate(
    { stripePaymentIntentId: paymentIntentId },
    { status: "completed", transactionId: paymentIntent.id },
    { new: true },
  );

  if (!payment) {
    const err = new Error("Payment record not found");
    err.statusCode = 404;
    throw err;
  }
  // Call appointment service to confirm appointment
  // Inside confirmPayment() function, after retrieving payment
  await axios.put(
    `${appointmentServiceUrl}/api/appointments/${payment.appointmentId}/confirm`,
    {
      paymentId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
    },
    {
      headers: {
        "X-Internal-Secret": process.env.INTERNAL_API_SECRET,
      },
    },
  );
}

export async function getPaymentById(paymentId) {
  return Payment.findById(paymentId);
}

export async function listPayments({
  page = 1,
  limit = 10,
  q = "",
  status = "",
  fromDate = "",
  toDate = "",
}) {
  const skip = (page - 1) * limit;
  const filter = {};

  if (status) filter.status = status;

  if (q) {
    filter.$or = [
      { appointmentId: { $regex: q, $options: "i" } },
      { patientUserId: { $regex: q, $options: "i" } },
      { transactionId: { $regex: q, $options: "i" } },
      { stripePaymentIntentId: { $regex: q, $options: "i" } },
    ];
  }

  if (fromDate || toDate) {
    filter.createdAt = {};
    if (fromDate) filter.createdAt.$gte = new Date(fromDate);
    if (toDate) filter.createdAt.$lte = new Date(toDate);
  }

  const [items, total] = await Promise.all([
    Payment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Payment.countDocuments(filter),
  ]);

  return {
    items,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
}
export async function getPaymentByAppointmentId(appointmentId) {
  return Payment.findOne({ appointmentId });
}
