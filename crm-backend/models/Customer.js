const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Customer = sequelize.define('Customer', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [2, 255]
      }
    },
    email: {
      type: DataTypes.STRING,
      validate: {
        isEmail: true
      }
    },
    phone: {
      type: DataTypes.STRING,
      validate: {
        len: [0, 50]
      }
    },
    company: {
      type: DataTypes.STRING,
      validate: {
        len: [0, 255]
      }
    },
    tags: {
      type: DataTypes.TEXT,
      defaultValue: '[]',
      get() {
        const rawValue = this.getDataValue('tags');
        return rawValue ? JSON.parse(rawValue) : [];
      },
      set(value) {
        this.setDataValue('tags', JSON.stringify(value));
      }
    },
    notes: {
      type: DataTypes.TEXT,
      validate: {
        len: [0, 1000]
      }
    }
  }, {
    tableName: 'customers',
    indexes: [
      {
        fields: ['email']
      },
      {
        fields: ['company']
      }
    ]
  });

  // Instance method to add tag
  Customer.prototype.addTag = function(tag) {
    if (!this.tags.includes(tag)) {
      this.tags = [...this.tags, tag];
    }
    return this;
  };

  // Instance method to remove tag
  Customer.prototype.removeTag = function(tag) {
    this.tags = this.tags.filter(t => t !== tag);
    return this;
  };

  // Instance method to check if has tag
  Customer.prototype.hasTag = function(tag) {
    return this.tags.includes(tag);
  };

  return Customer;
}; 