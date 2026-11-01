# Multi-stage production build for UtsavAI
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Copy application sources
COPY . .

# Run type checks, tests, and production build
RUN npm run type-check && npm test && npm run build

# Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled bundles from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-server ./dist-server

EXPOSE 8080

# Run Express server
CMD ["node", "dist-server/server/index.js"]

