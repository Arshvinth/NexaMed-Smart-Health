import express from 'express';
import { deletePatientProfile, getAllPatients, getPatientprofile, updatePatientProfile, addPatient } from '../controllers/profileController.js';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';

const router = express.Router();

// Public: create a patient profile (no auth)
router.post('/addPatient', addPatient);

// Get patient profile
router.get('/profile/:patientid', auth, requireRole("PATIENT"), getPatientprofile);
// Update patient profile
router.put('/profile/:userId', auth, requireRole("PATIENT"), updatePatientProfile);

// Delete patient profile
router.delete('/profile/:userId', auth, requireRole("PATIENT"), deletePatientProfile);

// Get all patients
router.get('/', getAllPatients);

export default router;