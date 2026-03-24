# ---------------- base ----------------
FROM node:20-bullseye-slim AS base
WORKDIR /app
ENV HOSTNAME=0.0.0.0
# (intentionally NOT setting NODE_ENV here)

# ---------------- dev -----------------
FROM base AS dev
ENV NODE_ENV=development
RUN apt-get update \
  && apt-get install -y --no-install-recommends curl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --include=dev       # explicit: include dev deps
COPY . .
EXPOSE 3000
CMD ["npm","run","dev"]

# ---------------- build ---------------
FROM base AS build
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --include=dev
COPY . .
RUN npm run build

# ---------------- prod ----------------
FROM node:20-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache libc6-compat

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/.next ./.next

EXPOSE 3000
CMD ["npm","run","start"]

