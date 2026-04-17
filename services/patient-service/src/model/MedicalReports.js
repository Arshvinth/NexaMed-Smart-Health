import mongoose from "mongoose";

const MedicalReportSchema = new mongoose.Schema({

    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        // ref: "Patient"
        ref: "User"
    },
    doctorId: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },

    description: String,

    reportType: {
        type: String,
        enum: ["Lab Test", "Scan", "Other"]
    },
    diagnosis: String,
    file: {
        url: String
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

export default mongoose.model('MedicalReport', MedicalReportSchema); 
