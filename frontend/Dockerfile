# Frontend Dockerfile
FROM node:18-alpine AS base

# Declare build arguments
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_GOOGLE_CLIENT_SECRET
ARG VITE_API_URL
ARG VITE_GOOGLE_REDIRECT_URI

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Build the application
FROM base AS builder

# Re-declare ARG for builder stage
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_GOOGLE_CLIENT_SECRET
ARG VITE_API_URL
ARG VITE_GOOGLE_REDIRECT_URI

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application with env vars
RUN VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID \
    VITE_GOOGLE_CLIENT_SECRET=$VITE_GOOGLE_CLIENT_SECRET \
    VITE_API_URL=$VITE_API_URL \
    VITE_GOOGLE_REDIRECT_URI=$VITE_GOOGLE_REDIRECT_URI \
    npm run build

# Production image
FROM nginx:alpine AS runner
WORKDIR /app

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]