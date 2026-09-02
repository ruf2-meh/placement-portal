const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  student: {
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
  techStack: {
    type: String,
    default: ''
  },
  projectUrl: {
    type: String,
    default: ''
  },
  githubUrl: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);