const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sequelize } = require('../database');

// JWT Secret Key (In production, keep this hidden in a config file)
const JWT_SECRET = "super_secret_placement_portal_key";

// Emails are matched case-insensitively so "Faria@gmail.com" and
// "faria@gmail.com" are treated as the same account, not two.
const normalizeEmail = (email) => (typeof email === 'string' ? email.trim().toLowerCase() : '');

const findUserByEmail = (email) => User.findOne({
    where: sequelize.where(
        sequelize.fn('lower', sequelize.col('email')),
        normalizeEmail(email)
    )
});

// ==========================================
// 1. REGISTER ROUTE (POST /api/auth/register)
// ==========================================
router.post('/register', async (req, res) => {
    try {
        const { name, password, role } = req.body;
        const email = normalizeEmail(req.body.email);

        // Validate up front so the user gets a specific, actionable message
        // instead of a generic failure from the database layer.
        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'Please enter your full name.' });
        }
        if (!email) {
            return res.status(400).json({ message: 'Please enter your email address.' });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ message: 'Please enter a valid email address.' });
        }
        if (!password || password.length < 6) {
            return res.status(400).json({ message: 'Your password must be at least 6 characters long.' });
        }

        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            return res.status(409).json({
                message: `An account with ${email} already exists. Try signing in instead, or use a different email address.`,
                code: 'EMAIL_TAKEN'
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await User.create({
            name: name.trim(),
            email,
            password: hashedPassword,
            role
        });

        res.status(201).json({ message: 'User registered successfully!' });
    } catch (err) {
        console.error('Registration error: ', err);

        // Safety net: catches the race where two people submit the same email
        // at the same moment and both clear the check above.
        if (err.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({
                message: 'An account with that email already exists. Try signing in instead, or use a different email address.',
                code: 'EMAIL_TAKEN'
            });
        }
        if (err.name === 'SequelizeValidationError') {
            return res.status(400).json({ message: err.errors?.[0]?.message || 'Please check the details you entered and try again.' });
        }

        // Always JSON: plain-text replies made the frontend fall back to a generic message.
        res.status(500).json({ message: 'We could not create your account right now. Please try again in a moment.' });
    }
});

// ==========================================
// 2. LOGIN ROUTE (POST /api/auth/login)
// ==========================================
router.post('/login', async (req, res) => {
    try {
        const { password } = req.body;
        const email = normalizeEmail(req.body.email);

        if (!email || !password) {
            return res.status(400).json({ message: 'Please enter both your email and password.' });
        }

        // Case-insensitive so users can sign in however they type their email
        const user = await findUserByEmail(email);
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials (Email not found)' });
        }

        // Compare encrypted password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials (Wrong password)' });
        }

        // Generate a secure JWT Session Token
        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
            if (err) throw err;
            // Send back the user details and token to the frontend
            res.json({
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
        });

    } catch (err) {
        console.error('Login error: ', err);
        res.status(500).json({ message: 'We could not sign you in right now. Please try again in a moment.' });
    }
});

module.exports = router;