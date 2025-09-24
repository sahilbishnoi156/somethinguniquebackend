const mongoose = require('mongoose');
const { Schema } = mongoose;

const VoteSchema = new Schema(
    {
        user_id: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        post_id: {
            type: Schema.Types.ObjectId,
            ref: 'Post',
            required: true,
        },
        vote_type: {
            type: String,
            enum: ['upvote', 'downvote'],
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports =
    mongoose.models.Vote || mongoose.model('Vote', VoteSchema);
