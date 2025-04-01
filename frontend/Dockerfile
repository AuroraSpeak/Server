FROM node:20-alpine

# Enable pnpm
RUN corepack enable pnpm

# Set working directory
WORKDIR /app

# Configure npm and pnpm to use a more reliable registry
RUN npm config set registry https://registry.npmjs.org/ && \
    pnpm config set registry https://registry.npmjs.org/ && \
    pnpm config set fetch-timeout 300000

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies with increased timeout
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# Copy the rest of the application
COPY . .

# Expose port
EXPOSE 3000

# Set environment variables for hot reload
ENV CHOKIDAR_USEPOLLING=true
ENV WATCHPACK_POLLING=true
ENV NODE_ENV=development

# Start the development server with host flag for external access
CMD ["pnpm", "dev", "--host", "--port", "3000"] 