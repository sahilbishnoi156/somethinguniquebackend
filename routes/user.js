const express = require('express');
const router = express.Router();
const fetchuser = require('../middleware/fetcher');
const Post = require('../models/Post');
const User = require('../models/User');
const { body, validationResult } = require('express-validator');
var jwt = require('jsonwebtoken');
const addVotesCountToPosts = require('../utils/addvotestopost');
const JWT_SECRET = process.env.JWT_SECRET;

// Route 1: get all the notes using : Get "/api/fetchallposts"
router.get('/post', fetchuser, async (req, res) => {
    try {
        const posts = await Post.find();
        res.json(posts);
    } catch (error) {
        console.error(error.message);
        res.status(400).send('Internal server error occurred');
    }
});

router.post(
    '/create-post',
    fetchuser,
    [
        body('caption', 'Enter a valid caption').isLength({ min: 3 }),
        body('category', 'Enter a valid category'),
        body('attachments', 'Enter a valid attachments'),
    ],
    async (req, res) => {
        try {
            // If there are errors, return a bad request
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    data: errors
                        .array()
                        .map((item) => item.msg)
                        .join(', '),
                    message: 'Invalid data',
                });
            }
            const { caption, attachments, category } = req.body;
            if (
                ![
                    'confession',
                    'forum',
                    'lostAndFound',
                    'event',
                ].includes(category)
            ) {
                return res.status(400).json({
                    data: null,
                    message: 'Invalid category',
                });
            }
            const newPost = new Post({
                user_id: req.user.id,
                college_id: req.user.college_id,
                caption,
                attachments,
                category,
            });
            await newPost.save();
            const post = await Post.findById(newPost._id).populate(
                'user_id'
            );
            res.json({
                data: post,
                message: 'Post created successfully',
            });
        } catch (error) {
            console.error(error.message);
            res.status(500).json({
                data: null,
                message: 'Internal server error occurred',
            });
        }
    }
);

router.get('/get-user', fetchuser, async (req, res) => {
    try {
        const id = req.user.id;
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                data: null,
                message: 'User not found',
            });
        }
        res.json({
            data: user,
            message: 'User fetched successfully',
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({
            data: null,
            message: 'Internal server error occurred',
        });
    }
});
router.get('/get-profile', fetchuser, async (req, res) => {
    try {
        const username = req.query.username;
        const user = await User.findOne({
            username,
        });
        if (!user) {
            return res.status(404).json({
                data: null,
                message: 'User not found',
            });
        }
        const posts = await Post.find({ user_id: user._id })
            .populate('user_id')
            .lean();
        const updatedPosts = await addVotesCountToPosts(posts, req);
        res.json({
            data: { user, posts: updatedPosts },
            message: 'User fetched successfully',
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({
            data: null,
            message: 'Internal server error occurred',
        });
    }
});

router.patch('/update-bio', fetchuser, async (req, res) => {
    try {
        const { bio } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { bio },
            { new: true }
        );
        res.json({
            data: user,
            message: 'User updated successfully',
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({
            data: null,
            message: 'Internal server error occurred',
        });
    }
});

router.patch('/update-username', fetchuser, async (req, res) => {
    try {
        const { username } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { username },
            { new: true }
        );
        const data = {
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                college_id: user.college_id,
            },
        };
        const authToken = jwt.sign(data, JWT_SECRET);
        res.json({
            data: {
                user,
                authToken,
            },
            message: 'User updated successfully',
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({
            data: null,
            message: 'Internal server error occurred',
        });
    }
});

router.patch(
    '/update-profile-picture',
    fetchuser,
    async (req, res) => {
        try {
            const { avatar } = req.body;
            const user = await User.findByIdAndUpdate(
                req.user.id,
                { avatar },
                { new: true }
            );
            res.json({
                data: user,
                message: 'User updated successfully',
            });
        } catch (error) {
            console.error(error.message);
            res.status(500).json({
                data: null,
                message: 'Internal server error occurred',
            });
        }
    }
);

router.get('/get-suggestions', fetchuser, async (req, res) => {
    try {
        const query = req.query.query;
        const users = await User.find({
            username: { $regex: query, $options: 'i' },
        }).limit(5);
        res.json({
            data: users,
            message: 'Users fetched successfully',
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({
            data: null,
            message: 'Internal server error occurred',
        });
    }
});
module.exports = router;
