const express = require('express');
const router = express.Router();
const { 
    getAdminStats, 
    getAllUsers, 
    getAllIncidents,
    deleteUser, 
    deleteIncident, 
    createAnnouncement,
    getAllAnnouncements 
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Security: All routes require Admin role
router.use(protect);
router.use(authorize('Admin'));

// Dashboard Stats
router.get('/stats', getAdminStats);

// User Management
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);

// Incident Management
router.get('/incidents', getAllIncidents);
router.delete('/incidents/:id', deleteIncident);

// Announcements
router.post('/announcements', createAnnouncement);
router.get('/announcements', getAllAnnouncements);

module.exports = router;