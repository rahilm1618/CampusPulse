const express = require('express');
const router = express.Router();
const { createDepartment, getDepartments,assignHOD,getHODDashboard } = require('../controllers/deptController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect,authorize('Admin'), getDepartments)
    .post(protect, authorize('Admin'), createDepartment); // Restricted to Admin

router.put('/:id/assign-hod', protect, authorize('Admin'), assignHOD);
router.get('/hod/dashboard', protect, authorize('HOD'), getHODDashboard);
module.exports = router;