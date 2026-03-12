const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
  },
  // For MCQ
  options: [{
    type: String,
  }],
  correctAnswer: {
    type: String,
  },
  // For Coding
  starterCode: {
    type: String,
  },
  testCases: [{
    input: String,
    expectedOutput: String,
  }],
});

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    assignedTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
    },
    status: {
      type: String,
      enum: ['todo', 'inprogress', 'completed'],
      default: 'todo',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    deadline: {
      type: Date,
    },
    // Quiz fields
    taskType: {
      type: String,
      enum: ['mcq', 'coding', 'general'],
      default: 'general',
    },
    order: {
      type: Number,
      default: 0,
    },
    questions: [questionSchema],
    passingScore: {
      type: Number,
      default: 1, // minimum correct answers to pass
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', taskSchema);
