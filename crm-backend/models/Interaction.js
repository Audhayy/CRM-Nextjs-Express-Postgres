const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Interaction = sequelize.define('Interaction', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'customers',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.ENUM('call', 'email', 'meeting', 'note'),
      allowNull: false
    },
    notes: {
      type: DataTypes.TEXT,
      validate: {
        len: [0, 2000]
      }
    },
    date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'interactions',
    indexes: [
      {
        fields: ['customer_id']
      },
      {
        fields: ['type']
      },
      {
        fields: ['date']
      },
      {
        fields: ['created_by']
      }
    ]
  });

  // Instance method to get formatted date
  Interaction.prototype.getFormattedDate = function() {
    return this.date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Instance method to get interaction summary
  Interaction.prototype.getSummary = function() {
    return `${this.type.charAt(0).toUpperCase() + this.type.slice(1)} - ${this.notes?.substring(0, 100)}${this.notes?.length > 100 ? '...' : ''}`;
  };

  return Interaction;
}; 