require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        let user = await User.findOne({ email: 'guard@campus.com' });
        if (!user) {
            user = await User.create({
                name: 'Security Officer Dan',
                email: 'guard@campus.com',
                password: 'password123',
                role: 'Security'
            });
            console.log('Created Security user: guard@campus.com / password123');
        } else {
            console.log('Security user already exists');
        }
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
};

run();
