const mongoose = require('mongoose');

const taskUploadSchema = new mongoose.Schema(
    {
        taskId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Task',
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            required: true,
        },
        uploadType: {
            type: String,
            enum: ['file', 'link'],
            required: true,
        },
        // For file uploads
        fileName: {
            type: String,
        },
        filePath: {
            type: String,
        },
        fileSize: {
            type: Number,
        },
        mimeType: {
            type: String,
        },
        // For link submissions
        link: {
            type: String,
        },
        linkTitle: {
            type: String,
        },
        // Description
        description: {
            type: String,
            trim: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('TaskUpload', taskUploadSchema);
