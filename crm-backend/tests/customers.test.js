const request = require('supertest');
const { sequelize } = require('../models');
const app = require('../server');

describe('Customer Endpoints', () => {
  let authToken;
  let testCustomerId;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    
    // Create a test user and get auth token
    const userResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'user'
      });
    
    authToken = userResponse.body.data.token;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await sequelize.truncate({ cascade: true });
    
    // Recreate test user
    const userResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'user'
      });
    
    authToken = userResponse.body.data.token;
  });

  describe('GET /api/customers', () => {
    test('should get all customers with pagination', async () => {
      // Create test customers
      await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Customer 1',
          email: 'customer1@test.com',
          company: 'Test Company 1'
        });

      await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Customer 2',
          email: 'customer2@test.com',
          company: 'Test Company 2'
        });

      const response = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.customers).toHaveLength(2);
      expect(response.body.data.pagination).toBeDefined();
    });

    test('should filter customers by search term', async () => {
      await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Apple Inc',
          email: 'contact@apple.com',
          company: 'Apple'
        });

      const response = await request(app)
        .get('/api/customers?search=Apple')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.customers).toHaveLength(1);
      expect(response.body.data.customers[0].name).toBe('Apple Inc');
    });
  });

  describe('POST /api/customers', () => {
    test('should create a new customer', async () => {
      const customerData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1-555-0123',
        company: 'Acme Corp',
        tags: ['Enterprise', 'Technology'],
        notes: 'Important client'
      };

      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(customerData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.customer.name).toBe(customerData.name);
      expect(response.body.data.customer.email).toBe(customerData.email);
      expect(response.body.data.customer.tags).toEqual(customerData.tags);
    });

    test('should fail with invalid data', async () => {
      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'invalid-email'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/customers/:id', () => {
    beforeEach(async () => {
      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Customer',
          email: 'test@customer.com'
        });
      
      testCustomerId = response.body.data.customer.id;
    });

    test('should get customer by ID', async () => {
      const response = await request(app)
        .get(`/api/customers/${testCustomerId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.customer.id).toBe(testCustomerId);
    });

    test('should return 404 for non-existent customer', async () => {
      const response = await request(app)
        .get('/api/customers/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/customers/:id', () => {
    beforeEach(async () => {
      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Customer',
          email: 'test@customer.com'
        });
      
      testCustomerId = response.body.data.customer.id;
    });

    test('should update customer', async () => {
      const updateData = {
        name: 'Updated Customer',
        email: 'updated@customer.com',
        company: 'Updated Company'
      };

      const response = await request(app)
        .put(`/api/customers/${testCustomerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.customer.name).toBe(updateData.name);
      expect(response.body.data.customer.email).toBe(updateData.email);
    });
  });

  describe('DELETE /api/customers/:id', () => {
    beforeEach(async () => {
      const response = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Customer',
          email: 'test@customer.com'
        });
      
      testCustomerId = response.body.data.customer.id;
    });

    test('should delete customer', async () => {
      const response = await request(app)
        .delete(`/api/customers/${testCustomerId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify customer is deleted
      const getResponse = await request(app)
        .get(`/api/customers/${testCustomerId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.status).toBe(404);
    });
  });

  describe('Authentication', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/customers');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/customers')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
}); 