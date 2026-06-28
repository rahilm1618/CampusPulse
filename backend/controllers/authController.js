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

// ... existing imports

// @desc    Login user
// @route   POST /api/auth/login
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email }).select('+password');
        if (user && (await user.matchPassword(password))) {
            
            // FIX: Pass an object with id AND role to the token generator
            // Note: Ensure your generateAccessToken function accepts an object payload
            // If generateAccessToken only accepts a string, you might need to update that utility too.
            // Assuming standard jwt.sign usage:
            const tokenPayload = { id: user._id, role: user.role };
            
            // If your generateAccessToken util expects just an ID, you need to change how you call it
            // or update the util. For now, let's assume we pass the payload properly.
            const accessToken = generateAccessToken(tokenPayload); 
            const refreshToken = generateRefreshToken(user._id);

            user.refreshToken = refreshToken;
            await user.save();

            res.json({
                _id: user._id,
                name: user.name,
                role: user.role,
                accessToken,
                refreshToken
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ... rest of the file

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

// @desc    Register a new Staff member (Created by HOD)
// @route   POST /api/auth/add-staff
// @access  Private (HOD Only)
exports.addStaff = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // 1. Security Check: Ensure the creator has a department
        if (!req.user.department) {
            return res.status(400).json({ message: "HOD must belong to a department to add staff." });
        }

        // 2. Force the new user into the HOD's department
        const user = await User.create({
            name,
            email,
            password,
            role: role || 'Maintenance', // Default to Maintenance
            department: req.user.department // <--- AUTOMATIC ASSIGNMENT
        });

        res.status(201).json({
            success: true,
            message: `Staff member ${user.name} added to your department.`,
            userId: user._id
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Targeted Announcements for logged-in user
// @route   GET /api/auth/my-announcements
// @access  Private
exports.getMyAnnouncements = async (req, res) => {
    try {
        const Announcement = require('../models/Announcement'); // Dynamic import to avoid circular dep if any
        const { role, department } = req.user;
        
        // Build the OR query for audiences
        const audiences = ['All'];
        if (role === 'Student') audiences.push('Student');
        if (role === 'Faculty') audiences.push('Faculty');
        if (role === 'Maintenance') audiences.push('Maintenance');
        // If they belong to a department (HOD, Maintenance, Security), include Department target
        if (department) audiences.push('Department');

        const query = {
            isActive: true,
            $or: [
                { audience: { $in: audiences.filter(a => a !== 'Department') } },
                { audience: 'Department', targetDepartment: department }
            ]
        };

        const announcements = await Announcement.find(query).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: announcements
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update User Profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Handle Avatar Upload if a file is provided via multer
        if (req.file) {
            user.avatar = req.file.path; // Cloudinary URL
        }

        if (req.body.name) {
            user.name = req.body.name;
        }
        
        if (req.body.password) {
            user.password = req.body.password;
        }

        await user.save();

        res.status(200).json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                avatar: user.avatar
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};