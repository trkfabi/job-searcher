FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN if [ -f pnpm-lock.yaml ]; then corepack enable && pnpm i; \
    elif [ -f yarn.lock ]; then yarn install; \
    elif [ -f package-lock.json ]; then npm ci; \
    else npm i; fi

COPY . .

ENV DB_PATH=/data/jobs.sqlite
# Por defecto ejecuta el scraper (el compose ya define el command, aquí queda de respaldo)
CMD ["node", "--env-file=.env", "--loader", "tsx", "src/index.ts"]


# use it:
# docker compose build frontend --build-arg BASE_PATH=/job-searcher/