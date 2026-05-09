# 🏗️ Arquitectura del Simulador

## Diagrama de flujo de datos

```
┌─────────────────────────────────────────────────────────────┐
│                    SIMULADOR 3001                            │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐ │
│  │              ESTADO DEL VIAJE                         │ │
│  │  - id_envio, waypoints, telemetría actual            │ │
│  │  - temporizadores de telemetría                       │ │
│  │  - incidentes ocurridos                               │ │
│  └───────────────────────────────────────────────────────┘ │
│                        ▼                                     │
│  ┌────────────────────────────────────────────────────────┐│
│  │            CÁLCULOS DE POSICIÓN                        ││
│  │  - Interpolación entre waypoints                      ││
│  │  - Distancia recorrida                                ││
│  │  - Progreso del viaje                                 ││
│  └────────────────────────────────────────────────────────┘│
│                        ▼                                     │
│  ┌────────────────────────────────────────────────────────┐│
│  │        GENERACIÓN DE TELEMETRÍA                        ││
│  │  - Temperatura (con ruido)                            ││
│  │  - Humedad (fluctuante)                               ││
│  │  - Batería (decreciente)                              ││
│  └────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
              ║              ║              ║
              ▼              ▼              ▼
        POST /registros  POST /incidentes  GET endpoints
              │              │              │
              └──────────────┼──────────────┘
                             ▼
         ┌─────────────────────────────────────────┐
         │      BACKEND 3000 (API Gateway)         │
         │                                          │
         │  - Validar datos                        │
         │  - Autenticar (JWT)                     │
         │  - Procesar requests                    │
         └─────────────────────────────────────────┘
                             ▼
         ┌─────────────────────────────────────────┐
         │        MySQL (Persistencia)             │
         │                                          │
         │  - registros_telemetria                 │
         │  - incidentes                           │
         │  - envios                               │
         │  - vehiculos                            │
         │  - rutas                                │
         └─────────────────────────────────────────┘
```

---

## Componentes principales

### 1. **Simulador (simulator_server.js)**

#### Responsabilidades:
- Mantener estado de viajes en progreso
- Generar telemetría periódicamente
- Interpolar coordenadas entre waypoints
- Provocar incidentes bajo demanda
- Comunicarse con el backend

#### Flujo de un viaje:

```
iniciarViaje()
    ↓
└─ Crear entrada en activeJourneys
└─ Calcular duración (basada en distancia)
└─ Iniciar intervalo de telemetría
    ↓
[CADA 5 SEGUNDOS]
├─ Calcular progreso (0-100%)
├─ Interpolar posición
├─ Generar telemetría
├─ Enviar POST /api/registros al backend
└─ Continuar hasta progreso = 100%
    ↓
finalizarViaje()
└─ Detener intervalo
└─ Marcar como FINALIZADO
```

### 2. **Telemetría**

Se genera automáticamente cada 5 segundos:

```javascript
{
  id_envio: 1,
  latitud: 13.6850,           // Interpolada
  longitud: -89.2250,         // Interpolada
  temperatura: 4.2,           // Ruido: ±0.5°C
  humedad: 68.5,              // Ruido: ±2%
  porcentaje_bateria: 95,     // Decrece 0-0.5% por intervalo
  marca_tiempo_dispositivo: "2026-05-03T15:30:00Z"
}
```

### 3. **Incidentes**

Creados bajo demanda cuando se llama a los endpoints:

```javascript
{
  id_envio: 1,
  tipo_incidente: "RUPTURA_CADENA_FRIO",
  valor_registrado: 12.0,
  valor_limite: 5.0,
  descripcion: "...",
  origen_evento: "SIMULADOR",
  metadata_json: { ... }
}
```

Los incidentes afectan la telemetría inmediatamente:
- `temperatura-alta` → eleva temperatura a 12°C
- `bateria-baja` → reduce batería a 5%

---

## Gestión del estado

### activeJourneys (Map)

```javascript
activeJourneys = Map {
  1 => {
    id_envio: 1,
    estado: 'EN_PROGRESO',
    waypoints: [...],
    telemetria: { temperatura, humedad, bateria },
    telemetryInterval: <setInterval ID>,
    startTime: <timestamp>,
    duracionTotal: 30 (segundos),
    incidentes: [
      { tipo: 'RUPTURA_CADENA_FRIO', timestamp: '...' }
    ]
  }
}
```

### Estados posibles:
- **EN_PROGRESO**: Viaje activo, generando telemetría
- **PAUSADO**: Viaje pausado, sin generar telemetría
- **FINALIZADO**: Viaje terminado
- **CANCELADO**: Viaje detenido por el usuario

---

## Endpoints del Simulador

### Viajes

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/simulator/journeys/start` | Iniciar viaje |
| GET | `/api/simulator/journeys` | Listar viajes activos |
| GET | `/api/simulator/journeys/:id` | Obtener detalles del viaje |
| POST | `/api/simulator/journeys/:id/pause` | Pausar viaje |
| POST | `/api/simulator/journeys/:id/resume` | Reanudar viaje |
| POST | `/api/simulator/journeys/:id/stop` | Detener viaje |

### Incidentes

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/simulator/incidents/:id/temperatura-alta` | Ruptura de cadena de frío |
| POST | `/api/simulator/incidents/:id/bateria-baja` | Batería baja |
| POST | `/api/simulator/incidents/:id/geofence-violation` | Violación de perímetro |
| POST | `/api/simulator/incidents/:id/volumen-lleno` | Almacenamiento lleno |

### Utilidad

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/simulator/health` | Verificar salud |

---

## Cálculos matemáticos

### 1. Distancia Haversine

```javascript
function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la tierra en km
  const dLat = (lat2 - lat1) * π / 180;
  const dLon = (lon2 - lon1) * π / 180;
  
  const a = sin²(dLat/2) + cos(lat1*π/180) * cos(lat2*π/180) * sin²(dLon/2);
  const c = 2 * atan2(√a, √(1-a));
  
  return R * c; // en km
}
```

### 2. Interpolación lineal

```javascript
function interpolarPunto(punto1, punto2, progreso) {
  return {
    lat: punto1.lat + (punto2.lat - punto1.lat) * progreso,
    lng: punto1.lng + (punto2.lng - punto1.lng) * progreso
  };
}
```

### 3. Cálculo de progreso

```javascript
progreso = (tiempoTranscurrido / duracionTotal) * 100
```

---

## Flujo de comunicación con Backend

```
1. POST /api/simulator/journeys/start
   ├─ Simulador crea entrada en activeJourneys
   └─ Respuesta: { success: true, id_envio }

2. Cada 5 segundos: POST /api/registros
   ├─ Datos: { id_envio, lat, lng, temp, humedad, bateria, timestamp }
   ├─ Backend valida y guarda en registros_telemetria
   └─ Respuesta: { id_registro_telemetria }

3. POST /api/simulator/incidents/:id/temperatura-alta
   ├─ Backend crea incidente con tipo 'RUPTURA_CADENA_FRIO'
   ├─ Marca de tiempo inmutable
   └─ Respuesta: { id_incidente }

4. GET /api/simulator/journeys/:id
   └─ Devuelve estado actual desde activeJourneys
```

---

## Tolerancia a fallos

### Reinicio del Simulador

```
Antes: Simulador 3001 se apaga
Estado: activeJourneys se pierde (es en-memoria)

Después: Se reinicia simulador_server.js
Problema: No recuerda viajes en progreso
Solución: El usuario debe iniciar nuevamente

Nota: Los registros de telemetría E incidentes se guardan
      en MySQL, así que NO se pierden datos.
```

### Reinicio del Backend

```
Antes: Backend 3000 se apaga
Estado: Simulador sigue generando telemetría

Cuando se apaga:
├─ POST /api/registros falla
├─ POST /api/incidentes falla
└─ Simulador sigue en memoria

Cuando vuelve a encender:
├─ Simulador reintenta enviar telemetría
├─ Los datos se guardan en MySQL
└─ Sin pérdida de datos (MySQL está en volumen)
```

### Reinicio de MySQL

```
Antes: MySQL se apaga
Datos: En volumen persistente de Docker

Cuando vuelve a encender:
└─ Todos los datos se recuperan del volumen
   (registros_telemetria, incidentes, etc.)

CRÍTICO: Usar volumen -v /var/lib/mysql para persistencia
```

---

## Optimizaciones y decisiones de diseño

### 1. **En-memoria vs Persistente**

- **En-memoria (activeJourneys)**: 
  - Rápido, sin latencia
  - Se pierde si simulador reinicia
  - Adecuado para viajes actuales

- **Persistente (MySQL)**:
  - Dato definitivo
  - Recuperable
  - Adecuado para histórico

### 2. **Telemetría cada 5 segundos**

- Balance entre precisión y volumen de datos
- ~12 registros por minuto de viaje
- Si viaje de 30 min: ~360 registros
- Manejable para MySQL

### 3. **Interpolación de waypoints**

- Los waypoints son "puntos de control", no la ruta exacta
- Interpolación lineal es suficiente para simulación
- En producción usarías mapas reales (Google Maps API)

### 4. **Incidentes bajo demanda**

- No se generan automáticamente
- El usuario/QA decide cuándo provocar
- Permite control total de escenarios de prueba

---

## Flujo de prueba completo

```
┌────────────────────────────────────────────────────┐
│ 1. Verificar Backend (puerto 3000)                 │
│    - Debe responder a salud                        │
│    - Debe tener auth funcionando                   │
└────────────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────┐
│ 2. Iniciar Simulador (puerto 3001)                 │
│    - Obtener token JWT                            │
│    - Verificar conectividad con backend           │
└────────────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────┐
│ 3. Crear datos en Backend                          │
│    - POST /api/rutas (crear ruta)                 │
│    - POST /api/envios (crear envío)               │
│    - POST /api/vehiculos (crear vehículo)         │
│    - POST /api/envios-vehiculos (asignar)         │
└────────────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────┐
│ 4. Iniciar viaje en Simulador                      │
│    - POST /simulator/journeys/start                │
│    - activeJourneys entra en estado EN_PROGRESO   │
└────────────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────┐
│ 5. Generar telemetría (cada 5 seg)                 │
│    - POST /api/registros → MySQL                  │
│    - 6 registros en 30 segundos                    │
└────────────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────┐
│ 6. Crear incidentes bajo demanda                   │
│    - POST /simulator/incidents/:id/temperatura     │
│    - POST /api/incidentes → MySQL                 │
│    - Afectan telemetría siguiente                 │
└────────────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────┐
│ 7. Verificar datos en MySQL                        │
│    - SELECT FROM registros_telemetria             │
│    - SELECT FROM incidentes                        │
│    - Validar que no hay pérdida de datos          │
└────────────────────────────────────────────────────┘
```

---

## Variables de entorno

```bash
SIMULATOR_PORT=3001              # Puerto donde escucha el simulador
BACKEND_URL=http://localhost:3000 # URL del backend
ADMIN_EMAIL=admin@supplychain.com  # Para obtener token
ADMIN_PASSWORD=admin123            # Para obtener token
TELEMETRY_INTERVAL=5000           # Cada 5 segundos
MIN_JOURNEY_DURATION=10            # Mínimo 10 segundos
```

---

**Última actualización:** 2026-05-03
