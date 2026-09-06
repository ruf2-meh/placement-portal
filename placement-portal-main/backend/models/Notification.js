const { DataTypes } = require('sequelize');
const { sequelize } = require('../database');

const Notification = sequelize.define('Notification', {
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    message: { type: DataTypes.STRING, allowNull: false },
    is_read: { type: DataTypes.BOOLEAN, defaultValue: false }
});

module.exports = Notification;