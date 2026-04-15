import express from 'express';
import { deletePatientProfile, getAllPatients, getPatientprofile, updatePatientProfile } from '../controllers/profileController.js';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';

const router = express.Router();

// Get patient profile
router.get('/profile/:patientid', auth, requireRole("PATIENT"), getPatientprofile);
// Update patient profile
router.put('/profile/:patientid', auth, requireRole("PATIENT"), updatePatientProfile);

// Delete patient profile
router.delete('/profile/:patientid', auth, requireRole("PATIENT"), deletePatientProfile);

// Get all patients
router.get('/', getAllPatients);

export default router;