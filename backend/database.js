const mongoose = require('mongoose');

// Read the URI from the environment (set MONGO_URI in backend/.env)
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_portal';

const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ MongoDB Connected Successfully!');
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err.message);
        process.exit(1);
    }
};

module.exports = connectDB;