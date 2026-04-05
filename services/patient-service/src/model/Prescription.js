
import mongoose from "mongoose";

const PrescriptionSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient"
    },
    doctorId: {
        type: String,
        required: true
    },
    file: {
        url: String
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

export default mongoose.model('Prescription', PrescriptionSchema);