import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ["PATIENT", "DOCTOR", "ADMIN"],
      required: true,
      index: true
    },
    verificationStatus: {
      type: String,
      enum: ["PENDING", "VERIFIED", "REJECTED"],
      default: function () {
        return this.role === "DOCTOR" ? "PENDING" : "VERIFIED";
      },
      index: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);