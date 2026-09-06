const { DataTypes } = require('sequelize');
const { sequelize } = require('../database');

const WeeklyLog = sequelize.define('WeeklyLog', {
    application_id: { type: DataTypes.INTEGER, allowNull: false },
    student_id: { type: DataTypes.INTEGER, allowNull: false },
    week_number: { type: DataTypes.INTEGER, allowNull: false },
    hours_worked: { type: DataTypes.INTEGER, defaultValue: 0 },
    tasks_completed: { type: DataTypes.TEXT, allowNull: false },
    challenges: { type: DataTypes.TEXT },
    learnings: { type: DataTypes.TEXT }
});

module.exports = WeeklyLog;
