# --- Base stage ---
    FROM node:18-alpine AS base

    WORKDIR /app
    
    # Enable pnpm
    RUN corepack enable && corepack prepare pnpm@10.6.5 --activate
    
    # Install dependencies
    COPY package.json pnpm-lock.yaml ./
    RUN pnpm install --frozen-lockfile
    
    # Copy full app
    COPY . .
    
    # Prisma (if used)
    RUN pnpm prisma generate
    
    # Build Next.js (for production later)
    RUN pnpm build
    
    
    # --- Dev Stage ---
    FROM base AS dev
    
    ENV NODE_ENV=development
    ENV NEXT_TELEMETRY_DISABLED=1
    ENV HOST=0.0.0.0
    EXPOSE 3000
    
    CMD ["pnpm", "dev"]
    
    
    # --- Prod Stage ---
    FROM node:18-alpine AS prod
    
    WORKDIR /app
    
    RUN corepack enable && corepack prepare pnpm@10.6.5 --activate
    
    COPY --from=base /app .
    
    ENV NODE_ENV=production
    ENV NEXT_TELEMETRY_DISABLED=1
    ENV HOST=0.0.0.0
    EXPOSE 3000
    
    CMD ["pnpm", "start"]
    