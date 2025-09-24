const mongoose = require('mongoose');
const { Schema } = mongoose;

const CommentSchema = new Schema(
    {
        post_id: {
            type: Schema.Types.ObjectId,
            ref: 'Post', // Reference to the Post model
            required: true,
        },
        user_id: {
            type: Schema.Types.ObjectId,
            ref: 'User', // Reference to the User model
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: false }, // Automatically adds created_at field
    }
);

module.exports =
    mongoose.models.Comment ||
    mongoose.model('Comment', CommentSchema);
