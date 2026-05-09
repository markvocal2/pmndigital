# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS base
RUN apk add --no-cache tini
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
RUN [ -f package-lock.json ] && npm ci || npm install

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build
RUN npm prune --omit=dev

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3001
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
EXPOSE 3001
ENTRYPOINT ["/sbin/tini","--"]
CMD ["node","dist/main"]
