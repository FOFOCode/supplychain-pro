# 🚛 Simulador de Camión Virtual - SupplyChain Pro

## Descripción

El simulador es un servidor Node.js que se ejecuta en el puerto **3001** y actúa como un "camión virtual" que realiza viajes, registra telemetría en intervalos de 5 segundos, y puede provocar incidentes durante el transporte.

El simulador **NO escribe directamente en la base de datos**. Todas las operaciones se hacen a través de llamadas HTTP al servidor backend (puerto 3000), garantizando integridad y rastreabilidad completa.

---

## 📋 Características

✅ **Simulación de viajes** con duración basada en distancia  
✅ **Telemetría automática** cada 5 segundos  
✅ **Generación de incidentes** bajo demanda  
✅ **Persistencia de datos** en MySQL a través del backend  
✅ **Recuperación ante reinicios** del sistema  
✅ **Monitoreo en tiempo real** del estado de viajes  

---

## 🚀 Instalación y configuración

### 1. Instalar dependencias

```bash
cd simulator
npm install
```

### 2. Configurar variables de entorno

Crear/editar archivo `.env` en la carpeta `simulator`:

```env
SIMULATOR_PORT=3001
BACKEND_URL=http://localhost:3000
ADMIN_EMAIL=admin@supplychain.com
ADMIN_PASSWORD=admin123
TELEMETRY_INTERVAL=5000
MIN_JOURNEY_DURATION=10
```

### 3. Iniciar el simulador

```bash
npm run sim-server
```

O:

```bash
node simulator_server.js
```

Se debe ver un mensaje como:

```
🚀 Simulador de Camión iniciado en puerto 3001
📡 Backend URL: http://localhost:3000

✓ Token de admin obtenido
```

---

## 📡 Endpoints del simulador

### 1. Verificar salud

**GET** `/api/simulator/health`

```bash
curl http://localhost:3001/api/simulator/health
```

Respuesta:

```json
{
  "status": "ok",
  "viajesActivos": 1,
  "timestamp": "2026-05-03T15:30:00.000Z"
}
```

---

### 2. Iniciar viaje

**POST** `/api/simulator/journeys/start`

Inicia un viaje nuevo para un envío. El viaje durará como mínimo 10-30 segundos según la distancia de la ruta.

**Body:**

```json
{
  "id_envio": 1,
  "id_ruta": 1,
  "temp_min_permitida": 0.0,
  "temp_max_permitida": 5.0,
  "waypoints": [
    { "lat": 13.6800, "lng": -89.2300 },
    { "lat": 13.6750, "lng": -89.2350 },
    { "lat": 13.6700, "lng": -89.2400 }
  ]
}
```

**Respuesta:**

```json
{
  "success": true,
  "id_envio": 1,
  "mensaje": "Viaje iniciado"
}
```

---

### 3. Obtener estado del viaje

**GET** `/api/simulator/journeys/:id_envio`

```bash
curl http://localhost:3001/api/simulator/journeys/1
```

Respuesta:

```json
{
  "id_envio": 1,
  "estado": "EN_PROGRESO",
  "progreso": 45.5,
  "tiempo_transcurrido_seg": 13,
  "duracion_total_seg": 30,
  "telemetria_actual": {
    "temperatura": 4.2,
    "humedad": 68.5,
    "porcentaje_bateria": 95
  },
  "incidentes": []
}
```

---

### 4. Listar viajes activos

**GET** `/api/simulator/journeys`

```bash
curl http://localhost:3001/api/simulator/journeys
```

Respuesta:

```json
{
  "viajes": [
    {
      "id_envio": 1,
      "estado": "EN_PROGRESO",
      "distancia_km": "7.45",
      "temperatura": "4.20",
      "bateria": 95,
      "incidentes": 0
    }
  ]
}
```

---

### 5. Pausar viaje

**POST** `/api/simulator/journeys/:id_envio/pause`

```bash
curl -X POST http://localhost:3001/api/simulator/journeys/1/pause
```

---

### 6. Reanudar viaje

**POST** `/api/simulator/journeys/:id_envio/resume`

```bash
curl -X POST http://localhost:3001/api/simulator/journeys/1/resume
```

---

### 7. Detener viaje

**POST** `/api/simulator/journeys/:id_envio/stop`

```bash
curl -X POST http://localhost:3001/api/simulator/journeys/1/stop
```

---

## 🔴 Endpoints de incidentes

Todos estos endpoints **crean un incidente en la base de datos** y afectan la telemetría inmediatamente.

### 1. Temperatura alta (Ruptura de cadena de frío)

**POST** `/api/simulator/incidents/:id_envio/temperatura-alta`

```bash
curl -X POST http://localhost:3001/api/simulator/incidents/1/temperatura-alta
```

**Efecto:** La temperatura se eleva a 12°C (o superior al máximo permitido).

---

### 2. Batería baja

**POST** `/api/simulator/incidents/:id_envio/bateria-baja`

```bash
curl -X POST http://localhost:3001/api/simulator/incidents/1/bateria-baja
```

**Efecto:** El porcentaje de batería baja a 5%.

---

### 3. Violación de geofence

**POST** `/api/simulator/incidents/:id_envio/geofence-violation`

```bash
curl -X POST http://localhost:3001/api/simulator/incidents/1/geofence-violation
```

---

### 4. Volumen lleno

**POST** `/api/simulator/incidents/:id_envio/volumen-lleno`

```bash
curl -X POST http://localhost:3001/api/simulator/incidents/1/volumen-lleno
```

---

## 🧪 Prueba completa

Se incluye un cliente de prueba que automatiza todo el flujo:

```bash
node test_simulator.js
```

Este script:
1. ✓ Crea una ruta
2. ✓ Crea un envío
3. ✓ Crea un vehículo
4. ✓ Asigna el vehículo al envío
5. ✓ Inicia el viaje en el simulador
6. ✓ Monitorea el viaje durante 30 segundos
7. ✓ Provoca incidentes a mitad del viaje
8. ✓ Muestra los incidentes registrados en la base de datos

---

## 📊 Flujo de datos

```
┌─────────────────┐
│  Simulador 3001 │
└────────┬────────┘
         │ POST /api/registros (telemetría)
         │ POST /api/incidentes (incidentes)
         ↓
┌─────────────────────┐       ┌──────────────┐
│  Backend 3000       │───→   │ MySQL        │
│  (API Gateway)      │       │ (Persistencia)
└─────────────────────┘       └──────────────┘
```

---

## 🔍 Observar telemetría en la base de datos

Mientras el viaje está en curso, puedes consultar los registros:

```sql
SELECT * FROM registros_telemetria 
WHERE id_envio = 1 
ORDER BY marca_tiempo_dispositivo DESC 
LIMIT 10;
```

Verás algo como:

```
| id_registro | id_envio | latitud    | longitud   | temperatura | humedad | bateria | marca_tiempo_dispositivo |
|-------------|----------|-----------|------------|-------------|---------|---------|--------------------------|
| 6           | 1        | 13.620000 | -89.260000 | 4.50        | 65.2    | 95      | 2026-05-03 15:30:30      |
| 5           | 1        | 13.622000 | -89.258000 | 4.60        | 65.0    | 96      | 2026-05-03 15:30:25      |
| 4           | 1        | 13.624000 | -89.256000 | 4.70        | 64.8    | 97      | 2026-05-03 15:30:20      |
```

---

## 🎯 Casos de prueba

### Caso 1: Ruptura de cadena de frío

```bash
# 1. Iniciar viaje
curl -X POST http://localhost:3001/api/simulator/journeys/start \
  -H 'Content-Type: application/json' \
  -d '{
    "id_envio": 1,
    "id_ruta": 1,
    "temp_min_permitida": 0,
    "temp_max_permitida": 5,
    "waypoints": [...]
  }'

# 2. A los 10 segundos, provocar incidente
sleep 10
curl -X POST http://localhost:3001/api/simulator/incidents/1/temperatura-alta

# 3. Verificar incidentes en la BD
SELECT * FROM incidentes WHERE id_envio = 1;
```

### Caso 2: Persistencia ante reinicio

```bash
# 1. Iniciar viaje
curl -X POST http://localhost:3001/api/simulator/journeys/start ...

# 2. Después de 5 segundos, apagar el backend
# docker-compose down

# 3. Verificar que los datos siguen en la BD
SELECT COUNT(*) FROM registros_telemetria WHERE id_envio = 1;

# 4. Reiniciar backend
# docker-compose up

# 5. El simulador reanudará desde donde quedó
```

---

## 📝 Notas importantes

- **El simulador NO elimina datos**: Los viajes antiguos siguen en la base de datos
- **Telemetría cada 5 segundos**: Se crea un registro nuevo cada 5 segundos de viaje
- **Incidentes inmutables**: Una vez creado un incidente, no puede borrarse (solo agregarse más)
- **Token JWT**: El simulador obtiene automáticamente el token de admin al iniciarse
- **Duración mínima**: Un viaje siempre dura al menos 10 segundos para permitir múltiples registros

---

## 🐛 Solución de problemas

### "✗ Simulador no disponible"

```bash
# Asegúrate de que el simulador esté corriendo
node simulator_server.js

# Verifica el puerto 3001
netstat -tuln | grep 3001
```

### "✗ Error obteniendo token de admin"

```bash
# Verifica que el backend esté en línea
curl http://localhost:3000/api/simulator/health

# Verifica las credenciales en .env
ADMIN_EMAIL=admin@supplychain.com
ADMIN_PASSWORD=admin123
```

### "✗ Error enviando telemetría"

```bash
# El backend debe tener la ruta /api/registros disponible
# Verifica que el backend esté en línea
curl http://localhost:3000/health
```

---

## 📚 Estructura del código

```
simulator/
├── simulator_server.js       # Servidor principal
├── test_simulator.js         # Cliente de prueba
├── .env                      # Configuración
├── package.json
└── README.md                 # Este archivo
```

---

## 🚀 Mejoras futuras

- [ ] Persistencia de estado del simulador en archivo JSON
- [ ] Reanudar viajes después de reinicio del simulador
- [ ] Más tipos de incidentes configurables
- [ ] Dashboard web para monitoreo en tiempo real
- [ ] Simulación de múltiples viajes concurrentes
- [ ] Exportar datos a CSV/JSON

---

**Autor:** Sistema SupplyChain Pro  
**Última actualización:** 2026-05-03
