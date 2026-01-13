const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { 
        type: String, 
        required: true // e.g., "Plumbing", "Electrical", "IT"
    },
    status: { 
        type: String, 
        enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'REOPENED'], 
        default: 'OPEN' 
    },
    // GeoJSON for Map View
    location: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number], required: true }, // [longitude, latitude]
        roomNumber: String,
        blockName: String
    },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    // Images from Cloudinary
    images: {
        beforeFix: [String], // URL from Cloudinary
        afterFix: [String]   // Required for RESOLVED status
    }
}, { timestamps: true });

incidentSchema.index({ location: '2dsphere' }); // For location-based queries

module.exports = mongoose.model('Incident', incidentSchema);