import express from 'express';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import {
  uploadSingle,
  uploadMultiple,
  deleteFile,
  getUploadedFiles
} from '../controllers/uploadController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Single file upload
router.post('/single', upload.single('file'), uploadSingle);

// Multiple files upload
router.post('/multiple', upload.array('files', 10), uploadMultiple);

// Delete file
router.delete('/:publicId', deleteFile);

// Get user's uploaded files
router.get('/my-files', getUploadedFiles);

export default router;