const { DataTypes } = require('sequelize');
const { sequelize } = require('../database');

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
    }
});

module.exports = Job;