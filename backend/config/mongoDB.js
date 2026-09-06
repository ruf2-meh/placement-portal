const mongoose = require('mongoose');

const connectMongo = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Connected Successfully');
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);
        // Note: NOT calling process.exit(1) here — this connection is additive.
        // A MongoDB outage should not take down the server while the app is still
        // primarily SQLite/Sequelize-backed. The server will continue running.
    }
};

module.exports = connectMongo;
