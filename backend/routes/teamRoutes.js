const express = require('express');
const {
  createTeam,
  getAllTeams,
  getTeamById,
  updateTeam,
  addMemberToTeam,
  removeMemberFromTeam,
  deleteTeam,
} = require('../controllers/teamController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Admin only routes
router.post('/', authorizeRoles('admin'), createTeam);
router.put('/:id', authorizeRoles('admin'), updateTeam);
router.delete('/:id', authorizeRoles('admin'), deleteTeam);
router.post('/:id/members', authorizeRoles('admin'), addMemberToTeam);
router.post('/:id/remove-member', authorizeRoles('admin'), removeMemberFromTeam);

// Routes accessible to all authenticated users
router.get('/', getAllTeams);
router.get('/:id', getTeamById);

module.exports = router;
