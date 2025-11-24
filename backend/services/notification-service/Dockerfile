FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY .env ./

# Install dependencies
RUN npm ci --omit=dev

# Copy source code
COPY src/ ./src/

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership of the app directory
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3003

CMD ["npm", "start"]