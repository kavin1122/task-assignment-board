const express = require('express');
const {
  createTask,
  getAllTasks,
  getTasksByProject,
  getTaskById,
  updateTask,
  startTask,
  updateTaskStatus,
  submitTask,
  submitGeneralTask,
  runCode,
  getSupportedLanguages,
  getTaskProgress,
  getSubmission,
  deleteTask,
} = require('../controllers/taskController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Admin only routes
router.post('/', authorizeRoles('admin'), createTask);
router.delete('/:id', authorizeRoles('admin'), deleteTask);

// Quiz / Coding routes
router.post('/:id/submit', submitTask);
router.post('/:id/submit-general', submitGeneralTask);
router.post('/:id/run', runCode);
router.patch('/:id/start', startTask);
router.get('/progress/:projectId', getTaskProgress);
router.get('/:id/submission', getSubmission);

// Routes accessible to all authenticated users
router.get('/languages', getSupportedLanguages);
router.get('/', getAllTasks);
router.get('/project/:projectId', getTasksByProject);
router.get('/:id', getTaskById);
router.put('/:id', updateTask);
router.patch('/:id/status', updateTaskStatus);

module.exports = router;
