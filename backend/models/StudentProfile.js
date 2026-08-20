const { DataTypes } = require('sequelize');
const { sequelize } = require('../database');

const StudentProfile = sequelize.define('StudentProfile', {
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true
    },
    full_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    department: {
        type: DataTypes.STRING,
        allowNull: false
    },
    cgpa: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    backlogs: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    skills: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    bio: {
        type: DataTypes.TEXT,
        allowNull: true
    }
});

module.exports = StudentProfile;