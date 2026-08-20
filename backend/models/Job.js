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
  }
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);