const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT Secret Key (In production, keep this hidden in a config file)
const JWT_SECRET = "super_secret_placement_portal_key";

// ==========================================
// 1. REGISTER ROUTE (POST /api/auth/register)
// ==========================================
router.post('/register', async (req, res) => {
    try {
        // Accept 'name' or 'fullName' to match frontend inputs flexible
        const { name, fullName, email, password, role } = req.body;
        const userName = name || fullName;

        if (!userName || !email || !password) {
            return res.status(400).json({ message: 'Please fill in all required fields.' });
        }

        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Pass 'userName' as 'name' to Mongoose
        user = await User.create({
            name: userName,
            email,
            password: hashedPassword,
            role: role || 'student' // Default fallback if role isn't selected
        });

        res.status(201).json({ message: 'User registered successfully!' });
    } catch (err) {
        console.error("Registration Error:", err.message);

        // Catch Mongoose ValidationError specifically
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }

        res.status(500).json({ message: 'Server Error' });
    }
});

// ==========================================
// 2. LOGIN ROUTE (POST /api/auth/login)
// ==========================================
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials (Email not found)' });
        }

        // Compare encrypted password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials (Wrong password)' });
        }

        // Generate a secure JWT Session Token using user._id
        const payload = {
            user: {
                id: user._id,
                role: user.role
            }
        };

        jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
            if (err) throw err;
            // Send back user details with MongoDB's _id
            res.json({
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;