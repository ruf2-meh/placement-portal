const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

// -----------------------------------------------------------------------------
// HELPER FUNCTIONS
// -----------------------------------------------------------------------------
const calculateSkillMatch = (userSkillsInput, jobRequirementsInput) => {
    const jobRequirements = Array.isArray(jobRequirementsInput)
        ? jobRequirementsInput
        : (jobRequirementsInput || '').split(',').map(s => s.trim()).filter(Boolean);

    const userSkills = Array.isArray(userSkillsInput)
        ? userSkillsInput
        : (userSkillsInput || '').split(',').map(s => s.trim()).filter(Boolean);

    if (jobRequirements.length === 0) {
        return {
            matchPercentage: 100,
            matchedSkills: [],
            missingSkills: [],
            requiredSkillCount: 0
        };
    }

    const userSkillsSet = new Set(userSkills.map(s => s.toLowerCase()));
    const matchedSkills = [];
    const missingSkills = [];

    jobRequirements.forEach(reqSkill => {
        if (userSkillsSet.has(reqSkill.toLowerCase())) {
            matchedSkills.push(reqSkill);
        } else {
            missingSkills.push(reqSkill);
        }
    });

    const matchPercentage = Math.round((matchedSkills.length / jobRequirements.length) * 100);

    return {
        matchPercentage,
        matchedSkills,
        missingSkills,
        requiredSkillCount: jobRequirements.length
    };
};

// -----------------------------------------------------------------------------
// CONTROLLER LOGIC
// -----------------------------------------------------------------------------

// @route   GET /api/jobs/:id/match
// @desc    Get logged-in student's compatibility score for a specific job
// @access  Private (Student)
const getJobSkillMatch = async (req, res) => {
    try {
        const jobId = req.params.id;
        const studentId = req.user.id || req.user._id;

        const [job, student] = await Promise.all([
            Job.findById(jobId),
            User.findById(studentId)
        ]);

        if (!job) {
            return res.status(404).json({ success: false, message: 'Job opportunity not found.' });
        }
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student profile not found.' });
        }

        const jobRequirements = job.requirements || job.skills || "";
        const studentSkills = student.skills || student.keySkills || [];

        const matchResult = calculateSkillMatch(studentSkills, jobRequirements);

        return res.status(200).json({
            success: true,
            jobId: job._id,
            ...matchResult
        });
    } catch (error) {
        console.error('Error in getJobSkillMatch:', error.message);
        return res.status(500).json({ 
            success: false, 
            message: 'Server error processing skill match.' 
        });
    }
};

// -----------------------------------------------------------------------------
// ROUTE DEFINITIONS
// -----------------------------------------------------------------------------

// GET: Fetch all job listings with company details populated
router.get('/', async (req, res) => {
    try {
        const jobs = await Job.find().populate('company', 'name email');
        res.json(jobs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch jobs." });
    }
});

// GET: Get student skill match score for a specific job
router.get('/:id/match', authMiddleware, getJobSkillMatch);

// POST: Create a job posting
router.post('/', async (req, res) => {
    const { company, title, description, requirements, location, deadline } = req.body;

    if (!title || !description || !deadline) {
        return res.status(400).json({ message: "Please fill out all required fields." });
    }

    try {
        const newJob = await Job.create({
            company,
            title,
            description,
            requirements,
            location,
            deadline
        });

        res.status(201).json({ 
            message: "Job posted successfully!", 
            jobId: newJob._id 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to post job." });
    }
});

module.exports = router;