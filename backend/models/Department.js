const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'Department name is required'], 
        unique: true,
        trim: true 
    },
    description: { type: String },
    buildingLocation: { type: String },
    // Points to the staff member who leads this team
    headOfDepartment: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' ,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Department', departmentSchema);