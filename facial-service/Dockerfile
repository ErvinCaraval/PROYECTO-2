# Dockerfile opcional - usando docker-compose con imagen base
# Este archivo es opcional ya que usamos la imagen serengil/deepface:latest directamente
# Se mantiene por si necesitas personalizar la imagen

FROM serengil/deepface:latest

WORKDIR /app

# Instalar dependencias adicionales
RUN pip install flask flask-cors

# Copiar el archivo de la API
COPY api.py /app/api.py

# Exponer el puerto
EXPOSE 5001

# Comando por defecto
CMD ["python", "api.py"]

