import mongoose from "mongoose";

const PrescriptionItemSchema = new mongoose.Schema(
  {
    medicineName: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    durationDays: { type: Number, required: true }
  },
  { _id: false }
);

const PrescriptionSchema = new mongoose.Schema(
  {
    appointmentId: { type: String, required: true, index: true },
    doctorUserId: { type: String, required: true, index: true },
    patientUserId: { type: String, required: true, index: true },

    notes: { type: String, default: "" },
    items: { type: [PrescriptionItemSchema], default: [] }
  },
  { timestamps: true }
);

export default mongoose.model("Prescription", PrescriptionSchema);