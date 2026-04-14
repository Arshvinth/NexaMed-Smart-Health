import mongoose from "mongoose";

const MedicalReportSchema = new mongoose.Schema({

    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient"
    },
    file: {
        url: String
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

export default mongoose.model('MedicalReport', MedicalReportSchema); 
