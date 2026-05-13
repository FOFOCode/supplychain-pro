SupplyChain Pro — Documentación de rutas (Backend)

Resumen
- Documento con instrucciones rápidas para desarrolladores sobre cómo usar las rutas REST del backend.

Requisitos
- Node.js (>=14)
- MySQL con la base `supplychange` creada y migraciones aplicadas
- Archivo `.env` en el directorio `backend` con las variables (DB_*, JWT_SECRET, JWT_EXPIRY, PORT)

Instalación y ejecutar
1. Instalar dependencias:

```bash
cd backend
npm install
```

2. Ejecutar (desarrollo):

```bash
npm run dev
# o
node server.js
```

3. (Opcional) Crear un usuario ADMIN de prueba (para poder probar endpoints protegidos):

```bash
setx ADMIN_EMAIL "admin@ejemplo.com"
setx ADMIN_PASSWORD "adminpass"
npm run seed:admin
```

4. Probar endpoints automáticamente (smoke test; requiere servidor corriendo y ADMIN_*):

```bash
npm run smoke
```

Autenticación
- Endpoint de login: `POST /api/auth/login`
- Request JSON: `{ "correo": "x@dominio", "contrasena": "secret" }`
- Respuesta: `{ token: "<JWT>", user: { id_usuario, nombre_completo, rol } }`
- Usar header `Authorization: Bearer <JWT>` en requests protegidos.
- Roles: `ADMIN` (todo), `USUARIO` (solo lectura).

Nota: `.env` contiene `JWT_SECRET` y `JWT_EXPIRY`.

Rutas principales y uso (resumen)
- /api/auth
  - POST /login — login (public)
  - GET /me — obtener usuario actual (authenticate)

- /api/envios
  - GET /api/envios — listar envios (authenticate)
  - GET /api/envios/:id — obtener (authenticate)
  - POST /api/envios — crear (ADMIN)
    - body: `{ codigo_rastreo, origen, destino, id_ruta?, temp_max_permitida, temp_min_permitida }`
  - PUT /api/envios/:id — actualizar (ADMIN)
  - DELETE /api/envios/:id — eliminar (ADMIN)

- /api/vehiculos
  - GET /api/vehiculos — listar (authenticate)
  - GET /api/vehiculos/:id — obtener (authenticate)
  - POST /api/vehiculos — crear (ADMIN)
  - PUT /api/vehiculos/:id — actualizar (ADMIN)
  - DELETE /api/vehiculos/:id — eliminar (ADMIN)

- /api/envios-vehiculos
  - GET /api/envios-vehiculos — listar asignaciones (authenticate)
  - POST /api/envios-vehiculos — crear asignación (ADMIN)
  - GET /api/envios-vehiculos/:id — obtener (authenticate)

- /api/registros
  - POST /api/registros — insertar telemetría (PUBLIC — simulador)
    - body: `{ id_envio, latitud, longitud, temperatura, humedad, porcentaje_bateria, marca_tiempo_dispositivo }`
  - GET /api/registros/:id — obtener registro (authenticate)
  - GET /api/registros/envio/:id?limit=100&since=2026-05-03T00:00:00Z — últimos registros por envío (authenticate)

- /api/incidentes
  - GET /api/incidentes — listar (authenticate)
  - POST /api/incidentes — crear incidente (ADMIN)
  - GET /api/incidentes/:id — obtener (authenticate)

- /api/productos
  - GET /api/productos — listar (authenticate)
  - GET /api/productos/:id — obtener (authenticate)
  - POST /api/productos — crear (ADMIN)
  - PUT /api/productos/:id — actualizar (ADMIN)
  - DELETE /api/productos/:id — eliminar (ADMIN)

- /api/detalles-envio
  - GET /api/detalles-envio?envio=<id> — listar detalles de un envío (authenticate)
  - POST /api/detalles-envio — crear detalle (ADMIN)
  - DELETE /api/detalles-envio/:id — eliminar detalle (ADMIN)

- /api/roles
  - GET /api/roles — listar (authenticate)
  - POST /api/roles — crear rol (ADMIN)

- /api/usuarios
  - GET /api/usuarios — listar (authenticate)
  - GET /api/usuarios/:id — obtener (authenticate)
  - POST /api/usuarios — crear usuario (ADMIN)
    - body: `{ id_rol, nombre_completo, correo, contrasena }`
  - PUT /api/usuarios/:id — actualizar (ADMIN)

- /api/rutas
  - GET /api/rutas — listar (authenticate)
  - GET /api/rutas/:id — obtener (authenticate)
  - POST /api/rutas — crear (ADMIN)
    - body: `{ nombre, waypoints_json }`

Ejemplos curl
- Login:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"correo":"admin@ejemplo.com","contrasena":"adminpass"}'
```

- Llamar endpoint protegido:
```bash
TOKEN=<copiar token de login>
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/envios
```

- Enviar telemetría (desde simulador):
```bash
curl -X POST http://localhost:3000/api/registros \
  -H 'Content-Type: application/json' \
  -d '{"id_envio":1,"latitud":13.6890,"longitud":-89.1872,"temperatura":6.2,"humedad":75,"porcentaje_bateria":85,"marca_tiempo_dispositivo":"2026-05-03T10:00:00Z"}'
```

Notas importantes
- Roles: el sistema espera `roles.nombre` con valores legibles. Por convención añadir `ADMIN` y `USUARIO`.
- Incidentes: la tabla es de tipo "inmutable" por diseño; el API evita endpoints de update/delete para incidentes.
- Telemetría es de alta frecuencia: evaluar particionado/TTL/archivado y backups en la BD.
- Rutas: en el esquema simple se guardan como `waypoints_json` (JSON), sin tipos espaciales.
- Seguridad: el README no sustituye políticas de producción (TLS, cifrado en reposo, backups, rotación de claves).

Sugerencias siguientes (opcional)
- Crear script `seed` para insertar roles por defecto y un usuario `ADMIN` inicial.
- Añadir `express-validator` en controladores para validar payloads.
- Añadir tests/smoke scripts y un `postman` collection.

Archivo creado: `README_ROUTES.md`
