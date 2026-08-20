const express = require('express');
const cors = require('cors');
const connectDB = require('./database'); // Imports your updated database.js

// --- Routes ---
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
app.use('/api/auth', require('./routes/auth.js'));
app.use('/api/jobs', jobRoutes);
app.use('/api/portal', portalRoutes);

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server is flying smoothly on port ${PORT}`);
});