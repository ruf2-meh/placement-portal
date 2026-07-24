const express = require('express');
const router = express.Router();
const Job = require('../models/Job'); // Import your Sequelize model

// POST: Create a job posting (Feature 1)
router.post('/', async (req, res) => {
    const { 
        company_id, 
        title, 
        description, 
        requirements, 
        location, 
        deadline,
        min_cgpa,            // <-- ADDED
        max_backlogs,        // <-- ADDED
        allowed_departments  // <-- ADDED
    } = req.body;

    if (!title || !description || !deadline) {
        return res.status(400).json({ message: "Please fill out all required fields." });
    }

    try {
        const newJob = await Job.create({
            company_id,
            title,
            description,
            requirements,
            location,
            deadline,
            min_cgpa: min_cgpa ? parseFloat(min_cgpa) : null,
            max_backlogs: max_backlogs !== undefined && max_backlogs !== '' ? parseInt(max_backlogs, 10) : null,
            allowed_departments: allowed_departments || null
        });

        res.status(201).json({ message: "Job posted successfully!", jobId: newJob.id });
    } catch (err) {
        console.error("Error creating job:", err);
        res.status(500).json({ message: "Failed to post job." });
    }
});

module.exports = router;