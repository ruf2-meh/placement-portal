const { sequelize } = require('../database');
const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const Project = require('../models/Project');
const Application = require('../models/Application');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { Op } = require('sequelize');

// =========================================================================
// FEATURE 9: Student Project Showcase Profile
// =========================================================================
// POST: Add a student project
router.post('/projects', async (req, res) => {
    try {
        const { student_id, title, description, link } = req.body;
        const project = await Project.create({ student_id, title, description, link });
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

// =========================================================================
// FEATURE 4 & 6: Job Board Search, Filters & Deadline Validation Check
// =========================================================================
router.get('/jobs/search', async (req, res) => {
    try {
        const { keyword } = req.query;
        let queryOptions = {};

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

        const job = await Job.findByPk(job_id);
        if (!job) return res.status(404).json({ message: "Job not found." });

        const today = new Date().toISOString().split('T')[0];
        if (job.deadline < today) {
            return res.status(400).json({ message: "Application failed: The deadline for this job posting has passed." });
        }

        const existingApp = await Application.findOne({ where: { job_id, student_id } });
        if (existingApp) {
            return res.status(400).json({ message: "You have already applied to this position." });
        }

        await Application.create({
            job_id,
            student_id,
            status: 'applied'
        });

        await Notification.create({
            user_id: job.company_id,
            message: `🎉 You have received a new applicant submission for your position: "${job.title}"!`
        });

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
            order: [['createdAt', 'DESC']]
        });
        res.json(companyJobs);
    } catch (err) {
        console.error("Error fetching company jobs: ", err);
        res.status(500).json({ message: "Error fetching company job listings." });
    }
});

// =========================================================================
// NEW: Fetch All Applicants for a Job (Used by Shortlist Page)
// =========================================================================
router.get('/jobs/:job_id/applicants', async (req, res) => {
    try {
        const { job_id } = req.params;
        const applications = await Application.findAll({
            where: { job_id },
            include: [
                {
                    model: User,
                    attributes: ['id', 'name', 'email']
                }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(applications);
    } catch (err) {
        console.error("Error fetching job applicants: ", err);
        res.status(500).json({ message: "Error fetching applicants." });
    }
});

// =========================================================================
// FEATURE 13: Batch Shortlist Multiple Students at Once (Raw SQL Fix)
// =========================================================================
router.post('/applications/batch-shortlist', async (req, res) => {
    try {
        const { application_ids } = req.body;

        if (!application_ids || !Array.isArray(application_ids) || application_ids.length === 0) {
            return res.status(400).json({ message: "No applications selected for shortlisting." });
        }

        // 1. Direct raw SQL update to guarantee SQLite updates the status column
        await sequelize.query(
            `UPDATE Applications
            SET status = 'shortlisted', updatedAt = CURRENT_TIMESTAMP
            WHERE id IN (${application_ids.map(() => '?').join(',')})`,
                              { replacements: application_ids }
        );

        // 2. Fetch student IDs and Job titles to dispatch notifications
        const [updatedApps] = await sequelize.query(
            `SELECT a.id, a.student_id, j.title
            FROM Applications a
            LEFT JOIN Jobs j ON a.job_id = j.id
            WHERE a.id IN (${application_ids.map(() => '?').join(',')})`,
                                                    { replacements: application_ids }
        );

        for (const app of updatedApps) {
            await Notification.create({
                user_id: app.student_id,
                message: `🌟 Great news! You have been shortlisted for the role "${app.title || 'Position'}"!`
            });
        }

        res.json({ message: `Successfully shortlisted ${application_ids.length} applicant(s)!` });
    } catch (err) {
        console.error("Batch shortlisting failed: ", err);
        res.status(500).json({ message: "Internal server error during batch shortlisting.", error: err.message });
    }
});

// =========================================================================
// FEATURE 17: Get Student's Active Offers & Accept/Reject Engine
// =========================================================================
// GET: Fetch actionable offers and shortlists for a student via raw SQL
router.get('/student/:student_id/offers', async (req, res) => {
    try {
        const studentId = req.params.student_id;

        const [results] = await sequelize.query(`
        SELECT
        a.id AS id,
        a.status AS status,
        a.student_id AS student_id,
        a.job_id AS job_id,
        a.updatedAt AS updatedAt,
        j.id AS job_id_val,
        j.title AS job_title,
        j.location AS job_location,
        j.company_id AS job_company_id
        FROM Applications a
        LEFT JOIN Jobs j ON a.job_id = j.id
        WHERE a.student_id = :studentId
        AND a.status IN ('shortlisted', 'offered')
        ORDER BY a.updatedAt DESC
        `, {
            replacements: { studentId }
        });

        const formatted = results.map(row => ({
            id: row.id,
            status: row.status,
            student_id: row.student_id,
            job_id: row.job_id,
            Job: {
                id: row.job_id_val,
                title: row.job_title,
                location: row.job_location,
                company_id: row.job_company_id
            }
        }));

        res.json(formatted);
    } catch (err) {
        console.error("Error fetching student offers: ", err);
        res.status(500).json({ message: "Error fetching student offers.", error: err.message });
    }
});

// PATCH: Accept or reject an offer via raw SQL
router.patch('/applications/:id/offer-decision', async (req, res) => {
    try {
        const { decision } = req.body;
        const applicationId = req.params.id;

        if (!['accepted', 'rejected'].includes(decision)) {
            return res.status(400).json({ message: "Decision must be either 'accepted' or 'rejected'." });
        }

        // 1. Update application status directly
        await sequelize.query(
            `UPDATE Applications SET status = :decision, updatedAt = CURRENT_TIMESTAMP WHERE id = :id`,
            { replacements: { decision, id: applicationId } }
        );

        // 2. Fetch the job info so we can alert the recruiter
        const [appRow] = await sequelize.query(
            `SELECT a.job_id, j.title, j.company_id
            FROM Applications a
            LEFT JOIN Jobs j ON a.job_id = j.id
            WHERE a.id = :id`,
            { replacements: { id: applicationId } }
        );

        if (appRow.length > 0 && appRow[0].company_id) {
            await Notification.create({
                user_id: appRow[0].company_id,
                message: `📢 A student has ${decision} your job offer for "${appRow[0].title}".`
            });
        }

        res.json({ message: `Offer successfully marked as ${decision}.` });
    } catch (err) {
        console.error("Error processing offer decision: ", err);
        res.status(500).json({ message: "Error updating offer decision.", error: err.message });
    }
});

module.exports = router;
