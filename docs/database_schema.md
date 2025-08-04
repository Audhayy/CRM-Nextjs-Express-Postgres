# Database Schema Documentation

## Overview
The CRM system uses PostgreSQL with Sequelize ORM. The database is designed with normalized tables and proper relationships to ensure data integrity and optimal performance.

## Database Tables

### 1. Users Table
Stores user authentication and profile information.

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- `idx_users_email` (email)
- `idx_users_role` (role)

**Sample Data:**
```sql
INSERT INTO users (name, email, password, role) VALUES
('Admin User', 'admin@crm.com', '$2b$10$...', 'admin'),
('Regular User', 'user@crm.com', '$2b$10$...', 'user');
```

### 2. Customers Table
Core entity for customer information and management.

```sql
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  company VARCHAR(255),
  tags TEXT[], -- Array of tags
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- `idx_customers_email` (email)
- `idx_customers_company` (company)
- `idx_customers_tags` USING GIN (tags)

**Sample Data:**
```sql
INSERT INTO customers (name, email, phone, company, tags, notes) VALUES
('Acme Corporation', 'contact@acme.com', '+1-555-0123', 'Acme Corp', ARRAY['Enterprise', 'Technology'], 'Initial contact made'),
('TechStart Inc', 'hello@techstart.com', '+1-555-0124', 'TechStart', ARRAY['Startup', 'Technology'], 'Interested in CRM solution');
```

### 3. Leads Table
Sales pipeline management with stages and values.

```sql
CREATE TABLE leads (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  stage ENUM('lead', 'qualified', 'proposal', 'closed') DEFAULT 'lead',
  value DECIMAL(10,2),
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- `idx_leads_stage` (stage)
- `idx_leads_customer_id` (customer_id)
- `idx_leads_assigned_to` (assigned_to)
- `idx_leads_value` (value)

**Sample Data:**
```sql
INSERT INTO leads (title, description, stage, value, customer_id, assigned_to) VALUES
('Enterprise Software Deal', 'Large enterprise looking for CRM solution', 'qualified', 50000.00, 1, 1),
('Startup CRM Implementation', 'Tech startup needs basic CRM setup', 'lead', 15000.00, 2, 2);
```

### 4. Tasks Table
Task management for follow-ups and reminders.

```sql
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('pending', 'in-progress', 'completed') DEFAULT 'pending',
  priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
  due_date DATE,
  assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- `idx_tasks_status` (status)
- `idx_tasks_priority` (priority)
- `idx_tasks_assigned_to` (assigned_to)
- `idx_tasks_customer_id` (customer_id)
- `idx_tasks_due_date` (due_date)

**Sample Data:**
```sql
INSERT INTO tasks (title, description, status, priority, due_date, assigned_to, customer_id) VALUES
('Follow up with Acme Corp', 'Schedule demo meeting for enterprise solution', 'pending', 'high', '2024-01-15', 1, 1),
('Send proposal to TechStart', 'Prepare and send detailed proposal', 'in-progress', 'medium', '2024-01-20', 2, 2);
```

### 5. Interactions Table
Contact history and communication logs.

```sql
CREATE TABLE interactions (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  type ENUM('call', 'email', 'meeting', 'note') NOT NULL,
  notes TEXT,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- `idx_interactions_customer_id` (customer_id)
- `idx_interactions_type` (type)
- `idx_interactions_date` (date)
- `idx_interactions_created_by` (created_by)

**Sample Data:**
```sql
INSERT INTO interactions (customer_id, type, notes, created_by) VALUES
(1, 'call', 'Followed up on proposal - client requested meeting', 1),
(2, 'email', 'Sent initial proposal and pricing', 2);
```

## Relationships

### One-to-Many Relationships
1. **User → Leads**: One user can be assigned to multiple leads
2. **User → Tasks**: One user can be assigned to multiple tasks
3. **User → Interactions**: One user can create multiple interactions
4. **Customer → Leads**: One customer can have multiple leads
5. **Customer → Tasks**: One customer can have multiple tasks
6. **Customer → Interactions**: One customer can have multiple interactions

### Foreign Key Constraints
```sql
-- Leads table
ALTER TABLE leads ADD CONSTRAINT fk_leads_customer 
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;

ALTER TABLE leads ADD CONSTRAINT fk_leads_assigned_to 
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL;

-- Tasks table
ALTER TABLE tasks ADD CONSTRAINT fk_tasks_assigned_to 
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE tasks ADD CONSTRAINT fk_tasks_customer 
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;

-- Interactions table
ALTER TABLE interactions ADD CONSTRAINT fk_interactions_customer 
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;

ALTER TABLE interactions ADD CONSTRAINT fk_interactions_created_by 
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
```

## Sequelize Models

### User Model
```javascript
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('admin', 'user'),
    defaultValue: 'user'
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['email'] },
    { fields: ['role'] }
  ]
});
```

### Customer Model
```javascript
const Customer = sequelize.define('Customer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    validate: {
      isEmail: true
    }
  },
  phone: DataTypes.STRING,
  company: DataTypes.STRING,
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  notes: DataTypes.TEXT
}, {
  timestamps: true,
  indexes: [
    { fields: ['email'] },
    { fields: ['company'] },
    { fields: ['tags'], using: 'GIN' }
  ]
});
```

### Lead Model
```javascript
const Lead = sequelize.define('Lead', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: DataTypes.TEXT,
  stage: {
    type: DataTypes.ENUM('lead', 'qualified', 'proposal', 'closed'),
    defaultValue: 'lead'
  },
  value: {
    type: DataTypes.DECIMAL(10, 2),
    validate: {
      min: 0
    }
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['stage'] },
    { fields: ['customerId'] },
    { fields: ['assignedTo'] },
    { fields: ['value'] }
  ]
});
```

## Database Migrations

### Initial Migration
```javascript
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create users table
    await queryInterface.createTable('Users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      role: {
        type: Sequelize.ENUM('admin', 'user'),
        defaultValue: 'user'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add indexes
    await queryInterface.addIndex('Users', ['email']);
    await queryInterface.addIndex('Users', ['role']);

    // Create other tables...
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Users');
    // Drop other tables...
  }
};
```

## Data Seeding

### Seed Data Structure
```javascript
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Seed users
    await queryInterface.bulkInsert('Users', [
      {
        name: 'Admin User',
        email: 'admin@crm.com',
        password: '$2b$10$...', // Hashed password
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Regular User',
        email: 'user@crm.com',
        password: '$2b$10$...', // Hashed password
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // Seed customers
    await queryInterface.bulkInsert('Customers', [
      {
        name: 'Acme Corporation',
        email: 'contact@acme.com',
        phone: '+1-555-0123',
        company: 'Acme Corp',
        tags: ['Enterprise', 'Technology'],
        notes: 'Initial contact made - interested in enterprise solution',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      // More customers...
    ]);

    // Seed leads, tasks, interactions...
  }
};
```

## Performance Optimizations

### Query Optimization
1. **Indexed Fields**: All frequently queried fields are indexed
2. **Composite Indexes**: For complex queries involving multiple fields
3. **GIN Indexes**: For array fields (tags) to enable efficient searching
4. **Foreign Key Indexes**: Automatically created for foreign key relationships

### Connection Pooling
```javascript
const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});
```

### Query Examples

#### Get Customers with Interactions
```sql
SELECT c.*, 
       COUNT(i.id) as interaction_count,
       MAX(i.date) as last_interaction
FROM customers c
LEFT JOIN interactions i ON c.id = i.customer_id
GROUP BY c.id
ORDER BY last_interaction DESC;
```

#### Get Pipeline Statistics
```sql
SELECT stage, 
       COUNT(*) as count,
       SUM(value) as total_value
FROM leads
GROUP BY stage
ORDER BY 
  CASE stage 
    WHEN 'lead' THEN 1
    WHEN 'qualified' THEN 2
    WHEN 'proposal' THEN 3
    WHEN 'closed' THEN 4
  END;
```

#### Get Tasks by Priority and Due Date
```sql
SELECT t.*, c.name as customer_name, u.name as assigned_to_name
FROM tasks t
JOIN customers c ON t.customer_id = c.id
LEFT JOIN users u ON t.assigned_to = u.id
WHERE t.status = 'pending'
  AND t.due_date <= CURRENT_DATE + INTERVAL '7 days'
ORDER BY 
  CASE t.priority
    WHEN 'high' THEN 1
    WHEN 'medium' THEN 2
    WHEN 'low' THEN 3
  END,
  t.due_date;
```

## Backup and Recovery

### Backup Strategy
```bash
# Daily backup
pg_dump -h localhost -U username -d crm_db > backup_$(date +%Y%m%d).sql

# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -h localhost -U username -d crm_db > /backups/crm_backup_$DATE.sql
```

### Recovery Process
```bash
# Restore from backup
psql -h localhost -U username -d crm_db < backup_20240101.sql
```

## Security Considerations

### Data Protection
1. **Password Hashing**: All passwords are hashed using bcrypt
2. **Input Validation**: All inputs are validated and sanitized
3. **SQL Injection Prevention**: Using parameterized queries with Sequelize
4. **Access Control**: Role-based access control at database level

### Audit Trail
```sql
-- Add audit columns to sensitive tables
ALTER TABLE customers ADD COLUMN created_by INTEGER REFERENCES users(id);
ALTER TABLE customers ADD COLUMN updated_by INTEGER REFERENCES users(id);
ALTER TABLE customers ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
```

This database schema provides a solid foundation for the CRM system with proper relationships, indexing, and security measures in place. 