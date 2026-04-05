
import Patient from "../model/Patient.js";
import logger from "../utils/Logger.js"


// Service to get patient profile by ID
export const getPatientProfiles = async (patientId) => {

    if (!patientId) {
        logger.error('Patient ID is required to fetch profile');
        throw new Error("Patient Id is Required");
    }

    const patientProfile = await Patient.findById(patientId);

    if (!patientProfile) {
        logger.error(`No patient found with ID: ${patientId}`);
        throw new Error("Patient Not Found");

    }

    return patientProfile;
}

// Service to update patient profile
export const updatePatientProfiles = async (patientId, updateData) => {

    if (!patientId) {
        logger.error('Patient ID is required to update profile');
        throw new Error("Patient Id is Required");
    }

    const updatedProfile = await Patient.findByIdAndUpdate(patientId, updateData,
        { new: true, runValidators: true }
    )
    if (!updatedProfile) {
        logger.error(`No patient found with ID: ${patientId} to update`);
        throw new Error("Patient Not Found");
    }

    return updatedProfile;
}

//delete patient profile
export const deletePatientProfiles = async (patientid) => {

    if (!patientid) {
        logger.error('Patient ID is required to delete profile');
        throw new Error("Patient Id is Required");
    }

    const deletedProfile = await Patient.findByIdAndDelete(patientid);
    if (!deletedProfile) {
        logger.error(`No patient found with ID: ${patientid} to delete`);
        throw new Error("Patient Not Found");
    }

    return deletedProfile;
}

//get all patients
export const getAllProfiles = async () => {
    const patients = await Patient.find();
    return patients;
}