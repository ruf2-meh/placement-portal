const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  cgpa: {
    type: Number,
    default: 0.0
  },
  backlogs: {
    type: Number,
    default: 0
  },
  department: {
    type: String,
    trim: true,
    default: ''
  },
  full_name: {
    type: String,
    trim: true,
    default: ''
  },
  bio: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  resumeUrl: {
    type: String,
    default: ''
  },
  skills: {
    type: [String],
    default: []
  }
}, { timestamps: true });

module.exports = mongoose.model('StudentProfile', studentProfileSchema);
