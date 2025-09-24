const mongoose = require('mongoose');
const { Schema } = mongoose;

const ClubSchema = new Schema({
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
    created_by: {
        type: Schema.Types.ObjectId,
        ref: 'User', // Reference the user who created the club
        required: true,
    },
});

module.exports =
    mongoose.models.Club || mongoose.model('Club', ClubSchema);
