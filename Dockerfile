FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund && test -x node_modules/.bin/next

FROM node:20-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DESIGNDRAFT_WORKSPACE_DIR=/app/.workspace

RUN addgroup -S nextjs && adduser -S nextjs -G nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules

RUN mkdir -p /app/.workspace && chown -R nextjs:nextjs /app
USER nextjs

EXPOSE 3000
CMD ["npm", "run", "start"]
