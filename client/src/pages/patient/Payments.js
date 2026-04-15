import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import api from "../../api/client";
import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

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
    try {
      // Create payment intent
      const { data } = await api.post("/api/payments/create-intent", {
        appointmentId: appointment._id,
        amount: appointment.paymentAmount || 50,
      });
      const { clientSecret } = data;
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: elements.getElement(CardElement) },
      });
      if (result.error) {
        toast.error(result.error.message);
        setError(result.error.message);
      } else {
        toast.success("Payment successful! Your appointment is confirmed.");
        // Optional: call onSuccess if you still want to notify parent
        if (onSuccess) onSuccess();
        // Redirect to My Appointments page
        navigate("/patient/appointments");
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Payment failed";
      toast.error(msg);
      setError(msg);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <CardElement className="p-2 border rounded" />
      {error && <p className="text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || processing}
        className="bg-blue-600 text-white p-2 rounded w-full"
      >
        {processing ? "Processing..." : "Pay Now"}
      </button>
    </form>
  );
}

export default function PaymentPage({ appointment, onSuccess }) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm appointment={appointment} onSuccess={onSuccess} />
    </Elements>
  );
}
