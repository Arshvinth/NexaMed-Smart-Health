import stripe from "../config/stripe.js";
import {
  createPaymentIntent,
  confirmPayment,
  getPaymentById,
  listPayments,
  getPaymentByAppointmentId,
} from "../services/paymentService.js";

// POST /api/payments/create-intent
export async function postCreatePaymentIntent(req, res) {
  const { appointmentId, amount } = req.body;
  const patientUserId = req.user.userId;

  if (!appointmentId || !amount) {
    return res
      .status(400)
      .json({ message: "appointmentId and amount are required" });
  }

  console.log(
    `[create-intent] appointment=${appointmentId}, patient=${patientUserId}, amount=${amount}`,
  );
  const result = await createPaymentIntent({
    appointmentId,
    patientUserId,
    amount,
  });
  res.status(201).json(result);
}

// POST /api/payments/webhook (unchanged)
export async function postStripeWebhook(req, res) {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    await confirmPayment(paymentIntent.id);
  }
  res.json({ received: true });
}

// POST /api/payments/confirm-appointment
export async function postConfirmAppointment(req, res) {
  const { appointmentId, paymentIntentId, amount } = req.body;
  const patientUserId = req.user.userId;

  console.log(
    `[confirm-appointment] appointment=${appointmentId}, paymentIntent=${paymentIntentId}, user=${patientUserId}`,
  );

  // 1. Find the payment record
  const payment = await getPaymentByAppointmentId(appointmentId);
  console.log(
    "[confirm-appointment] Payment record:",
    payment ? `found (patient=${payment.patientUserId})` : "NOT FOUND",
  );

  if (!payment) {
    console.error(
      `[confirm-appointment] No payment record for appointment ${appointmentId}`,
    );
    return res
      .status(404)
      .json({ message: "Payment record not found. Please retry payment." });
  }

  if (payment.patientUserId !== patientUserId) {
    console.error(
      `[confirm-appointment] User mismatch: payment.patient=${payment.patientUserId}, token.user=${patientUserId}`,
    );
    return res
      .status(403)
      .json({ message: "Forbidden: payment belongs to another user" });
  }

  // 2. Confirm payment (this will also call appointment service)
  try {
    await confirmPayment(paymentIntentId);
    console.log(
      `[confirm-appointment] Payment confirmed for appointment ${appointmentId}`,
    );
    res.json({ message: "Appointment confirmed" });
  } catch (err) {
    console.error(
      `[confirm-appointment] Error confirming payment:`,
      err.message,
    );
    res.status(500).json({ message: err.message || "Internal server error" });
  }
}

// GET /api/payments/:id
export async function getPayment(req, res) {
  const { id } = req.params;
  const payment = await getPaymentById(id);
  if (!payment) return res.status(404).json({ message: "Payment not found" });
  if (payment.patientUserId !== req.user.userId && req.user.role !== "DOCTOR") {
    return res.status(403).json({ message: "Forbidden" });
  }
  res.json(payment);
}

// GET /api/payments (admin only)
export async function getPaymentsAdmin(req, res) {
  const { page = 1, limit = 10, q = "", status = "", fromDate = "", toDate = "" } = req.query;

  const result = await listPayments({
    page: Number(page),
    limit: Number(limit),
    q,
    status,
    fromDate,
    toDate,
  });

  res.json(result);
}
