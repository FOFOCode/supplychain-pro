SupplyChain Pro — Guía para el Simulador (Camión Virtual)

## 1) Descripción del proyecto (contexto)

El proyecto consiste en un sistema de seguimiento donde el Frontend muestra la hoja de ruta y las condiciones ambientales de cada contenedor de carga.

- El Backend almacena y expone la información (envíos, rutas, telemetría e incidentes) y registra incidentes “tickets” inmutables en MySQL.
- El Simulador actúa como un “camión virtual” que viaja y experimenta cambios (temperatura, batería, desvíos, etc.).

Este proyecto pone a prueba la persistencia y la integridad de los datos. En logística, si la información se pierde, la responsabilidad legal es enorme. El uso de volúmenes de Docker es el protagonista técnico aquí.

## 2) Qué debe hacer el Simulador

El simulador debe ser un servidor Node.js que:

1) Reciba llamadas (desde UI/QA u otro cliente) para:
- Iniciar un viaje de un envío.
- Detener/pausar un viaje.
- Provocar incidentes (por botones/eventos).

2) Mientras el viaje está activo:
- Envíe telemetría periódicamente al Backend mediante `POST /api/registros`.

3) Cuando ocurre un evento de alerta (por lógica del simulador o por botón):
- Cree un “Ticket de Incidencia” llamando al Backend con `POST /api/incidentes`.

Importante:
- El simulador NO escribe directo a la base de datos.
- El ticket de incidencia debe quedar persistido en MySQL con marca de tiempo y no debe “desaparecer” aunque luego el simulador vuelva a valores normales.

## 3) Contrato del Simulador ↔ Backend

### Base URL
- Backend (dev): `http://localhost:${PORT}` (por defecto `3000`)

### 3.1 Envío de telemetría (público)
- Endpoint: `POST /api/registros`
- Auth: No (público para el simulador)
- Content-Type: `application/json`

Payload esperado (ejemplo):

```json
{
	"id_envio": 1,
	"latitud": 13.6890,
	"longitud": -89.1872,
	"temperatura": 6.2,
	"humedad": 75,
	"porcentaje_bateria": 85,
	"marca_tiempo_dispositivo": "2026-05-03T10:00:00.000Z"
}
```

### 3.2 Creación de incidentes (protegido)

- Endpoint: `POST /api/incidentes`
- Auth: Sí (JWT de `ADMIN`)

Payload recomendado (ejemplo):

```json
{
	"id_envio": 1,
	"id_registro_telemetria": 12345,
	"tipo_incidente": "RUPTURA_CADENA_FRIO",
	"valor_registrado": 12.0,
	"valor_limite": 5.0,
	"descripcion": "La temperatura superó el máximo permitido",
	"origen_evento": "SIMULADOR",
	"metadata_json": { "boton": "subir_temperatura", "nota": "evento de prueba" }
}
```

Notas:
- `id_registro_telemetria` puede ser `null` si el incidente se disparó por un botón/evento y no quieres ligarlo a un registro exacto.
- `tipo_incidente` es texto (no ENUM) para permitir agregar nuevos tipos sin migrar schema.

### 3.3 Recuperación tras reinicio (lectura opcional)

Para reanudar un viaje después de un reinicio, el simulador puede consultar el último estado desde el Backend (requiere JWT):

- `GET /api/registros/envio/:id?limit=1`

La persistencia de datos la garantiza MySQL + volumen Docker; el simulador puede usar esta lectura para “retomar” la UI/estado del camión virtual sin saltos.

## 4) Casos de prueba (alertas y persistencia)

### Caso de Alerta 1: Ruptura de cadena de frío

Escenario:
- El camión virtual reporta temperatura de 12°C cuando el máximo permitido del envío es 5°C.

Qué debe pasar:
- El simulador provoca el incidente.
- El backend registra un “Ticket de Incidencia” inmutable con marca de tiempo.
- Aunque luego el camionero (simulado) baje la temperatura, el incidente ya quedó sellado.

Guía práctica:
1) Enviar telemetría normal por `POST /api/registros`.
2) Al presionar el botón de “subir temperatura”, enviar telemetría con `temperatura=12`.
3) Crear incidente con `POST /api/incidentes` y valores (`valor_registrado=12`, `valor_limite=5`).

### Caso de Alerta 2: Reinicio del sistema (persistencia)

Escenario:
- El contenedor/servicio se apaga accidentalmente en mitad del viaje.

Qué debe pasar:
- Al reiniciar con Docker Compose, el sistema recupera la última ubicación y temperatura desde el volumen persistente.
- No se debe “perder” el recorrido (los registros siguen en `registros_telemetria`).

Guía práctica:
1) Durante un viaje, enviar telemetría durante 1–2 minutos.
2) Apagar el stack (backend + mysql) y volver a encender.
3) Verificar que en la base de datos siguen estando los registros.
4) (Opcional) El simulador consulta `GET /api/registros/envio/:id?limit=1` para retomar desde la última muestra.

### Otros ejemplos de incidentes (para botones/eventos)

Estos son ejemplos de incidentes que el simulador puede provocar explícitamente:
- “VIOLACION_GEOFENCE”: el simulador envía coordenadas fuera de un perímetro permitido.
- “BATERIA_BAJA”: el simulador reporta `porcentaje_bateria=5` y además crea el incidente.
- “VOLUMEN_LLENO”: simular que el volumen/almacenamiento de registros se llenó al 100% y crear un incidente informativo.

Nota: En esta versión, si existe lógica de geofence, debe venir del simulador o de reglas externas. El backend se encarga de persistir y exponer los tickets.

## 5) Seguridad (tokens)

- `POST /api/registros` es público por diseño para facilitar la ingesta desde el simulador en entorno local.
- `POST /api/incidentes` requiere token JWT de `ADMIN`. En desarrollo el simulador puede usarlo, pero no debe “hardcodearse” ni exponerse en producción.

## 6) Ejemplos curl (para QA)

Enviar telemetría:

```bash
curl -X POST http://localhost:3000/api/registros \
	-H 'Content-Type: application/json' \
	-d '{"id_envio":1,"latitud":13.6890,"longitud":-89.1872,"temperatura":6.2,"humedad":75,"porcentaje_bateria":85,"marca_tiempo_dispositivo":"2026-05-03T10:00:00.000Z"}'
```

Crear incidente (requiere token ADMIN):

```bash
TOKEN=<token_admin>
curl -X POST http://localhost:3000/api/incidentes \
	-H "Authorization: Bearer $TOKEN" \
	-H 'Content-Type: application/json' \
	-d '{"id_envio":1,"tipo_incidente":"RUPTURA_CADENA_FRIO","valor_registrado":12,"valor_limite":5,"descripcion":"Incidente de prueba","origen_evento":"SIMULADOR","metadata_json":{"boton":"subir_temperatura"}}'
```

---

Documento: README_FOR_SIMULATOR.md
