const { Sequelize } = require('sequelize');
require('dotenv').config();

// Create Sequelize instance
const databaseUrl = process.env.DATABASE_URL || 'sqlite:./crm.db';

const sequelize = new Sequelize(databaseUrl, {
  dialect: databaseUrl.startsWith('sqlite') ? 'sqlite' : 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: databaseUrl.startsWith('sqlite') ? undefined : {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  }
});

// Import models
const User = require('./User')(sequelize);
const Customer = require('./Customer')(sequelize);
const Lead = require('./Lead')(sequelize);
const Task = require('./Task')(sequelize);
const Interaction = require('./Interaction')(sequelize);

// Define associations
User.hasMany(Lead, { foreignKey: 'assigned_to', as: 'assignedLeads' });
Lead.belongsTo(User, { foreignKey: 'assigned_to', as: 'assignedUser' });

User.hasMany(Task, { foreignKey: 'assigned_to', as: 'assignedTasks' });
Task.belongsTo(User, { foreignKey: 'assigned_to', as: 'assignedUser' });

User.hasMany(Interaction, { foreignKey: 'created_by', as: 'createdInteractions' });
Interaction.belongsTo(User, { foreignKey: 'created_by', as: 'createdByUser' });

Customer.hasMany(Lead, { foreignKey: 'customer_id', as: 'leads' });
Lead.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });

Customer.hasMany(Task, { foreignKey: 'customer_id', as: 'tasks' });
Task.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });

Customer.hasMany(Interaction, { foreignKey: 'customer_id', as: 'interactions' });
Interaction.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });

// Export models and sequelize instance
module.exports = {
  sequelize,
  User,
  Customer,
  Lead,
  Task,
  Interaction
}; 