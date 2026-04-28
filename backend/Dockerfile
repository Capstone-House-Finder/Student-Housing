# ══════════════════════════════════════════════════════════════════════════════
# Stage 1 — deps
# Install production dependencies only.
# ══════════════════════════════════════════════════════════════════════════════
FROM node:20-alpine AS deps

RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm ci --omit=dev


# ══════════════════════════════════════════════════════════════════════════════
# Stage 2 — runner (final image)
# Minimal Alpine image with production dependencies and source code.
# ══════════════════════════════════════════════════════════════════════════════
FROM node:20-alpine AS runner

# Security: non-root user
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nodeapp

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Copy production node_modules from the deps stage.
COPY --from=deps --chown=nodeapp:nodejs /app/node_modules ./node_modules

# Copy application source code and configuration
COPY --chown=nodeapp:nodejs package.json ./
COPY --chown=nodeapp:nodejs src ./src

USER nodeapp

EXPOSE 5000

# Health check — Docker (and Compose) will mark the container unhealthy if
# the API stops responding, and the deploy workflow can detect this.
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:5000/health || exit 1

# Entry point: run the application directly (Node can natively handle .js files)
CMD ["node", "src/app.js"]
