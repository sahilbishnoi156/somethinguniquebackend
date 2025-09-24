const mongoose = require('mongoose');
const { Schema } = mongoose;

const CollegeSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
        },
        city: {
            type: String,
        },
        state: {
            type: String,
        },
        country: {
            type: String,
            required: true,
        },
        admin: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
);

module.exports =
    mongoose.models.College ||
    mongoose.model('College', CollegeSchema);
