# API Documentation

## Overview
The API is based on Next.js API Routes and provides RESTful endpoints for the application.

## Authentication

### JWT Token
- Bearer Token Authentication
- Token Format: `Authorization: Bearer <token>`
- Token Expiration: 24 hours
- Refresh Token: 7 days

### Endpoints
```
POST /api/auth/login
POST /api/auth/register
POST /api/auth/refresh
POST /api/auth/logout
```

## User API

### Endpoints
```
GET    /api/users
GET    /api/users/:id
POST   /api/users
PUT    /api/users/:id
DELETE /api/users/:id
```

### Request/Response Examples

#### Create User
```typescript
POST /api/users
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe"
}
```

#### Update User
```typescript
PUT /api/users/:id
{
  "name": "John Updated",
  "email": "john@example.com"
}
```

## Profile API

### Endpoints
```
GET    /api/profile
PUT    /api/profile
POST   /api/profile/avatar
DELETE /api/profile/avatar
```

### Request/Response Examples

#### Update Profile
```typescript
PUT /api/profile
{
  "bio": "Software Developer",
  "location": "Berlin",
  "website": "https://example.com"
}
```

## Settings API

### Endpoints
```
GET    /api/settings
PUT    /api/settings
```

### Request/Response Examples

#### Update Settings
```typescript
PUT /api/settings
{
  "notifications": {
    "email": true,
    "push": false
  },
  "privacy": {
    "profileVisibility": "public",
    "activityVisibility": "friends"
  }
}
```

## Error Handling

### HTTP Status Codes
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error

### Error Format
```typescript
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": {}
  }
}
```

## Rate Limiting

### Limits
- 100 requests per minute per IP
- 1000 requests per hour per user
- 10000 requests per day per user

### Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1623456789
```

## Versioning

### API Version
- Current Version: v1
- URL Path Versioning: `/api/v1/...`
- Header Versioning: `Accept: application/vnd.auraspeak.v1+json`

## Security

### CORS
- Allowed Origins: Configurable
- Allowed Methods: GET, POST, PUT, DELETE
- Allowed Headers: Content-Type, Authorization
- Max Age: 86400 seconds

### Security Headers
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

## Monitoring

### Metrics
- Request Rate
- Response Time
- Error Rate
- Status Code Distribution

### Logging
- Request Logs
- Error Logs
- Access Logs
- Performance Logs 