# Build stage for Frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install
COPY frontend/ .
RUN pnpm run build

# Build stage for Backend
FROM golang:1.22-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ .
RUN CGO_ENABLED=0 GOOS=linux go build -o dist/auraspeak cmd/server/main.go

# Production stage
FROM alpine:latest
WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache ca-certificates tzdata

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Copy built backend
COPY --from=backend-builder /app/backend/dist/auraspeak ./backend/

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Start the application
CMD ["./backend/auraspeak"]
    