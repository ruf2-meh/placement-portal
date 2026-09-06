const { DataTypes } = require('sequelize');
const { sequelize } = require('../database');

const MidTermReport = sequelize.define('MidTermReport', {
    application_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    student_id: { type: DataTypes.INTEGER, allowNull: false },
    company_id: { type: DataTypes.INTEGER, allowNull: false },
    attendance_rating: { type: DataTypes.INTEGER, allowNull: false },
    technical_rating: { type: DataTypes.INTEGER, allowNull: false },
    communication_rating: { type: DataTypes.INTEGER, allowNull: false },
    strengths: { type: DataTypes.TEXT },
    areas_to_improve: { type: DataTypes.TEXT },
    comments: { type: DataTypes.TEXT }
});

module.exports = MidTermReport;
