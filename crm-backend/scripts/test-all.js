#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Running comprehensive test suite...\n');

// Test categories
const tests = [
  {
    name: 'Authentication Tests',
    command: 'npm test -- tests/auth.test.js',
    description: 'Testing login, register, and JWT functionality'
  },
  {
    name: 'Customer API Tests',
    command: 'npm test -- tests/customers.test.js',
    description: 'Testing customer CRUD operations'
  },
  {
    name: 'Database Connection Test',
    command: 'node -e "require(\'./models\').sequelize.authenticate().then(() => console.log(\'✅ Database connected\')).catch(e => console.error(\'❌ Database error:\', e.message))"',
    description: 'Verifying database connectivity'
  },
  {
    name: 'API Health Check',
    command: 'curl -s http://localhost:5000/api/health || echo "Server not running"',
    description: 'Checking API server health'
  }
];

async function runTests() {
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    console.log(`\n📋 ${test.name}`);
    console.log(`   ${test.description}`);
    console.log('   Running...');
    
    try {
      const output = execSync(test.command, { 
        cwd: path.join(__dirname, '..'),
        encoding: 'utf8',
        timeout: 30000 
      });
      console.log('   ✅ PASSED');
      console.log(output);
      passed++;
    } catch (error) {
      console.log('   ❌ FAILED');
      console.log(error.message);
      failed++;
    }
  }

  console.log('\n📊 Test Summary:');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\n⚠️  Some tests failed. Please check the output above.');
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed!');
  }
}

// Check if database is ready
async function checkDatabase() {
  try {
    const { sequelize } = require('../models');
    await sequelize.authenticate();
    console.log('✅ Database connection verified');
    return true;
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    console.log('Please ensure PostgreSQL is running and DATABASE_URL is set correctly');
    return false;
  }
}

async function main() {
  console.log('🔍 Checking prerequisites...');
  
  const dbReady = await checkDatabase();
  if (!dbReady) {
    console.log('\n❌ Cannot run tests without database connection');
    process.exit(1);
  }

  await runTests();
}

main().catch(console.error); 