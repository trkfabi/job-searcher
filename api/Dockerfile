# api/Dockerfile
FROM node:20-bullseye-slim

# Toolchain para compilar nativos
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Instala deps (incluye dev para tsx/typescript)
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN if [ -f pnpm-lock.yaml ]; then corepack enable && pnpm i; \
    elif [ -f yarn.lock ]; then yarn install; \
    elif [ -f package-lock.json ]; then npm ci; \
    else npm i; fi

# Fuerza rebuild del binario nativo (evita prebuilds que no matchean)
ENV npm_config_build_from_source=true PREBUILD_INSTALL=false
RUN npm rebuild better-sqlite3 || true

# Copia el código
COPY . .

ENV NODE_ENV=production
ENV PORT=3333
ENV DB_PATH=/data/jobs.sqlite

EXPOSE 3333
# Node 20: usar --import tsx (no --loader)
CMD ["node", "--import", "tsx", "server.ts"]