const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  requirements: {
    type: String
  },
  // Structured skill list used by the Skill Matcher (Feature 2) and Skill
  // Gap Analyzer (Feature 3) for reliable comparison. Auto-populated from
  // `requirements` at creation time — the company posting form still only
  // has one free-text field, this just also stores it as a clean array.
  // `requirements` is kept as-is for display; nothing here removes it.
  requiredSkills: {
    type: [String],
    default: []
  },
  location: {
    type: String
  },
  jobType: {
    type: String,
    enum: ['Remote', 'On-site', 'Hybrid'],
    default: null
  },
  paymentType: {
    type: String,
    enum: ['Paid', 'Unpaid'],
    default: null
  },
  deadline: {
    type: Date,
    required: true
  },
  min_cgpa: {
    type: Number,
    default: null
  },
  max_cgpa: {
    type: Number,
    default: null
  },
  max_backlogs: {
    type: Number,
    default: null
  },
  allowed_departments: {
    type: String,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);