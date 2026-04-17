import Patient from '../model/Patient.js';
import { uploadPrescriptions, getPrescriptionsByPatient } from '../services/PrescriptionService.js';
import logger from '../utils/Logger.js';

export const uploadPrescription = async (req, res) => {
    try {

        const { userid } = req.body;
        const { doctorId } = req.body;
        console.log("patient userid: ", userid);

        const patient = await Patient.findOne({ userId: userid });

        console.log("patient Details: ", patient);

        if (!patient) {
            return res.status(404).json({ message: "Patient not found" });
        }

        if (!req.files || req.files.length === 0) {
            ss
            return res.status(400).json({ message: 'No files uploaded' });
        }

        const uploadedPrescriptions = await uploadPrescriptions(req.files, patient._id, doctorId);

        logger.info(`${uploadedPrescriptions.length} prescription(s) uploaded successfully for patient ID ${patient._id}`);
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

        console.log("UserId :", patientId);

        const patient = await Patient.findOne({ userId: patientId });
        console.log("Patient Id :", patient._id);

        const prescriptions = await getPrescriptionsByPatient(patient._id);
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