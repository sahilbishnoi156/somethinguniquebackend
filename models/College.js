const mongoose = require('mongoose');
const { Schema } = mongoose;

const CollegeSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    admin: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    key: {
        type: String,
        required: true,
    },
});

module.exports =
    mongoose.models.College ||
    mongoose.model('College', CollegeSchema);
