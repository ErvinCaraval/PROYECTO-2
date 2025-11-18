Facial Recognition Service (Redis-only persistent store)

Resumen
- Este microservicio usa DeepFace para generar embeddings faciales.
- Persistencia de embeddings: Redis (configurable vía `USE_REDIS` / `REDIS_URL`).
- Caché en memoria deshabilitable con `USE_INMEM_CACHE=0`.
- Firestore/Firebase no se usa en esta carpeta (removido).

Arrancar localmente (desde `facial-service`):

```bash
# Build & start Redis + service (detached)
docker compose up --build -d

# Ver logs
docker logs -f facial-recognition-service
docker logs -f facial-service-redis
```

Variables de entorno relevantes (en `docker-compose.yml`):
- `USE_REDIS=1` — habilita Redis como almacenamiento persistente.
- `REDIS_URL` — URL de conexión a Redis (por defecto `redis://redis:6379/0`).
- `USE_INMEM_CACHE=0` — deshabilita caché en memoria (usa solo Redis).

Endpoints principales:
- `GET /health` — salud del servicio
- `POST /register` — registra una cara (body `{ "image": "<base64>", "user_id": "..." }`)
- `POST /verify` — verifica dos imágenes (body `{ "img1": "<base64>", "img2": "<base64>" }`)

Notas de operación
- Redis está configurado con AOF y volumen `redis-data` para persistencia local; para producción configure backups y replicación.
- Si migras desde Firestore, debes copiar embeddings Firestore → Redis si quieres conservar registros anteriores.

Contacto
- Si necesitas que implemente migración desde Firestore o que cambie la política de TTL, dime y lo hago.
