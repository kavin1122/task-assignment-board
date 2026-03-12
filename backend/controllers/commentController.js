const Comment = require('../models/Comment');

// Create Comment
exports.createComment = async (req, res) => {
    try {
        const { text, taskId } = req.body;

        if (!text || !taskId) {
            return res.status(400).json({ message: 'Text and taskId are required' });
        }

        const comment = new Comment({
            text,
            taskId,
            userId: req.user.id,
        });

        await comment.save();
        await comment.populate('userId', 'name email role');

        res.status(201).json({
            message: 'Comment added successfully',
            comment,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error adding comment', error: error.message });
    }
};

// Get comments by task
exports.getCommentsByTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const comments = await Comment.find({ taskId })
            .populate('userId', 'name email role')
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: 'Comments retrieved successfully',
            comments,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching comments', error: error.message });
    }
};

// Delete comment (admin or comment owner)
exports.deleteComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        if (comment.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete this comment' });
        }

        await Comment.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Comment deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting comment', error: error.message });
    }
};
