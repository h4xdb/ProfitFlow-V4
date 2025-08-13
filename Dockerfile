# Multi-stage build for production
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies including devDependencies
RUN npm install --include=dev

# Copy source code
COPY . .

# Build the application
RUN npx vite build && npx esbuild server/production.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/production.js

# Production stage
FROM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies + drizzle-kit for schema management
RUN npm install --omit=dev && npm install drizzle-kit && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist/public ./public
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/drizzle.config.ts ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership of the app directory
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Start the application using production build
CMD ["node", "dist/production.js"]
