# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN if [ -f pnpm-lock.yaml ]; then corepack enable && pnpm i; \
    elif [ -f yarn.lock ]; then yarn install; \
    elif [ -f package-lock.json ]; then npm ci; \
    else npm i; fi
COPY . .
RUN npm run build || yarn build || pnpm build

# Serve con Nginx
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]