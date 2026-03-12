const express = require('express');
const {
    createComment,
    getCommentsByTask,
    deleteComment,
} = require('../controllers/commentController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

router.post('/', createComment);
router.get('/task/:taskId', getCommentsByTask);
router.delete('/:id', deleteComment);

module.exports = router;
