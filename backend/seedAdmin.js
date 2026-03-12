require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const ADMIN_USER = {
    name: 'Admin',
    email: 'admin@taskboard.com',
    password: 'admin123',
    role: 'admin',
};

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected');

        // Check if admin already exists
        const existing = await User.findOne({ email: ADMIN_USER.email });
        if (existing) {
            console.log('Admin user already exists:');
            console.log(`  Email: ${ADMIN_USER.email}`);
            console.log(`  Password: ${ADMIN_USER.password}`);
            process.exit(0);
        }

        // Create admin user
        const admin = new User(ADMIN_USER);
        await admin.save();

        console.log('Fixed admin user created successfully!');
        console.log(`  Email: ${ADMIN_USER.email}`);
        console.log(`  Password: ${ADMIN_USER.password}`);
        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin:', error.message);
        process.exit(1);
    }
};

seedAdmin();
