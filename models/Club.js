const mongoose = require('mongoose');
const { Schema } = mongoose;

const ClubSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
        },
        college_id: {
            type: Schema.Types.ObjectId,
            ref: 'College', // Reference the College model
            required: true,
        },
        status: {
            type: String,
            enum: ['active', 'inactive', 'review'],
            default: 'review',
        },
        admin: {
            type: Schema.Types.ObjectId,
            ref: 'User', // Reference the user who created the club
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports =
    mongoose.models.Club || mongoose.model('Club', ClubSchema);
