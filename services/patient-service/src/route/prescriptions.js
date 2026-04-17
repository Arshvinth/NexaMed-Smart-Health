import express from 'express';
import { uploadPrescriptions } from '../middleware/upload.js';
import { uploadPrescription, getPrescriptions, getDoctorPatientsFromPrescription } from '../controllers/PrescriptionController.js';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';

const router = express.Router();

// Upload prescription(s) - allows up to 10 files
router.post('/upload', auth, requireRole("PATIENT"), uploadPrescriptions.array('files', 10), uploadPrescription);

// Get prescriptions for a patient
router.get('/:patientId', auth, getPrescriptions);

//get all prtient by doctor from prescription
router.get("/prescription/:doctorId", auth, getDoctorPatientsFromPrescription);


export default router;