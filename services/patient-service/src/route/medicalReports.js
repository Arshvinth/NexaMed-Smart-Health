import express from 'express';
import { uploadMedicalReports } from '../middleware/upload.js';
import { uploadMedicalReport, getMedicalReports, viewMedicalReportByDoctor } from '../controllers/MedicalReportsController.js';
import { updateMedicalReport } from '../services/MedicalReportsService.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Upload medical report(s) - allows up to 10 files
router.post('/upload', auth, uploadMedicalReports.array('files', 10), uploadMedicalReport);

// Get medical reports for a patient
router.get('/:patientId', auth, getMedicalReports);

//get medical report by doctor
router.get("/reports/doctor", auth, viewMedicalReportByDoctor);

//Update medical report
router.put('/update/:reportId', auth, uploadMedicalReports.single('file'), updateMedicalReport);

export default router;