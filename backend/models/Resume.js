const mongoose = require('mongoose');

// Sub-schemas for structured sections stored as native arrays (not JSON strings)
const EducationEntrySchema = new mongoose.Schema(
    {
        institution: { type: String, default: '' },
        degree: { type: String, default: '' },
        field: { type: String, default: '' },
        startYear: { type: String, default: '' },
        endYear: { type: String, default: '' }
    },
    { _id: false }
);

const ExperienceEntrySchema = new mongoose.Schema(
    {
        company: { type: String, default: '' },
        role: { type: String, default: '' },
        startDate: { type: String, default: '' },
        endDate: { type: String, default: '' },
        description: { type: String, default: '' }
    },
    { _id: false }
);

const ResearchEntrySchema = new mongoose.Schema(
    {
        title: { type: String, default: '' },
        description: { type: String, default: '' },
        year: { type: String, default: '' }
    },
    { _id: false }
);

const ResumeSchema = new mongoose.Schema(
    {
        // References the User who owns this resume (replaces integer student_id)
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

        full_name: { type: String, required: true, trim: true },
        email: { type: String, default: '' },
        phone: { type: String, default: '' },
        summary: { type: String, default: '' },

        // Arrays stored natively instead of JSON-stringified TEXT columns
        education: { type: [EducationEntrySchema], default: [] },
        experience: { type: [ExperienceEntrySchema], default: [] },
        research: { type: [ResearchEntrySchema], default: [] },
        skills: { type: [String], default: [] },

        // Social / portfolio links — stored as a plain sub-document map
        links: {
            github: { type: String, default: '' },
            linkedin: { type: String, default: '' },
            portfolio: { type: String, default: '' }
        },

        include_projects: { type: Boolean, default: true }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Resume', ResumeSchema);
