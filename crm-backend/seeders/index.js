const bcrypt = require('bcryptjs');
const { User, Customer, Lead, Task, Interaction } = require('../models');

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await Interaction.destroy({ where: {} });
    await Task.destroy({ where: {} });
    await Lead.destroy({ where: {} });
    await Customer.destroy({ where: {} });
    await User.destroy({ where: {} });

    console.log('✅ Existing data cleared');

    // Create users
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@crm.com',
      password: 'admin123',
      role: 'admin'
    });

    const regularUser = await User.create({
      name: 'Regular User',
      email: 'user@crm.com',
      password: 'user123',
      role: 'user'
    });

    console.log('✅ Users created');

    // Create customers
    const customers = await Customer.bulkCreate([
      {
        name: 'Acme Corporation',
        email: 'contact@acme.com',
        phone: '+1-555-0123',
        company: 'Acme Corp',
        tags: ['Enterprise', 'Technology'],
        notes: 'Initial contact made - interested in enterprise solution'
      },
      {
        name: 'TechStart Inc',
        email: 'hello@techstart.com',
        phone: '+1-555-0124',
        company: 'TechStart',
        tags: ['Startup', 'Technology'],
        notes: 'Interested in CRM solution for their growing team'
      },
      {
        name: 'Global Solutions Ltd',
        email: 'info@globalsolutions.com',
        phone: '+1-555-0125',
        company: 'Global Solutions',
        tags: ['Enterprise', 'Consulting'],
        notes: 'Looking for comprehensive CRM solution'
      },
      {
        name: 'Innovation Labs',
        email: 'contact@innovationlabs.com',
        phone: '+1-555-0126',
        company: 'Innovation Labs',
        tags: ['Startup', 'Innovation'],
        notes: 'Early stage startup, needs basic CRM'
      },
      {
        name: 'MegaCorp Industries',
        email: 'procurement@megacorp.com',
        phone: '+1-555-0127',
        company: 'MegaCorp Industries',
        tags: ['Enterprise', 'Manufacturing'],
        notes: 'Large enterprise with complex requirements'
      }
    ]);

    console.log('✅ Customers created');

    // Create leads
    const leads = await Lead.bulkCreate([
      {
        title: 'Enterprise Software Deal',
        description: 'Large enterprise looking for comprehensive CRM solution with advanced features',
        stage: 'qualified',
        value: 50000.00,
        customer_id: customers[0].id,
        assigned_to: adminUser.id
      },
      {
        title: 'Startup CRM Implementation',
        description: 'Tech startup needs basic CRM setup for their growing sales team',
        stage: 'lead',
        value: 15000.00,
        customer_id: customers[1].id,
        assigned_to: regularUser.id
      },
      {
        title: 'Consulting Firm Solution',
        description: 'Global consulting firm requires CRM for client management',
        stage: 'proposal',
        value: 35000.00,
        customer_id: customers[2].id,
        assigned_to: adminUser.id
      },
      {
        title: 'Innovation Labs CRM',
        description: 'Early stage startup needs simple CRM solution',
        stage: 'lead',
        value: 8000.00,
        customer_id: customers[3].id,
        assigned_to: regularUser.id
      },
      {
        title: 'MegaCorp Enterprise Deal',
        description: 'Large manufacturing company needs enterprise CRM',
        stage: 'qualified',
        value: 75000.00,
        customer_id: customers[4].id,
        assigned_to: adminUser.id
      },
      {
        title: 'Acme Corp Expansion',
        description: 'Additional modules for existing Acme Corp implementation',
        stage: 'proposal',
        value: 25000.00,
        customer_id: customers[0].id,
        assigned_to: regularUser.id
      },
      {
        title: 'TechStart Upgrade',
        description: 'Upgrade from basic to premium CRM features',
        stage: 'lead',
        value: 12000.00,
        customer_id: customers[1].id,
        assigned_to: adminUser.id
      },
      {
        title: 'Global Solutions Training',
        description: 'Training and implementation services for Global Solutions',
        stage: 'closed',
        value: 18000.00,
        customer_id: customers[2].id,
        assigned_to: adminUser.id
      },
      {
        title: 'Innovation Labs Support',
        description: 'Ongoing support and maintenance contract',
        stage: 'lead',
        value: 5000.00,
        customer_id: customers[3].id,
        assigned_to: regularUser.id
      },
      {
        title: 'MegaCorp Integration',
        description: 'Integration with existing MegaCorp systems',
        stage: 'qualified',
        value: 30000.00,
        customer_id: customers[4].id,
        assigned_to: adminUser.id
      }
    ]);

    console.log('✅ Leads created');

    // Create tasks
    const tasks = await Task.bulkCreate([
      {
        title: 'Follow up with Acme Corp',
        description: 'Schedule demo meeting for enterprise solution',
        status: 'pending',
        priority: 'high',
        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        assigned_to: adminUser.id,
        customer_id: customers[0].id
      },
      {
        title: 'Send proposal to TechStart',
        description: 'Prepare and send detailed proposal for CRM implementation',
        status: 'in-progress',
        priority: 'medium',
        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        assigned_to: regularUser.id,
        customer_id: customers[1].id
      },
      {
        title: 'Review Global Solutions requirements',
        description: 'Analyze requirements and prepare technical specification',
        status: 'completed',
        priority: 'high',
        due_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        assigned_to: adminUser.id,
        customer_id: customers[2].id
      }
    ]);

    console.log('✅ Tasks created');

    // Create interactions
    const interactions = await Interaction.bulkCreate([
      {
        customer_id: customers[0].id,
        type: 'call',
        notes: 'Initial contact made - client showed interest in enterprise features',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        created_by: adminUser.id
      },
      {
        customer_id: customers[0].id,
        type: 'meeting',
        notes: 'Demo meeting scheduled for next week',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        created_by: adminUser.id
      },
      {
        customer_id: customers[1].id,
        type: 'email',
        notes: 'Sent initial proposal and pricing information',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        created_by: regularUser.id
      },
      {
        customer_id: customers[2].id,
        type: 'call',
        notes: 'Requirements gathering call completed',
        date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        created_by: adminUser.id
      },
      {
        customer_id: customers[3].id,
        type: 'note',
        notes: 'Client requested basic CRM features only',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        created_by: regularUser.id
      }
    ]);

    console.log('✅ Interactions created');

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Sample Data Summary:');
    console.log(`- Users: ${await User.count()}`);
    console.log(`- Customers: ${await Customer.count()}`);
    console.log(`- Leads: ${await Lead.count()}`);
    console.log(`- Tasks: ${await Task.count()}`);
    console.log(`- Interactions: ${await Interaction.count()}`);

    console.log('\n🔐 Test Credentials:');
    console.log('Admin: admin@crm.com / admin123');
    console.log('User: user@crm.com / user123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
};

// Run seeder if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('✅ Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = seedDatabase; 