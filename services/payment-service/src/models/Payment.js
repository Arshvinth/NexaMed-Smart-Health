import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: String,
      required: true,
      index: true,
    },
    patientUserId: {
      type: String,
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    stripePaymentIntentId: {
      type: String,
      index: true,
    },
    transactionId: {
      type: String,
      default: null,
    },
    refundNotAllowed: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Payment", PaymentSchema);
