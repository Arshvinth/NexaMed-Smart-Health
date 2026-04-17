import Prescription from '../model/Prescription.js';
import { uploadToCloudinary } from '../middleware/upload.js';

export const uploadPrescriptions = async (files, patientId, doctorId) => {
    const uploadedPrescriptions = [];

    for (const file of files) {
        // Upload to Cloudinary
        const result = await uploadToCloudinary(file, 'prescriptions');

        const prescription = new Prescription({
            patientId: patientId,
            doctorId: doctorId,
            file: {
                url: result.secure_url
            }
        });

        await prescription.save();
        uploadedPrescriptions.push(prescription);
    }

    return uploadedPrescriptions;
};

export const getPrescriptionsByPatient = async (patientId) => {
    return await Prescription.find({ patientId }).sort({ uploadedAt: -1 });
};

export const getPatientByPrescrioption = async (doctorId) => {

    if (!doctorId) {
        throw new Error("Doctor Id is required");
    }

    //get all prescriptions
    const prescriptions = await Prescription.find({ doctorId })
        .populate("patientId");

    if (!prescriptions.length) {
        throw new Error("No Patients found for this doctor");

    }

    //get distinct patients
    const uniquePatients = [];
    const seen = new Set();

    prescriptions.forEach(p => {
        if (p.patientId && !seen.has(p.patientId._id.toString())) {
            seen.add(p.patientId._id.toString());
            uniquePatients.push(p.patientId);
        }

    });

    return uniquePatients;
}



