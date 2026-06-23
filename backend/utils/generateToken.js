const jwt = require('jsonwebtoken');

const generateAccessToken = (user) => {
    // Check if we passed a full user object or just an ID
    const payload = {
        id: user._id || user.id || user, // Handle various input formats
        role: user.role || null          // Include role if it exists
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '15m', // Short life for security
    });
};
const generateRefreshToken = (id) => {
    return jwt.sign({ id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
};

module.exports ={ generateAccessToken, generateRefreshToken };