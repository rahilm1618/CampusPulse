const express = require('express');
const router = express.Router();
const { registerUser, loginUser,refreshAccessToken,addStaff } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh', refreshAccessToken);
// Add this under your protected routes
router.post('/add-staff', protect, authorize('HOD'), addStaff);

module.exports = router;