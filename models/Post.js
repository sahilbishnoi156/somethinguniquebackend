const mongoose = require('mongoose');
const { Schema } = mongoose;

const PostSchema = new Schema(
    {
        user_id: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        college_id: {
            type: Schema.Types.ObjectId,
            ref: 'College',
            required: true,
        },
        category: {
            type: String,
            required: true,
            enum: ['lostAndFound', 'confession', 'forum', 'event'],
        },
        caption: {
            type: String,
            required: true,
        },
        is_approved: {
            type: Boolean,
            default: false,
        },
        attachments: {
            type: [
                {
                    type: { type: String, enum: ['image', 'video'] },
                    url: String,
                },
            ],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

module.exports =
    mongoose.models.Post || mongoose.model('Post', PostSchema);
