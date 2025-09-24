const mongoose = require('mongoose');
const { Schema } = mongoose;

const OtpSchema = new Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
        },
        otp: {
            type: Number,
            required: true,
        },
        expireAt: {
            type: Date,
            default: Date.now,
            index: { expires: '1m' },
        },
    },
    {
        timestamps: true,
    }
);

module.exports =
    mongoose.models.OtpSchema || mongoose.model('Otp', OtpSchema);
