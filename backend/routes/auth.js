const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT Secret Key
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_placement_portal_key';

// ==========================================
// 1. REGISTER ROUTE (POST /api/auth/register)
// ==========================================
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Check if user already exists (Mongoose findOne — same shape as Sequelize here)
        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = new User({ name, email, password: hashedPassword, role });
        await user.save();

        res.status(201).json({ message: 'User registered successfully!' });
    } catch (err) {
        console.error('Register error:', err.message);
        res.status(500).send('Server Error');
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

        // CHECKPOINT D: Flat payload — { id, role } — NOT nested under a 'user' key
        const payload = { id: user._id, role: user.role };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;