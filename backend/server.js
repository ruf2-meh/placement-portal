const express = require('express');
const cors = require('cors');
const { sequelize } = require('./database');

// --- Models ---
const User = require('./models/User'); 
const Job = require('./models/Job');
const Project = require('./models/Project');
const Application = require('./models/Application');
const Notification = require('./models/Notification');
const StudentProfile = require('./models/StudentProfile'); // Fixed path (single dot)
const profileRoutes = require('./routes/profile');

// --- Routes ---
const jobRoutes = require('./routes/jobs');
const portalRoutes = require('./routes/portal');

const app = express();
app.use(cors());
app.use(express.json());

// Base Route
app.get('/', (req, res) => {
    res.send('API is running smoothly...');
});

// Mount Routes
app.use('/api/auth', require('./routes/auth.js'));
app.use('/api/jobs', jobRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/profile', profileRoutes);

// Test connection and sync tables
sequelize.authenticate()
    .then(() => {
        console.log('✅ Local SQLite Database File Connected Successfully!');
        // alter: true safely adds new columns without dropping existing data
        return sequelize.sync({ alter: true }); 
    })
    .then(() => {
        console.log('📦 All database tables synchronized perfectly!');
    })
    .catch((err) => console.error('❌ Database Sync Error: ', err));

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server is flying smoothly on port ${PORT}`);
});