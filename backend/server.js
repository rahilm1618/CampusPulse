require('dotenv').config();
const express = require('express');
const http = require('http'); // Required for Socket.io
const cors = require('cors');
const connectDB = require('./config/db');
const { Server } = require('socket.io');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const incidentRoutes = require('./routes/incidentRoutes');
const deptRoutes = require('./routes/deptRoutes');
const adminRoutes = require('./routes/adminRoutes');
const staffRoutes = require('./routes/staffRoutes');

// Utils
const startCronJobs = require('./utils/cronJobs');

// Initialize DB
connectDB();

const app = express();
const server = http.createServer(app); // Wrap Express with HTTP Server

// --- 1. SOCKET.IO SETUP ---
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // Match your Frontend URL
        methods: ["GET", "POST"],
        credentials: true
    }
});

// --- 2. SHARE SOCKET WITH CONTROLLERS ---
// This allows req.app.get('socketio') inside your controllers
app.set('socketio', io);

// Socket Logic
io.on('connection', (socket) => {
    console.log('User Connected:', socket.id);

    // Join a specific Incident Room (Frontend sends incident ID here)
    socket.on('join_incident', (incidentId) => {
        socket.join(incidentId);
        console.log(`Socket ${socket.id} joined room: ${incidentId}`);
    });

    socket.on('disconnect', () => {
        console.log('User Disconnected:', socket.id);
    });
});

// --- 3. MIDDLEWARE ---
app.use(cors({
    origin: 'http://localhost:5173', 
    credentials: true                
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- 4. ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/departments', deptRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/staff', staffRoutes);

// Base Route
app.get('/', (req, res) => res.send('API is running...'));

// Start Background Jobs (SLA Watchdog)
startCronJobs();

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));