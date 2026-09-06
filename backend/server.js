const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./database');
const connectMongo = require('./config/mongoDB');

// --- Routes ---
const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/jobs');
const portalRoutes = require('./routes/portal');
const offerRoutes = require('./routes/offers');

const app = express();
app.use(cors());
app.use(express.json());

// Primary MongoDB connection (exits on failure — required for core app)
connectDB();

// Additive MongoDB connection for the Offers feature (does NOT exit on failure —
// a Mongo outage should not crash the server while it is still primarily
// Mongoose-backed). In practice Mongoose pools one connection, so both
// connectDB() and connectMongo() share the same underlying socket.
connectMongo();

// Base Route
app.get('/', (req, res) => {
    res.send('API is running smoothly...');
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/offers', offerRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server is flying smoothly on port ${PORT}`);
});