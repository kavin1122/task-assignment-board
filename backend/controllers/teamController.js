const Team = require('../models/Team');
const User = require('../models/User');

// Create Team
exports.createTeam = async (req, res) => {
  try {
    const { name, members } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Team name is required' });
    }

    // Check if team name already exists
    const existing = await Team.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ message: 'A team with this name already exists' });
    }

    const team = new Team({
      name: name.trim(),
      members: members || [],
      createdBy: req.user.id,
    });

    await team.save();
    await team.populate(['members', 'createdBy']);

    res.status(201).json({
      message: 'Team created successfully',
      team,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating team', error: error.message });
  }
};

// Get all teams
exports.getAllTeams = async (req, res) => {
  try {
    const teams = await Team.find()
      .populate('members', 'name email role')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: 'Teams retrieved successfully',
      teams,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching teams', error: error.message });
  }
};

// Get team by ID
exports.getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('members', 'name email role')
      .populate('createdBy', 'name email');

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    res.status(200).json({
      message: 'Team retrieved successfully',
      team,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching team', error: error.message });
  }
};

// Update Team
exports.updateTeam = async (req, res) => {
  try {
    const { name, members } = req.body;
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (name) team.name = name.trim();
    if (members) team.members = members;

    await team.save();
    await team.populate(['members', 'createdBy']);

    res.status(200).json({
      message: 'Team updated successfully',
      team,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating team', error: error.message });
  }
};

// Add member to team
exports.addMemberToTeam = async (req, res) => {
  try {
    const { memberId } = req.body;
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (team.members.map(m => m.toString()).includes(memberId)) {
      return res.status(400).json({ message: 'Member already in team' });
    }

    team.members.push(memberId);
    await team.save();
    await team.populate(['members', 'createdBy']);

    res.status(200).json({
      message: 'Member added to team',
      team,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error adding member to team', error: error.message });
  }
};

// Remove member from team
exports.removeMemberFromTeam = async (req, res) => {
  try {
    const { memberId } = req.body;
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    team.members = team.members.filter(m => m.toString() !== memberId);
    await team.save();
    await team.populate(['members', 'createdBy']);

    res.status(200).json({
      message: 'Member removed from team',
      team,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error removing member from team', error: error.message });
  }
};

// Delete Team
exports.deleteTeam = async (req, res) => {
  try {
    const team = await Team.findByIdAndDelete(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    res.status(200).json({
      message: 'Team deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting team', error: error.message });
  }
};
