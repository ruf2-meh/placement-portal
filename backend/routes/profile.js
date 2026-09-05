const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const StudentProfile = require('../models/StudentProfile');

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------

// Skills are the canonical structured source used by Feature 2 (Skill Matcher)
// and Feature 3 (Skill Gap Analyzer). The existing ProfileCompletion.jsx form
// still sends them as a single comma-separated string, so normalize whatever
// shape arrives (string or array) into a clean array of trimmed strings.
const normalizeSkillsInput = (rawSkills) => {
    if (!rawSkills) return [];
    const list = Array.isArray(rawSkills) ? rawSkills : String(rawSkills).split(',');
    return list
        .map((s) => (typeof s === 'string' ? s.trim() : ''))
        .filter(Boolean);
};

// -----------------------------------------------------------------------------
// GET: Fetch profile for a specific user
// -----------------------------------------------------------------------------
router.get('/:userId', async (req, res) => {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "Invalid user ID." });
    }

    try {
        const profile = await StudentProfile.findOne({ user: userId });

        if (!profile) {
            return res.status(404).json({ message: "Profile not found." });
        }

        res.json(profile);
    } catch (err) {
        console.error("Error fetching profile:", err);
        res.status(500).json({ message: "Server error while fetching profile." });
    }
});

// -----------------------------------------------------------------------------
// POST: Create or Update Student Profile (upsert keyed on the User reference)
// -----------------------------------------------------------------------------
router.post('/', async (req, res) => {
    const { user_id, full_name, phone, department, cgpa, backlogs, skills, bio } = req.body;

    if (!user_id || !department || cgpa === undefined || backlogs === undefined) {
        return res.status(400).json({ message: "Please fill out all required fields." });
    }

    if (!mongoose.Types.ObjectId.isValid(user_id)) {
        return res.status(400).json({ message: "Invalid user ID." });
    }

    const parsedCgpa = parseFloat(cgpa);
    const parsedBacklogs = parseInt(backlogs, 10);

    if (Number.isNaN(parsedCgpa) || Number.isNaN(parsedBacklogs)) {
        return res.status(400).json({ message: "CGPA and backlogs must be valid numbers." });
    }

    try {
        const existingProfile = await StudentProfile.findOne({ user: user_id });

        const profile = await StudentProfile.findOneAndUpdate(
            { user: user_id },
            {
                user: user_id,
                full_name,
                phone,
                department,
                cgpa: parsedCgpa,
                backlogs: parsedBacklogs,
                skills: normalizeSkillsInput(skills),
                bio
            },
            { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
        );

        res.status(200).json({
            message: existingProfile ? "Profile updated successfully!" : "Profile created successfully!",
            profile
        });
    } catch (err) {
        console.error("Error saving profile:", err);

        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map((val) => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }

        res.status(500).json({ message: "Failed to save profile." });
    }
});

module.exports = router;