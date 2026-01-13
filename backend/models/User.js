const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false // Doesn't return password by default in queries
    },
    role: {
        type: String,
        enum: ['Student', 'Faculty', 'Maintenance', 'Security', 'Admin','HOD'],
        default: 'Student'
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department'
    },
    activeTasks: {
        type: Number,
        default: 0
    },
    // For Future Push Notifications
    fcmToken: {
        type: String,
        default: null
    },
    // For Soft Deletion
    isDeleted: {
        type: Boolean,
        default: false
    },
    refreshToken: {
        type: String
    }
}, { timestamps: true });

// Password Hashing Middleware
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});


// Method to compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);