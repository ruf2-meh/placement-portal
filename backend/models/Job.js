const mongoose = require('mongoose');

<<<<<<< HEAD
const Job = sequelize.define('Job', {
    company_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    requirements: {
        type: DataTypes.TEXT
    },
    location: {
        type: DataTypes.STRING
    },
    deadline: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    // --- ADDED ELIGIBILITY FIELDS ---
    min_cgpa: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: null
    },
    max_backlogs: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null
    },
    allowed_departments: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
    }
});
=======
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
>>>>>>> main

module.exports = mongoose.model('Job', jobSchema);