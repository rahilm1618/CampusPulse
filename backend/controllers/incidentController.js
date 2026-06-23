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
            priority: 'Medium',
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
// @desc    Get incidents assigned to staff (Security sees all security tasks)
// @route   GET /api/incidents/my-tasks
// @access  Private (Maintenance/Security)
exports.getMyTasks = async (req, res) => {
    try {
        let query;

        if (req.user.role === 'Security') {
            // Security personnel see ALL security-related incidents that aren't resolved
            query = {
                category: 'Security',
                status: { $ne: 'RESOLVED' }
            };
        } else {
            // Maintenance staff only see incidents specifically assigned to them
            query = {
                assignedTo: req.user._id,
                status: { $ne: 'RESOLVED' }
            };
        }

        const tasks = await Incident.find(query)
            .populate('reportedBy', 'name roomNumber') // Existing
            // UPDATED: Populate sender details inside the comments array
            .populate({
                path: 'comments.sender',
                select: 'name role' // Only fetch Name and Role (e.g., "Student")
            })
            // Optional: Also show escalated/reopened tasks at the top for staff too
            .sort({ isEscalated: -1, status: -1, createdAt: -1 });

        res.status(200).json({
            success: true,
            count: tasks.length,
            role: req.user.role,
            data: tasks
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// @desc    Update status and handle "Claiming" for unassigned tasks
// @route   PATCH /api/incidents/:id/status
// @access  Private (Maintenance/Security)
// @desc    Update status and handle "Claiming" for unassigned tasks
// @route   PATCH /api/incidents/:id/status
// @access  Private (Maintenance/Security)
exports.updateIncidentStatus = async (req, res) => {
    try {
        const { status } = req.body;
        // Use populate to check the user role if needed, but req.user usually has it
        let incident = await Incident.findById(req.params.id);

        if (!incident) return res.status(404).json({ message: "Incident not found" });

        // --- 1. NEW "CLAIMING" LOGIC (Strictly for Security) ---
        if (!incident.assignedTo) {
            // Check if user is trying to claim it (moving to IN_PROGRESS)
            if (status === 'IN_PROGRESS') {
                // STRICT CHECK: Only Security can claim unassigned tasks
                if (req.user.role !== 'Security') {
                    return res.status(403).json({
                        message: "Only Security personnel can claim unassigned emergency tasks."
                    });
                }

                // If role is Security, allow the claim
                incident.assignedTo = req.user._id;

                // Increment active tasks
                await User.findByIdAndUpdate(req.user._id, { $inc: { activeTasks: 1 } });
            } else {
                // If they are trying to Resolve an unassigned task without claiming it first
                return res.status(400).json({ message: "You must claim (set to IN_PROGRESS) this task before resolving it." });
            }
        }

        // --- 2. STANDARD CHECK (For already assigned tasks) ---
        // If it IS assigned, ensure the current user is the one assigned to it
        else if (incident.assignedTo.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "This task is already being handled by another officer" });
        }

        // --- 3. RESOLUTION LOGIC ---
        if (status === 'RESOLVED') {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ message: "Please upload proof of resolution" });
            }
            incident.images.afterFix = req.files.map(file => file.path);

            // Decrement active tasks upon completion
            await User.findByIdAndUpdate(req.user._id, { $inc: { activeTasks: -1 } });
        }

        incident.status = status;
        await incident.save();

        res.status(200).json({
            success: true,
            message: `Status updated to ${status}`,
            claimedBy: !incident.assignedTo ? req.user.name : 'Already Assigned',
            data: incident
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// @desc    Trigger Emergency Panic Alert
// @route   POST /api/incidents/panic
// @access  Private (Any User)
exports.triggerPanic = async (req, res) => {
    try {
        const { longitude, latitude, locationDescription } = req.body;

        // Create a special incident with 'High' priority (internal logic)
        const panicAlert = await Incident.create({
            title: "🚨 EMERGENCY PANIC ALERT",
            description: `Emergency triggered at ${locationDescription}`,
            category: "Security",
            priority: "Critical",
            reportedBy: req.user._id,
            location: {
                type: 'Point',
                coordinates: [longitude, latitude],
                blockName: "EMERGENCY"
            },
            status: 'OPEN'
        });

        // In a real app, this is where you would trigger WebSockets/Socket.io 
        // to send a real-time push notification to all Security staff devices.

        res.status(201).json({
            success: true,
            message: "Emergency alert sent to all Security personnel!",
            data: panicAlert
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// @desc    Rate an incident (Handle Reopening on bad ratings)
// @route   PATCH /api/incidents/:id/rate
// @access  Private (Student Only)
exports.rateIncident = async (req, res) => {
    try {
        const { rating, feedback } = req.body;
        const incident = await Incident.findById(req.params.id);

        if (!incident) return res.status(404).json({ message: "Incident not found" });

        // 1. Security: Only the reporter can rate
        if (incident.reportedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "You can only rate your own incidents" });
        }

        // 2. Logic: Can only rate if it was RESOLVED
        if (incident.status !== 'RESOLVED') {
            return res.status(400).json({ message: "You can only rate resolved incidents" });
        }

        incident.rating = rating;
        incident.feedback = feedback;

        // 3. THE REOPEN LOGIC
        if (rating < 2) {
            // Bad Rating (1 Star) -> REOPEN the ticket
            incident.status = 'REOPENED';

            // AUTOMATICALLY INCREMENT STAFF LOAD
            // Since the task is active again, we must add +1 to the staff's count
            if (incident.assignedTo) {
                await User.findByIdAndUpdate(incident.assignedTo, {
                    $inc: { activeTasks: 1 }
                });
            }

            res.status(200).json({
                success: true,
                message: "We are sorry to hear that. The incident has been REOPENED and sent back to the staff.",
                data: incident
            });

        } else {
            // Good Rating (2-5 Stars) -> Keep as RESOLVED (Final State)
            // We do not change status to CLOSED if you prefer keeping it RESOLVED
            await incident.save();

            res.status(200).json({
                success: true,
                message: "Thank you for your feedback!",
                data: incident
            });
        }

        // Save the changes (status, rating, feedback)
        await incident.save();

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Smart Auto-Reassign incident to the next available staff
// @route   PUT /api/incidents/reassign/:id
// @access  Private (HOD / Admin)
exports.reassignIncident = async (req, res) => {
    try {
        const incident = await Incident.findById(req.params.id);

        if (!incident) return res.status(404).json({ message: "Incident not found" });

        // SECURITY: Verify HOD manages this specific department
        if (req.user.role === 'HOD') {
            if (incident.department.toString() !== req.user.department.toString()) {
                return res.status(403).json({
                    message: "You can only reassign incidents within your own department"
                });
            }
        }

        const oldStaffId = incident.assignedTo;

        // 1. Find the next best staff member
        // Logic: Same department, role Maintenance, NOT the current guy, sorted by least tasks
        const nextAvailableStaff = await User.findOne({
            role: 'Maintenance',
            department: incident.department,
            _id: { $ne: oldStaffId }, // EXCLUDE the current assigned staff
            isDeleted: false
        }).sort({ activeTasks: 1 });

        if (!nextAvailableStaff) {
            return res.status(404).json({
                message: "No other staff members available in this department to take this task"
            });
        }

        // 2. Decrement old staff's workload (if someone was assigned)
        if (oldStaffId) {
            await User.findByIdAndUpdate(oldStaffId, { $inc: { activeTasks: -1 } });
        }

        // 3. Update Incident with New Staff
        incident.assignedTo = nextAvailableStaff._id;
        await incident.save();

        // 4. Increment new staff's workload
        await User.findByIdAndUpdate(nextAvailableStaff._id, { $inc: { activeTasks: 1 } });

        res.status(200).json({
            success: true,
            message: `Incident successfully re-routed to ${nextAvailableStaff.name}`,
            newStaff: nextAvailableStaff.name
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all incidents reported by the current student
// @route   GET /api/incidents/my-incidents
// @access  Private (Student)
exports.getMyIncidents = async (req, res) => {
    try {
        const incidents = await Incident.find({ reportedBy: req.user._id })
            .sort({ createdAt: -1 }) // Newest first
            .populate('assignedTo', 'name') // Show who is handling it
            .populate({
                path: 'comments.sender',
                select: 'name role' // We need this to show "John (Staff): Hello"
            });
        res.status(200).json({
            success: true,
            count: incidents.length,
            data: incidents
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


exports.getMapData = async (req, res) => {
    try {
        // Filter: Active Incidents AND only 'Security' category
        const activeSecurityIncidents = await Incident.find({
            status: { $nin: ['RESOLVED', 'CLOSED'] }, // Must be active
            category: 'Security'                      // <--- THE IMPORTANT FILTER
        })
            .select('title location category priority status');

        res.status(200).json({
            success: true,
            count: activeSecurityIncidents.length,
            data: activeSecurityIncidents
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add a comment (Chat System)
// @route   POST /api/incidents/:id/comment
// @access  Private (Reporter, Assigned Staff, Admin)
exports.addComment = async (req, res) => {
    try {
        const { message } = req.body;
        
        // 1. Find the incident
        const incident = await Incident.findById(req.params.id);
        if (!incident) {
            return res.status(404).json({ message: "Incident not found" });
        }

        // 2. Security Check: Only allow relevant people to comment
        const isReporter = incident.reportedBy.toString() === req.user._id.toString();
        const isAssigned = incident.assignedTo && incident.assignedTo.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'Admin';

        // If you are not the reporter, the assigned staff, or an admin, you can't chat.
        if (!isReporter && !isAssigned && !isAdmin) {
            return res.status(403).json({ message: "Not authorized to chat on this ticket." });
        }

        // 3. Add the comment to the array
        const newComment = {
            sender: req.user._id,
            message: message,
            createdAt: new Date()
        };

        incident.comments.push(newComment);
        await incident.save();

       // 2. Populate the sender details (Important for the UI to show names)
        // We need to fetch the user name to send it via socket
        const populatedIncident = await Incident.findById(req.params.id)
            .populate({
                path: 'comments.sender',
                select: 'name role'
            });
            
        const addedComment = populatedIncident.comments[populatedIncident.comments.length - 1];

        // 3. EMIT REAL-TIME EVENT
        // Get the IO instance we set in server.js
        const io = req.app.get('socketio');
        // Push to everyone in this room
        io.to(req.params.id).emit('receive_comment', addedComment);

        res.status(201).json({ success: true, data: incident.comments });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};