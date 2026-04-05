import MedicalReport from '../model/MedicalReports.js';
import { uploadToCloudinary } from '../middleware/upload.js';

export const uploadMedicalReports = async (files, patientId) => {
    const uploadedReports = [];

    for (const file of files) {
        // Upload to Cloudinary
        const result = await uploadToCloudinary(file, 'medical-reports');

        const medicalReport = new MedicalReport({
            patientId: patientId,
            file: {
                url: result.secure_url
            }
        });

        await medicalReport.save();
        uploadedReports.push(medicalReport);
    }

    return uploadedReports;
};

export const getMedicalReportsByPatient = async (patientId) => {
    return await MedicalReport.find({ patientId }).sort({ uploadedAt: -1 });
};