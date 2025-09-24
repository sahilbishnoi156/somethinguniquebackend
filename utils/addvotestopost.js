const Vote = require('../models/Vote');

const addVotesCountToPosts = async (posts, req) => {
    return await Promise.all(
        posts.map(async (post) => {
            // Get vote counts
            const upvotesCount = await Vote.countDocuments({
                post_id: post._id,
                vote_type: 'upvote',
            });
            const downvotesCount = await Vote.countDocuments({
                post_id: post._id,
                vote_type: 'downvote',
            });

            // Check if the current user has voted on this post
            const userVote = await Vote.findOne({
                post_id: post._id,
                user_id: req.user.id,
            });

            // Add vote info to the post object
            return {
                ...post,
                upvotesCount,
                downvotesCount,
                userVote: userVote ? userVote.vote_type : null, // null means no vote
            };
        })
    );
};

module.exports = addVotesCountToPosts;
