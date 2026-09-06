const express = require('express');
const router = express.Router();
const Offer = require('../models/Offer');
const Notification = require('../models/Notification');

// =========================================================================
// FEATURE 16: Digital Offer Letters
// =========================================================================

// ── POST /api/offers ──────────────────────────────────────────────────────
// Body: applicationId, jobId, companyId, studentId, position, salary,
//       startDate, letterBody, jobTitle (for notification message)
// Creates an offer for a student. Rejects with 409 if a non-withdrawn offer
// already exists for the same application.
router.post('/', async (req, res) => {
    try {
        const {
            applicationId, jobId, companyId, studentId,
            position, salary, startDate, letterBody,
            jobTitle // passed from frontend — avoids a cross-DB job lookup
        } = req.body;

        // Validate required fields
        if (!applicationId || !jobId || !companyId || !studentId) {
            return res.status(400).json({
                message: 'applicationId, jobId, companyId, and studentId are required.'
            });
        }

        // Reject with 409 if a non-withdrawn offer already exists for this application
        const existing = await Offer.findOne({
            application: applicationId,
            status: { $ne: 'withdrawn' }
        });
        if (existing) {
            return res.status(409).json({
                message: 'An active offer already exists for this application. Withdraw it before sending a new one.'
            });
        }

        // Create the offer
        const offer = await Offer.create({
            application: applicationId,
            job: jobId,
            student: studentId,
            company: companyId,
            position,
            salary,
            startDate: startDate ? new Date(startDate) : undefined,
            letterBody,
            status: 'sent'
        });

        // Notify the student via the Notification model (Mongoose on this branch)
        const title = jobTitle || position || 'the position';
        await Notification.create({
            user_id: studentId,
            message: `📩 You've received a job offer for "${title}"!`
        });

        res.status(201).json({ message: 'Offer letter sent successfully!', offer });
    } catch (err) {
        console.error('Error creating offer:', err);
        res.status(500).json({ message: 'Error creating offer letter.' });
    }
});

// ── GET /api/offers/company/:companyId ────────────────────────────────────
// Returns all offers sent by a specific company, newest first.
router.get('/company/:companyId', async (req, res) => {
    try {
        const offers = await Offer.find({ company: req.params.companyId })
            .sort({ createdAt: -1 });
        res.json(offers);
    } catch (err) {
        console.error('Error fetching company offers:', err);
        res.status(500).json({ message: 'Error fetching company offers.' });
    }
});

// ── GET /api/offers/student/:studentId ───────────────────────────────────
// Returns all offers received by a specific student, newest first.
router.get('/student/:studentId', async (req, res) => {
    try {
        const offers = await Offer.find({ student: req.params.studentId })
            .sort({ createdAt: -1 });
        res.json(offers);
    } catch (err) {
        console.error('Error fetching student offers:', err);
        res.status(500).json({ message: 'Error fetching student offers.' });
    }
});

// ── PATCH /api/offers/:id/withdraw ────────────────────────────────────────
// Withdraws an offer (company action). Notifies the student.
router.patch('/:id/withdraw', async (req, res) => {
    try {
        const offer = await Offer.findById(req.params.id);
        if (!offer) {
            return res.status(404).json({ message: 'Offer not found.' });
        }

        offer.status = 'withdrawn';
        await offer.save();

        // Notify the student that the offer was withdrawn
        const title = offer.position || 'the position';
        await Notification.create({
            user_id: offer.student,
            message: `🔔 The job offer for "${title}" has been withdrawn by the company.`
        });

        res.json({ message: 'Offer withdrawn successfully.', offer });
    } catch (err) {
        console.error('Error withdrawing offer:', err);
        res.status(500).json({ message: 'Error withdrawing offer.' });
    }
});

module.exports = router;
