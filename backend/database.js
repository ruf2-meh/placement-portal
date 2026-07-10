const { Sequelize } = require('sequelize');

// Create a single, shared database connection instance
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: false
});

// Export it cleanly so all models can find it
module.exports = { sequelize };