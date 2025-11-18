# Dockerfile optimizado para escalabilidad
FROM serengil/deepface:latest

WORKDIR /app
# Copiar requirements y instalar dependencias
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copiar el archivo de la API
COPY api.py /app/api.py
COPY . /app/

# Exponer el puerto
EXPOSE 5001

# Variables de entorno
ENV FLASK_ENV=production
ENV PYTHONUNBUFFERED=1

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=40s \
    CMD curl -f http://localhost:5001/health || exit 1

# Comando por defecto
CMD ["python", "api.py"]
