const { DataTypes } = require('sequelize');
const { sequelize } = require('../database');

const Application = sequelize.define('Application', {
    job_id: { type: DataTypes.INTEGER, allowNull: false },
    student_id: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.STRING, defaultValue: 'applied' }
});

module.exports = Application;
