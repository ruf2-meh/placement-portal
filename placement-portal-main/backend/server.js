const express = require('express');
const cors = require('cors');
const { sequelize } = require('./database');

// --- Models ---
const User = require('./models/User');
const Job = require('./models/Job');
const Project = require('./models/Project');
const Application = require('./models/Application');
const Notification = require('./models/Notification');
const WeeklyLog = require('./models/WeeklyLog');
const MidTermReport = require('./models/MidTermReport');

// --- Associations ---
Application.belongsTo(User, { foreignKey: 'student_id' });
User.hasMany(Application, { foreignKey: 'student_id' });

Application.belongsTo(Job, { foreignKey: 'job_id' });
Job.hasMany(Application, { foreignKey: 'job_id' });

Notification.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Notification, { foreignKey: 'user_id' });

// Feature 18: weekly diary logs hang off an accepted application
WeeklyLog.belongsTo(Application, { foreignKey: 'application_id' });
Application.hasMany(WeeklyLog, { foreignKey: 'application_id' });

// Feature 19: one mid-term report per accepted application
MidTermReport.belongsTo(Application, { foreignKey: 'application_id' });
Application.hasOne(MidTermReport, { foreignKey: 'application_id' });

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
app.use('/api/internship', require('./routes/internship.js'));

const PORT = 5000;

// Bind to port immediately so Node never closes the process
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server is flying smoothly on http://localhost:${PORT}`);
});

// Authenticate and sync SQLite database
sequelize.authenticate()
.then(() => {
    console.log('✅ Local SQLite Database File Connected Successfully!');
    return sequelize.sync({ force: false });
})
.then(() => {
    console.log('📦 All database tables synchronized perfectly!');
})
.catch((err) => {
    console.error('❌ Database Sync Error: ', err);
});

server.on('error', (err) => {
    console.error('❌ Server Listen Error: ', err);
});
