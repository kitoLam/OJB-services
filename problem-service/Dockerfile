# ============================================================
#  problem-service — Multi-stage Dockerfile
#  Stage 1 (builder): Install deps + compile TypeScript
#  Stage 2 (production): Lean runtime image
# ============================================================

# ------------------------------------------------------------
# Stage 1: Builder
# ------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install ALL dependencies (including devDeps for building)
RUN npm ci

# Copy source code
COPY . .

# Build NestJS app
RUN npm run build

# Remove devDependencies to keep only production deps
RUN npm prune --production

# ------------------------------------------------------------
# Stage 2: Production
# ------------------------------------------------------------
FROM node:22-alpine AS production

# Add non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy built artifacts and production node_modules from builder
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist
COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /app/package.json ./package.json

# Switch to non-root user
USER appuser

EXPOSE 3001

# Healthcheck
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["node", "dist/main"]
