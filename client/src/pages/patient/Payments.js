import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import api from "../../api/client"; // ← use gateway client
import toast from "react-hot-toast";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

function PaymentForm({ appointment, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError("");

    try {
      // 1. Create PaymentIntent via gateway
      const { data } = await api.post("/api/payments/create-intent", {
        appointmentId: appointment._id,
        amount: appointment.paymentAmount,
      });
      const { clientSecret } = data;

      // 2. Confirm card payment with Stripe
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: { name: "Patient" },
        },
      });

      if (result.error) {
        toast.error(result.error.message);
        setError(result.error.message);
      } else {
        // 3. Confirm appointment via gateway
        await api.post("/api/payments/confirm-appointment", {
          appointmentId: appointment._id,
          paymentIntentId: result.paymentIntent.id,
          amount: appointment.paymentAmount,
        });

        toast.success("Payment successful! Your appointment is confirmed.");
        if (onSuccess) onSuccess();
        navigate("/patient/appointments");
      }
    } catch (err) {
      console.error("Payment error:", err.response?.data);
      const msg =
        err.response?.data?.message || "Payment failed. Please try again.";
      toast.error(msg);
      setError(msg);
    } finally {
      setProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#1e293b",
        "::placeholder": { color: "#94a3b8" },
      },
      invalid: { color: "#ef4444" },
    },
    hidePostalCode: true,
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">
          Card Payment
        </h3>
        <div className="space-y-4">
          <div className="border border-slate-200 rounded-xl p-4 transition-all focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-100">
            <CardElement options={cardElementOptions} />
          </div>
          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Appointment Fee</span>
              <span className="font-bold text-slate-800">
                ${appointment.paymentAmount}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!stripe || processing}
          className="px-8 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition disabled:opacity-50"
        >
          {processing ? "Processing..." : "Pay Now"}
        </button>
      </div>
    </form>
  );
}

export default function PaymentPage({ appointment, onSuccess }) {
  if (!appointment) {
    return (
      <div className="text-center py-12 text-slate-500">
        No appointment selected for payment.
      </div>
    );
  }
  return (
    <div className="max-w-md mx-auto">
      <Elements stripe={stripePromise}>
        <PaymentForm appointment={appointment} onSuccess={onSuccess} />
      </Elements>
    </div>
  );
}
