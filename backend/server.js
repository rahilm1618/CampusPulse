// backend/server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { Server } = require('socket.io');
const authRoutes = require('./routes/authRoutes');
const incidentRoutes = require('./routes/incidentRoutes');
const deptRoutes = require('./routes/deptRoutes');
dotenv.config();
connectDB(); // We will create this in the next step

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/incidents',incidentRoutes); 
app.use('/api/departments',deptRoutes );

// Socket.IO Setup
const io = new Server(server, {
    cors: { origin: "*" }
});

io.on('connection', (socket) => {
    console.log('User Connected:', socket.id);
    
    socket.on('join_room', (data) => {
        socket.join(data); // Users join rooms based on Role or Incident ID
    });


    socket.on('disconnect', () => {
        console.log('User Disconnected');
    });
});

// Routes Placeholder
app.get('/', (req, res) => res.send('API is running...'));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));