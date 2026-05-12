# SupplyChain Pro

Pequeña guía rápida de instalación y verificación del proyecto usando Docker.

## Instalación (rápida)

Requisitos previos:

- Docker Desktop (con Docker Compose v2)
- Git
- Puertos libres en el host: 5001, 5173 y 8080

1. Revisar y ajustar el archivo `.env` en la raíz del proyecto. Variables clave:
   - `DB_HOST` (ej: `supplychainpro-db`)
   - `DB_PORT` (`3306`)
   - `DB_NAME` (`supplychain_db`)
   - `DB_USER` (consultar `Manual.txt` para credenciales de prueba)
   - `DB_PASSWORD` (consultar `Manual.txt`)
   - `DB_ROOT_PASSWORD` (consultar `Manual.txt`)
   - `PORT` (`5000`)
   - `BACKEND_HOST_PORT` (`5001`)
   - `PHPMYADMIN_HOST_PORT` (`8080`)

   Nota: Las credenciales de ejemplo y usuarios de prueba están documentadas en `Manual.txt`.

2. Construir imágenes y levantar servicios:

```bash
docker compose up -d --build
```

3. Ver estado y logs:

```bash
docker compose ps
docker compose logs -f
```

4. Validaciones rápidas:

- Backend health: `http://localhost:5001/health`
- Swagger UI: `http://localhost:5001/api-docs`
- Frontend: `http://localhost:5173`
- phpMyAdmin: `http://localhost:8080`

5. Si cambias credenciales de la base de datos y ya existe un volumen, recrea los datos:

```bash
docker compose down -v
docker compose up -d --build
```

## Puertos públicos (host)

- `5001` -> Backend API (contenedor `5000`) — `http://localhost:5001`
- `5173` -> Frontend (Nginx, contenedor `80`) — `http://localhost:5173`
- `8080` -> phpMyAdmin (contenedor `80`) — `http://localhost:8080`

## Más información

Las credenciales de prueba, pasos de autenticación en Swagger y notas útiles para soporte
se mantienen en `Manual.txt`. Revisa allí la sección **Credenciales de acceso** antes de probar
usuarios de admin en el entorno local.
