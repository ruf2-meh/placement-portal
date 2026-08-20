const mongoose = require('mongoose');

<<<<<<< HEAD
const Project = sequelize.define('Project', {
    student_id: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    link: { type: DataTypes.STRING },
    tech_stack: { type: DataTypes.STRING }
});
=======
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
    type: String
  },
  link: {
    type: String,
    trim: true
  }
}, { timestamps: true });
>>>>>>> main

module.exports = mongoose.model('Project', projectSchema);