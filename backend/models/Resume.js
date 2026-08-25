const { DataTypes } = require('sequelize');
const { sequelize } = require('../database');

const Resume = sequelize.define('Resume', {
    student_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true
    },
    full_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING
    },
    phone: {
        type: DataTypes.STRING
    },
    summary: {
        type: DataTypes.TEXT
    },
    education: {
        type: DataTypes.TEXT
    },
    experience: {
        type: DataTypes.TEXT
    },
    research: {
        type: DataTypes.TEXT
    },
    skills: {
        type: DataTypes.TEXT
    },
    links: {
        type: DataTypes.TEXT
    },
    include_projects: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
});

module.exports = Resume;
