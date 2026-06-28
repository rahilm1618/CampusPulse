const Department = require('../models/Department');
const User = require('../models/User');
const Incident = require('../models/Incident');
// @desc    Create a new department
// @route   POST /api/departments
// @access  Private/Admin
exports.createDepartment = async (req, res) => {
    try {
        const { name, description, buildingLocation } = req.body;

        // Check if department already exists
        const deptExists = await Department.findOne({ name });
        if (deptExists) {
            return res.status(400).json({ message: 'Department already exists' });
        }

        const department = await Department.create({
            name,
            description,
            buildingLocation
        });

        res.status(201).json({
            success: true,
            data: department
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private
exports.getDepartments = async (req, res) => {
    try {
        const departments = await Department.find().populate('headOfDepartment', 'name email');
        res.status(200).json(departments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// @desc    Assign an HOD to a Department
// @route   PUT /api/departments/:id/assign-hod
// @access  Private (Admin)
// @desc    Assign a new HOD and demote the previous one
// @route   PUT /api/departments/:id/assign-hod
// @access  Private (Admin)

exports.assignHOD = async (req, res) => {
    try {
        const { hodId } = req.body; // The ID of the NEW HOD
        const deptId = req.params.id;

        const department = await Department.findById(deptId);
        if (!department) return res.status(404).json({ message: "Department not found" });

        // 1. Handle the Previous HOD (if they exist)
        if (department.headOfDepartment) {
            const oldHodId = department.headOfDepartment;
            
            // Demote old HOD to Maintenance staff and clear their department link if needed
            // Or just change the role so they lose HOD permissions
            await User.findByIdAndUpdate(oldHodId, { 
                role: 'Maintenance' 
            });
        }

        // 2. Update the New HOD's Role and Department Link
        const newHod = await User.findByIdAndUpdate(hodId, { 
            role: 'HOD',
            department: deptId 
        }, { new: true });

        if (!newHod) return res.status(404).json({ message: "New HOD user not found" });

        // 3. Update the Department to point to the new HOD
        department.headOfDepartment = hodId;
        await department.save();

        res.status(200).json({
            success: true,
            message: `HOD Updated: ${newHod.name} is now the head of ${department.name}. Previous HOD has been demoted to Maintenance.`,
            data: department
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};




// @desc    Get HOD Dashboard Analytics (Specific to their department)
// @route   GET /api/departments/hod/dashboard
// @access  Private (HOD)
exports.getHODDashboard = async (req, res) => {
    try {
        const deptId = req.user.department;

        if (!deptId) {
            return res.status(400).json({ message: "You are not associated with any department" });
        }

        // 1. Get Department Details
        const department = await Department.findById(deptId);
        
        // 2. Get Status Counts (Open, In Progress, Resolved)
        const stats = await Incident.aggregate([
            { $match: { department: deptId } },
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        // 3. Get Staff Performance (List of staff and their active tasks)
        const staffWorkload = await User.find({ 
            department: deptId, 
            role: { $in: ['Maintenance', 'Security'] } 
        })
        .select('name email activeTasks')
        .sort({ activeTasks: -1 });

        // 3. Get Recent Activity (Last 5 incidents)
        const recentIncidents = await Incident.find({ department: deptId })
            // Sort by Escalated (true) first, then by Newest date
            .sort({ isEscalated: -1, createdAt: -1 }) 
            .limit(10) // Increased limit so HOD sees more
            .populate('reportedBy', 'name')
            .populate('assignedTo', 'name');

        res.status(200).json({
            success: true,
            departmentId: deptId,
            departmentName: department?.name || "Unknown Department",
            statusSummary: stats,
            teamWorkload: staffWorkload,
            recentActivity: recentIncidents
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};