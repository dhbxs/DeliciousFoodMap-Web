FROM node:18-alpine AS build-stage

WORKDIR /app

COPY package*.json ./
COPY pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install
COPY . .
RUN pnpm run build

FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*

COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY --from=build-stage /app/public/config.json.template /usr/share/nginx/html/config.json.template
COPY nginx.conf /etc/nginx/nginx.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh

RUN chmod +x /docker-entrypoint.sh

# Expose port 80
EXPOSE 80

# Set entrypoint
ENTRYPOINT ["/docker-entrypoint.sh"]

# Default command
CMD ["nginx", "-g", "daemon off;"]
