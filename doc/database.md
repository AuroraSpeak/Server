# Database Documentation

## Overview
The application uses PostgreSQL as the main database with Prisma as the ORM. Database management is handled through pgAdmin.

## Database Configuration

### PostgreSQL
- Version: 16 (Alpine)
- Port: 5432
- Database Name: Configurable via environment variables
- User: Configurable via environment variables

### Prisma
- ORM for TypeScript
- Schema definition in `prisma/schema.prisma`
- Migrations in `prisma/migrations`
- Client generation: `prisma generate`

## Database Operations

### Migrations
```bash
# Create new migration
pnpm prisma:migrate

# Reset migration
pnpm prisma:reset

# Push schema changes
pnpm prisma:dbpush
```

### Seeding
```bash
# Insert seed data
pnpm prisma:seed
```

### Database Studio
```bash
# Start Prisma Studio
pnpm prisma:studio
```

## Backup & Recovery

### Automatic Backups
- Daily backups
- Weekly backups
- Monthly backups

### Backup Restoration
```bash
# Create backup
pg_dump -U $POSTGRES_USER $POSTGRES_DB > backup.sql

# Restore backup
psql -U $POSTGRES_USER $POSTGRES_DB < backup.sql
```

## Performance Optimization

### Indexing
- Primary keys
- Foreign keys
- Frequently queried fields
- Full-text search

### Query Optimization
- Prepared statements
- Connection pooling
- Query caching
- Materialized views

## Security

### Access Rights
- User roles
- Schema permissions
- Row level security
- Audit logging

### Encryption
- SSL/TLS
- Data encryption
- Password hashing
- Sensitive data

## Monitoring

### Metrics
- Query performance
- Connection pool
- Cache hit rate
- Dead locks
- Table sizes

### Alerts
- High CPU usage
- Slow queries
- Connection issues
- Disk space

## Maintenance

### VACUUM
- Automatic VACUUM
- Manual VACUUM
- VACUUM ANALYZE
- VACUUM FULL

### Index Maintenance
- Index rebuild
- Index statistics
- Index usage
- Index size

## Troubleshooting

### Common Issues
- Connection timeouts
- Dead locks
- Slow queries
- Disk space issues

### Debugging
- Query logging
- Explain analyze
- Performance views
- Error logs 