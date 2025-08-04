const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Task = sequelize.define('Task', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [2, 255]
      }
    },
    description: {
      type: DataTypes.TEXT,
      validate: {
        len: [0, 1000]
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'in-progress', 'completed'),
      defaultValue: 'pending',
      allowNull: false
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      defaultValue: 'medium',
      allowNull: false
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'due_date',
      validate: {
        isDate: true
      }
    },
    assignedTo: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'assigned_to',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'customer_id',
      references: {
        model: 'customers',
        key: 'id'
      }
    }
  }, {
    tableName: 'tasks',
    indexes: [
      {
        fields: ['status']
      },
      {
        fields: ['priority']
      },
      {
        fields: ['assigned_to']
      },
      {
        fields: ['customer_id']
      },
      {
        fields: ['due_date']
      }
    ]
  });

  // Instance method to mark as completed
  Task.prototype.markCompleted = function() {
    this.status = 'completed';
    return this;
  };

  // Instance method to start task
  Task.prototype.startTask = function() {
    this.status = 'in-progress';
    return this;
  };

  // Instance method to check if overdue
  Task.prototype.isOverdue = function() {
    if (!this.dueDate) return false;
    return new Date(this.dueDate) < new Date() && this.status !== 'completed';
  };

  // Instance method to get priority score
  Task.prototype.getPriorityScore = function() {
    const priorityScores = { low: 1, medium: 2, high: 3 };
    return priorityScores[this.priority] || 2;
  };

  return Task;
}; 