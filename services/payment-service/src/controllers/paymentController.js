import stripe from "../config/stripe.js";
import {
  createPaymentIntent,
  confirmPayment,
  getPaymentById,
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

  const result = await createPaymentIntent({
    appointmentId,
    patientUserId,
    amount,
  });
  res.status(201).json(result);
}

// POST /api/payments/webhook (Stripe webhook)
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

// GET /api/payments/:id (optional, for checking status)
export async function getPayment(req, res) {
  const { id } = req.params;
  const payment = await getPaymentById(id);
  if (!payment) return res.status(404).json({ message: "Payment not found" });
  // Only allow the patient who owns it
  if (payment.patientUserId !== req.user.userId && req.user.role !== "DOCTOR") {
    return res.status(403).json({ message: "Forbidden" });
  }
  res.json(payment);
}
