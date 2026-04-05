import { uploadPrescriptions, getPrescriptionsByPatient } from '../services/PrescriptionService.js';

export const uploadPrescription = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        const uploadedPrescriptions = await uploadPrescriptions(req.files, req.body.patientId, req.body.doctorId);

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
    } catch (error) {
        console.error('Error fetching prescriptions:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};