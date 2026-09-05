const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema(
    {
        job_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
        student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
    },
    { timestamps: true }
);

// Prevent duplicate applications
ApplicationSchema.index({ job_id: 1, student_id: 1 }, { unique: true });

module.exports = mongoose.model('Application', ApplicationSchema);