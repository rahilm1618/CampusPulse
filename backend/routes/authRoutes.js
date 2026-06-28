const express = require('express');
const router = express.Router();
const { registerUser, loginUser,refreshAccessToken,addStaff,getMyAnnouncements,updateProfile } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh', refreshAccessToken);
// Add this under your protected routes
router.post('/add-staff', protect, authorize('HOD'), addStaff);
router.get('/my-announcements', protect, getMyAnnouncements);
router.put('/profile', protect, upload.single('avatar'), updateProfile);

module.exports = router;