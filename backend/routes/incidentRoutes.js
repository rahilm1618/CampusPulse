const express = require('express');
const router = express.Router();
const { createIncident } = require('../controllers/incidentController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');
const { getMyTasks } = require('../controllers/incidentController');
const { authorize } = require('../middleware/authMiddleware');
const { updateIncidentStatus } = require('../controllers/incidentController');
// 'beforeFix' matches the field name in your Postman request
router.post('/', protect, upload.array('beforeFix', 3), createIncident);

// Only Maintenance and Security staff should be able to access their task list
router.get('/my-tasks', protect, authorize('Maintenance', 'Security'), getMyTasks);

router.patch('/:id/status', protect, authorize('Maintenance', 'Security'), upload.array('afterFix', 3), updateIncidentStatus);

module.exports = router;