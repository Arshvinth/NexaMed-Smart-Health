import mongoose from "mongoose";

const AppointmentSchema = new mongoose.Schema(
  {
    patientUserId: {
      type: String,
      required: true,
      index: true,
    },
    doctorUserId: {
      type: String,
      required: true,
      index: true,
    },
    doctorName: {
      type: String,
      required: true,
    },
    doctorSpecialization: {
      type: String,
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
      index: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    queueNumber: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "cancelled_by_patient",
        "cancelled_by_doctor",
        "completed",
      ],
      default: "pending",
      index: true,
    },
    paymentId: {
      type: String,
      default: null,
    },
    paymentAmount: {
      type: Number,
      default: null,
    },
    meetingLink: {
      type: String,
      default: null,
    },
    cancellationReason: {
      type: String,
      default: null,
    },
    rescheduleFromId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

AppointmentSchema.index({ doctorUserId: 1, startTime: 1 }, { unique: true });

export default mongoose.model("Appointment", AppointmentSchema);
