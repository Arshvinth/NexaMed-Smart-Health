import mongoose from 'mongoose';
import MedicalReport from '../model/MedicalReports.js';
import { uploadToCloudinary } from '../middleware/upload.js';
import Patient from '../model/Patient.js';

export const uploadMedicalReports = async (files, body) => {
    const uploadedReports = [];

    console.log('Looking for patient with identifier:', body.patientId);

    const identifier = body.patientId;

    console.log("identifier", identifier);

    const patient = await Patient.findOne({ userId: identifier })

    if (!patient) {
        console.error('Patient not found. Searched for userId:', identifier);

        // List available patients for debugging
        const allPatients = await Patient.find({}).select('_id userId');
        console.log('Available patients in DB:');
        allPatients.forEach(p => {
            console.log(`  - _id: ${p._id}, userId: ${p.userId}`);
        });

        throw new Error(`Patient not found with userId: ${identifier}`);
    }

    console.log('Found patient:', {
        _id: patient._id,
        userId: patient.userId
    });


    for (const file of files) {
        // Upload to Cloudinary
        const result = await uploadToCloudinary(file, 'medical-reports');

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
    // Find patient by userId
    const patient = await Patient.findOne({ userId: patientId });

    if (!patient) {
        console.log('Patient not found with userId:', patientId);
        return [];
    }

    const reports = await MedicalReport.find({ patientId: patient._id }).sort({ uploadedAt: -1 });
    console.log(`Found ${reports.length} reports for patient ${patient._id}`);
    return reports;
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