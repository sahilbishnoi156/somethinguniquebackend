const connectToMongo = require('./db'); // initializing db file
const express = require('express'); // Initializing
const path = require('path');
require('dotenv').config();

connectToMongo(); //! Running db server

const app = express();
const cors = require('cors');
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/static', express.static(path.join(__dirname, 'public')));

// Available Routes

app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/feed', require('./routes/post'));
app.use('/api/comments', require('./routes/comments'));

app.listen(port, () => {
    console.log(`SomethingUnique App now live on port ${port}`);
});
