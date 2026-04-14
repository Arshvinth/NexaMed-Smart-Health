import { uploadPrescriptions, getPrescriptionsByPatient } from '../services/PrescriptionService.js';
import logger from '../utils/Logger.js';

export const uploadPrescription = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        const uploadedPrescriptions = await uploadPrescriptions(req.files, req.body.patientId, req.body.doctorId);

        logger.info(`${uploadedPrescriptions.length} prescription(s) uploaded successfully for patient ID ${req.body.patientId}`);
        res.status(201).json({
            message: `${uploadedPrescriptions.length} prescription(s) uploaded successfully`,
            data: uploadedPrescriptions
        });
    } catch (error) {
        console.error('Error uploading prescription:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getPrescriptions = async (req, res) => {
    try {
        const { patientId } = req.params;
        const prescriptions = await getPrescriptionsByPatient(patientId);
        res.status(200).json({ data: prescriptions });
        logger.info(`Prescriptions for patient ID ${patientId} fetched successfully`);
    } catch (error) {
        console.error('Error fetching prescriptions:', error);
        res.status(500).json({ message: 'Internal server error' });
        logger.error(`Error fetching prescriptions for patient ID ${req.params.patientId}: ${error.message}`);
    }
};


export const getDoctorPatientsFromPrescription = async (req, res) => {
    try {
        const { doctorId } = req.params;

        const patients = await getPatientsByDoctor(doctorId);

        res.status(200).json({ data: patients });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};