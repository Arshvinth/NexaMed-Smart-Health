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