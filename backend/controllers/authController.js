const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { generateRefreshToken,generateAccessToken } = require('../utils/generateToken');
// @desc    Register new user
// @route   POST /api/auth/register
exports.registerUser = async (req, res) => {
    const { name, email, password, role, department } = req.body;
    try {
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        const user = await User.create({ name, email, password, role, department });

        res.status(201).json({
            _id: user._id,
            name: user.name,
            role: user.role,
            token: generateAccessToken(user._id),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email }).select('+password');
        if (user && (await user.matchPassword(password))) {
            
            const accessToken = generateAccessToken(user._id);
            const refreshToken = generateRefreshToken(user._id);

            // Save refresh token in DB
            user.refreshToken = refreshToken;
            await user.save();

            res.json({
                _id: user._id,
                name: user.name,
                role: user.role,
                accessToken,
                refreshToken // In production, this is often sent as an httpOnly cookie
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
        
    }
};

// Add this to controllers/authController.js
exports.refreshAccessToken = async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) return res.status(401).json({ message: 'Refresh Token required' });

    try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decoded.id);

        if (!user || user.refreshToken !== refreshToken) {
            return res.status(403).json({ message: 'Invalid Refresh Token' });
        }

        const newAccessToken = generateAccessToken(user._id);
        res.json({ accessToken: newAccessToken });
        
    } catch (error) {
        res.status(403).json({ message: 'Refresh Token expired or invalid' });
    }
};