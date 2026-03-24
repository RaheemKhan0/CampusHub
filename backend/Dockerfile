# ---- development ----
FROM node:20-bullseye-slim AS dev
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 4000
ENV HOST=0.0.0.0
ENV NODE_ENV=development
CMD ["npm" , "run", "start:dev"]

# ---- build stage ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- runtime stage ----
FROM node:20-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE 4000
CMD ["npm", "run", "start"]


