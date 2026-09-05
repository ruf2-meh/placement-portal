const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const Project = require('../models/Project');
const Application = require('../models/Application');
const Notification = require('../models/Notification');
const Resume = require('../models/Resume');

// =========================================================================
// FEATURE 9: Student Project Showcase Profile
// =========================================================================
// POST: Add a student project
router.post('/projects', async (req, res) => {
    try {
        const { student_id, title, description, link, tech_stack } = req.body;
        const project = await Project.create({ student_id, title, description, link, tech_stack });
        res.status(201).json({ message: 'Project added successfully!', project });
    } catch (err) {
        console.error('Error adding project:', err);
        res.status(500).json({ message: 'Error adding project.' });
    }
});

// GET: Get a specific student's projects
router.get('/projects/:student_id', async (req, res) => {
    try {
        const projects = await Project.find({ student_id: req.params.student_id })
            .sort({ createdAt: -1 });
        res.json(projects);
    } catch (err) {
        console.error('Error fetching projects:', err);
        res.status(500).json({ message: 'Error fetching projects.' });
    }
});

// PUT: Edit an existing student project
router.put('/projects/:id', async (req, res) => {
    try {
        const { title, description, link, tech_stack } = req.body;
        const project = await Project.findByIdAndUpdate(
            req.params.id,
            { title, description, link, tech_stack },
            { new: true, runValidators: true }
        );
        if (!project) return res.status(404).json({ message: 'Project not found.' });
        res.json({ message: 'Project updated successfully!', project });
    } catch (err) {
        console.error('Error updating project:', err);
        res.status(500).json({ message: 'Error updating project.' });
    }
});

// DELETE: Remove a student project
router.delete('/projects/:id', async (req, res) => {
    try {
        const project = await Project.findByIdAndDelete(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found.' });
        res.json({ message: 'Project deleted successfully!' });
    } catch (err) {
        console.error('Error deleting project:', err);
        res.status(500).json({ message: 'Error deleting project.' });
    }
});

// =========================================================================
// FEATURE 4 & 6: Job Board Search, Filters & Deadline Validation Check
// =========================================================================
router.get('/jobs/search', async (req, res) => {
    try {
        const { keyword } = req.query;
        let query = {};

        // If a keyword is provided, filter by title or location using regex
        if (keyword && keyword.trim()) {
            const re = new RegExp(keyword.trim(), 'i');
            query = { $or: [{ title: re }, { location: re }] };
        }

        const jobs = await Job.find(query).sort({ createdAt: -1 });
        res.json(jobs);
    } catch (err) {
        console.error('Error searching jobs:', err);
        res.status(500).json({ message: 'Error searching jobs.' });
    }
});

// =========================================================================
// FEATURE 10, 6, & 23: Apply Engine + Deadline Protection + Alert Triggering
// =========================================================================
router.post('/jobs/apply', async (req, res) => {
    try {
        const { job_id, student_id } = req.body;

        if (!job_id || !student_id) {
            return res.status(400).json({ message: 'Job ID and student ID are required.' });
        }

        // Find the job details
        const job = await Job.findById(job_id);
        if (!job) return res.status(404).json({ message: 'Job not found.' });

        // FEATURE 6: Deadline enforcement validation check
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const deadline = new Date(job.deadline);
        deadline.setHours(23, 59, 59, 999);

        if (isNaN(deadline.getTime())) {
            return res.status(400).json({ message: 'This job has an invalid application deadline.' });
        }

        if (deadline < today) {
            return res.status(400).json({
                message: 'Application failed: The deadline for this job posting has passed.'
            });
        }

        // Check if student already applied
        const existingApp = await Application.findOne({ job_id, student_id });
        if (existingApp) {
            return res.status(400).json({ message: 'You have already applied to this position.' });
        }

        // Register application record
        const application = await Application.create({ job_id, student_id });

        // FEATURE 23: Alert System (Notify the company recruiter)
        await Notification.create({
            user_id: job.company_id,
            message: `🎉 You have received a new applicant submission for your position: "${job.title}"!`
        });

        // Notify the student confirming submission
        await Notification.create({
            user_id: student_id,
            message: `✅ Your application for "${job.title}" has been transmitted successfully.`
        });

        res.status(201).json({ message: 'Application submitted successfully!', application });
    } catch (err) {
        console.error('Error processing application:', err);
        res.status(500).json({ message: 'Error processing application.' });
    }
});

// =========================================================================
// FEATURE 23: Pull Notification Dashboard Feeds
// =========================================================================
// GET: Get all notifications for a specific user
router.get('/notifications/:user_id', async (req, res) => {
    try {
        const alerts = await Notification.find({ user_id: req.params.user_id })
            .sort({ createdAt: -1 });
        res.json(alerts);
    } catch (err) {
        console.error('Error fetching alerts:', err);
        res.status(500).json({ message: 'Error fetching alerts.' });
    }
});

// GET: Get unread notification count
router.get('/notifications/:user_id/unread-count', async (req, res) => {
    try {
        const unreadCount = await Notification.countDocuments({
            user_id: req.params.user_id,
            is_read: false
        });
        res.json({ unreadCount });
    } catch (err) {
        console.error('Error fetching unread count:', err);
        res.status(500).json({ message: 'Error fetching unread notification count.' });
    }
});

// PATCH: Mark a single notification as read
router.patch('/notifications/:notification_id/read', async (req, res) => {
    try {
        const { user_id } = req.body;

        if (!user_id) {
            return res.status(400).json({ message: 'User ID is required.' });
        }

        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.notification_id, user_id },
            { is_read: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found.' });
        }

        res.json({ message: 'Notification marked as read.', notification });
    } catch (err) {
        console.error('Error updating notification:', err);
        res.status(500).json({ message: 'Error updating notification.' });
    }
});

// PATCH: Mark all notifications as read
router.patch('/notifications/:user_id/read-all', async (req, res) => {
    try {
        const result = await Notification.updateMany(
            { user_id: req.params.user_id, is_read: false },
            { is_read: true }
        );
        res.json({ message: 'All notifications marked as read.', updatedCount: result.modifiedCount });
    } catch (err) {
        console.error('Error marking all notifications as read:', err);
        res.status(500).json({ message: 'Error updating notifications.' });
    }
});

// =========================================================================
// FEATURE: Get Company's Specific Job Listings
// =========================================================================
router.get('/jobs/company/:company_id', async (req, res) => {
    try {
        const companyJobs = await Job.find({ company_id: req.params.company_id })
            .sort({ createdAt: -1 });
        res.json(companyJobs);
    } catch (err) {
        console.error('Error fetching company jobs:', err);
        res.status(500).json({ message: 'Error fetching company job listings.' });
    }
});

// =========================================================================
// FEATURE 7 & 8: Resume Builder — Save & Fetch Resume
// =========================================================================
// POST: Create or update a student's resume (upsert by user id)
router.post('/resume', async (req, res) => {
    try {
        const {
            student_id,
            full_name, email, phone, summary,
            education, experience, research, skills, links,
            include_projects
        } = req.body;

        // Arrays/objects come in already parsed (no JSON.parse needed with Mongoose native arrays)
        const resume = await Resume.findOneAndUpdate(
            { user: student_id },
            {
                user: student_id,
                full_name, email, phone, summary,
                education: education || [],
                experience: experience || [],
                research: research || [],
                skills: skills || [],
                links: links || {},
                include_projects: include_projects !== undefined ? include_projects : true
            },
            { upsert: true, new: true, runValidators: true }
        );

        res.status(200).json({ message: 'Resume saved successfully!', resume });
    } catch (err) {
        console.error('Error saving resume:', err);
        res.status(500).json({ message: 'Error saving resume.' });
    }
});

// GET: Fetch a student's resume
router.get('/resume/:student_id', async (req, res) => {
    try {
        const resume = await Resume.findOne({ user: req.params.student_id });
        if (!resume) return res.status(404).json({ message: 'No resume found for this student.' });
        // Arrays already native — no JSON.parse needed
        res.json(resume);
    } catch (err) {
        console.error('Error fetching resume:', err);
        res.status(500).json({ message: 'Error fetching resume.' });
    }
});

module.exports = router;