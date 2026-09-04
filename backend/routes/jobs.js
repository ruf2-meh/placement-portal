const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Job = require('../models/Job');
const User = require('../models/User');
const Application = require('../models/Application');
const Notification = require('../models/Notification');
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
router.post('/', authMiddleware, async (req, res) => {
    if (req.user.role !== 'company') {
        return res.status(403).json({ message: 'Only company accounts can post jobs.' });
    }

    const {
        title,
        description,
        requirements,
        location,
        jobType,
        paymentType,
        deadline,
        min_cgpa,
        max_backlogs,
        allowed_departments
    } = req.body;

    if (!title || !description || !deadline) {
        return res.status(400).json({ message: "Please fill out all required fields." });
    }

    const validJobTypes = ['Remote', 'On-site', 'Hybrid'];
    const validPaymentTypes = ['Paid', 'Unpaid'];

    if (jobType && !validJobTypes.includes(jobType)) {
        return res.status(400).json({ message: `Job type must be one of: ${validJobTypes.join(', ')}` });
    }

    if (paymentType && !validPaymentTypes.includes(paymentType)) {
        return res.status(400).json({ message: `Payment type must be one of: ${validPaymentTypes.join(', ')}` });
    }

    const parsedDeadline = new Date(deadline);
    if (Number.isNaN(parsedDeadline.getTime())) {
        return res.status(400).json({ message: "Please provide a valid application deadline." });
    }

    try {
        const newJob = await Job.create({
            company: req.user.id,
            title,
            description,
            requirements,
            location,
            jobType: jobType || null,
            paymentType: paymentType || null,
            deadline: parsedDeadline,
            min_cgpa: min_cgpa ? parseFloat(min_cgpa) : null,
            max_backlogs: max_backlogs !== undefined && max_backlogs !== '' ? parseInt(max_backlogs, 10) : null,
            allowed_departments: allowed_departments || null
        });

        return res.status(201).json({
            message: "Job posted successfully!",
            job: newJob
        });

    } catch (err) {
        console.error("Error creating job:", err);

        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map((val) => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }

        return res.status(500).json({ message: "Failed to post job." });
    }
});
// -----------------------------------------------------------------------------
// POST: Apply to a job
//
// StudentDashboard.jsx already calls this exact route
// (API.post(`/jobs/${jobId}/apply`), no request body) — it was previously
// calling a route that didn't exist. The student is taken from the
// authenticated token, not from any client-supplied field, so a student
// can only ever apply as themselves.
// -----------------------------------------------------------------------------
router.post('/:id/apply', authMiddleware, async (req, res) => {
    if (req.user.role !== 'student') {
        return res.status(403).json({ message: 'Only student accounts can apply to jobs.' });
    }

    const jobId = req.params.id;
    const studentId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
        return res.status(400).json({ message: 'Invalid job ID.' });
    }

    try {
        const job = await Job.findById(jobId);

        if (!job) {
            return res.status(404).json({ message: 'Job not found.' });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const deadline = new Date(job.deadline);
        deadline.setHours(23, 59, 59, 999);

        if (Number.isNaN(deadline.getTime())) {
            return res.status(400).json({ message: 'This job has an invalid application deadline.' });
        }

        if (deadline < today) {
            return res.status(400).json({ message: 'The deadline for this job posting has passed.' });
        }

        const existingApplication = await Application.findOne({
            job: jobId,
            student: studentId
        });

        if (existingApplication) {
            return res.status(400).json({ message: 'You have already applied to this position.' });
        }

        const application = await Application.create({
            job: jobId,
            student: studentId
        });

        if (job.company) {
            await Notification.create({
                user: job.company,
                message: `A student has applied for your job: "${job.title}".`
            });
        }

        await Notification.create({
            user: studentId,
            message: `Your application for "${job.title}" was submitted successfully.`
        });

        return res.status(201).json({
            message: 'Application submitted successfully!',
            application
        });
    } catch (err) {
        console.error('Error submitting application:', err);
        return res.status(500).json({ message: 'Failed to submit application.' });
    }
});

module.exports = router;