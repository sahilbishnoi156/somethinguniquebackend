const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

const isCollegeAdmin = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({
            message: 'Please authenticate using a valid token',
            data: null,
        });
    }
    try {
        const data = jwt.verify(token, JWT_SECRET);
        if (data.user.role !== 'college_admin') {
            return res.status(403).json({
                message: 'Authorization denied',
                data: null,
            });
        }
        req.user = data.user;
        next();
    } catch (error) {
        //Check for token expiration specifically
        if (error.name === 'TokenExpiredError') {
            return res.status(419).json({
                message:
                    'Your token has expired. Please log in again.',
                data: error,
                isJwtExpired: true, // Added comma
            });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(419).json({
                message: 'Invalid token. Please log in again.',
                data: error,
            });
        } else {
            console.error('JWT verification error:', error); // Log other errors for debugging
            return res.status(500).json({
                message: 'An unexpected error occurred.',
                data: error,
            }); //Internal server error
        }
    }
};

module.exports = isCollegeAdmin;
