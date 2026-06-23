const express = require('express');
const router = express.Router();
const { createIncident,triggerPanic } = require('../controllers/incidentController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');
const { getMyTasks } = require('../controllers/incidentController');
const { authorize } = require('../middleware/authMiddleware');
const { updateIncidentStatus ,reassignIncident,rateIncident,getMyIncidents,getMapData,addComment} = require('../controllers/incidentController');
// 'beforeFix' matches the field name in your Postman request
router.post('/', protect, upload.array('beforeFix', 3), createIncident);

// Only Maintenance and Security staff should be able to access their task list
router.get('/my-tasks', protect, authorize('Maintenance', 'Security'), getMyTasks);

//studentdashboard

router.get('/my-incidents', protect, authorize('Student'), getMyIncidents);

router.patch('/:id/status', protect, authorize('Maintenance', 'Security'), upload.array('afterFix', 3), updateIncidentStatus);

//panic
router.post('/panic', protect,upload.none(), triggerPanic);
router.put('/reassign/:id', protect, authorize('HOD', 'Admin'), reassignIncident);
router.patch('/:id/rate', protect, authorize('Student'), rateIncident);

router.get('/map-data', protect, authorize('Security', 'Admin'), getMapData);

// Chat Route
router.post('/:id/comment', protect, addComment);

module.exports = router;