import express from 'express';
import { deletePatientProfile, getAllPatients, getPatientprofile, updatePatientProfile } from '../controllers/profileController';

const router = express.Router();

// Get patient profile
router.get('/profile', getPatientprofile);
// Update patient profile
router.put('/profile/:patientid', updatePatientProfile);

// Delete patient profile
router.delete('/profile/:patientid', deletePatientProfile);

// Get all patients
router.get('/all', getAllPatients);

export default router;