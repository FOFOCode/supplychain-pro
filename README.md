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

# SupplyChain Pro — Guía rápida de instalación

Una guía concisa para levantar el proyecto localmente con Docker. Esta página NO incluye
credenciales ni datos sensibles — las credenciales de prueba se mantienen en `Manual.txt`.

---

## Tabla de contenido

- [Requisitos previos](#requisitos-previos)
- [Arranque rápido (Docker)](#arranque-rápido-docker)
- [Validaciones rápidas](#validaciones-rápidas)
- [Puertos expuestos](#puertos-expuestos)
- [Volúmenes y recreado de datos](#volúmenes-y-recreado-de-datos)
- [Soporte y notas](#soporte-y-notas)

---

## Requisitos previos

- Docker Desktop (con Docker Compose v2)
- Git
- Puertos libres en el host: `5001`, `5173`, `8080`

Antes de arrancar, verifica y ajusta el archivo `.env` en la raíz del proyecto si es necesario.
Las variables clave y ejemplos están documentados en `Manual.txt` (no incluir credenciales aquí).

---

## Arranque rápido (Docker)

1. Desde la raíz del repositorio, construir y levantar los servicios:

```bash
docker compose up -d --build
```

2. Ver el estado de los contenedores:

```bash
docker compose ps
```

3. Ver los logs (si necesitas depurar):

```bash
docker compose logs -f
```

---

## Validaciones rápidas

- Backend (health): `http://localhost:5001/health`
- Swagger UI: `http://localhost:5001/api-docs`
- Frontend: `http://localhost:5173`
- phpMyAdmin: `http://localhost:8080`

Para probar login vía API (usar credenciales desde `Manual.txt`):

```bash
curl -X POST http://localhost:5001/api/auth/login \
   -H "Content-Type: application/json" \
   -d '{"correo":"admin@local.test","contrasena":"admin123"}'
```

> Nota: el ejemplo anterior asume que el usuario existe en la base de datos. Consulta
> `Manual.txt` para las credenciales de prueba y pasos de seed si necesitas crearlos.

---

## Puertos expuestos

- `5001` → Backend API (contenedor `5000`) — `http://localhost:5001`
- `5173` → Frontend (Nginx, contenedor `80`) — `http://localhost:5173`
- `8080` → phpMyAdmin (contenedor `80`) — `http://localhost:8080`

Internamente (red Docker):

- MySQL: `supplychainpro-db:3306`
- Backend: `supplychainpro-backend:5000`

---

## Volúmenes y recreado de datos

Si cambias credenciales de la base de datos o quieres reiniciar los datos de desarrollo,
recrea el volumen de MySQL y arranca de nuevo:

```bash
docker compose down -v
docker compose up -d --build
```

---

## Soporte y notas

- Las credenciales de prueba, pasos de autenticación en Swagger y notas de soporte se
   mantienen en `Manual.txt`.
- Errores comunes:
   - CORS: verificar `CORS_ORIGINS` en `.env` incluye `http://localhost:5173`.
   - DB access denied: si cambiaste `DB_PASSWORD` o `DB_ROOT_PASSWORD` y existe un volumen,
      recrearlo con `docker compose down -v`.

---

Si quieres, puedo añadir un pequeño TOC con enlaces de salto o badges (Docker/GH),
o adaptar el README para que sirva como la página principal del repo en GitHub.
