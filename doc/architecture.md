# System Architecture

## Overview
The AuraSpeak application is based on a modern microservices architecture with Docker containers. The system is divided into various components, each serving specific functions.

## Core Components

### 1. Next.js Application
- Main application based on Next.js 15.1.0
- Server-Side Rendering (SSR) and API Routes
- TypeScript for type-safe development
- Tailwind CSS for styling
- Radix UI components for UI elements

### 2. Database
- PostgreSQL 16 as main database
- Prisma as ORM
- Automated migrations and seeds
- pgAdmin for database management

### 3. Caching
- Redis 6 for session management and caching
- Improved performance and scalability

### 4. Monitoring & Logging
- Prometheus for metrics collection
- Grafana for visualization
- Loki for log aggregation
- Glitchtip for error tracking

## Network Architecture

### Container Network
- All services are in the `voice-net` Docker network
- Isolated communication between containers
- Exposed ports for external access

### Service Dependencies
```
Next.js App
  ├── PostgreSQL
  ├── Redis
  └── Glitchtip

Prometheus
  └── Next.js App (Metrics)

Grafana
  └── Prometheus (Data Source)

Loki
  └── Next.js App (Logs)

pgAdmin
  └── PostgreSQL
```

## Security
- Environment variables for sensitive data
- Isolated container environment
- Separate networks for different service types
- JWT for authentication

## Scalability
- Horizontal scaling possible through container architecture
- Redis for distributed caching
- Prometheus for performance monitoring
- Grafana for resource monitoring 