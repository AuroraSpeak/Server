# AuraSpeak Server Documentation

## Overview
AuraSpeak is a modern web application based on Next.js that integrates various technologies for monitoring, logging, and database management.

## Documentation Structure

- [Architecture](architecture.md) - System architecture and components
- [Development](development.md) - Development guidelines and setup
- [Deployment](deployment.md) - Deployment process and configuration
- [Monitoring](monitoring.md) - Monitoring and logging system
- [Database](database.md) - Database management and migrations
- [API](api.md) - API documentation and endpoints

## Technology Stack

- **Frontend**: Next.js 15.1.0 with React 19
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL 16
- **Caching**: Redis 6
- **Monitoring**: 
  - Prometheus
  - Grafana
  - Loki
- **Error Tracking**: Glitchtip
- **Database Management**: pgAdmin
- **Container**: Docker & Docker Compose

## Quick Start

1. Clone repository
2. Configure environment variables (`.env` file)
3. Start Docker Compose:
   ```bash
   docker-compose up -d
   ```
4. Start development server:
   ```bash
   pnpm dev
   ```

## Ports

- Next.js App: 3000
- PostgreSQL: 5432
- pgAdmin: 5050
- Glitchtip: 8000
- Prometheus: 9090
- Grafana: 4000
- Loki: 3100 