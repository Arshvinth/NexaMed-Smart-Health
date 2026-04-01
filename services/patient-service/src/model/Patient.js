import mongoose from "mongoose";

const PatientSchema = new mongoose.Schema({
    fullName: {
        required: true,
        type: String
    },

    email: {
        type: String,
        required: true,
        unique: true
    },
    mobileNumber: {
        type: String,
        required: true,
        unique: true
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
    currentmedication: [String],
    isActive: {
        type: Boolean,
        default: true
    }


}, { timestamps: true });

export default mongoose.model("Patient", PatientSchema);