const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

const fetchuser = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).send({
            error: 'Please authenticate using a valid token',
        });
    }

    try {
        const data = jwt.verify(token, JWT_SECRET);
        req.user = data.user;
        next();
    } catch (error) {
        //Check for token expiration specifically
        if (error.name === 'TokenExpiredError') {
            return res.status(419).send({
                error: 'Your token has expired. Please log in again.',
                isJwtExpired: true,
            });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(419).send({
                error: 'Invalid token. Please log in again.',
            });
        } else {
            console.error('JWT verification error:', error); // Log other errors for debugging
            return res
                .status(500)
                .send({ error: 'An unexpected error occurred.' }); //Internal server error
        }
    }
};

module.exports = fetchuser;
