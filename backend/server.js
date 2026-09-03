// Load environment variables from .env (e.g. JWT_SECRET) before anything else
// runs. Wrapped in try/catch so the server still starts even if `npm install`
// hasn't been re-run yet to pull in the new `dotenv` dependency.
try {
    require('dotenv').config();
} catch (err) {
    console.warn('⚠️  dotenv is not installed yet. Run "npm install" in /backend to load backend/.env automatically. Falling back to existing environment variables/defaults for now.');
}

const express = require('express');
const cors = require('cors');

// Import MongoDB Connection Function
const connectDB = require('./database'); 

// --- Routes ---
const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/jobs');
const portalRoutes = require('./routes/portal');
const profileRoutes = require('./routes/profile');

const app = express();

// Middleware
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
app.use('/api/profile', profileRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server is flying smoothly on port ${PORT}`);
});