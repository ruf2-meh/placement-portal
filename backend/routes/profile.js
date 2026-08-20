const express = require('express');
const router = express.Router();
const StudentProfile = require('../models/StudentProfile');

// GET: Fetch profile for a specific user
router.get('/:userId', async (req, res) => {
    try {
        const profile = await StudentProfile.findOne({
            where: { user_id: req.params.userId }
        });
        
        if (!profile) {
            return res.status(404).json({ message: "Profile not found." });
        }

        res.json(profile);
    } catch (err) {
        console.error("Error fetching profile:", err);
        res.status(500).json({ message: "Server error while fetching profile." });
    }
});

// POST/PUT: Create or Update Student Profile
router.post('/', async (req, res) => {
    const { user_id, full_name, phone, department, cgpa, backlogs, skills, bio } = req.body;

    if (!user_id || !department || cgpa === undefined || backlogs === undefined) {
        return res.status(400).json({ message: "Please fill out all required fields." });
    }

    try {
        // Upsert creates or updates if user_id already exists
        const [profile, created] = await StudentProfile.upsert({
            user_id: parseInt(user_id, 10),
            full_name,
            phone,
            department,
            cgpa: parseFloat(cgpa),
            backlogs: parseInt(backlogs, 10),
            skills,
            bio
        });

        res.status(200).json({ 
            message: created ? "Profile created successfully!" : "Profile updated successfully!",
            profile 
        });
    } catch (err) {
        console.error("Error saving profile:", err);
        res.status(500).json({ message: "Failed to save profile." });
    }
});

module.exports = router;