const Department = require('../models/Department');

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
        const departments = await Department.find();
        res.status(200).json(departments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};