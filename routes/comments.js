const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const User = require('../models/User');
const Post = require('../models/Post');
const fetchuser = require('../middleware/fetcher');
const mongoose = require('mongoose');

// Add a new comment (top-level)
router.post('/add', fetchuser, async (req, res) => {
    try {
        const { post_id, content } = req.body;

        const comment = new Comment({
            post_id,
            user_id: req.user.id,
            content,
        });

        const user = await User.findById(req.user.id);
        const savedComment = await comment.save();

        savedComment.user_id = user; //Attach user object for easier access in the frontend

        res.status(201).json({
            data: savedComment,
            message: 'Comment added successfully',
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            data: error,
            message: 'Failed to add comment.',
        });
    }
});

router.delete('/delete', fetchuser, async (req, res) => {
    try {
        const { commentId } = req.body;
        const comment = await Comment.findById(commentId);
        if (!comment)
            return res.status(404).json({
                success: false,
                error: 'Comment not found.',
            });
        if (comment.user_id.toString() !== req.user.id)
            return res.status(401).json({
                success: false,
                error: 'Not authorized to delete this comment.',
            });

        res.status(200).json({
            data: null,
            message: 'Comment deleted successfully.',
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            data: error,
            message: 'Failed to delete comment.',
        });
    }
});

// Get top-level comments for a post
router.get('/get-comments-for-post', fetchuser, async (req, res) => {
    try {
        const { postId: post_id } = req.query;
        const post = await Post.findById(post_id).populate('user_id');
        const user = await User.findById(req.user.id);
        const comments = await Comment.find({
            post_id,
        }).populate('user_id');
        res.json({
            message: 'Comments fetched successfully',
            data: {
                comments: comments,
                post: post,
                user: user,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch comments.',
        });
    }
});

module.exports = router;
