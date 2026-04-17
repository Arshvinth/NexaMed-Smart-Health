import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import api from "../../api/client";
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
          card: elements.getElement(CardNumberElement),
          billing_details: { name: "Patient" },
        },
      });

      if (result.error) {
        toast.error(result.error.message, {
          duration: 5000,
          style: {
            background: "#fef2f2",
            color: "#dc2626",
            border: "1px solid #fecaca",
            padding: "12px",
            borderRadius: "12px",
          },
        });
        setError(result.error.message);
      } else {
        // 3. Confirm appointment via gateway
        await api.post("/api/payments/confirm-appointment", {
          appointmentId: appointment._id,
          paymentIntentId: result.paymentIntent.id,
          amount: appointment.paymentAmount,
        });

        toast.success("Payment successful! Your appointment is confirmed.", {
          duration: 5000,
          style: {
            background: "#f0fdf4",
            color: "#16a34a",
            border: "1px solid #bbf7d0",
            padding: "12px",
            borderRadius: "12px",
          },
        });
        if (onSuccess) onSuccess();
        navigate("/patient/appointments");
      }
    } catch (err) {
      console.error("Payment error:", err.response?.data);
      const msg =
        err.response?.data?.message || "Payment failed. Please try again.";
      toast.error(msg, {
        duration: 5000,
        style: {
          background: "#fef2f2",
          color: "#dc2626",
          border: "1px solid #fecaca",
          padding: "12px",
          borderRadius: "12px",
        },
      });
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
        fontFamily: "Inter, system-ui, sans-serif",
        "::placeholder": { color: "#94a3b8" },
      },
      invalid: { color: "#ef4444" },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gradient-to-br from-white to-neutral-50 rounded-2xl shadow-soft border border-neutral-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-100 to-secondary-100 px-6 py-5 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-md">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-display font-bold bg-gradient-to-r from-primary-700 to-secondary-700 bg-clip-text text-transparent">
                Card Payment
              </h3>
              <p className="text-neutral-500 text-xs mt-0.5">
                Secure payment via Stripe
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Card Number Field */}
          <div>
            <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-2">
              Card Number
            </label>
            <div className="border-2 border-neutral-200 rounded-xl p-4 transition-all focus-within:border-primary-400 focus-within:ring-4 focus-within:ring-primary-100 bg-white">
              <CardNumberElement options={cardElementOptions} />
            </div>
          </div>

          {/* Expiry and CVC Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-2">
                Expiry Date
              </label>
              <div className="border-2 border-neutral-200 rounded-xl p-4 transition-all focus-within:border-primary-400 focus-within:ring-4 focus-within:ring-primary-100 bg-white">
                <CardExpiryElement options={cardElementOptions} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-2">
                CVC
              </label>
              <div className="border-2 border-neutral-200 rounded-xl p-4 transition-all focus-within:border-primary-400 focus-within:ring-4 focus-within:ring-primary-100 bg-white">
                <CardCvcElement options={cardElementOptions} />
              </div>
            </div>
          </div>

          {/* Security Indicators */}
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1">
              <svg
                className="w-4 h-4 text-neutral-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <span className="text-xs text-neutral-400">
                Secure encryption
              </span>
            </div>
            <div className="flex items-center gap-1">
              <svg
                className="w-4 h-4 text-neutral-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <span className="text-xs text-neutral-400">PCI compliant</span>
            </div>
          </div>

          {error && (
            <div className="bg-danger-50 border border-danger-200 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-danger-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-sm text-danger-700">{error}</span>
              </div>
            </div>
          )}

          {/* Appointment Fee */}
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-5 border border-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <svg
                    className="w-4 h-4 text-amber-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                    Appointment Fee
                  </span>
                </div>
                <p className="font-bold text-amber-800 text-3xl">
                  ${appointment.paymentAmount}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-xs text-amber-600">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>Including taxes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pay Now Button - No Arrow */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!stripe || processing}
          className="px-8 py-3 bg-gradient-to-r from-secondary-600 to-secondary-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processing ? (
            <>
              <svg
                className="animate-spin h-4 w-4 text-white inline-block mr-2"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Processing...
            </>
          ) : (
            "Pay Now"
          )}
        </button>
      </div>
    </form>
  );
}

export default function PaymentPage({ appointment, onSuccess }) {
  if (!appointment) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-neutral-50 rounded-2xl shadow-soft border border-neutral-200 p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-4">
            <svg
              className="w-8 h-8 text-amber-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <p className="text-neutral-700 font-medium">
            No appointment selected
          </p>
          <p className="text-neutral-500 text-sm mt-1">
            Please select an appointment to proceed with payment.
          </p>
        </div>
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
