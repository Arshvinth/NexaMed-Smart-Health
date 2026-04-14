import mongoose from "mongoose";

const PatientSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    birthDay: {
        type: Date,
        required: true
    },
    gender: {
        type: String,
        enum: ["Female", "Male", "Other"]
    },
    address: {
        line: String,
        city: String,
        country: String
    },
    medicalHistory: [String],
    bloodGroup: String,
    currentMedication: [String],
    isActive: {
        type: Boolean,
        default: true
    }


}, { timestamps: true });

export default mongoose.model("Patient", PatientSchema);