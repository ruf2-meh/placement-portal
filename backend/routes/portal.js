const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const Project = require('../models/Project');
const Application = require('../models/Application');
const Notification = require('../models/Notification');
const { Op } = require('sequelize'); // Used for search querying filters

// =========================================================================
// FEATURE 9: Student Project Showcase Profile
// =========================================================================
// POST: Add a student project
router.post('/projects', async (req, res) => {
    try {
        const { student_id, title, description, link, tech_stack } = req.body;
        const project = await Project.create({ student_id, title, description, link, tech_stack });
        res.status(201).json({ message: "Project added successfully!", project });
    } catch (err) {
        res.status(500).json({ message: "Error adding project." });
    }
});

// GET: Get a specific student's projects
router.get('/projects/:student_id', async (req, res) => {
    try {
        const projects = await Project.findAll({ where: { student_id: req.params.student_id } });
        res.json(projects);
    } catch (err) {
        res.status(500).json({ message: "Error fetching projects." });
    }
});

// PUT: Edit an existing student project
router.put('/projects/:id', async (req, res) => {
    try {
        const { title, description, link, tech_stack } = req.body;
        const project = await Project.findByPk(req.params.id);
        if (!project) return res.status(404).json({ message: "Project not found." });
        await project.update({ title, description, link, tech_stack });
        res.json({ message: "Project updated successfully!", project });
    } catch (err) {
        res.status(500).json({ message: "Error updating project." });
    }
});

// DELETE: Remove a student project
router.delete('/projects/:id', async (req, res) => {
    try {
        const project = await Project.findByPk(req.params.id);
        if (!project) return res.status(404).json({ message: "Project not found." });
        await project.destroy();
        res.json({ message: "Project deleted successfully!" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting project." });
    }
});

// =========================================================================
// FEATURE 4 & 6: Job Board Search, Filters & Deadline Validation Check
// =========================================================================
router.get('/jobs/search', async (req, res) => {
    try {
        const { keyword } = req.query;
        let queryOptions = {};

        // If a keyword search string is provided, filter by title or location
        if (keyword) {
            queryOptions.where = {
                [Op.or]: [
                    { title: { [Op.like]: `%${keyword}%` } },
                    { location: { [Op.like]: `%${keyword}%` } }
                ]
            };
        }

        const jobs = await Job.findAll(queryOptions);
        res.json(jobs);
    } catch (err) {
        res.status(500).json({ message: "Error searching jobs." });
    }
});

// =========================================================================
// FEATURE 10, 6, & 23: Apply Engine + Deadline Protection + Alert Triggering
// =========================================================================
router.post('/jobs/apply', async (req, res) => {
    try {
        const { job_id, student_id } = req.body;

        // Find the job details
        const job = await Job.findByPk(job_id);
        if (!job) return res.status(404).json({ message: "Job not found." });

        // FEATURE 6: Deadline enforcement validation check
        const today = new Date().toISOString().split('T')[0];
        if (job.deadline < today) {
            return res.status(400).json({ message: "Application failed: The deadline for this job posting has passed." });
        }

        // Check if student already applied
        const existingApp = await Application.findOne({ where: { job_id, student_id } });
        if (existingApp) {
            return res.status(400).json({ message: "You have already applied to this position." });
        }

        // Register application record
        await Application.create({ job_id, student_id });

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

        res.status(201).json({ message: "Application submitted successfully!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error processing application." });
    }
});

// =========================================================================
// FEATURE 23: Pull Notification Dashboard Feeds
// =========================================================================
router.get('/notifications/:user_id', async (req, res) => {
    try {
        const alerts = await Notification.findAll({
            where: { user_id: req.params.user_id },
            order: [['createdAt', 'DESC']]
        });
        res.json(alerts);
    } catch (err) {
        res.status(500).json({ message: "Error fetching alerts." });
    }
});
// =========================================================================
// FEATURE: Get Company's Specific Job Listings
// =========================================================================
router.get('/jobs/company/:company_id', async (req, res) => {
    try {
        const companyJobs = await Job.findAll({
            where: { company_id: req.params.company_id },
            order: [['createdAt', 'DESC']] // Shows newest postings first
        });
        res.json(companyJobs);
    } catch (err) {
        console.error("Error fetching company jobs: ", err);
        res.status(500).json({ message: "Error fetching company job listings." });
    }
});

module.exports = router;