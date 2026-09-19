# Stage 1: Build the Vite + React application
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies using layer caching
COPY package*.json ./
RUN npm install

# Copy source code and assets
COPY . .

# Build production bundle
RUN npm run build

# Stage 2: Serve using Nginx
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built production assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration with SPA support
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose standard HTTP port
EXPOSE 80

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
