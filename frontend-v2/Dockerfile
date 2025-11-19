# Multi-stage build para frontend-v2
# Stage 1: Builder
FROM node:20-ubuntu AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar todas las dependencias (incluyendo devDependencies para build)
RUN npm ci

# Copiar código fuente
COPY . .

# Build de la aplicación
RUN npm run build

# Stage 2: Runtime (Nginx)
FROM nginx:latest

# Etiquetas de metadatos
LABEL maintainer="Ervin Caraval <ervin@brainblitz.com>"
LABEL version="1.0"
LABEL description="Frontend React para BrainBlitz - Gamificación y aprendizaje"

# Instalar curl para health check
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Copiar configuración de Nginx
COPY nginx.conf /etc/nginx/nginx.conf
COPY nginx-default.conf /etc/nginx/conf.d/default.conf

# Copiar archivos construidos desde builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Crear usuario no-root para Nginx
RUN useradd -m -u 1001 nginx && \
    chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /var/run/nginx.pid

# Cambiar a usuario no-root
USER nginx

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:80/ || exit 1

# Exponer puerto
EXPOSE 80

# Comando de inicio
CMD ["nginx", "-g", "daemon off;"]
