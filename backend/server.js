const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./database');

// --- Routes ---
const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/jobs');
const portalRoutes = require('./routes/portal');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Base Route
app.get('/', (req, res) => {
    res.send('API is running smoothly...');
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/portal', portalRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server is flying smoothly on port ${PORT}`);
});