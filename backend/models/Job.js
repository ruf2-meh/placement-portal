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
  location: {
    type: String
  },
  deadline: {
    type: Date,
    required: true
  },
  min_cgpa: {
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