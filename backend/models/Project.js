const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema(
    {
        student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        title: { type: String, required: true, trim: true },
        description: { type: String, default: '' },
        link: { type: String, default: '' },
        // Additive field from this branch (not present in main); kept as it is useful
        tech_stack: { type: String, default: '' }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Project', ProjectSchema);