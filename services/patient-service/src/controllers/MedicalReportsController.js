import { uploadMedicalReports, getMedicalReportsByPatient, updateMedicalReport } from '../services/MedicalReportsService.js';
import logger from '../utils/Logger.js';

export const uploadMedicalReport = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        const uploadedReports = await uploadMedicalReports(req.files, req.body.patientId);

        res.status(201).json({
            message: `${uploadedReports.length} medical report(s) uploaded successfully`,
            data: uploadedReports
        });
    } catch (error) {
        console.error('Error uploading medical report:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getMedicalReports = async (req, res) => {
    try {
        const { patientId } = req.params;
        const reports = await getMedicalReportsByPatient(patientId);
        res.status(200).json({ data: reports });
    } catch (error) {
        console.error('Error fetching medical reports:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateMedicalReports = async (req, res) => {
    try {
        const { reportId } = req.params;

        if (req.files && req.files.length > 0) {
            const updateReport = await updateMedicalReport(reportId, req.files);

            res.status(200).json({
                message: "Medical Report Updated Successfully",
                data: updateReport
            })
            logger.info(`Medical report with ID ${reportId} updated successfully`);
        }
    } catch (err) {
        logger.error(`Error updating medical report with ID ${reportId}: ${err.message}`);
        res.status(500).json({ message: "Internal Server Error" });
    }
}