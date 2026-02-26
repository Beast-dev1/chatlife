# Multi-stage: build then production (dev compose overrides CMD to npm run dev)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY prisma ./prisma/
RUN npx prisma generate
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY prisma ./prisma/
RUN npx prisma generate
COPY --from=builder /app/dist ./dist
EXPOSE 4000
# Production: node dist/server.js (compose.prod runs migrate deploy first)
CMD ["node", "dist/server.js"]
