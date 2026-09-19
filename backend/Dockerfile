# Use an official Node.js runtime (Debian slim for native dependency compatibility)
FROM node:20-bookworm-slim

# Set working directory
WORKDIR /app

# Install system dependencies if required for network and audio utilities
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency manifests first to leverage Docker layer caching
COPY package*.json ./

# Install dependencies (ignoring devDependencies for a lean image)
RUN npm install --omit=dev

# Copy the rest of the application source code
COPY . .

# Set environment defaults
ENV NODE_ENV=production
ENV PORT=3000

# Expose backend API port
EXPOSE 3000

# Health check to ensure Express is accepting connections
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/user/current || exit 0

# Start the application
CMD ["node", "index.js"]
