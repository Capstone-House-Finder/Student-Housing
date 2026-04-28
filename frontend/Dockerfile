# ══════════════════════════════════════════════════════════════════════════════
# Stage 1 — deps
# Install only production + dev dependencies so the build stage has everything
# it needs. We use a separate stage so the final image never contains
# node_modules with dev tools (jest, eslint, typescript, etc.).
# ══════════════════════════════════════════════════════════════════════════════
FROM node:20-alpine AS deps

# libc6-compat is required by some native Node addons on Alpine.
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy manifests first — Docker layer-caches this step until package*.json
# changes, so npm ci is skipped on rebuilds that only touch source files.
COPY package.json package-lock.json ./

RUN npm ci


# ══════════════════════════════════════════════════════════════════════════════
# Stage 2 — builder
# Compile the Next.js application. The output is a standalone bundle that
# includes only the code needed to run the server — no full node_modules.
# ══════════════════════════════════════════════════════════════════════════════
FROM node:20-alpine AS builder

WORKDIR /app

# Bring in installed node_modules from the deps stage.
COPY --from=deps /app/node_modules ./node_modules

# Copy the full source tree.
COPY . .

# NEXT_PUBLIC_* variables are inlined at build time by Next.js.
# We accept them as build args so CI/CD can pass the right value per
# environment without hardcoding anything in this file.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Disable Next.js telemetry in CI and container builds.
ENV NEXT_TELEMETRY_DISABLED=1

# output: 'standalone' in next.config.ts makes Next.js produce a self-contained
# .next/standalone directory that can run without the full node_modules tree.
RUN npm run build


# ══════════════════════════════════════════════════════════════════════════════
# Stage 3 — runner (final image)
# A minimal Alpine image that only contains the compiled output.
# No source code, no dev dependencies, no build tools.
# ══════════════════════════════════════════════════════════════════════════════
FROM node:20-alpine AS runner

WORKDIR /app

# Security: run the process as a non-root user.
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy the standalone server bundle produced by the builder stage.
COPY --from=builder /app/.next/standalone ./

# Copy static assets (/_next/static) and the public folder.
# These are served directly by the standalone server.
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public        ./public

USER nextjs

EXPOSE 3000

# The standalone output exposes a server.js entry point.
CMD ["node", "server.js"]
