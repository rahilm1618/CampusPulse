const Incident = require('../models/Incident');
const User = require('../models/User');
const Department = require('../models/Department');

// @desc    Report a new incident
// @route   POST /api/incidents
// @access  Private (Student/Faculty)
exports.createIncident = async (req, res) => {
    try {
        const { title, description, category, longitude, latitude, blockName, roomNumber } = req.body;

        // 1. Find the department matching the category
        const dept = await Department.findOne({ name: category });
        if (!dept) {
            return res.status(404).json({ message: "Department for this category not found." });
        }

        // 2. Auto-Assignment Logic: Find staff in this dept with fewest active tasks
        const availableStaff = await User.findOne({
            role: 'Maintenance',
            department: dept._id,
            isDeleted: false
        }).sort({ activeTasks: 1 }); // Sorts ascending (0, 1, 2...)

        // 3. Extract Cloudinary URLs from multer
        const imageUrls = Array.isArray(req.files)
  ? req.files.map(file => file.path)
  : [];


        // 4. Create the Incident
        const incident = await Incident.create({
            title,
            description,
            category,
            department: dept._id,
            reportedBy: req.user._id,
            assignedTo: availableStaff ? availableStaff._id : null,
            location: {
                type: 'Point',
                coordinates: [longitude, latitude],
                blockName,
                roomNumber
            },
            images: { beforeFix: imageUrls },
            status: availableStaff ? 'OPEN' : 'OPEN' // Could be 'PENDING' if no staff exists
        });

        // 5. Increment Staff's active task count if assigned
        if (availableStaff) {
            availableStaff.activeTasks += 1;
            await availableStaff.save();
        }

        res.status(201).json({
            success: true,
            data: incident,
            assignedTo: availableStaff ? availableStaff.name : 'Unassigned (No staff available)'
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// @desc    Get incidents assigned to the logged-in staff member
// @route   GET /api/incidents/my-tasks
// @access  Private (Maintenance/Security)
exports.getMyTasks = async (req, res) => {
    try {
        // Find incidents where assignedTo matches the logged-in user's ID
        const tasks = await Incident.find({ 
            assignedTo: req.user._id,
            status: { $ne: 'RESOLVED' } // Optional: Hide resolved tasks
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: tasks.length,
            data: tasks
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update incident status (Work on it or Resolve it)
// @route   PATCH /api/incidents/:id/status
// @access  Private (Maintenance/Security)
exports.updateIncidentStatus = async (req, res) => {
    try {
        const { status } = req.body;
        let incident = await Incident.findById(req.params.id);

        if (!incident) return res.status(404).json({ message: "Incident not found" });

        // Security Check: Only the assigned staff can update the status
        if (incident.assignedTo.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "You are not assigned to this task" });
        }

        // Logic for RESOLVED status
        if (status === 'RESOLVED') {
            // 1. Require "After" images
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ message: "Please upload a photo of the fix to resolve" });
            }

            // 2. Save After-Fix images
            const imageUrls = req.files.map(file => file.path);
            incident.images.afterFix = imageUrls;

            // 3. Decrement Staff active tasks
            const staff = await User.findById(req.user._id);
            if (staff.activeTasks > 0) {
                staff.activeTasks -= 1;
                await staff.save();
            }
        }

        incident.status = status;
        await incident.save();

        res.status(200).json({ success: true, data: incident });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};