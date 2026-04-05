import express from 'express';
import { uploadMedicalReports } from '../middleware/upload.js';
import { uploadMedicalReport, getMedicalReports } from '../controllers/MedicalReportsController.js';
import { updateMedicalReport } from '../services/MedicalReportsService.js';

const router = express.Router();

// Upload medical report(s) - allows up to 10 files
router.post('/upload', uploadMedicalReports.array('files', 10), uploadMedicalReport);

// Get medical reports for a patient
router.get('/:patientId', getMedicalReports);

//Update medical report
router.put('/update/:reportId', uploadMedicalReports.single('file'), updateMedicalReport);

export default router;