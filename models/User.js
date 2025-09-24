const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        admin_of_college: {
            type: Schema.Types.ObjectId,
            ref: 'College',
        },
        bio: {
            type: String,
        },
        college_id: {
            type: Schema.Types.ObjectId,
            ref: 'College',
        },
        avatar: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: true,
    }
);

module.exports =
    mongoose.models.User || mongoose.model('User', UserSchema);
