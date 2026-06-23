const Incident = require('../models/Incident');
const User = require('../models/User');
const Announcement = require('../models/Announcement'); // Ensure you have this model created

// @desc    Get Admin Dashboard Stats (Cards)
// @route   GET /api/admin/stats
exports.getAdminStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalIncidents = await Incident.countDocuments();
        const openIncidents = await Incident.countDocuments({ status: { $ne: 'RESOLVED' } });
        const criticalIncidents = await Incident.countDocuments({ priority: 'Critical' });

        // Optional: Keep your detailed aggregation if you want to use it later
        const deptPerformance = await Incident.aggregate([
            {
                $group: {
                    _id: "$category",
                    totalIncidents: { $sum: 1 },
                    resolvedCount: { $sum: { $cond: [{ $eq: ["$status", "RESOLVED"] }, 1, 0] } }
                }
            }
        ]);

        res.status(200).json({
            totalUsers,
            totalIncidents,
            openIncidents,
            criticalIncidents,
            deptPerformance
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get All Users
// @route   GET /api/admin/users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password').populate('department', 'name').sort({ createdAt: -1 });
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get All Incidents (With Search/Filter)
// @route   GET /api/admin/incidents
exports.getAllIncidents = async (req, res) => {
    try {
        const { search, status, category, sort, page = 1, limit = 50 } = req.query; // Increased limit for dashboard

        const queryObject = {};

        if (search) {
            queryObject.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        if (status && status !== 'All') queryObject.status = status;
        if (category && category !== 'All') queryObject.category = category;

        let sortStr = '-createdAt';
        if (sort === 'oldest') sortStr = 'createdAt';
        if (sort === 'priority') sortStr = 'priority';

        const pageNum = Number(page);
        const limitNum = Number(limit);
        const skip = (pageNum - 1) * limitNum;

        const incidents = await Incident.find(queryObject)
            .populate('reportedBy', 'name email role') // Added role
            .populate('assignedTo', 'name email')
            .sort(sortStr)
            .skip(skip)
            .limit(limitNum);

        const totalIncidents = await Incident.countDocuments(queryObject);

        res.status(200).json({
            success: true,
            count: incidents.length,
            totalIncidents,
            data: incidents // <--- Frontend expects this
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete User
// @route   DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "User deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete Incident
// @route   DELETE /api/admin/incidents/:id
exports.deleteIncident = async (req, res) => {
    try {
        await Incident.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "Incident deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create Announcement
// @route   POST /api/admin/announcements
exports.createAnnouncement = async (req, res) => {
    try {
        const { title, message, priority } = req.body;
        
        const announcement = await Announcement.create({
            title,
            message,
            priority,
            createdBy: req.user._id
        });

        res.status(201).json({
            success: true,
            data: announcement,
            message: "Announcement broadcasted"
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get All Announcements
// @route   GET /api/admin/announcements
exports.getAllAnnouncements = async (req, res) => {
    try {
        const announcements = await Announcement.find({ isActive: true })
            .sort({ createdAt: -1 })
            .populate('createdBy', 'name');

        res.status(200).json(announcements); // Return simple array
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

