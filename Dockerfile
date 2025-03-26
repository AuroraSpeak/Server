FROM node:18-alpine AS builder

# Build Stage
WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN corepack enable && corepack prepare pnpm@8.6.12 --activate
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# Production Stage
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV production

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

RUN corepack enable && corepack prepare pnpm@8.6.12 --activate
RUN pnpm install --prod --frozen-lockfile

EXPOSE 3000

CMD ["pnpm", "start"]
