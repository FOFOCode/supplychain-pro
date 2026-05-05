# 📚 Índice de archivos del Simulador

## 🎯 Archivos principales (necesarios para ejecutar)

### `simulator_server.js` ⭐
**Servidor principal del simulador**

- **Qué hace**: Implementa todos los endpoints del simulador
- **Responsabilidades**:
  - Mantiene estado de viajes activos
  - Genera telemetría cada 5 segundos
  - Interpola coordenadas entre waypoints
  - Crea incidentes bajo demanda
  - Se comunica con backend en puerto 3000
- **Tamaño**: ~400 líneas
- **Dependencias**: express, axios
- **Ejecutar**: `npm run sim-server`

---

### `package.json`
**Configuración del proyecto Node.js**

- Versión del proyecto
- Dependencias instaladas (express, axios, dotenv)
- Scripts disponibles:
  - `npm run sim-server` → Inicia el simulador
  - `npm run verify` → Verifica configuración
  - `npm run test-complete` → Ejecuta prueba completa
  - `npm run example-simple` → Ejemplo 1
  - `npm run example-incidents` → Ejemplo 2
  - `npm run example-monitor` → Ejemplo 3

---

### `.env`
**Variables de entorno**

```
SIMULATOR_PORT=3001
BACKEND_URL=http://localhost:3000
ADMIN_EMAIL=admin@supplychain.com
ADMIN_PASSWORD=admin123
```

- Define configuración del simulador
- **NUNCA** compartir en GitHub (añadir a .gitignore)
- Modificar según tu entorno

---

## 🧪 Archivos de prueba y ejemplos

### `test_simulator.js`
**Prueba automatizada completa**

- **Qué hace**: 
  - Crea ruta automáticamente
  - Crea envío
  - Crea vehículo
  - Asigna vehículo
  - Inicia viaje
  - Monitorea por 30 segundos
  - Provoca 2 incidentes
  - Valida datos en BD
- **Usar**: `npm run test-complete`
- **Duración**: ~40 segundos
- **Resultado**: Al final muestra incidentes registrados

---

### `example_usage.js`
**Ejemplos rápidos y simples**

3 ejemplos diferentes:

**Ejemplo 1**: `npm run example-simple`
- Viaje simple sin incidentes
- Dura ~15 segundos
- Muestra progreso

**Ejemplo 2**: `npm run example-incidents`
- Viaje con incidentes provocados
- A los 7 segundos: temperatura alta
- Dura ~20 segundos
- Muestra temperatura elevada

**Ejemplo 3**: `npm run example-monitor`
- Monitoreo continuo
- Registra estado cada 3 segundos
- Dura 15 segundos total

---

### `verify_setup.js`
**Verificación de instalación**

- **Qué hace**:
  - Verifica que existan todos los archivos
  - Verifica dependencias instaladas
  - Verifica configuración en .env
  - Verifica conectividad con backend
- **Usar**: `npm run verify`
- **Cuándo**: Antes de iniciar el simulador
- **Resultado**: 
  - ✅ TODO OK → Puedes iniciar
  - ❌ Errores → Detalla qué falta

---

## 📖 Archivos de documentación

### `README_SIMULATOR.md` 📖
**Documentación completa**

- Características del simulador
- Instalación paso a paso
- Todos los endpoints con ejemplos curl
- Descripciones de cada endpoint
- Casos de uso y pruebas
- Solución de problemas
- **Leer cuando**: Necesitas documentación completa

---

### `QUICK_START.md` 🚀
**Guía de inicio rápido**

- Primeros pasos (3 comandos)
- Ejemplos rápidos con curl
- Verifica que funciona
- Próximos pasos
- **Leer cuando**: Acabas de clonar el proyecto

---

### `ARCHITECTURE.md` 🏗️
**Arquitectura y diseño técnico**

- Diagrama de flujo de datos
- Componentes principales
- Gestión de estado
- Cálculos matemáticos (Haversine, interpolación)
- Tolerancia a fallos
- Decisiones de diseño
- **Leer cuando**: Quieres entender cómo funciona internamente

---

### `FILES.md` 📚
**Este archivo**

- Índice de todos los archivos
- Descripción de cada uno
- Cuándo usar cada archivo

---

## 📊 Estructura del directorio

```
simulator/
│
├── 🎯 ARCHIVOS PRINCIPALES
├── simulator_server.js          ← Servidor (IMPRESCINDIBLE)
├── package.json                 ← Configuración (IMPRESCINDIBLE)
├── .env                         ← Variables (IMPRESCINDIBLE)
│
├── 🧪 ARCHIVOS DE PRUEBA
├── test_simulator.js            ← Prueba completa
├── example_usage.js             ← Ejemplos simples
├── verify_setup.js              ← Verificación
│
├── 📖 DOCUMENTACIÓN
├── README_SIMULATOR.md          ← Doc completa
├── QUICK_START.md               ← Inicio rápido
├── ARCHITECTURE.md              ← Arquitectura
├── FILES.md                     ← Este archivo
│
└── 📦 NODE MODULES (auto-generado)
    └── node_modules/            ← Dependencias instaladas
```

---

## 🚀 Secuencia de uso recomendada

### Primera vez (setup)

```bash
1. npm install
   └─ Instala dependencias

2. npm run verify
   └─ Verifica que todo esté configurado

3. node simulator_server.js
   └─ Inicia el simulador
   └─ Debe mostrar "✓ Token de admin obtenido"
```

### Probar funcionamiento

```bash
1. npm run test-complete
   └─ Prueba todo automáticamente
   └─ Debe mostrar incidentes al final

O

1. npm run example-simple (primer ejemplo)
2. npm run example-incidents (con incidentes)
3. npm run example-monitor (monitoreo)
```

### Uso avanzado

```bash
1. Leer README_SIMULATOR.md para todos los endpoints
2. Hacer llamadas personalizadas con curl
3. Monitorear datos en MySQL en tiempo real
```

---

## 🔑 Puntos clave de cada archivo

| Archivo | Punto clave | Editar? |
|---------|-----------|---------|
| `simulator_server.js` | Lógica principal | Sólo para cambios profundos |
| `.env` | Configuración por entorno | SÍ, personalizar para tu BD |
| `test_simulator.js` | Prueba de concepto | No (salvo experimentar) |
| `example_usage.js` | Aprender API | No (salvo experimentar) |
| `verify_setup.js` | Diagnóstico | No |
| `README_SIMULATOR.md` | Referencia API | Leer |
| `QUICK_START.md` | Primeros pasos | Leer |
| `ARCHITECTURE.md` | Entender diseño | Leer |

---

## 🎓 Cómo leer la documentación

### Si tienes 5 minutos ⏱️
→ Leer `QUICK_START.md`

### Si tienes 15 minutos ⏱️
→ Leer `QUICK_START.md` + ejecutar `npm run test-complete`

### Si tienes 30 minutos ⏱️
→ Leer `QUICK_START.md` + `README_SIMULATOR.md`

### Si tienes 1 hora 📚
→ Leer todo:
- `QUICK_START.md` (inicio)
- `README_SIMULATOR.md` (API)
- `ARCHITECTURE.md` (diseño)
- Examinar `simulator_server.js` (código)

---

## 💡 Casos de uso

### "Quiero iniciar rápido"
```bash
npm run verify
npm run sim-server
# (en otra terminal)
npm run test-complete
```

### "Quiero entender los endpoints"
→ Leer `README_SIMULATOR.md` (sección Endpoints)

### "Quiero saber por qué funciona así"
→ Leer `ARCHITECTURE.md`

### "Quiero ver ejemplos de código"
→ Examinar `example_usage.js`

### "Quiero hacer curl requests"
→ Ver sección en `README_SIMULATOR.md`

### "Quiero entender el código"
→ Leer `simulator_server.js` + `ARCHITECTURE.md`

---

## 🐛 Si algo no funciona

1. Ejecutar `npm run verify`
   - Muestra qué está faltando

2. Leer sección "Solución de problemas" en `README_SIMULATOR.md`
   - Resuelve los errores comunes

3. Revisar `.env`
   - ¿Están correctos BACKEND_URL y credenciales?

4. Verificar que backend esté en línea
   ```bash
   curl http://localhost:3000/api/simulator/health
   ```

---

## 📝 Resumen rápido

```
🎯 EJECUTAR
├── npm run sim-server          ← Iniciar simulador

🧪 PROBAR
├── npm run verify              ← Verificar setup
├── npm run test-complete       ← Prueba completa
├── npm run example-simple      ← Ejemplo 1
├── npm run example-incidents   ← Ejemplo 2
├── npm run example-monitor     ← Ejemplo 3

📖 LEER
├── QUICK_START.md              ← Primeros pasos
├── README_SIMULATOR.md         ← API completa
├── ARCHITECTURE.md             ← Cómo funciona
```

---

**Última actualización:** 2026-05-03  
**Versión:** 1.0.0
