import MedicalReport from '../model/MedicalReports.js';
import { uploadToCloudinary } from '../middleware/upload.js';

export const uploadMedicalReports = async (files, body) => {
    const uploadedReports = [];

    for (const file of files) {
        // Upload to Cloudinary
        const result = await uploadToCloudinary(file, 'medical-reports');

        let patient = await Patient.findById(body.patientId);

        const medicalReport = new MedicalReport({
            patientId: patient._id,
            doctorId: body.doctorId,
            title: body.title,
            description: body.description,
            reportType: body.reportType,
            diagnosis: body.diagnosis,
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

export const viewMedicalReportByDoctor = async (doctorId) => {
    return await MedicalReport.find({ doctorId }).sort({ uploadedAt: -1 })
}

//delete medical reports
export const deletemedicalReport = async (reportId) => {
    return await MedicalReport.findByIdAndDelete(reportId);
}


//update medical Reports
export const updateMedicalReport = async (reportId, files, body) => {

    let updateData = {};

    if (files && files.length > 0) {
        const result = await uploadToCloudinary(files[0], 'medical-reports');
        updateData.file = { url: result.secure_url };
    }

    if (body.title) updateData.title = body.title;
    if (body.description) updateData.description = body.description;
    if (body.reportType) updateData.reportType = body.reportType;
    if (body.diagnosis) updateData.diagnosis = body.diagnosis;


    const updatedReport = await MedicalReport.findByIdAndUpdate(
        reportId,
        updateData,
        { new: true }
    );

    return updatedReport;
}