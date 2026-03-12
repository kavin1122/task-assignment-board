const express = require('express');
const {
    uploadFile,
    uploadMultipleFiles,
    submitLink,
    getUploadsByTask,
    deleteUpload,
} = require('../controllers/uploadController');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Upload single file
router.post('/:taskId/file', upload.single('file'), uploadFile);

// Upload multiple files (folder contents)
router.post('/:taskId/files', upload.array('files', 20), uploadMultipleFiles);

// Submit a link
router.post('/:taskId/link', submitLink);

// Get all uploads for a task
router.get('/:taskId', getUploadsByTask);

// Delete upload
router.delete('/delete/:id', deleteUpload);

module.exports = router;
