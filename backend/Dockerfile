# --- build stage -----------------------------------------------------------
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# --- runtime stage ---------------------------------------------------------
FROM node:22-slim
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
# The SQLite file lives here; mount a volume to persist it.
ENV DB_PATH=/app/data/data.sqlite
RUN mkdir -p /app/data
EXPOSE 4000
CMD ["node", "dist/index.js"]
