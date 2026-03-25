import mongoose from "mongoose";

const AvailabilitySchema = new mongoose.Schema(
  {
    // We store doctorUserId (userId from JWT) to keep identity consistent across services
    doctorUserId: { type: String, required: true, index: true },
    startTime: { type: Date, required: true, index: true },
    endTime: { type: Date, required: true, index: true }
  },
  { timestamps: true }
);

AvailabilitySchema.index({ doctorUserId: 1, startTime: 1, endTime: 1 });

export default mongoose.model("Availability", AvailabilitySchema);