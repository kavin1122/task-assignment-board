const TaskUpload = require('../models/TaskUpload');
const Task = require('../models/Task');
const path = require('path');
const fs = require('fs');

// Upload file for a task
exports.uploadFile = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { description } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const upload = new TaskUpload({
            taskId,
            userId: req.user.id,
            projectId: task.projectId,
            uploadType: 'file',
            fileName: req.file.originalname,
            filePath: `/uploads/${taskId}/${req.file.filename}`,
            fileSize: req.file.size,
            mimeType: req.file.mimetype,
            description: description || '',
        });

        await upload.save();
        await upload.populate('userId', 'name email');

        res.status(201).json({
            message: 'File uploaded successfully',
            upload,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error uploading file', error: error.message });
    }
};

// Upload multiple files for a task
exports.uploadMultipleFiles = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { description } = req.body;

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const uploads = [];
        for (const file of req.files) {
            const upload = new TaskUpload({
                taskId,
                userId: req.user.id,
                projectId: task.projectId,
                uploadType: 'file',
                fileName: file.originalname,
                filePath: `/uploads/${taskId}/${file.filename}`,
                fileSize: file.size,
                mimeType: file.mimetype,
                description: description || '',
            });
            await upload.save();
            await upload.populate('userId', 'name email');
            uploads.push(upload);
        }

        res.status(201).json({
            message: `${uploads.length} file(s) uploaded successfully`,
            uploads,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error uploading files', error: error.message });
    }
};

// Submit a link for a task
exports.submitLink = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { link, linkTitle, description } = req.body;

        if (!link) {
            return res.status(400).json({ message: 'Link URL is required' });
        }

        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const upload = new TaskUpload({
            taskId,
            userId: req.user.id,
            projectId: task.projectId,
            uploadType: 'link',
            link,
            linkTitle: linkTitle || link,
            description: description || '',
        });

        await upload.save();
        await upload.populate('userId', 'name email');

        res.status(201).json({
            message: 'Link submitted successfully',
            upload,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error submitting link', error: error.message });
    }
};

// Get all uploads for a task
exports.getUploadsByTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const uploads = await TaskUpload.find({ taskId })
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: 'Uploads retrieved successfully',
            uploads,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching uploads', error: error.message });
    }
};

// Delete upload
exports.deleteUpload = async (req, res) => {
    try {
        const upload = await TaskUpload.findById(req.params.id);
        if (!upload) {
            return res.status(404).json({ message: 'Upload not found' });
        }

        // Only uploader or admin can delete
        if (upload.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Delete physical file if it's a file upload
        if (upload.uploadType === 'file' && upload.filePath) {
            const fullPath = path.join(__dirname, '..', upload.filePath);
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
            }
        }

        await TaskUpload.findByIdAndDelete(req.params.id);

        res.status(200).json({
            message: 'Upload deleted successfully',
        });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting upload', error: error.message });
    }
};
