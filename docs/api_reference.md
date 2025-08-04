# API Reference Documentation

## Base URL
```
Development: http://localhost:5000/api
Production: https://your-backend-url.com/api
```

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Response Format
All API responses follow this standard format:
```json
{
  "success": true,
  "data": {},
  "message": "Operation successful"
}
```

Error responses:
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

---

## Authentication Endpoints

### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "User registered successfully"
}
```

### POST /auth/login
Authenticate user and get JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
}
```

### GET /auth/me
Get current user profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

## Customer Endpoints

### GET /customers
Get all customers with pagination and filtering.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `search` (string): Search by name, email, or company
- `tags` (string): Filter by tags (comma-separated)

**Response:**
```json
{
  "success": true,
  "data": {
    "customers": [
      {
        "id": 1,
        "name": "Acme Corporation",
        "email": "contact@acme.com",
        "phone": "+1-555-0123",
        "company": "Acme Corp",
        "tags": ["Enterprise", "Technology"],
        "notes": "Initial contact made",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

### POST /customers
Create a new customer.

**Request Body:**
```json
{
  "name": "Acme Corporation",
  "email": "contact@acme.com",
  "phone": "+1-555-0123",
  "company": "Acme Corp",
  "tags": ["Enterprise", "Technology"],
  "notes": "Initial contact made"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "customer": {
      "id": 1,
      "name": "Acme Corporation",
      "email": "contact@acme.com",
      "phone": "+1-555-0123",
      "company": "Acme Corp",
      "tags": ["Enterprise", "Technology"],
      "notes": "Initial contact made",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  },
  "message": "Customer created successfully"
}
```

### GET /customers/:id
Get customer by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "customer": {
      "id": 1,
      "name": "Acme Corporation",
      "email": "contact@acme.com",
      "phone": "+1-555-0123",
      "company": "Acme Corp",
      "tags": ["Enterprise", "Technology"],
      "notes": "Initial contact made",
      "interactions": [
        {
          "id": 1,
          "type": "call",
          "notes": "Followed up on proposal",
          "date": "2024-01-01T00:00:00.000Z"
        }
      ],
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### PUT /customers/:id
Update customer.

**Request Body:**
```json
{
  "name": "Acme Corporation Updated",
  "email": "newcontact@acme.com",
  "phone": "+1-555-0124",
  "company": "Acme Corp",
  "tags": ["Enterprise", "Technology", "VIP"],
  "notes": "Updated contact information"
}
```

### DELETE /customers/:id
Delete customer.

**Response:**
```json
{
  "success": true,
  "message": "Customer deleted successfully"
}
```

---

## Lead/Pipeline Endpoints

### GET /leads
Get all leads with pipeline stages.

**Query Parameters:**
- `stage` (string): Filter by stage (lead, qualified, proposal, closed)
- `page` (number): Page number
- `limit` (number): Items per page

**Response:**
```json
{
  "success": true,
  "data": {
    "leads": [
      {
        "id": 1,
        "title": "Enterprise Software Deal",
        "description": "Large enterprise looking for CRM solution",
        "stage": "qualified",
        "value": 50000,
        "customerId": 1,
        "customer": {
          "name": "Acme Corporation",
          "email": "contact@acme.com"
        },
        "assignedTo": 1,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 15,
      "pages": 2
    }
  }
}
```

### POST /leads
Create a new lead.

**Request Body:**
```json
{
  "title": "Enterprise Software Deal",
  "description": "Large enterprise looking for CRM solution",
  "stage": "lead",
  "value": 50000,
  "customerId": 1,
  "assignedTo": 1
}
```

### PUT /leads/:id/stage
Update lead stage (for drag-and-drop).

**Request Body:**
```json
{
  "stage": "qualified"
}
```

### GET /leads/stats
Get pipeline statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "stages": {
      "lead": 5,
      "qualified": 3,
      "proposal": 2,
      "closed": 1
    },
    "totalValue": 250000,
    "conversionRate": 20
  }
}
```

---

## Task Endpoints

### GET /tasks
Get all tasks.

**Query Parameters:**
- `status` (string): Filter by status (pending, in-progress, completed)
- `priority` (string): Filter by priority (low, medium, high)
- `assignedTo` (number): Filter by assignee ID

**Response:**
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": 1,
        "title": "Follow up with Acme Corp",
        "description": "Schedule demo meeting",
        "status": "pending",
        "priority": "high",
        "dueDate": "2024-01-15T00:00:00.000Z",
        "assignedTo": 1,
        "customerId": 1,
        "customer": {
          "name": "Acme Corporation"
        },
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

### POST /tasks
Create a new task.

**Request Body:**
```json
{
  "title": "Follow up with Acme Corp",
  "description": "Schedule demo meeting",
  "status": "pending",
  "priority": "high",
  "dueDate": "2024-01-15T00:00:00.000Z",
  "assignedTo": 1,
  "customerId": 1
}
```

### PUT /tasks/:id/status
Update task status.

**Request Body:**
```json
{
  "status": "completed"
}
```

---

## Interaction Endpoints

### POST /customers/:id/interactions
Add interaction to customer.

**Request Body:**
```json
{
  "type": "call",
  "notes": "Followed up on proposal - client requested meeting",
  "date": "2024-01-01T00:00:00.000Z"
}
```

### GET /customers/:id/interactions
Get customer interactions.

**Response:**
```json
{
  "success": true,
  "data": {
    "interactions": [
      {
        "id": 1,
        "type": "call",
        "notes": "Followed up on proposal",
        "date": "2024-01-01T00:00:00.000Z",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

---

## Reports Endpoints

### GET /reports/dashboard
Get dashboard statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "customers": {
      "total": 25,
      "newThisMonth": 5
    },
    "leads": {
      "total": 15,
      "conversionRate": 20,
      "totalValue": 250000
    },
    "tasks": {
      "total": 30,
      "completed": 20,
      "pending": 10
    },
    "pipeline": {
      "lead": 5,
      "qualified": 3,
      "proposal": 2,
      "closed": 1
    }
  }
}
```

### GET /reports/conversion
Get conversion rate data.

**Query Parameters:**
- `period` (string): Time period (week, month, quarter, year)

**Response:**
```json
{
  "success": true,
  "data": {
    "conversionRates": [
      {
        "month": "2024-01",
        "rate": 20,
        "leads": 10,
        "closed": 2
      }
    ],
    "averageRate": 18.5
  }
}
```

---

## User Management Endpoints

### GET /users
Get all users (Admin only).

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "role": "admin",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

### PUT /users/:id
Update user (Admin only).

**Request Body:**
```json
{
  "name": "John Doe Updated",
  "role": "user"
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `AUTHENTICATION_ERROR` | Invalid or missing authentication |
| `AUTHORIZATION_ERROR` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `DUPLICATE_ENTRY` | Resource already exists |
| `DATABASE_ERROR` | Database operation failed |
| `RATE_LIMIT_EXCEEDED` | Too many requests |

---

## Rate Limiting

- **Authentication endpoints**: 5 requests per minute
- **Other endpoints**: 100 requests per minute per user

---

## WebSocket Events (Real-time Updates)

For real-time updates, the API supports WebSocket connections:

### Connection
```
ws://localhost:5000/ws
```

### Events

#### Lead Stage Update
```json
{
  "event": "lead:stage:updated",
  "data": {
    "leadId": 1,
    "oldStage": "lead",
    "newStage": "qualified"
  }
}
```

#### Task Status Update
```json
{
  "event": "task:status:updated",
  "data": {
    "taskId": 1,
    "oldStatus": "pending",
    "newStatus": "completed"
  }
}
```

#### New Interaction
```json
{
  "event": "interaction:created",
  "data": {
    "customerId": 1,
    "interaction": {
      "id": 1,
      "type": "call",
      "notes": "Followed up on proposal"
    }
  }
}
``` 