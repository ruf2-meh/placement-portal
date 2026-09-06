const express = require('express');
const router = express.Router();
const { sequelize } = require('../database');
const { Op } = require('sequelize');
const WeeklyLog = require('../models/WeeklyLog');
const MidTermReport = require('../models/MidTermReport');
const Notification = require('../models/Notification');

// =========================================================================
// FEATURE 18 & 19 SHARED: Resolve who is actually an active intern
// An "active internship" = an Application whose status is 'accepted'
// =========================================================================

// GET: A student's active internships (accepted offers)
router.get('/student/:student_id/internships', async (req, res) => {
    try {
        const [rows] = await sequelize.query(`
            SELECT a.id AS application_id,
                   a.status AS status,
                   j.id AS job_id,
                   j.title AS job_title,
                   j.location AS job_location,
                   u.name AS company_name
            FROM Applications a
            LEFT JOIN Jobs j ON a.job_id = j.id
            LEFT JOIN Users u ON j.company_id = u.id
            WHERE a.student_id = :studentId AND a.status = 'accepted'
            ORDER BY a.updatedAt DESC
        `, { replacements: { studentId: req.params.student_id } });

        res.json(rows);
    } catch (err) {
        console.error("Error fetching student internships: ", err);
        res.status(500).json({ message: "Error fetching internships." });
    }
});

// =========================================================================
// FEATURE 18: Weekly Diary Logs
// =========================================================================

// POST: Submit one weekly diary entry
router.post('/logs', async (req, res) => {
    try {
        const { application_id, student_id, week_number, hours_worked, tasks_completed, challenges, learnings } = req.body;

        if (!application_id || !student_id || !week_number || !tasks_completed) {
            return res.status(400).json({ message: "Internship, week number and tasks completed are required." });
        }

        const week = parseInt(week_number, 10);
        if (isNaN(week) || week < 1 || week > 52) {
            return res.status(400).json({ message: "Week number must be between 1 and 52." });
        }

        // Block duplicate submissions for the same week of the same internship
        const existing = await WeeklyLog.findOne({ where: { application_id, week_number: week } });
        if (existing) {
            return res.status(400).json({ message: `You have already submitted a diary log for Week ${week}.` });
        }

        const log = await WeeklyLog.create({
            application_id,
            student_id,
            week_number: week,
            hours_worked: parseInt(hours_worked, 10) || 0,
            tasks_completed,
            challenges,
            learnings
        });

        // FEATURE 23: alert the supervising company
        const [jobRow] = await sequelize.query(`
            SELECT j.title, j.company_id, u.name AS student_name
            FROM Applications a
            LEFT JOIN Jobs j ON a.job_id = j.id
            LEFT JOIN Users u ON a.student_id = u.id
            WHERE a.id = :id
        `, { replacements: { id: application_id } });

        if (jobRow.length > 0 && jobRow[0].company_id) {
            await Notification.create({
                user_id: jobRow[0].company_id,
                message: `📔 ${jobRow[0].student_name || 'An intern'} submitted a Week ${week} diary log for "${jobRow[0].title}".`
            });
        }

        res.status(201).json({ message: `Week ${week} diary log submitted successfully!`, log });
    } catch (err) {
        console.error("Error submitting weekly log: ", err);
        res.status(500).json({ message: "Error submitting weekly diary log." });
    }
});

// GET: All diary logs for one internship
router.get('/logs/:application_id', async (req, res) => {
    try {
        const logs = await WeeklyLog.findAll({
            where: { application_id: req.params.application_id },
            order: [['week_number', 'ASC']]
        });
        res.json(logs);
    } catch (err) {
        console.error("Error fetching weekly logs: ", err);
        res.status(500).json({ message: "Error fetching weekly logs." });
    }
});

// PUT: Edit one of the student's own diary entries
router.put('/logs/:id', async (req, res) => {
    try {
        const { student_id, week_number, hours_worked, tasks_completed, challenges, learnings } = req.body;

        const log = await WeeklyLog.findByPk(req.params.id);
        if (!log) {
            return res.status(404).json({ message: "That diary log no longer exists." });
        }

        // Ownership check: a student may only edit their own entries
        if (String(log.student_id) !== String(student_id)) {
            return res.status(403).json({ message: "You can only edit your own diary logs." });
        }

        if (!tasks_completed || !String(tasks_completed).trim()) {
            return res.status(400).json({ message: "Tasks completed cannot be empty." });
        }

        const week = parseInt(week_number, 10);
        if (isNaN(week) || week < 1 || week > 52) {
            return res.status(400).json({ message: "Week number must be between 1 and 52." });
        }

        // Moving an entry to a week that already has one would create a duplicate
        const clash = await WeeklyLog.findOne({
            where: {
                application_id: log.application_id,
                week_number: week,
                id: { [Op.ne]: log.id }
            }
        });
        if (clash) {
            return res.status(400).json({ message: `You already have a diary log for Week ${week}.` });
        }

        await log.update({
            week_number: week,
            hours_worked: parseInt(hours_worked, 10) || 0,
            tasks_completed,
            challenges,
            learnings
        });

        // FEATURE 23: let the manager know the record they review has changed
        const [jobRow] = await sequelize.query(`
            SELECT j.title, j.company_id, u.name AS student_name
            FROM Applications a
            LEFT JOIN Jobs j ON a.job_id = j.id
            LEFT JOIN Users u ON a.student_id = u.id
            WHERE a.id = :id
        `, { replacements: { id: log.application_id } });

        if (jobRow.length > 0 && jobRow[0].company_id) {
            await Notification.create({
                user_id: jobRow[0].company_id,
                message: `✏️ ${jobRow[0].student_name || 'An intern'} updated their Week ${week} diary log for "${jobRow[0].title}".`
            });
        }

        res.json({ message: `Week ${week} diary log updated successfully!`, log });
    } catch (err) {
        console.error("Error updating weekly log: ", err);
        res.status(500).json({ message: "Error updating weekly diary log." });
    }
});

// DELETE: Remove one of the student's own diary entries
router.delete('/logs/:id', async (req, res) => {
    try {
        // Sent in the body by axios.delete(url, { data: {...} })
        const student_id = req.body?.student_id;

        const log = await WeeklyLog.findByPk(req.params.id);
        if (!log) {
            return res.status(404).json({ message: "That diary log no longer exists." });
        }

        if (String(log.student_id) !== String(student_id)) {
            return res.status(403).json({ message: "You can only delete your own diary logs." });
        }

        const week = log.week_number;
        const applicationId = log.application_id;
        await log.destroy();

        const [jobRow] = await sequelize.query(`
            SELECT j.title, j.company_id, u.name AS student_name
            FROM Applications a
            LEFT JOIN Jobs j ON a.job_id = j.id
            LEFT JOIN Users u ON a.student_id = u.id
            WHERE a.id = :id
        `, { replacements: { id: applicationId } });

        if (jobRow.length > 0 && jobRow[0].company_id) {
            await Notification.create({
                user_id: jobRow[0].company_id,
                message: `🗑️ ${jobRow[0].student_name || 'An intern'} removed their Week ${week} diary log for "${jobRow[0].title}".`
            });
        }

        res.json({ message: `Week ${week} diary log deleted.` });
    } catch (err) {
        console.error("Error deleting weekly log: ", err);
        res.status(500).json({ message: "Error deleting weekly diary log." });
    }
});

// =========================================================================
// FEATURE 19: Mid-Term Report by the Company Manager
// =========================================================================

// GET: A company's active interns, with how many diary logs each has filed
router.get('/company/:company_id/interns', async (req, res) => {
    try {
        const [rows] = await sequelize.query(`
            SELECT a.id AS application_id,
                   u.id AS student_id,
                   u.name AS student_name,
                   u.email AS student_email,
                   j.id AS job_id,
                   j.title AS job_title,
                   (SELECT COUNT(*) FROM WeeklyLogs w WHERE w.application_id = a.id) AS log_count,
                   (SELECT COUNT(*) FROM MidTermReports m WHERE m.application_id = a.id) AS has_midterm
            FROM Applications a
            LEFT JOIN Jobs j ON a.job_id = j.id
            LEFT JOIN Users u ON a.student_id = u.id
            WHERE j.company_id = :companyId AND a.status = 'accepted'
            ORDER BY a.updatedAt DESC
        `, { replacements: { companyId: req.params.company_id } });

        res.json(rows);
    } catch (err) {
        console.error("Error fetching company interns: ", err);
        res.status(500).json({ message: "Error fetching active interns." });
    }
});

// POST: Create or update the mid-term report (one per internship)
router.post('/midterm', async (req, res) => {
    try {
        const {
            application_id, student_id, company_id,
            attendance_rating, technical_rating, communication_rating,
            strengths, areas_to_improve, comments
        } = req.body;

        if (!application_id || !student_id || !company_id) {
            return res.status(400).json({ message: "Internship, student and company are required." });
        }

        const ratings = { attendance_rating, technical_rating, communication_rating };
        for (const [key, value] of Object.entries(ratings)) {
            const num = parseInt(value, 10);
            if (isNaN(num) || num < 1 || num > 5) {
                return res.status(400).json({ message: `${key.replace('_rating', '')} rating must be between 1 and 5.` });
            }
            ratings[key] = num;
        }

        const payload = { application_id, student_id, company_id, ...ratings, strengths, areas_to_improve, comments };

        // One report per internship: update in place if it already exists
        const existing = await MidTermReport.findOne({ where: { application_id } });
        let report;
        let isUpdate = false;
        if (existing) {
            await existing.update(payload);
            report = existing;
            isUpdate = true;
        } else {
            report = await MidTermReport.create(payload);
        }

        // FEATURE 23: notify the student that a review was filed (ratings stay private)
        await Notification.create({
            user_id: student_id,
            message: `📝 Your internship manager has ${isUpdate ? 'updated' : 'submitted'} your mid-term performance review.`
        });

        res.status(isUpdate ? 200 : 201).json({
            message: `Mid-term report ${isUpdate ? 'updated' : 'submitted'} successfully!`,
            report
        });
    } catch (err) {
        console.error("Error saving mid-term report: ", err);
        res.status(500).json({ message: "Error saving mid-term report." });
    }
});

// GET: Read the mid-term report for one internship (company side)
router.get('/midterm/:application_id', async (req, res) => {
    try {
        const report = await MidTermReport.findOne({ where: { application_id: req.params.application_id } });
        res.json(report || null);
    } catch (err) {
        console.error("Error fetching mid-term report: ", err);
        res.status(500).json({ message: "Error fetching mid-term report." });
    }
});

module.exports = router;
