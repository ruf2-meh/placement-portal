const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Job = require('../models/Job');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const Application = require('../models/Application');
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/authMiddleware');
const { calculateSkillMatch, normalizeSkillList, calculateGpaFit } = require('../utils/skillMatcher');

// Weights for blending the two sub-scores into one headline compatibility
// number. Skills matter more than GPA closeness, but GPA still counts.
const SKILL_WEIGHT = 0.7;
const GPA_WEIGHT = 0.3;

// -----------------------------------------------------------------------------
// CONTROLLER LOGIC
// -----------------------------------------------------------------------------

// @route   GET /api/jobs/:id/match
// @desc    Get logged-in student's compatibility score for a specific job.
//          Returns both a blended headline score (matchPercentage) and the
//          two sub-scores it's built from (skillMatchPercentage,
//          gpaFitPercentage), so the UI can show either or both.
// @access  Private (Student)
const getJobSkillMatch = async (req, res) => {
    try {
        const jobId = req.params.id;
        const studentId = req.user.id;

        const [job, studentProfile] = await Promise.all([
            Job.findById(jobId),
            StudentProfile.findOne({ user: studentId })
        ]);

        if (!job) {
            return res.status(404).json({ success: false, message: 'Job opportunity not found.' });
        }
        if (!studentProfile) {
            return res.status(404).json({ success: false, message: 'Please complete your student profile to see your compatibility score.' });
        }

        // Prefer the structured requiredSkills array; fall back to parsing
        // the free-text requirements field for jobs created before
        // requiredSkills existed.
        const jobSkillSource = (job.requiredSkills && job.requiredSkills.length > 0)
            ? job.requiredSkills
            : job.requirements;

        const skillResult = calculateSkillMatch(studentProfile.skills, jobSkillSource);
        const gpaResult = calculateGpaFit(studentProfile.cgpa, job.min_cgpa, job.max_cgpa);

        const skillMatchPercentage = skillResult.matchPercentage;
        const gpaFitPercentage = gpaResult.gpaFitPercentage;
        const overallCompatibility = Math.round(
            skillMatchPercentage * SKILL_WEIGHT + gpaFitPercentage * GPA_WEIGHT
        );

        return res.status(200).json({
            success: true,
            jobId: job._id,
            // Headline blended score — what most of the UI shows front-and-center.
            matchPercentage: overallCompatibility,
            // Sub-scores, for the breakdown view.
            skillMatchPercentage,
            gpaFitPercentage,
            gpaMessage: gpaResult.message,
            matchedSkills: skillResult.matchedSkills,
            missingSkills: skillResult.missingSkills,
            studentSkillCount: skillResult.studentSkillCount,
            requiredSkillCount: skillResult.requiredSkillCount,
            message: skillResult.message
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
//
// Previously this route had no authMiddleware at all, and trusted a
// company/company_id field sent directly in the request body — meaning
// any caller (authenticated or not) could create a job under any
// company's identity. It also meant CompanyDashboard.jsx's own form
// (which never sent a company field) was silently failing Mongoose's
// required-field validation on every submission, and the frontend was
// masking that failure with a fake "Local Mode" success message.
//
// The company is now always taken from the verified JWT (req.user.id),
// never from the request body.
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
        max_cgpa,
        max_backlogs,
        allowed_departments
    } = req.body;

    if (!title || !description || !deadline) {
        return res.status(400).json({ message: "Please fill out all required fields." });
    }

    // CGPA range is required for every new job post — it now feeds directly
    // into the student-facing compatibility score (GPA Fit %), not just
    // eligibility, so it can no longer be left blank.
    if (min_cgpa === undefined || min_cgpa === '' || max_cgpa === undefined || max_cgpa === '') {
        return res.status(400).json({ message: "Minimum and maximum CGPA are required." });
    }

    const parsedMinCgpa = parseFloat(min_cgpa);
    const parsedMaxCgpa = parseFloat(max_cgpa);

    if (Number.isNaN(parsedMinCgpa) || Number.isNaN(parsedMaxCgpa)) {
        return res.status(400).json({ message: "CGPA values must be valid numbers." });
    }

    if (parsedMinCgpa >= parsedMaxCgpa) {
        return res.status(400).json({ message: "Maximum CGPA must be greater than minimum CGPA." });
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
        // Derive the structured requiredSkills array from the free-text
        // requirements field using the same normalization the skill matcher
        // itself uses, so what's stored and what's matched can never drift.
        const requiredSkills = Array.from(normalizeSkillList(requirements).values());

        const newJob = await Job.create({
            company: req.user.id,
            title,
            description,
            requirements,
            requiredSkills,
            location,
            jobType: jobType || null,
            paymentType: paymentType || null,
            deadline: parsedDeadline,
            min_cgpa: parsedMinCgpa,
            max_cgpa: parsedMaxCgpa,
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