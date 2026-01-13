const express = require('express');
const router = express.Router();
const { createDepartment, getDepartments } = require('../controllers/deptController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect,authorize('Admin'), getDepartments)
    .post(protect, authorize('Admin'), createDepartment); // Restricted to Admin

module.exports = router;