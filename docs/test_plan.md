# Test Plan Documentation

## Overview
This document outlines the comprehensive testing strategy for the CRM system, including API tests, frontend component tests, integration tests, and end-to-end testing scenarios.

## Testing Strategy

### Test Types
1. **Unit Tests**: Individual functions and components
2. **Integration Tests**: API endpoints and database operations
3. **Frontend Tests**: React components and user interactions
4. **E2E Tests**: Complete user workflows
5. **Security Tests**: Authentication and authorization
6. **Performance Tests**: Load testing and optimization

---

## Backend API Testing

### Test Environment Setup
```javascript
// test/setup.js
const request = require('supertest');
const app = require('../app');
const { sequelize } = require('../models');

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

beforeEach(async () => {
  await sequelize.truncate({ cascade: true });
});
```

### Authentication Tests

#### Test: User Registration
```javascript
describe('POST /api/auth/register', () => {
  test('should register a new user successfully', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'user'
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user).toHaveProperty('id');
    expect(response.body.data.user.email).toBe('test@example.com');
    expect(response.body.data).toHaveProperty('token');
  });

  test('should fail with invalid email', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'invalid-email',
        password: 'password123'
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  test('should fail with duplicate email', async () => {
    // First registration
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });

    // Duplicate registration
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Another User',
        email: 'test@example.com',
        password: 'password123'
      });

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
    expect(response.body.code).toBe('DUPLICATE_ENTRY');
  });
});
```

#### Test: User Login
```javascript
describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
  });

  test('should login successfully with valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('token');
    expect(response.body.data.user.email).toBe('test@example.com');
  });

  test('should fail with invalid password', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'wrongpassword'
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.code).toBe('AUTHENTICATION_ERROR');
  });
});
```

### Customer Management Tests

#### Test: Create Customer
```javascript
describe('POST /api/customers', () => {
  let token;

  beforeEach(async () => {
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@crm.com',
        password: 'admin123'
      });
    token = loginResponse.body.data.token;
  });

  test('should create customer successfully', async () => {
    const response = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Acme Corporation',
        email: 'contact@acme.com',
        phone: '+1-555-0123',
        company: 'Acme Corp',
        tags: ['Enterprise', 'Technology'],
        notes: 'Initial contact made'
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.customer.name).toBe('Acme Corporation');
    expect(response.body.data.customer.tags).toContain('Enterprise');
  });

  test('should fail without authentication', async () => {
    const response = await request(app)
      .post('/api/customers')
      .send({
        name: 'Acme Corporation',
        email: 'contact@acme.com'
      });

    expect(response.status).toBe(401);
    expect(response.body.code).toBe('AUTHENTICATION_ERROR');
  });
});
```

#### Test: Get Customers with Pagination
```javascript
describe('GET /api/customers', () => {
  let token;

  beforeEach(async () => {
    // Login and create test customers
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@crm.com',
        password: 'admin123'
      });
    token = loginResponse.body.data.token;

    // Create multiple customers
    for (let i = 1; i <= 15; i++) {
      await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: `Customer ${i}`,
          email: `customer${i}@example.com`,
          company: `Company ${i}`
        });
    }
  });

  test('should return paginated customers', async () => {
    const response = await request(app)
      .get('/api/customers?page=1&limit=10')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.customers).toHaveLength(10);
    expect(response.body.data.pagination.page).toBe(1);
    expect(response.body.data.pagination.total).toBe(15);
    expect(response.body.data.pagination.pages).toBe(2);
  });

  test('should filter customers by search term', async () => {
    const response = await request(app)
      .get('/api/customers?search=Customer 1')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.customers).toHaveLength(1);
    expect(response.body.data.customers[0].name).toBe('Customer 1');
  });
});
```

### Pipeline Management Tests

#### Test: Lead Stage Updates
```javascript
describe('PUT /api/leads/:id/stage', () => {
  let token, leadId;

  beforeEach(async () => {
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@crm.com',
        password: 'admin123'
      });
    token = loginResponse.body.data.token;

    // Create a test lead
    const leadResponse = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Test Lead',
        description: 'Test description',
        stage: 'lead',
        value: 10000,
        customerId: 1
      });
    leadId = leadResponse.body.data.lead.id;
  });

  test('should update lead stage successfully', async () => {
    const response = await request(app)
      .put(`/api/leads/${leadId}/stage`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        stage: 'qualified'
      });

    expect(response.status).toBe(200);
    expect(response.body.data.lead.stage).toBe('qualified');
  });

  test('should fail with invalid stage', async () => {
    const response = await request(app)
      .put(`/api/leads/${leadId}/stage`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        stage: 'invalid-stage'
      });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });
});
```

### Task Management Tests

#### Test: Create and Update Tasks
```javascript
describe('Task Management', () => {
  let token;

  beforeEach(async () => {
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@crm.com',
        password: 'admin123'
      });
    token = loginResponse.body.data.token;
  });

  test('should create task successfully', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Follow up with client',
        description: 'Schedule meeting',
        priority: 'high',
        dueDate: '2024-01-15',
        assignedTo: 1,
        customerId: 1
      });

    expect(response.status).toBe(201);
    expect(response.body.data.task.title).toBe('Follow up with client');
    expect(response.body.data.task.priority).toBe('high');
  });

  test('should update task status', async () => {
    // Create task first
    const createResponse = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Test Task',
        description: 'Test description',
        priority: 'medium',
        assignedTo: 1,
        customerId: 1
      });

    const taskId = createResponse.body.data.task.id;

    // Update status
    const updateResponse = await request(app)
      .put(`/api/tasks/${taskId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'completed'
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.task.status).toBe('completed');
  });
});
```

---

## Frontend Component Testing

### Test Setup
```javascript
// test/setup.js
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider } from '../contexts/AuthContext';

const AllTheProviders = ({ children }) => {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
};

const customRender = (ui, options) =>
  render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

### Authentication Component Tests

#### Test: Login Form
```javascript
import { render, screen, fireEvent, waitFor } from '../test/setup';
import LoginForm from '../components/LoginForm';

describe('LoginForm', () => {
  test('should render login form', () => {
    render(<LoginForm />);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  test('should handle form submission', async () => {
    const mockOnLogin = jest.fn();
    render(<LoginForm onLogin={mockOnLogin} />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(mockOnLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });
  });

  test('should show validation errors', async () => {
    render(<LoginForm />);

    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });
});
```

### Customer Management Component Tests

#### Test: Customer List
```javascript
import { render, screen, fireEvent } from '../test/setup';
import CustomerList from '../components/CustomerList';

const mockCustomers = [
  {
    id: 1,
    name: 'Acme Corporation',
    email: 'contact@acme.com',
    company: 'Acme Corp',
    tags: ['Enterprise', 'Technology']
  },
  {
    id: 2,
    name: 'TechStart Inc',
    email: 'hello@techstart.com',
    company: 'TechStart',
    tags: ['Startup']
  }
];

describe('CustomerList', () => {
  test('should render customer list', () => {
    render(<CustomerList customers={mockCustomers} />);
    
    expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
    expect(screen.getByText('TechStart Inc')).toBeInTheDocument();
    expect(screen.getByText('contact@acme.com')).toBeInTheDocument();
  });

  test('should handle search filtering', () => {
    render(<CustomerList customers={mockCustomers} />);
    
    const searchInput = screen.getByPlaceholderText(/search customers/i);
    fireEvent.change(searchInput, { target: { value: 'Acme' } });

    expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
    expect(screen.queryByText('TechStart Inc')).not.toBeInTheDocument();
  });

  test('should handle customer selection', () => {
    const mockOnSelect = jest.fn();
    render(<CustomerList customers={mockCustomers} onSelect={mockOnSelect} />);
    
    fireEvent.click(screen.getByText('Acme Corporation'));
    
    expect(mockOnSelect).toHaveBeenCalledWith(mockCustomers[0]);
  });
});
```

### Pipeline Component Tests

#### Test: Kanban Board
```javascript
import { render, screen, fireEvent } from '../test/setup';
import KanbanBoard from '../components/KanbanBoard';

const mockLeads = {
  lead: [
    { id: 1, title: 'New Lead', value: 10000 }
  ],
  qualified: [
    { id: 2, title: 'Qualified Lead', value: 25000 }
  ],
  proposal: [
    { id: 3, title: 'Proposal Sent', value: 50000 }
  ],
  closed: [
    { id: 4, title: 'Deal Closed', value: 75000 }
  ]
};

describe('KanbanBoard', () => {
  test('should render all pipeline stages', () => {
    render(<KanbanBoard leads={mockLeads} />);
    
    expect(screen.getByText('Lead')).toBeInTheDocument();
    expect(screen.getByText('Qualified')).toBeInTheDocument();
    expect(screen.getByText('Proposal')).toBeInTheDocument();
    expect(screen.getByText('Closed')).toBeInTheDocument();
  });

  test('should display leads in correct stages', () => {
    render(<KanbanBoard leads={mockLeads} />);
    
    expect(screen.getByText('New Lead')).toBeInTheDocument();
    expect(screen.getByText('Qualified Lead')).toBeInTheDocument();
    expect(screen.getByText('Proposal Sent')).toBeInTheDocument();
    expect(screen.getByText('Deal Closed')).toBeInTheDocument();
  });

  test('should handle drag and drop', () => {
    const mockOnStageChange = jest.fn();
    render(<KanbanBoard leads={mockLeads} onStageChange={mockOnStageChange} />);
    
    // Simulate drag and drop
    const leadCard = screen.getByText('New Lead').closest('[data-testid="lead-card"]');
    const qualifiedColumn = screen.getByText('Qualified').closest('[data-testid="stage-column"]');
    
    fireEvent.dragStart(leadCard);
    fireEvent.drop(qualifiedColumn);
    
    expect(mockOnStageChange).toHaveBeenCalledWith(1, 'qualified');
  });
});
```

---

## Integration Tests

### Test: Complete Customer Workflow
```javascript
describe('Customer Workflow Integration', () => {
  let token;

  beforeEach(async () => {
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@crm.com',
        password: 'admin123'
      });
    token = loginResponse.body.data.token;
  });

  test('should complete full customer lifecycle', async () => {
    // 1. Create customer
    const customerResponse = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Customer',
        email: 'test@customer.com',
        company: 'Test Corp',
        tags: ['Test']
      });

    expect(customerResponse.status).toBe(201);
    const customerId = customerResponse.body.data.customer.id;

    // 2. Create lead for customer
    const leadResponse = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Test Lead',
        description: 'Test lead description',
        stage: 'lead',
        value: 15000,
        customerId: customerId
      });

    expect(leadResponse.status).toBe(201);
    const leadId = leadResponse.body.data.lead.id;

    // 3. Add interaction
    const interactionResponse = await request(app)
      .post(`/api/customers/${customerId}/interactions`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'call',
        notes: 'Initial contact made'
      });

    expect(interactionResponse.status).toBe(201);

    // 4. Create task
    const taskResponse = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Follow up with Test Customer',
        description: 'Schedule meeting',
        priority: 'high',
        dueDate: '2024-01-15',
        customerId: customerId
      });

    expect(taskResponse.status).toBe(201);

    // 5. Update lead stage
    const stageResponse = await request(app)
      .put(`/api/leads/${leadId}/stage`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        stage: 'qualified'
      });

    expect(stageResponse.status).toBe(200);

    // 6. Verify customer has all related data
    const customerDetailsResponse = await request(app)
      .get(`/api/customers/${customerId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(customerDetailsResponse.status).toBe(200);
    expect(customerDetailsResponse.body.data.customer.interactions).toHaveLength(1);
  });
});
```

---

## Security Tests

### Test: Authentication and Authorization
```javascript
describe('Security Tests', () => {
  test('should reject requests without token', async () => {
    const response = await request(app)
      .get('/api/customers');

    expect(response.status).toBe(401);
    expect(response.body.code).toBe('AUTHENTICATION_ERROR');
  });

  test('should reject requests with invalid token', async () => {
    const response = await request(app)
      .get('/api/customers')
      .set('Authorization', 'Bearer invalid-token');

    expect(response.status).toBe(401);
    expect(response.body.code).toBe('AUTHENTICATION_ERROR');
  });

  test('should enforce role-based access', async () => {
    // Login as regular user
    const userLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@crm.com',
        password: 'user123'
      });
    const userToken = userLoginResponse.body.data.token;

    // Try to access admin-only endpoint
    const response = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(403);
    expect(response.body.code).toBe('AUTHORIZATION_ERROR');
  });

  test('should prevent SQL injection', async () => {
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@crm.com',
        password: 'admin123'
      });
    const token = loginResponse.body.data.token;

    const response = await request(app)
      .get('/api/customers?search=1%27%20OR%20%271%27%3D%271')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    // Should not return all customers due to SQL injection
    expect(response.body.data.customers).toHaveLength(0);
  });
});
```

---

## Performance Tests

### Test: API Response Times
```javascript
describe('Performance Tests', () => {
  test('should respond within acceptable time limits', async () => {
    const startTime = Date.now();
    
    const response = await request(app)
      .get('/api/customers')
      .set('Authorization', `Bearer ${token}`);

    const responseTime = Date.now() - startTime;
    
    expect(response.status).toBe(200);
    expect(responseTime).toBeLessThan(1000); // 1 second
  });

  test('should handle concurrent requests', async () => {
    const concurrentRequests = 10;
    const promises = [];

    for (let i = 0; i < concurrentRequests; i++) {
      promises.push(
        request(app)
          .get('/api/customers')
          .set('Authorization', `Bearer ${token}`)
      );
    }

    const responses = await Promise.all(promises);
    
    responses.forEach(response => {
      expect(response.status).toBe(200);
    });
  });
});
```

---

## Test Execution

### Running Tests
```bash
# Backend tests
cd crm-backend
npm test

# Frontend tests
cd crm-frontend
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --testPathPattern=customer.test.js

# Run tests in watch mode
npm test -- --watch
```

### Test Coverage Goals
- **Backend**: 90%+ coverage
- **Frontend**: 80%+ coverage
- **Integration**: 100% of critical paths
- **Security**: 100% of authentication/authorization flows

### Continuous Integration
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: |
          cd crm-backend && npm install
          cd ../crm-frontend && npm install
      - name: Run backend tests
        run: cd crm-backend && npm test
      - name: Run frontend tests
        run: cd crm-frontend && npm test
```

---

## Expected Test Results

### API Test Results
- ✅ All authentication endpoints working
- ✅ CRUD operations for all entities
- ✅ Proper error handling and validation
- ✅ Role-based access control
- ✅ Pagination and filtering
- ✅ Real-time updates via WebSocket

### Frontend Test Results
- ✅ All components rendering correctly
- ✅ Form validation working
- ✅ State management functioning
- ✅ API integration successful
- ✅ Responsive design working
- ✅ Error boundaries catching errors

### Integration Test Results
- ✅ Complete user workflows working
- ✅ Data consistency maintained
- ✅ Performance within acceptable limits
- ✅ Security measures effective

This comprehensive test plan ensures the CRM system is robust, secure, and performs well under various conditions. 