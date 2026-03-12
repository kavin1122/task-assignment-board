const express = require('express');
const {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  addMemberToProject,
  addTeamToProject,
  deleteProject,
} = require('../controllers/projectController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Admin only routes
router.post('/', authorizeRoles('admin'), createProject);
router.put('/:id', authorizeRoles('admin'), updateProject);
router.delete('/:id', authorizeRoles('admin'), deleteProject);
router.post('/:id/members', authorizeRoles('admin'), addMemberToProject);
router.post('/:id/teams', authorizeRoles('admin'), addTeamToProject);

// Routes accessible to all authenticated users
router.get('/', getAllProjects);
router.get('/:id', getProjectById);

module.exports = router;
