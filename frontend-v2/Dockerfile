# Frontend - Multi-stage build
# Stage 1: Build
FROM node:20 AS builder

WORKDIR /app

# Copiar todo el proyecto
COPY . .

# Instalar dependencias
RUN npm install --verbose

# Reconstruir con las variables de entorno correctas
ENV VITE_API_URL=http://localhost:5000/api
ENV VITE_SOCKET_URL=http://localhost:5000

# Build
RUN npm run build

# Stage 2: Runtime
FROM nginx:alpine

LABEL maintainer="Ervin Caraval <ervin@brainblitz.com>"
LABEL version="1.0"
LABEL description="Frontend React para BrainBlitz"

# Instalar curl para health check
RUN apk add --no-cache curl

# Copiar configuración de Nginx
COPY ./nginx.conf /etc/nginx/nginx.conf
COPY ./nginx-default.conf /etc/nginx/conf.d/default.conf

# Copiar el dist del builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Permisos
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    mkdir -p /var/run/nginx && \
    chown -R nginx:nginx /var/run/nginx

# Usuario nginx
USER nginx

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:80/ || exit 1

# Puerto
EXPOSE 80

# Inicio
CMD ["nginx", "-g", "daemon off;"]
