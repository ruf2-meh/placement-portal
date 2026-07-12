const { DataTypes } = require('sequelize');
const { sequelize } = require('../database');

const Project = sequelize.define('Project', {
    student_id: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    link: { type: DataTypes.STRING },
    tech_stack: { type: DataTypes.STRING }
});

module.exports = Project;