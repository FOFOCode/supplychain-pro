## 🚀 Guía de inicio rápido del simulador

### Paso 1: Asegurar que el backend esté en línea

```bash
# Terminal 1 - Backend en puerto 3000
cd backend
npm start
```

Deberías ver:
```
✓ Backend iniciado en puerto 3000
✓ Conectado a MySQL
```

### Paso 2: Iniciar el simulador

```bash
# Terminal 2 - Simulador en puerto 3001
cd simulator
npm run sim-server
```

Deberías ver:
```
🚀 Simulador de Camión iniciado en puerto 3001
📡 Backend URL: http://localhost:3000

✓ Token de admin obtenido
```

### Paso 3: Ejecutar prueba completa

```bash
# Terminal 3 - Cliente de prueba
cd simulator
node test_simulator.js
```

Esto automáticamente:
1. ✓ Crea una ruta
2. ✓ Crea un envío
3. ✓ Crea un vehículo
4. ✓ Asigna el vehículo
5. ✓ Inicia el viaje
6. ✓ Monitorea por 30 segundos
7. ✓ Provoca 2 incidentes
8. ✓ Muestra los incidentes guardados

---

## 📱 Ejemplos rápidos con curl

### 1. Verificar que el simulador está activo

```bash
curl http://localhost:3001/api/simulator/health
```

### 2. Iniciar un viaje

```bash
curl -X POST http://localhost:3001/api/simulator/journeys/start \
  -H 'Content-Type: application/json' \
  -d '{
    "id_envio": 1,
    "id_ruta": 1,
    "temp_min_permitida": 0,
    "temp_max_permitida": 5,
    "waypoints": [
      {"lat": 13.68, "lng": -89.23},
      {"lat": 13.67, "lng": -89.24},
      {"lat": 13.66, "lng": -89.25}
    ]
  }'
```

### 3. Ver estado del viaje

```bash
curl http://localhost:3001/api/simulator/journeys/1
```

Respuesta:
```json
{
  "id_envio": 1,
  "estado": "EN_PROGRESO",
  "progreso": 25.5,
  "tiempo_transcurrido_seg": 7,
  "duracion_total_seg": 30,
  "telemetria_actual": {
    "temperatura": 4.2,
    "humedad": 68.5,
    "porcentaje_bateria": 95
  },
  "incidentes": []
}
```

### 4. Provocar incidente de temperatura alta

```bash
curl -X POST http://localhost:3001/api/simulator/incidents/1/temperatura-alta
```

### 5. Provocar incidente de batería baja

```bash
curl -X POST http://localhost:3001/api/simulator/incidents/1/bateria-baja
```

### 6. Pausar viaje

```bash
curl -X POST http://localhost:3001/api/simulator/journeys/1/pause
```

### 7. Reanudar viaje

```bash
curl -X POST http://localhost:3001/api/simulator/journeys/1/resume
```

### 8. Detener viaje

```bash
curl -X POST http://localhost:3001/api/simulator/journeys/1/stop
```

---

## 🧪 Ejecutar ejemplos rápidos

```bash
# Ejemplo 1: Viaje simple
node example_usage.js 1

# Ejemplo 2: Viaje con incidentes
node example_usage.js 2

# Ejemplo 3: Monitoreo continuo
node example_usage.js 3
```

---

## 📊 Ver datos en la base de datos

Durante un viaje en progreso, abre una terminal MySQL y ejecuta:

```sql
-- Ver telemetría más reciente
SELECT id_registro_telemetria, id_envio, temperatura, humedad, porcentaje_bateria, marca_tiempo_dispositivo
FROM registros_telemetria 
WHERE id_envio = 1 
ORDER BY marca_tiempo_dispositivo DESC 
LIMIT 5;

-- Ver incidentes
SELECT id_incidente, tipo_incidente, valor_registrado, valor_limite, fecha_creacion
FROM incidentes 
WHERE id_envio = 1 
ORDER BY fecha_creacion DESC;
```

---

## 🎯 Flujo de una prueba completa

```
1. Backend 3000 corriendo ✓
2. Simulador 3001 corriendo ✓
3. Ejecutar: node test_simulator.js
   ├─ Crear ruta
   ├─ Crear envío
   ├─ Crear vehículo
   ├─ Asignar vehículo
   ├─ Iniciar viaje
   ├─ Monitorear 30 segundos
   │  ├─ A 7s: Provocar incidente 1
   │  └─ A 20s: Provocar incidente 2
   ├─ Terminar viaje
   └─ Mostrar incidentes guardados
```

---

## ✅ Verificar que funciona

Después de ejecutar `node test_simulator.js`, deberías ver:

```
========================================
PRUEBA COMPLETA DEL SIMULADOR
========================================

✓ Simulador en línea

📍 Creando ruta...
✓ Ruta creada con ID: 1

📦 Creando envío...
✓ Envío creado con ID: 1
   Código de rastreo: SHIP-1714749000000

🚛 Creando vehículo...
✓ Vehículo creado con ID: 1
   Placa: SV-ABC123

🔗 Asignando vehículo...
✓ Vehículo 1 asignado al envío 1

🚀 Iniciando viaje...
✓ Viaje iniciado para envío 1
  - Distancia total: 7.45 km
  - Duración estimada: 30.0 segundos
  - Velocidad: 5.0 km/h

⏱ Monitoreando viaje (30 segundos)...

📊 Estado del viaje (envío 1):
   - Estado: EN_PROGRESO
   - Progreso: 16.7%
   - Tiempo: 5s / 30s
   - Temperatura: 4.20°C
   - Humedad: 68.5%
   - Batería: 100%
   - Incidentes: 0

[... más registros cada 5 segundos ...]

⚠️ Provocando incidente de temperatura...
🔴 Incidente de temperatura alta creado para envío 1

[... más registros ...]

⚠️ Provocando incidente de batería...
🔴 Incidente de batería baja creado para envío 1

🔍 Obteniendo incidentes del backend...

🚨 Incidentes registrados (2):
   - RUPTURA_CADENA_FRIO: Temperatura excedió el máximo permitido durante el transporte
   - BATERIA_BAJA: El dispositivo de monitoreo tiene batería baja

✅ Prueba completada exitosamente
```

---

## 🐛 Si algo no funciona

### Error: "Simulador no disponible"
```bash
# Verificar que está corriendo
npm run sim-server

# Verificar puerto 3001
netstat -an | grep 3001
```

### Error: "✗ Error obteniendo token de admin"
```bash
# Backend debe estar en línea
curl http://localhost:3000/api/simulator/health

# Verificar credenciales en .env
ADMIN_EMAIL=admin@supplychain.com
ADMIN_PASSWORD=admin123
```

### Error: "✗ Error enviando telemetría"
```bash
# Verificar que backend tiene el endpoint
curl http://localhost:3000/api/registros

# Si falla, el backend puede no tener las rutas
```

---

## 📝 Resumen de archivos creados

```
simulator/
├── simulator_server.js       # Servidor principal del simulador ⭐
├── test_simulator.js         # Prueba automatizada completa
├── example_usage.js          # Ejemplos rápidos
├── .env                      # Configuración
├── README_SIMULATOR.md       # Documentación completa
├── QUICK_START.md           # Esta guía
├── package.json
└── package-lock.json
```

---

## 🚀 Próximos pasos

1. **Ejecutar la prueba completa:**
   ```bash
   node test_simulator.js
   ```

2. **Monitorear en MySQL:**
   ```sql
   SELECT * FROM registros_telemetria WHERE id_envio = 1 ORDER BY marca_tiempo_dispositivo DESC LIMIT 10;
   ```

3. **Crear tus propios incidentes:**
   ```bash
   curl -X POST http://localhost:3001/api/simulator/incidents/1/temperatura-alta
   ```

4. **Explorar los endpoints:**
   Revisar `README_SIMULATOR.md` para la documentación completa.

---

**¡Listo para empezar! 🎉**
