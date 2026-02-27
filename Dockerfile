# ─── Stage 1: Builder ─────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace package files
COPY package.json package-lock.json* ./
COPY Backend/package.json ./Backend/
COPY Frontend/package.json ./Frontend/

# Install backend production dependencies using workspace
RUN npm ci --omit=dev -w Backend

# Install frontend dependencies and build
RUN npm ci -w Frontend
COPY Frontend/ ./Frontend/
RUN npm run build -w Frontend

# ─── Stage 2: Production image ────────────────────────────────
FROM node:20-alpine AS production

# Security: run as non-root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy backend + production deps
COPY --from=builder /app/Backend/node_modules ./Backend/node_modules
COPY Backend/ ./Backend/

# Copy built frontend to a static folder
COPY --from=builder /app/Frontend/dist ./Frontend/dist

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5001/api/health || exit 1

USER appuser

EXPOSE 5001

ENV NODE_ENV=production

CMD ["node", "Backend/server.js"]