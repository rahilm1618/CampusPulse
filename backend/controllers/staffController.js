const Incident = require('../models/Incident');

// @desc    Get Staff Personal Stats
// @route   GET /api/staff/stats
// @access  Private (Maintenance)
exports.getStaffStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Tasks Completed Today
        const completedToday = await Incident.countDocuments({
            assignedTo: req.user._id,
            status: 'RESOLVED',
            updatedAt: { $gte: today }
        });

        // 2. Current Active Load
        const activeTasks = await Incident.countDocuments({
            assignedTo: req.user._id,
            status: { $in: ['OPEN', 'IN_PROGRESS', 'REOPENED'] }
        });

        // 3. Average Rating calculation
        const ratedIncidents = await Incident.find({
            assignedTo: req.user._id,
            rating: { $exists: true }
        });

        const avgRating = ratedIncidents.length > 0
            ? ratedIncidents.reduce((acc, item) => acc + item.rating, 0) / ratedIncidents.length
            : 0;

        res.status(200).json({
            success: true,
            completedToday,
            activePending: activeTasks,
            averageRating: avgRating.toFixed(1)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};