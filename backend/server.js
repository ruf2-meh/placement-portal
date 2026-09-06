require('dotenv').config();

const express = require('express');
const cors = require('cors');

const connectDB = require('./database');


// --- Load Models ---
require('./models/User');
require('./models/Job');
require('./models/Project');
require('./models/Application');
require('./models/Notification');
require('./models/Certificate');


// --- Routes ---
const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/jobs');
const portalRoutes = require('./routes/portal');
const certificateRoutes = require('./routes/certificate');


// Temporary Debug
console.log("auth:", typeof authRoutes);
console.log("jobs:", typeof jobRoutes);
console.log("portal:", typeof portalRoutes);
console.log("certificate:", typeof certificateRoutes);



const app = express();


// Middleware
app.use(cors());
app.use(express.json());


// Base Route
app.get('/', (req, res) => {

    res.send('API is running smoothly...');

});


// API Routes
app.use('/api/auth', authRoutes);

app.use('/api/jobs', jobRoutes);

app.use('/api/portal', portalRoutes);

app.use('/api/certificates', certificateRoutes);



// MongoDB Connection + Server Start
const PORT = process.env.PORT || 5000;


connectDB()
    .then(() => {

        app.listen(PORT, () => {

            console.log(`🚀 Server is running on port ${PORT}`);

        });

    })
    .catch((error) => {

        console.error(
            "❌ Failed to start server:",
            error.message
        );

    });