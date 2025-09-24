const express = require('express');
const router = express.Router();
const fetchuser = require('../middleware/fetcher');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Vote = require('../models/Vote');
const { body, validationResult } = require('express-validator');
const addVotesCountToPosts = require('../utils/addvotestopost');
const mongoose = require('mongoose');

// Route 1: get all the notes using : Get "/api/fetchallposts"
router.get('/get-by-category', fetchuser, async (req, res) => {
    const category = req.query.category;
    if (
        !['confession', 'forum', 'lostAndFound', 'event'].includes(
            category
        )
    ) {
        return res.status(400).send('Invalid category');
    }

    const college_id = req.user.college_id;
    try {
        // Get all posts for the given category and college
        const posts = await Post.find({
            category,
            college_id,
        })
            .populate('user_id') // Populate user details
            .lean();
        const postsWithVoteInfo = await addVotesCountToPosts(
            posts,
            req
        );

        res.status(200).json({
            data: postsWithVoteInfo,
            message: 'Posts fetched successfully',
        });
    } catch (error) {
        console.error(error.message);
        res.status(400).send('Internal server error occurred');
    }
});

router.post('/get-post', fetchuser, async (req, res) => {
    try {
        const { postId } = req.body;
        const post = await Post.findById(postId).populate('user_id');
        res.json(post);
    } catch (error) {
        console.error(error.message);
        res.status(400).send('Internal server error occurred');
    }
});

// Route 4: Delete note using : Delete "/api/deleteblog" Login required
router.delete('/delete-post', fetchuser, async (req, res) => {
    try {
        // Find the note to be Delete
        let post = await Post.findById(req.query.postId);
        if (!post) {
            return res.status(401).send({
                data: null,
                message: 'Post not found',
            });
        } // checking if note if found

        console.log(post);
        if (post.user_id.toString() !== req.user.id) {
            // validating user
            return res.status(401).json({
                data: null,
                message: 'You cannot delete this post',
            });
        }
        await Comment.deleteMany({ post_id: req.query.postId });
        await Post.deleteOne({
            _id: req.query.postId,
        });
        res.json({ data: null, message: 'Post Deleted' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({
            data: null,
            message: 'Internal server error occurred',
        });
    }
});

router.patch('/vote-post', fetchuser, async (req, res) => {
    const { postId, voteType } = req.body;
    const userId = req.user.id;

    try {
        // Check if the user has already voted on the post
        const existingVote = await Vote.findOne({
            user_id: userId,
            post_id: postId,
        });

        if (existingVote) {
            // User has already voted, so update their vote
            if (existingVote.vote_type === voteType) {
                // Remove vote (unvoting)
                await Vote.deleteOne({ _id: existingVote._id });
            } else {
                // Change vote (upvote -> downvote or vice versa)
                existingVote.vote_type = voteType;
                await existingVote.save();
            }
        } else {
            // Create a new vote
            await Vote.create({
                user_id: userId,
                post_id: postId,
                vote_type: voteType,
            });
        }

        const upvotes = await Vote.countDocuments({
            post_id: postId,
            vote_type: 'upvote',
        });
        const downvotes = await Vote.countDocuments({
            post_id: postId,
            vote_type: 'downvote',
        });

        res.status(200).json({
            data: {
                upvotesCount: upvotes,
                downvotesCount: downvotes,
            },
            message: 'Voted successfully',
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
