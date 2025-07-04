# Multi-stage Dockerfile for DeliciousFoodMap-Web
# Stage 1: Build the Vue.js application
FROM node:18-alpine AS build-stage

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml* ./

# Install dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm run build

# Stage 2: Production stage with Nginx
FROM nginx:1.25-alpine AS production-stage

# Remove default nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy built application from build stage
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/default.conf /etc/nginx/conf.d/default.conf

# Copy config template for runtime substitution
COPY public/config.json.template /usr/share/nginx/html/config.json.template

# Copy startup script
COPY docker/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Set environment variables with defaults
ENV API_BASE_URL=http://localhost:8080
ENV AMAP_KEY=""

# Expose port
EXPOSE 80

EXPOSE 443



# Use custom entrypoint
ENTRYPOINT ["/docker-entrypoint.sh"]

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
