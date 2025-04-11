# Entwicklungs-Stage
FROM golang:1.22-alpine

WORKDIR /app

# Installiere Build-Abhängigkeiten und Air
RUN apk add --no-cache gcc musl-dev git && \
    go install github.com/cosmtrek/air@v1.49.0

# Optimiere Go für Container
ENV CGO_ENABLED=0
ENV GOOS=linux
ENV GO111MODULE=on
ENV GOFLAGS=-mod=vendor

# Kopiere go.mod und go.sum
COPY go.mod go.sum ./

# Lade Abhängigkeiten mit Cache-Layer
RUN --mount=type=cache,target=/go/pkg/mod \
    go mod download && \
    go mod verify

# Kopiere den Rest des Codes
COPY . .

# Vendor Dependencies
RUN go mod vendor

# Erstelle Verzeichnis für .env
RUN mkdir -p /app/config

# Kopiere .env.example als .env, falls keine .env existiert
COPY .env.example /app/.env

# Health Check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:8080/health || exit 1

# Exponiere die Ports
EXPOSE 8080 3478

# Starte die Anwendung mit Air für Hot-Reloading
CMD ["air", "-c", ".air.toml"] 