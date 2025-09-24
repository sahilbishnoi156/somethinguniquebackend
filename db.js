const mongoose = require('mongoose'); //~ Initializing mongoose
require('dotenv').config();

const encodedPassword = encodeURIComponent('Sahil80942@#');

const mongoURI = process.env.DB_URI;

const connectToMongo = async () => {
    await mongoose.connect(mongoURI);
    const db = mongoose.connection;
    db.on(
        'error',
        console.error.bind(console, 'MongoDB connection error:')
    );
    db.once('open', () => {
        console.log('Connected to MongoDB!');
    });
};

module.exports = connectToMongo;
