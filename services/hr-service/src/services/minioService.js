import * as Minio from 'minio';
import dotenv from 'dotenv';

dotenv.config({ path: '../../../.env' });

const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || 'play.min.io',
    port: parseInt(process.env.MINIO_PORT) || 9000,
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

const BUCKET_NAME = 'employee-documents';

// Ensure bucket exists
const ensureBucket = async () => {
    try {
        const exists = await minioClient.bucketExists(BUCKET_NAME);
        if (!exists) {
            await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
            console.log(`Bucket ${BUCKET_NAME} created successfully`);
        }
    } catch (error) {
        console.error('Error ensuring bucket exists:', error);
    }
};

ensureBucket();

/**
 * Upload a document to MinIO
 * @param {Object} file - Multer file object
 * @param {string} nik - Employee NIK
 * @param {string} type - Document type (e.g., 'ktp', 'contract', 'photo')
 * @returns {Promise<string>} - Object name in MinIO
 */
export const uploadDocument = async (file, nik, type) => {
    try {
        const timestamp = Date.now();
        const objectName = `${nik}/${type}/${timestamp}-${file.originalname}`;

        await minioClient.putObject(
            BUCKET_NAME,
            objectName,
            file.buffer,
            file.size,
            {
                'Content-Type': file.mimetype,
            }
        );

        return objectName;
    } catch (error) {
        console.error('Error uploading document:', error);
        throw new Error('Failed to upload document');
    }
};

/**
 * Get a presigned URL for downloading a document
 * @param {string} objectName - Object name in MinIO
 * @param {number} expiry - URL expiry time in seconds (default: 24 hours)
 * @returns {Promise<string>} - Presigned URL
 */
export const getPresignedUrl = async (objectName, expiry = 24 * 60 * 60) => {
    try {
        const url = await minioClient.presignedGetObject(BUCKET_NAME, objectName, expiry);
        return url;
    } catch (error) {
        console.error('Error generating presigned URL:', error);
        throw new Error('Failed to generate download URL');
    }
};

/**
 * Delete a document from MinIO
 * @param {string} objectName - Object name in MinIO
 * @returns {Promise<void>}
 */
export const deleteDocument = async (objectName) => {
    try {
        await minioClient.removeObject(BUCKET_NAME, objectName);
    } catch (error) {
        console.error('Error deleting document:', error);
        throw new Error('Failed to delete document');
    }
};

/**
 * List all documents for an employee
 * @param {string} nik - Employee NIK
 * @returns {Promise<Array>} - List of document objects
 */
export const listEmployeeDocuments = async (nik) => {
    try {
        const documents = [];
        const stream = minioClient.listObjects(BUCKET_NAME, `${nik}/`, true);

        return new Promise((resolve, reject) => {
            stream.on('data', (obj) => documents.push(obj));
            stream.on('error', reject);
            stream.on('end', () => resolve(documents));
        });
    } catch (error) {
        console.error('Error listing documents:', error);
        throw new Error('Failed to list documents');
    }
};
