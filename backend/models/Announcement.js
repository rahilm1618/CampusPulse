const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: [true, 'Please add a title'] 
    },
    message: { 
        type: String, 
        required: [true, 'Please add a message'] 
    },
    priority: {
        type: String,
        enum: ['Normal', 'High', 'Critical'],
        default: 'Normal'
    },
    createdBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true 
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Announcement', AnnouncementSchema);