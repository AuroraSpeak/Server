# Development Guidelines

## Setting up Development Environment

### Prerequisites
- Node.js (Version 22 or higher)
- pnpm (Version 10.7.0)
- Docker & Docker Compose
- Git

### Installation
1. Clone repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
4. Start Docker containers:
   ```bash
   docker-compose up -d
   ```
5. Run database migrations:
   ```bash
   pnpm prisma:migrate
   ```

## Development Server

### Starting
```bash
pnpm dev
```
The server will run on `http://localhost:3000`

### Available Scripts
- `pnpm dev` - Starts the development server
- `pnpm build` - Creates a production build
- `pnpm start` - Starts the production server
- `pnpm lint` - Runs linting
- `pnpm prisma:generate` - Generates Prisma Client
- `pnpm prisma:studio` - Opens Prisma Studio
- `pnpm prisma:migrate` - Runs database migrations
- `pnpm prisma:reset` - Resets the database
- `pnpm prisma:dbpush` - Pushes schema changes to database
- `pnpm prisma:seed` - Runs seeding

## Code Structure

```
/
├── app/              # Next.js App Router
├── components/       # React Components
├── contexts/        # React Contexts
├── hooks/           # Custom React Hooks
├── lib/             # Utility Functions
├── prisma/          # Database Schema and Migrations
├── public/          # Static Assets
├── styles/          # Global Styles
└── types/           # TypeScript Type Definitions
```

## Best Practices

### TypeScript
- Use strict typing
- Interfaces for complex types
- Generics where appropriate

### React
- Functional Components
- Hooks for State Management
- Context for global state
- Memoization where needed

### Styling
- Tailwind CSS for styling
- Component-specific styles
- Responsive design

### Testing
- Unit tests for utilities
- Component tests for UI
- Integration tests for API
- E2E tests for critical flows

### Git Workflow
- Feature branches
- Pull requests for reviews
- Semantic versioning
- Conventional commits

## Debugging

### Tools
- Chrome DevTools
- React DevTools
- Prisma Studio
- pgAdmin

### Logging
- Winston for server logs
- Sentry for error tracking
- Prometheus for metrics

## Performance

### Optimizations
- Code splitting
- Image optimization
- Caching strategies
- Bundle size monitoring

### Monitoring
- Lighthouse scores
- Core Web Vitals
- Performance metrics in Grafana 