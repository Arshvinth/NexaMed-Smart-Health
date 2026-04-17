import multer from 'multer';
import cloudinary from '../config/cloudinary.js';
import { fileFilter } from '../utils/FileValidator.js';

const storage = multer.memoryStorage();

const createUpload = (folder) => {
    return multer({
        storage: storage,
        fileFilter: fileFilter,
        limits: {
            fileSize: 10 * 1024 * 1024 // 10MB limit
        }
    });
};

export const uploadMedicalReports = createUpload('medical-reports');
export const uploadPrescriptions = createUpload('prescriptions');

// Helper function to upload to cloudinary
export const uploadToCloudinary = (file, folder) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: folder,
                allowed_formats: ['jpeg', 'jpg', 'png', 'gif', 'webp', 'pdf'],
                resource_type: 'auto',
                type: "upload",
                access_mode: "public"
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        );
        uploadStream.end(file.buffer);
    });
};
