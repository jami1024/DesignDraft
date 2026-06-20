FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:20-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production-only deps. pi-ai is externalized from the server bundle (it is
# ESM-only and lazy-loads provider SDKs via dynamic import), so it + its SDK
# tree must exist in node_modules at runtime — Next standalone tracing does not
# follow its computed-path imports.
FROM node:20-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund \
    # Trim runtime-irrelevant weight from the node_modules we ship:
    # - @next/swc-* native compiler binaries are build-time only (the standalone
    #   server never invokes SWC); next itself is re-provided by the standalone copy.
    # - pi-ai lazy-loads provider SDKs on demand; only the OpenAI-compatible path
    #   (deepseek) is used, so the other provider SDKs are never imported.
    # - tsx is an e2e/dev tool.
    && rm -rf node_modules/@next \
              node_modules/@aws-sdk node_modules/@smithy \
              node_modules/@google node_modules/@mistralai node_modules/@anthropic-ai \
              node_modules/tsx

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DESIGNDRAFT_WORKSPACE_DIR=/app/.workspace

# git is required at runtime: each project is a per-project git repo
# (ProjectRepo.init runs `git init`/`commit`). alpine has no git by default.
RUN apk add --no-cache git

RUN addgroup -S nextjs && adduser -S nextjs -G nextjs

# Production node_modules first (provides externalized pi-ai + provider SDKs),
# then overlay the standalone output so Next's pruned runtime files win where
# they overlap.
COPY --from=prod-deps --chown=nextjs:nextjs /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nextjs /app/.next/static ./.next/static

# Runtime-read asset trees, resolved via process.cwd()=/app. Next standalone
# only bundles import-traced modules, so these fs-read data dirs must be copied
# explicitly: the React scaffold cloned per project, and the Impeccable skill
# docs the prompts inject.
COPY --from=builder --chown=nextjs:nextjs /app/lib/scaffold/template ./lib/scaffold/template
COPY --from=builder --chown=nextjs:nextjs /app/lib/skills ./lib/skills

RUN mkdir -p /app/.workspace && chown -R nextjs:nextjs /app/.workspace

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
