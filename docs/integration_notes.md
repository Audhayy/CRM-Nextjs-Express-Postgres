# Integration Notes - Frontend-Backend Communication

## Overview
This document outlines how the frontend (Next.js) and backend (Express.js) communicate, including API patterns, data flow, error handling, and real-time updates.

## Architecture Overview

### Communication Flow
```
Frontend (Next.js) ←→ API Layer ←→ Backend (Express.js) ←→ Database (PostgreSQL)
     ↑                    ↑                    ↑
  React Components    Axios Client        Sequelize ORM
  Context API         Interceptors        JWT Middleware
  State Management    Error Handling      Validation
```

### Technology Stack Integration
- **Frontend**: Next.js 14 with App Router, React 18, Context API
- **Backend**: Express.js with RESTful APIs, JWT authentication
- **Database**: PostgreSQL with Sequelize ORM
- **Communication**: Axios for HTTP requests, WebSocket for real-time updates
- **State Management**: React Context API + local state

---

## API Communication Patterns

### 1. HTTP Client Setup (Axios)

#### Frontend Configuration
```javascript
// lib/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

#### Backend CORS Configuration
```javascript
// backend/app.js
const cors = require('cors');

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### 2. Authentication Flow

#### Login Process
```javascript
// Frontend: Login component
const handleLogin = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials);
    const { token, user } = response.data.data;
    
    // Store token and user data
    localStorage.setItem('token', token);
    setUser(user);
    
    // Redirect to dashboard
    router.push('/dashboard');
  } catch (error) {
    setError(error.response?.data?.error || 'Login failed');
  }
};

// Backend: Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    const { error } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }
    
    // Find user and verify password
    const user = await User.findOne({ where: { email } });
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        code: 'AUTHENTICATION_ERROR'
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      data: {
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        token
      },
      message: 'Login successful'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'DATABASE_ERROR'
    });
  }
});
```

### 3. Data Fetching Patterns

#### Frontend: Custom Hooks
```javascript
// hooks/useApi.js
import { useState, useEffect } from 'react';
import api from '../lib/api';

export const useApi = (endpoint, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(endpoint, options);
      setData(response.data.data);
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [endpoint]);

  return { data, loading, error, refetch: fetchData };
};

// Usage in components
const CustomerList = () => {
  const { data: customers, loading, error, refetch } = useApi('/customers');
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <div>
      {customers?.map(customer => (
        <CustomerCard key={customer.id} customer={customer} />
      ))}
    </div>
  );
};
```

#### Backend: Standardized Response Format
```javascript
// middleware/responseHandler.js
const successResponse = (res, data, message = 'Success', status = 200) => {
  res.status(status).json({
    success: true,
    data,
    message
  });
};

const errorResponse = (res, error, code = 'ERROR', status = 500) => {
  res.status(status).json({
    success: false,
    error: error.message || error,
    code
  });
};

// Usage in controllers
const getCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, tags } = req.query;
    
    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { company: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    const customers = await Customer.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']]
    });
    
    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit),
      total: customers.count,
      pages: Math.ceil(customers.count / limit)
    };
    
    successResponse(res, {
      customers: customers.rows,
      pagination
    });
  } catch (error) {
    errorResponse(res, error, 'DATABASE_ERROR');
  }
};
```

### 4. Real-time Updates (WebSocket)

#### Frontend: WebSocket Integration
```javascript
// hooks/useWebSocket.js
import { useEffect, useRef } from 'react';

export const useWebSocket = (url, onMessage) => {
  const ws = useRef(null);

  useEffect(() => {
    ws.current = new WebSocket(url);
    
    ws.current.onopen = () => {
      console.log('WebSocket connected');
    };
    
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    };
    
    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.current.onclose = () => {
      console.log('WebSocket disconnected');
    };
    
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [url, onMessage]);

  return ws.current;
};

// Usage in pipeline component
const Pipeline = () => {
  const [leads, setLeads] = useState({});
  
  const handleWebSocketMessage = (data) => {
    switch (data.event) {
      case 'lead:stage:updated':
        setLeads(prev => ({
          ...prev,
          [data.data.oldStage]: prev[data.data.oldStage].filter(l => l.id !== data.data.leadId),
          [data.data.newStage]: [...prev[data.data.newStage], data.data.lead]
        }));
        break;
      // Handle other events...
    }
  };
  
  useWebSocket('ws://localhost:5000/ws', handleWebSocketMessage);
  
  // Component JSX...
};
```

#### Backend: WebSocket Server
```javascript
// websocket/websocket.js
const WebSocket = require('ws');

const setupWebSocket = (server) => {
  const wss = new WebSocket.Server({ server });
  
  wss.on('connection', (ws) => {
    console.log('Client connected');
    
    ws.on('message', (message) => {
      const data = JSON.parse(message);
      // Handle incoming messages
    });
    
    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });
  
  // Broadcast to all connected clients
  const broadcast = (event, data) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ event, data }));
      }
    });
  };
  
  return { wss, broadcast };
};

// Usage in lead controller
const updateLeadStage = async (req, res) => {
  try {
    const { id } = req.params;
    const { stage } = req.body;
    
    const lead = await Lead.findByPk(id);
    if (!lead) {
      return errorResponse(res, 'Lead not found', 'NOT_FOUND', 404);
    }
    
    const oldStage = lead.stage;
    lead.stage = stage;
    await lead.save();
    
    // Broadcast real-time update
    req.app.locals.broadcast('lead:stage:updated', {
      leadId: id,
      oldStage,
      newStage: stage,
      lead
    });
    
    successResponse(res, { lead });
  } catch (error) {
    errorResponse(res, error, 'DATABASE_ERROR');
  }
};
```

---

## State Management Integration

### 1. Context API Setup

#### Authentication Context
```javascript
// contexts/AuthContext.js
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await api.get('/auth/me');
          setUser(response.data.data.user);
        } catch (error) {
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    
    initAuth();
  }, []);

  const login = async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    const { token, user } = response.data.data;
    localStorage.setItem('token', token);
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

#### Data Context
```javascript
// contexts/DataContext.js
import { createContext, useContext, useState } from 'react';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [customers, setCustomers] = useState([]);
  const [leads, setLeads] = useState({});
  const [tasks, setTasks] = useState([]);

  const updateCustomer = (updatedCustomer) => {
    setCustomers(prev => 
      prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c)
    );
  };

  const addCustomer = (newCustomer) => {
    setCustomers(prev => [...prev, newCustomer]);
  };

  const updateLeadStage = (leadId, oldStage, newStage, lead) => {
    setLeads(prev => ({
      ...prev,
      [oldStage]: prev[oldStage].filter(l => l.id !== leadId),
      [newStage]: [...prev[newStage], lead]
    }));
  };

  const value = {
    customers,
    leads,
    tasks,
    updateCustomer,
    addCustomer,
    updateLeadStage,
    setCustomers,
    setLeads,
    setTasks
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
};
```

### 2. Optimistic Updates

#### Frontend: Optimistic UI Updates
```javascript
// components/CustomerForm.js
const CustomerForm = ({ customer, onSave }) => {
  const { updateCustomer, addCustomer } = useData();
  const [formData, setFormData] = useState(customer || {});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (customer?.id) {
        // Update existing customer
        const response = await api.put(`/customers/${customer.id}`, formData);
        updateCustomer(response.data.data.customer);
      } else {
        // Create new customer
        const response = await api.post('/customers', formData);
        addCustomer(response.data.data.customer);
      }
      
      onSave();
    } catch (error) {
      // Revert optimistic update on error
      if (customer?.id) {
        updateCustomer(customer);
      }
      setError(error.response?.data?.error || 'Failed to save customer');
    } finally {
      setLoading(false);
    }
  };

  // Component JSX...
};
```

---

## Error Handling Integration

### 1. Frontend Error Handling

#### Global Error Boundary
```javascript
// components/ErrorBoundary.js
import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>Please refresh the page or contact support.</p>
          <button onClick={() => window.location.reload()}>
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

#### API Error Handling
```javascript
// lib/errorHandler.js
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return `Validation error: ${data.error}`;
      case 401:
        return 'Authentication required. Please log in.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 429:
        return 'Too many requests. Please try again later.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return data.error || 'An unexpected error occurred.';
    }
  } else if (error.request) {
    // Network error
    return 'Network error. Please check your connection.';
  } else {
    // Other error
    return error.message || 'An unexpected error occurred.';
  }
};
```

### 2. Backend Error Handling

#### Global Error Middleware
```javascript
// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      error: err.errors[0].message,
      code: 'VALIDATION_ERROR'
    });
  }

  // Sequelize unique constraint errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      error: 'Resource already exists',
      code: 'DUPLICATE_ENTRY'
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
      code: 'AUTHENTICATION_ERROR'
    });
  }

  // Default error
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    code: 'DATABASE_ERROR'
  });
};

module.exports = errorHandler;
```

---

## Performance Optimization

### 1. Frontend Optimizations

#### React.memo for Components
```javascript
// components/CustomerCard.js
import { memo } from 'react';

const CustomerCard = memo(({ customer, onSelect }) => {
  return (
    <div className="customer-card" onClick={() => onSelect(customer)}>
      <h3>{customer.name}</h3>
      <p>{customer.email}</p>
      <div className="tags">
        {customer.tags.map(tag => (
          <span key={tag} className="tag">{tag}</span>
        ))}
      </div>
    </div>
  );
});

CustomerCard.displayName = 'CustomerCard';
```

#### Lazy Loading
```javascript
// pages/dashboard.js
import { lazy, Suspense } from 'react';

const CustomerList = lazy(() => import('../components/CustomerList'));
const Pipeline = lazy(() => import('../components/Pipeline'));
const Reports = lazy(() => import('../components/Reports'));

const Dashboard = () => {
  return (
    <div className="dashboard">
      <Suspense fallback={<LoadingSpinner />}>
        <CustomerList />
      </Suspense>
      <Suspense fallback={<LoadingSpinner />}>
        <Pipeline />
      </Suspense>
      <Suspense fallback={<LoadingSpinner />}>
        <Reports />
      </Suspense>
    </div>
  );
};
```

### 2. Backend Optimizations

#### Database Query Optimization
```javascript
// controllers/customerController.js
const getCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, tags } = req.query;
    
    const include = [
      {
        model: Interaction,
        as: 'interactions',
        attributes: ['id', 'type', 'date'],
        limit: 5,
        order: [['date', 'DESC']]
      }
    ];
    
    const customers = await Customer.findAndCountAll({
      include,
      where: buildWhereClause(search, tags),
      limit: parseInt(limit),
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']],
      distinct: true
    });
    
    successResponse(res, {
      customers: customers.rows,
      pagination: buildPagination(customers.count, page, limit)
    });
  } catch (error) {
    errorResponse(res, error, 'DATABASE_ERROR');
  }
};
```

#### Caching Strategy
```javascript
// middleware/cache.js
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes

const cacheMiddleware = (duration = 300) => {
  return (req, res, next) => {
    const key = `__express__${req.originalUrl}`;
    const cachedResponse = cache.get(key);
    
    if (cachedResponse) {
      res.send(cachedResponse);
      return;
    }
    
    res.sendResponse = res.send;
    res.send = (body) => {
      cache.set(key, body, duration);
      res.sendResponse(body);
    };
    next();
  };
};

// Usage
app.get('/api/reports/dashboard', cacheMiddleware(60), getDashboardStats);
```

---

## Security Integration

### 1. Authentication Middleware
```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token required',
      code: 'AUTHENTICATION_ERROR'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
        code: 'AUTHENTICATION_ERROR'
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
      code: 'AUTHENTICATION_ERROR'
    });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTHENTICATION_ERROR'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 'AUTHORIZATION_ERROR'
      });
    }
    
    next();
  };
};

module.exports = { authenticateToken, requireRole };
```

### 2. Input Validation
```javascript
// middleware/validation.js
const Joi = require('joi');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }
    
    next();
  };
};

// Validation schemas
const customerSchema = Joi.object({
  name: Joi.string().required().min(2).max(255),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/),
  company: Joi.string().max(255),
  tags: Joi.array().items(Joi.string()),
  notes: Joi.string().max(1000)
});

module.exports = { validate, customerSchema };
```

---

## Deployment Integration

### 1. Environment Configuration
```javascript
// Frontend: next.config.js
module.exports = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
      },
    ];
  },
};

// Backend: config/database.js
module.exports = {
  development: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    logging: false
  },
  production: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
};
```

### 2. Health Checks
```javascript
// Backend: routes/health.js
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    await sequelize.authenticate();
    
    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: 'connected'
      }
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: 'Service unhealthy',
      data: {
        status: 'unhealthy',
        database: 'disconnected'
      }
    });
  }
});
```

This integration approach ensures seamless communication between frontend and backend while maintaining security, performance, and reliability. 