const express = require('express');
const router = express.Router();

const Job = require('../models/Job');
const Project = require('../models/Project');
const Application = require('../models/Application');
const Notification = require('../models/Notification');

// =========================================================================
// FEATURE 9: Student Project Showcase Profile
// =========================================================================

// POST: Add a student project
router.post('/projects', async (req, res) => {
    try {
        const { student_id, title, description, link } = req.body;

        if (!student_id || !title) {
            return res.status(400).json({
                message: 'Student ID and project title are required.'
            });
        }

        const project = await Project.create({
            student: student_id,
            title,
            description,
            link
        });

        res.status(201).json({
            message: 'Project added successfully!',
            project
        });
    } catch (err) {
        console.error('Error adding project:', err);
        res.status(500).json({ message: 'Error adding project.' });
    }
});

// GET: Get a specific student's projects
router.get('/projects/:student_id', async (req, res) => {
    try {
        const projects = await Project.find({ student: req.params.student_id })
            .sort({ createdAt: -1 });

        res.status(200).json(projects);
    } catch (err) {
        console.error('Error fetching projects:', err);
        res.status(500).json({ message: 'Error fetching projects.' });
    }
});

// =========================================================================
// FEATURE 4 & 6: Job Search, Filter and Deadline Validation
// =========================================================================

// GET: Search jobs by title or location
router.get('/jobs/search', async (req, res) => {
    try {
        const { keyword } = req.query;
        let queryFilter = {};

        if (keyword && keyword.trim()) {
            const searchRegex = new RegExp(keyword.trim(), 'i'); // Case-insensitive regex search
            queryFilter = {
                $or: [
                    { title: { $regex: searchRegex } },
                    { location: { $regex: searchRegex } }
                ]
            };
        }

        const jobs = await Job.find(queryFilter)
            .populate('company', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json(jobs);
    } catch (err) {
        console.error('Error searching jobs:', err);
        res.status(500).json({ message: 'Error searching jobs.' });
    }
});

// =========================================================================
// FEATURE 10, 6 & 23:
// Apply Job + Deadline Protection + Notification System
// =========================================================================

router.post('/jobs/apply', async (req, res) => {
    try {
        const { job_id, student_id } = req.body;

        if (!job_id || !student_id) {
            return res.status(400).json({
                message: 'Job ID and student ID are required.'
            });
        }

        // Find the selected job
        const job = await Job.findById(job_id);

        if (!job) {
            return res.status(404).json({ message: 'Job not found.' });
        }

        // FEATURE 6: Check application deadline
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const deadline = new Date(job.deadline);
        deadline.setHours(23, 59, 59, 999);

        if (Number.isNaN(deadline.getTime())) {
            return res.status(400).json({
                message: 'This job has an invalid application deadline.'
            });
        }

        if (deadline < today) {
            return res.status(400).json({
                message: 'Application failed: The deadline for this job posting has passed.'
            });
        }

        // Check whether the student has already applied
        const existingApplication = await Application.findOne({
            job: job_id,
            student: student_id
        });

        if (existingApplication) {
            return res.status(400).json({
                message: 'You have already applied to this position.'
            });
        }

        // Create the application
        const application = await Application.create({
            job: job_id,
            student: student_id
        });

        // FEATURE 23: Notify the company
        await Notification.create({
            user: job.company,
            message: `A student has applied for your job: "${job.title}".`
        });

        // FEATURE 23: Notify the student
        await Notification.create({
            user: student_id,
            message: `Your application for "${job.title}" was submitted successfully.`
        });

        res.status(201).json({
            message: 'Application submitted successfully!',
            application
        });
    } catch (err) {
        console.error('Error processing application:', err);
        res.status(500).json({ message: 'Error processing application.' });
    }
});

// =========================================================================
// FEATURE 23: Notification Dashboard
// =========================================================================

// GET: Get all notifications for a specific user
router.get('/notifications/:user_id', async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.params.user_id })
            .sort({ createdAt: -1 });

        res.status(200).json(notifications);
    } catch (err) {
        console.error('Error fetching notifications:', err);
        res.status(500).json({ message: 'Error fetching notifications.' });
    }
});

// GET: Get unread notification count
router.get('/notifications/:user_id/unread-count', async (req, res) => {
    try {
        const unreadCount = await Notification.countDocuments({
            user: req.params.user_id,
            is_read: false
        });

        res.status(200).json({ unreadCount });
    } catch (err) {
        console.error('Error fetching unread notification count:', err);
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

        const notification = await Notification.findOne({
            _id: req.params.notification_id,
            user: user_id
        });

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found.' });
        }

        notification.is_read = true;
        await notification.save();

        res.status(200).json({
            message: 'Notification marked as read.',
            notification
        });
    } catch (err) {
        console.error('Error updating notification:', err);
        res.status(500).json({ message: 'Error updating notification.' });
    }
});

// PATCH: Mark all notifications as read
router.patch('/notifications/:user_id/read-all', async (req, res) => {
    try {
        const updateResult = await Notification.updateMany(
            { user: req.params.user_id, is_read: false },
            { $set: { is_read: true } }
        );

        res.status(200).json({
            message: 'All notifications marked as read.',
            updatedCount: updateResult.modifiedCount
        });
    } catch (err) {
        console.error('Error updating notifications:', err);
        res.status(500).json({ message: 'Error updating notifications.' });
    }
});

// =========================================================================
// FEATURE: Get Company's Specific Job Listings
// =========================================================================

router.get('/jobs/company/:company_id', async (req, res) => {
    try {
        const companyJobs = await Job.find({ company: req.params.company_id })
            .sort({ createdAt: -1 });

        res.status(200).json(companyJobs);
    } catch (err) {
        console.error('Error fetching company jobs:', err);
        res.status(500).json({ message: 'Error fetching company job listings.' });
    }
});

module.exports = router;