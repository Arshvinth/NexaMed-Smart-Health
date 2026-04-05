
import { deletePatientProfiles, getAllProfiles, getPatientProfiles, updatePatientProfiles } from "../services/ProfileService.js";
import logger from "../utils/Logger.js";

export const getPatientprofile = async (req, res) => {
    try {
        const { patientid } = req.params;
        const PatientProfile = await getPatientProfiles(patientid);
        logger.info(`Patient profile with ID ${patientid} fetched successfully`);
        res.status(200).json({ data: PatientProfile });
    } catch (error) {
        logger.error(`Error fetching patient profile with ID ${req.params.patientid}: ${error.message}`);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

export const updatePatientProfile = async (req, res) => {
    try {
        const { patientid } = req.params;
        const updateData = req.body;
        const updatedProfile = await updatePatientProfiles(patientid, updateData);
        logger.info(`Patient profile with ID ${patientid} updated successfully`);
        res.status(200).json({ data: updatedProfile });
    } catch (error) {
        logger.error(`Error updating patient profile with ID ${req.params.patientid}: ${error.message}`);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

export const deletePatientProfile = async (req, res) => {
    try {
        const { patientid } = req.params;
        const deletedProfile = await deletePatientProfiles(patientid);
        logger.info(`Patient profile with ID ${patientid} deleted successfully`);
        res.status(200).json({ data: deletedProfile });
    } catch (error) {
        logger.error(`Error deleting patient profile with ID ${req.params.patientid}: ${error.message}`);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

export const getAllPatients = async (req, res) => {
    try {
        const patients = await getAllProfiles();
        logger.info(`All patient profiles fetched successfully`);
        res.status(200).json({ data: patients });
    } catch (error) {
        logger.error(`Error fetching all patient profiles: ${error.message}`);
        res.status(500).json({ message: "Internal Server Error" });
    }
}