const express = require('express');
const router = express.Router();
const { getStaffStats } = require('../controllers/staffController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/stats', protect, authorize('Maintenance'), getStaffStats);

module.exports = router;