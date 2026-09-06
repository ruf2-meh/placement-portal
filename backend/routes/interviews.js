const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Interview = require('../models/Interview');
const Application = require('../models/Application');
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/authMiddleware');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------

const formatDateTime = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) +
        ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

// Checks whether [newStart, newEnd) overlaps any [existingStart, existingEnd)
// in the given list of interviews. Cancelled interviews never block new
// bookings. `excludeId` lets a reschedule ignore its own existing record.
const findConflict = (interviews, newStart, newEnd, excludeId = null) => {
    return interviews.find((interview) => {
        if (excludeId && String(interview._id) === String(excludeId)) return false;
        if (interview.status === 'cancelled') return false;

        const existingStart = new Date(interview.scheduledAt);
        const existingEnd = new Date(existingStart.getTime() + (interview.duration || 30) * 60000);

        return existingStart < newEnd && existingEnd > newStart;
    });
};

// -----------------------------------------------------------------------------
// POST: Schedule a new interview (company only)
// -----------------------------------------------------------------------------
router.post('/', authMiddleware, async (req, res) => {
    if (req.user.role !== 'company') {
        return res.status(403).json({ message: 'Only company accounts can schedule interviews.' });
    }

    const {
        applicationId,
        scheduledAt,
        duration,
        interviewType,
        meetingLink,
        location,
        notes
    } = req.body;

    if (!applicationId || !scheduledAt) {
        return res.status(400).json({ message: 'applicationId and scheduledAt are required.' });
    }

    if (!isValidId(applicationId)) {
        return res.status(400).json({ message: 'Invalid application ID.' });
    }

    const parsedStart = new Date(scheduledAt);
    if (Number.isNaN(parsedStart.getTime())) {
        return res.status(400).json({ message: 'Invalid scheduled date/time.' });
    }

    const parsedDuration = duration ? parseInt(duration, 10) : 30;
    const parsedEnd = new Date(parsedStart.getTime() + parsedDuration * 60000);

    try {
        const application = await Application.findById(applicationId).populate('job');

        if (!application) {
            return res.status(404).json({ message: 'Application not found.' });
        }

        // A company may only schedule interviews for applications to its own jobs.
        if (!application.job || String(application.job.company) !== String(req.user.id)) {
            return res.status(403).json({ message: 'You do not have access to this application.' });
        }

        const studentId = application.student;
        const companyId = req.user.id;

        // Conflict check across every non-cancelled interview involving
        // either this student or this company.
        const existingInterviews = await Interview.find({
            $or: [{ student: studentId }, { company: companyId }]
        });

        const conflict = findConflict(existingInterviews, parsedStart, parsedEnd);
        if (conflict) {
            return res.status(409).json({
                message: 'Interview time conflicts with an existing interview.'
            });
        }

        const interview = await Interview.create({
            application: applicationId,
            job: application.job._id,
            student: studentId,
            company: companyId,
            scheduledAt: parsedStart,
            duration: parsedDuration,
            interviewType: interviewType || 'Video Call',
            meetingLink: meetingLink || '',
            location: location || '',
            notes: notes || ''
        });

        await Notification.create({
            user: studentId,
            message: `Your interview for "${application.job.title}" has been scheduled for ${formatDateTime(parsedStart)}.`
        });

        return res.status(201).json({
            message: 'Interview scheduled successfully!',
            interview
        });
    } catch (err) {
        console.error('Error scheduling interview:', err);
        return res.status(500).json({ message: 'Failed to schedule interview.' });
    }
});

// -----------------------------------------------------------------------------
// GET: Company's own scheduled interviews
// -----------------------------------------------------------------------------
router.get('/company', authMiddleware, async (req, res) => {
    if (req.user.role !== 'company') {
        return res.status(403).json({ message: 'Only company accounts can view this.' });
    }

    try {
        const interviews = await Interview.find({ company: req.user.id })
            .populate('job', 'title')
            .populate('student', 'name email')
            .sort({ scheduledAt: 1 });

        return res.status(200).json(interviews);
    } catch (err) {
        console.error('Error fetching company interviews:', err);
        return res.status(500).json({ message: 'Failed to fetch interviews.' });
    }
});

// -----------------------------------------------------------------------------
// GET: Student's own interviews
// -----------------------------------------------------------------------------
router.get('/student', authMiddleware, async (req, res) => {
    if (req.user.role !== 'student') {
        return res.status(403).json({ message: 'Only student accounts can view this.' });
    }

    try {
        const interviews = await Interview.find({ student: req.user.id })
            .populate('job', 'title')
            .populate('company', 'name email')
            .sort({ scheduledAt: 1 });

        return res.status(200).json(interviews);
    } catch (err) {
        console.error('Error fetching student interviews:', err);
        return res.status(500).json({ message: 'Failed to fetch interviews.' });
    }
});

// -----------------------------------------------------------------------------
// PUT: Reschedule an interview (company only, must own it)
// -----------------------------------------------------------------------------
router.put('/:id', authMiddleware, async (req, res) => {
    if (req.user.role !== 'company') {
        return res.status(403).json({ message: 'Only company accounts can reschedule interviews.' });
    }

    const { id } = req.params;
    if (!isValidId(id)) {
        return res.status(400).json({ message: 'Invalid interview ID.' });
    }

    const { scheduledAt, duration, interviewType, meetingLink, location, notes } = req.body;

    try {
        const interview = await Interview.findById(id).populate('job', 'title');

        if (!interview) {
            return res.status(404).json({ message: 'Interview not found.' });
        }

        if (String(interview.company) !== String(req.user.id)) {
            return res.status(403).json({ message: 'You do not have access to this interview.' });
        }

        let parsedStart = interview.scheduledAt;
        let parsedDuration = interview.duration;

        if (scheduledAt) {
            parsedStart = new Date(scheduledAt);
            if (Number.isNaN(parsedStart.getTime())) {
                return res.status(400).json({ message: 'Invalid scheduled date/time.' });
            }
        }
        if (duration) {
            parsedDuration = parseInt(duration, 10);
        }
        const parsedEnd = new Date(parsedStart.getTime() + parsedDuration * 60000);

        const existingInterviews = await Interview.find({
            $or: [{ student: interview.student }, { company: interview.company }]
        });

        const conflict = findConflict(existingInterviews, parsedStart, parsedEnd, interview._id);
        if (conflict) {
            return res.status(409).json({
                message: 'Interview time conflicts with an existing interview.'
            });
        }

        interview.scheduledAt = parsedStart;
        interview.duration = parsedDuration;
        if (interviewType) interview.interviewType = interviewType;
        if (meetingLink !== undefined) interview.meetingLink = meetingLink;
        if (location !== undefined) interview.location = location;
        if (notes !== undefined) interview.notes = notes;
        interview.status = 'rescheduled';

        await interview.save();

        await Notification.create({
            user: interview.student,
            message: `Your interview for "${interview.job.title}" has been rescheduled to ${formatDateTime(parsedStart)}.`
        });

        return res.status(200).json({ message: 'Interview rescheduled successfully!', interview });
    } catch (err) {
        console.error('Error rescheduling interview:', err);
        return res.status(500).json({ message: 'Failed to reschedule interview.' });
    }
});

// -----------------------------------------------------------------------------
// PATCH: Update interview status (company only, must own it)
// Students can view status via GET /student but cannot change it themselves.
// -----------------------------------------------------------------------------
router.patch('/:id/status', authMiddleware, async (req, res) => {
    if (req.user.role !== 'company') {
        return res.status(403).json({ message: 'Only company accounts can update interview status.' });
    }

    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['scheduled', 'completed', 'cancelled', 'rescheduled'];

    if (!isValidId(id)) {
        return res.status(400).json({ message: 'Invalid interview ID.' });
    }

    if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ message: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    try {
        const interview = await Interview.findById(id).populate('job', 'title');

        if (!interview) {
            return res.status(404).json({ message: 'Interview not found.' });
        }

        if (String(interview.company) !== String(req.user.id)) {
            return res.status(403).json({ message: 'You do not have access to this interview.' });
        }

        interview.status = status;
        await interview.save();

        const statusMessages = {
            completed: `Your interview for "${interview.job.title}" has been marked as completed.`,
            cancelled: `Your interview for "${interview.job.title}" has been cancelled.`,
            rescheduled: `Your interview for "${interview.job.title}" has been rescheduled.`,
            scheduled: `Your interview status for "${interview.job.title}" has been updated to Scheduled.`
        };

        await Notification.create({
            user: interview.student,
            message: statusMessages[status]
        });

        return res.status(200).json({ message: 'Interview status updated.', interview });
    } catch (err) {
        console.error('Error updating interview status:', err);
        return res.status(500).json({ message: 'Failed to update interview status.' });
    }
});

module.exports = router;