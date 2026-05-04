# 📁 Estructura del Simulador Refactorizado

## Organización actual

```
simulator/
│
├── src/                          # Código fuente (NUEVO)
│   ├── server.js                 # Punto de entrada principal
│   │
│   ├── routes/                   # Rutas (endpoints)
│   │   ├── journeys.js           # Endpoints de viajes
│   │   └── incidents.js          # Endpoints de incidentes
│   │
│   ├── controllers/              # Lógica de negocio
│   │   ├── journeyController.js  # Gestión de viajes
│   │   └── incidentController.js # Gestión de incidentes
│   │
│   ├── utils/                    # Utilidades
│   │   ├── calculations.js       # Cálculos (distancia, interpolación)
│   │   └── telemetry.js          # Generación de telemetría
│   │
│   └── config/                   # Configuración (para futuro)
│
├── 📄 Archivos de configuración
├── .env                          # Variables de entorno
├── package.json                  # Dependencias y scripts
│
├── 📄 Archivos de prueba
├── test_simulator.js             # Prueba completa
├── setup_admin.js                # Setup de admin
│
├── 📖 Documentación
├── README_SIMULATOR.md           # Documentación completa
├── QUICK_START.md                # Guía rápida
│
└── node_modules/                 # Dependencias (npm install)
```

---

## Ventajas de esta estructura

✅ **Modular**: Cada componente tiene una responsabilidad clara  
✅ **Escalable**: Fácil agregar nuevas rutas y controladores  
✅ **Mantenible**: Código organizado y fácil de navegar  
✅ **Testeable**: Componentes separados son más fáciles de probar  
✅ **Limpio**: La raíz del proyecto solo tiene archivos esenciales  

---

## Flujo de datos

```
Request HTTP
    ↓
server.js (Express)
    ↓
routes/journeys.js o routes/incidents.js
    ↓
controllers/journeyController.js o controllers/incidentController.js
    ↓
utils/calculations.js y utils/telemetry.js
    ↓
Response JSON
```

---

## Cómo ejecutar

```bash
# Instalar dependencias
npm install

# Iniciar servidor
npm run sim-server

# Ejecutar prueba
npm run test-complete

# Setup admin
npm run setup-admin
```

---

## Estructura de directorios para futuras expansiones

```
src/
├── routes/
│   ├── journeys.js
│   ├── incidents.js
│   └── status.js          # (futuro)
│
├── controllers/
│   ├── journeyController.js
│   ├── incidentController.js
│   └── statusController.js  # (futuro)
│
├── utils/
│   ├── calculations.js
│   ├── telemetry.js
│   ├── logger.js            # (futuro)
│   └── validators.js        # (futuro)
│
├── middleware/
│   ├── auth.js              # (futuro)
│   └── errorHandler.js      # (futuro)
│
└── models/
    ├── Journey.js           # (futuro)
    └── Incident.js          # (futuro)
```

---

**Última actualización**: 2026-05-03
