const express = require('express');
const router = express.Router();
const fetchuser = require('../middleware/fetcher');
const Post = require('../models/Post');
const Club = require('../models/Club');
const addVotesCountToPosts = require('../utils/addvotestopost');

// Route 1: get all the notes using : Get "/api/fetchallposts"
router.get('/get-club-posts', fetchuser, async (req, res) => {
    const clubId = req.query.clubId;
    const club = await Club.findById(clubId)
        .populate('admin')
        .populate('college_id');
    if (!club) {
        return res.status(400).json({
            message: 'Club not found',
            data: null,
        });
    }
    if (club.status !== 'active') {
        return res.status(400).json({
            message: 'Club not found',
            data: null,
        });
    }
    const college_id = req.user.college_id;
    try {
        // Get all posts for the given category and college
        const posts = await Post.find({
            category: 'event',
            college_id,
            user_id: club.admin,
        })
            .populate('user_id')
            .lean();
        const postsWithVoteInfo = await addVotesCountToPosts(
            posts,
            req
        );

        res.status(200).json({
            data: {
                posts: postsWithVoteInfo,
                club: club,
            },
            message: 'Posts fetched successfully',
        });
    } catch (error) {
        console.error(error.message);
        res.status(400).send('Internal server error occurred');
    }
});

router.get('/get-clubs', fetchuser, async (req, res) => {
    const college_id = req.user.college_id;
    try {
        const clubs = await Club.find({
            college_id,
            status: 'active',
        });
        res.status(200).json({
            data: clubs,
            message: 'Clubs fetched successfully',
        });
    } catch (error) {
        console.error(error.message);
        res.status(400).send('Internal server error occurred');
    }
});

module.exports = router;
