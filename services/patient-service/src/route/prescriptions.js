import express from 'express';
import { uploadPrescriptions } from '../middleware/upload.js';
import { uploadPrescription, getPrescriptions, getDoctorPatientsFromPrescription } from '../controllers/PrescriptionController.js';

const router = express.Router();

// Upload prescription(s) - allows up to 10 files
router.post('/upload', uploadPrescriptions.array('files', 10), uploadPrescription);

// Get prescriptions for a patient
router.get('/:patientId', getPrescriptions);

//get all prtient by doctor from prescription
router.get("/prescription/:doctorId", getDoctorPatientsFromPrescription);


export default router;