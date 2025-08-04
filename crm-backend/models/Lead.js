const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Lead = sequelize.define('Lead', {
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
        len: [0, 2000]
      }
    },
    stage: {
      type: DataTypes.ENUM('lead', 'qualified', 'proposal', 'closed'),
      defaultValue: 'lead',
      allowNull: false
    },
    value: {
      type: DataTypes.DECIMAL(10, 2),
      validate: {
        min: 0
      }
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'customers',
        key: 'id'
      }
    },
    assigned_to: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'leads',
    indexes: [
      {
        fields: ['stage']
      },
      {
        fields: ['customer_id']
      },
      {
        fields: ['assigned_to']
      },
      {
        fields: ['value']
      }
    ]
  });

  // Instance method to move to next stage
  Lead.prototype.moveToNextStage = function() {
    const stages = ['lead', 'qualified', 'proposal', 'closed'];
    const currentIndex = stages.indexOf(this.stage);
    if (currentIndex < stages.length - 1) {
      this.stage = stages[currentIndex + 1];
    }
    return this;
  };

  // Instance method to move to previous stage
  Lead.prototype.moveToPreviousStage = function() {
    const stages = ['lead', 'qualified', 'proposal', 'closed'];
    const currentIndex = stages.indexOf(this.stage);
    if (currentIndex > 0) {
      this.stage = stages[currentIndex - 1];
    }
    return this;
  };

  // Instance method to check if lead is closed
  Lead.prototype.isClosed = function() {
    return this.stage === 'closed';
  };

  return Lead;
}; 