FROM node:20-alpine AS base
WORKDIR /app

# Instalar deps (usa el lock que tengas)
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN if [ -f pnpm-lock.yaml ]; then corepack enable && pnpm i --prod; \
    elif [ -f yarn.lock ]; then yarn install --production; \
    elif [ -f package-lock.json ]; then npm ci --omit=dev; \
    else npm i --omit=dev; fi

# Copiar código
COPY . .

ENV NODE_ENV=production
ENV PORT=3333
ENV DB_PATH=../data/jobs.sqlite

EXPOSE 3333
# Si tu API está en TypeScript sin build, asegúrate de tener "tsx" como dep:
# CMD ["node", "--loader", "tsx", "server.ts"]
# Si compilas a dist/ en tu build:
# CMD ["node", "dist/server.js"]
CMD ["node", "--loader", "tsx", "server.ts"]