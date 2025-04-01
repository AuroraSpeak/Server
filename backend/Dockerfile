FROM golang:1.21-alpine

WORKDIR /app

# Install build dependencies and Air
RUN apk add --no-cache gcc musl-dev && \
    go install github.com/cosmtrek/air@v1.49.0

# Copy go mod and sum files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Expose port
EXPOSE 8080

# Run the application with Air for hot reload
CMD ["air"] 