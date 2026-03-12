const mongoose = require('mongoose');

const taskSubmissionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        taskId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Task',
            required: true,
        },
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            required: true,
        },
        answers: [{
            questionIndex: Number,
            answer: String,
        }],
        score: {
            type: Number,
            default: 0,
        },
        totalQuestions: {
            type: Number,
            default: 0,
        },
        passed: {
            type: Boolean,
            default: false,
        },
        language: {
            type: String,
            default: 'javascript',
        },
    },
    { timestamps: true }
);

// Compound index: one submission per user per task
taskSubmissionSchema.index({ userId: 1, taskId: 1 }, { unique: true });

module.exports = mongoose.model('TaskSubmission', taskSubmissionSchema);
