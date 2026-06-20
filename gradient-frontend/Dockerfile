# Build stage
FROM oven/bun:alpine AS base
WORKDIR /app
COPY package*.json ./
RUN bun install
COPY . .

# Development stage
FROM base AS development
EXPOSE 5173
CMD ["bun", "run", "dev", "--", "--host", "0.0.0.0"]

# Production build stage
FROM base AS build
RUN bun run build

# Production run stage
FROM nginx:alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
# (Optional) Copy custom Nginx configuration if needed for React Router routing
# COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
