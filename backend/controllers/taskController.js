const Task = require('../models/Task');
const Project = require('../models/Project');
const TaskSubmission = require('../models/TaskSubmission');
const { runTestCases, LANGUAGES } = require('../utils/codeExecutor');

// Create Task
exports.createTask = async (req, res) => {
  try {
    const { title, description, projectId, assignedTo, assignedTeam, priority, deadline, taskType, questions, passingScore } = req.body;

    if (!title || !projectId) {
      return res.status(400).json({ message: 'Title and projectId are required' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Auto-assign order based on existing tasks count
    const existingTasks = await Task.countDocuments({ projectId });

    const task = new Task({
      title,
      description,
      projectId,
      assignedTo,
      assignedTeam,
      priority: priority || 'medium',
      deadline,
      taskType: taskType || 'general',
      order: existingTasks + 1,
      questions: questions || [],
      passingScore: passingScore || 1,
    });

    await task.save();
    await task.populate(['projectId', 'assignedTo', 'assignedTeam']);

    res.status(201).json({
      message: 'Task created successfully',
      task,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating task', error: error.message });
  }
};

// Get all tasks
exports.getAllTasks = async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'admin') {
      // Find projects where the user is a member
      const userProjects = await Project.find({ members: req.user.id }).select('_id');
      const projectIds = userProjects.map(p => p._id);
      
      // Find teams the user is a member of
      const userTeams = await require('../models/Team').find({ members: req.user.id }).select('_id');
      const teamIds = userTeams.map(t => t._id);

      query = {
        $or: [
          { projectId: { $in: projectIds } },
          { assignedTo: req.user.id },
          { assignedTeam: { $in: teamIds } }
        ]
      };
    }

    const tasks = await Task.find(query)
      .populate(['projectId', 'assignedTo', 'assignedTeam'])
      .sort({ order: 1 });

    res.status(200).json({
      message: 'Tasks retrieved successfully',
      tasks,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tasks', error: error.message });
  }
};

// Get tasks by project ID (with lock status for user)
exports.getTasksByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    const tasks = await Task.find({ projectId })
      .populate(['projectId', 'assignedTo', 'assignedTeam'])
      .sort({ order: 1 });

    // Get user's submissions for this project
    const submissions = await TaskSubmission.find({ userId, projectId });
    const submissionMap = {};
    submissions.forEach(s => {
      submissionMap[s.taskId.toString()] = s;
    });

    // Build tasks with lock status
    const tasksWithLock = tasks.map((task, index) => {
      const taskObj = task.toObject();
      const submission = submissionMap[task._id.toString()];

      taskObj.submission = submission || null;

      if (index === 0) {
        // First task is always unlocked
        taskObj.isLocked = false;
      } else {
        // Check if previous task is passed
        const prevTask = tasks[index - 1];
        const prevSubmission = submissionMap[prevTask._id.toString()];
        taskObj.isLocked = !prevSubmission || !prevSubmission.passed;
      }

      // Don't expose correct answers to users (admin can see them)
      if (req.user.role !== 'admin' && taskObj.questions) {
        taskObj.questions = taskObj.questions.map(q => ({
          ...q,
          correctAnswer: undefined,
          testCases: q.testCases ? q.testCases.map(tc => ({
            input: tc.input,
            expectedOutput: undefined,
          })) : undefined,
        }));
      }

      return taskObj;
    });

    res.status(200).json({
      message: 'Tasks retrieved successfully',
      tasks: tasksWithLock,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tasks', error: error.message });
  }
};

// Get task by ID
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate(['projectId', 'assignedTo', 'assignedTeam']);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.status(200).json({
      message: 'Task retrieved successfully',
      task,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching task', error: error.message });
  }
};

// Update Task
exports.updateTask = async (req, res) => {
  try {
    const { title, description, assignedTo, assignedTeam, status, priority, deadline, taskType, questions, passingScore } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (title) task.title = title;
    if (description) task.description = description;
    if (assignedTo) task.assignedTo = assignedTo;
    if (assignedTeam) task.assignedTeam = assignedTeam;
    if (status) task.status = status;
    if (priority) task.priority = priority;
    if (deadline) task.deadline = deadline;
    if (taskType) task.taskType = taskType;
    if (questions) task.questions = questions;
    if (passingScore !== undefined) task.passingScore = passingScore;

    await task.save();
    await task.populate(['projectId', 'assignedTo', 'assignedTeam']);

    res.status(200).json({
      message: 'Task updated successfully',
      task,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating task', error: error.message });
  }
};

// Start task (change status to inprogress)
exports.startTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.status !== 'todo') {
      return res.status(400).json({ message: 'Task is already started or completed' });
    }

    task.status = 'inprogress';
    await task.save();
    await task.populate(['projectId', 'assignedTo']);

    res.status(200).json({
      message: 'Task started successfully',
      task,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error starting task', error: error.message });
  }
};

// Update task status (for Kanban board)
exports.updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['todo', 'inprogress', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate(['projectId', 'assignedTo']);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.status(200).json({
      message: 'Task status updated successfully',
      task,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating task status', error: error.message });
  }
};

// Submit task answers (quiz / coding)
exports.submitTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.id;
    const { answers, language } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check lock — is previous task completed?
    if (task.order > 1) {
      const prevTask = await Task.findOne({ projectId: task.projectId, order: task.order - 1 });
      if (prevTask) {
        const prevSubmission = await TaskSubmission.findOne({ userId, taskId: prevTask._id, passed: true });
        if (!prevSubmission) {
          return res.status(403).json({ message: 'Previous task must be completed first' });
        }
      }
    }

    // Check if already submitted
    const existing = await TaskSubmission.findOne({ userId, taskId });
    if (existing && existing.passed) {
      return res.status(400).json({ message: 'Task already completed', submission: existing });
    }

    // Grade the submission
    let score = 0;
    const totalQuestions = task.questions.length;

    if (task.taskType === 'mcq') {
      task.questions.forEach((q, i) => {
        const userAnswer = answers.find(a => a.questionIndex === i);
        if (userAnswer && userAnswer.answer === q.correctAnswer) {
          score++;
        }
      });
    } else if (task.taskType === 'coding') {
      // Execute code against test cases
      const codingResults = [];
      for (let i = 0; i < task.questions.length; i++) {
        const q = task.questions[i];
        const userAnswer = answers.find(a => a.questionIndex === i);
        if (userAnswer && (userAnswer.answer || '').trim().length > 0 && q.testCases && q.testCases.length > 0) {
          const testResult = await runTestCases(userAnswer.answer, q.testCases, language || 'javascript');
          codingResults.push({ questionIndex: i, ...testResult });
          if (testResult.passed) score++;
        } else {
          codingResults.push({ questionIndex: i, results: [], passed: false, totalPassed: 0, totalTests: q.testCases?.length || 0 });
        }
      }
      // Attach coding results to response later
      req.codingResults = codingResults;
    }

    // For coding: pass if all questions' test cases passed
    // For MCQ: pass if score meets passingScore threshold
    const passed = task.taskType === 'coding'
      ? score === totalQuestions
      : score >= task.passingScore;

    // Upsert submission
    const submission = await TaskSubmission.findOneAndUpdate(
      { userId, taskId },
      {
        userId,
        taskId,
        projectId: task.projectId,
        answers,
        score,
        totalQuestions,
        passed,
        language: task.taskType === 'coding' ? (language || 'javascript') : undefined,
      },
      { upsert: true, new: true }
    );

    // If passed, mark task status as completed for this user
    if (passed) {
      task.status = 'completed';
      await task.save();
    }

    res.status(200).json({
      message: passed ? 'Congratulations! You passed!' : 'Not enough correct answers. Try again!',
      submission,
      passed,
      score,
      totalQuestions,
      codingResults: req.codingResults || null,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting task', error: error.message });
  }
};

// Submit general task (mark as completed)
exports.submitGeneralTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.id;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.taskType !== 'general') {
      return res.status(400).json({ message: 'This endpoint is only for general tasks' });
    }

    // Check lock — is previous task completed?
    if (task.order > 1) {
      const prevTask = await Task.findOne({ projectId: task.projectId, order: task.order - 1 });
      if (prevTask) {
        const prevSubmission = await TaskSubmission.findOne({ userId, taskId: prevTask._id, passed: true });
        if (!prevSubmission) {
          return res.status(403).json({ message: 'Previous task must be completed first' });
        }
      }
    }

    // Check if already submitted
    const existing = await TaskSubmission.findOne({ userId, taskId });
    if (existing && existing.passed) {
      return res.status(400).json({ message: 'Task already completed', submission: existing });
    }

    // Create submission for general task (auto-pass)
    const submission = await TaskSubmission.findOneAndUpdate(
      { userId, taskId },
      {
        userId,
        taskId,
        projectId: task.projectId,
        answers: [],
        score: 1,
        totalQuestions: 1,
        passed: true,
      },
      { upsert: true, new: true }
    );

    // Mark task as completed
    task.status = 'completed';
    await task.save();

    res.status(200).json({
      message: 'Task submitted successfully!',
      submission,
      passed: true,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting general task', error: error.message });
  }
};

// Run code against test cases (without submitting)
exports.runCode = async (req, res) => {
  try {
    const taskId = req.params.id;
    const { questionIndex, code, language } = req.body;

    if (code === undefined || questionIndex === undefined) {
      return res.status(400).json({ message: 'questionIndex and code are required' });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.taskType !== 'coding') {
      return res.status(400).json({ message: 'This is not a coding task' });
    }

    const question = task.questions[questionIndex];
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    if (!question.testCases || question.testCases.length === 0) {
      return res.status(400).json({ message: 'No test cases for this question' });
    }

    const testResult = await runTestCases(code, question.testCases, language || 'javascript');

    res.status(200).json({
      message: testResult.passed ? 'All test cases passed!' : `${testResult.totalPassed}/${testResult.totalTests} test cases passed`,
      ...testResult,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error running code', error: error.message });
  }
};

// Get supported programming languages
exports.getSupportedLanguages = (req, res) => {
  res.status(200).json({
    message: 'Supported languages',
    languages: LANGUAGES,
  });
};

// Get user's progress for a project
exports.getTaskProgress = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    const submissions = await TaskSubmission.find({ userId, projectId })
      .populate('taskId', 'title order taskType');

    res.status(200).json({
      message: 'Progress retrieved successfully',
      submissions,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching progress', error: error.message });
  }
};

// Get user's submission for a task (for View button)
exports.getSubmission = async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.id;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const submission = await TaskSubmission.findOne({ userId, taskId });
    if (!submission) {
      return res.status(404).json({ message: 'No submission found for this task' });
    }

    // Build question details with correct answers for review
    const questionsWithAnswers = task.questions.map((q, i) => {
      const userAnswer = submission.answers.find(a => a.questionIndex === i);
      const questionData = {
        questionIndex: i,
        questionText: q.questionText,
        userAnswer: userAnswer?.answer || '',
      };

      if (task.taskType === 'mcq') {
        questionData.options = q.options;
        questionData.correctAnswer = q.correctAnswer;
        questionData.isCorrect = userAnswer?.answer === q.correctAnswer;
      }

      if (task.taskType === 'coding') {
        questionData.starterCode = q.starterCode;
        questionData.testCases = q.testCases;
      }

      return questionData;
    });

    res.status(200).json({
      message: 'Submission retrieved successfully',
      task: {
        _id: task._id,
        title: task.title,
        description: task.description,
        taskType: task.taskType,
        order: task.order,
        passingScore: task.passingScore,
      },
      submission: {
        score: submission.score,
        totalQuestions: submission.totalQuestions,
        passed: submission.passed,
        language: submission.language,
        createdAt: submission.createdAt,
        updatedAt: submission.updatedAt,
      },
      questions: questionsWithAnswers,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching submission', error: error.message });
  }
};

// Delete Task
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Also delete related submissions
    await TaskSubmission.deleteMany({ taskId: req.params.id });

    res.status(200).json({
      message: 'Task deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting task', error: error.message });
  }
};
