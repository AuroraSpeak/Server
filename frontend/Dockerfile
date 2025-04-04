# Use Node.js as the base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Install dependencies first (for better caching)
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install
RUN pnpm approve-builds

# Set environment variables
ENV NODE_ENV=development
ENV VITE_API_URL=http://backend:8080
ENV VITE_WS_URL=ws://backend:8080

# Expose the port the app will run on
EXPOSE 3000

# Command to run the development server
CMD ["pnpm", "dev", "--host", "0.0.0.0"]

