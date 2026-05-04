/**
 * Cliente de prueba para el simulador
 * Uso: node test_simulator.js
 */

const axios = require('axios');

const SIMULATOR_URL = 'http://localhost:3001';
const BACKEND_URL = 'http://localhost:3000';

// Configuración de colores para consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Verificar que el simulador esté en línea
 */
async function verificarSimulador() {
  try {
    const response = await axios.get(`${SIMULATOR_URL}/api/simulator/health`);
    log(colors.green, '✓ Simulador en línea');
    return true;
  } catch (error) {
    log(colors.red, '✗ Simulador no disponible en ' + SIMULATOR_URL);
    return false;
  }
}

/**
 * Crear una ruta en el backend
 */
async function crearRuta() {
  try {
    // Primero, obtener un token (para poder hacer la llamada)
    const loginResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      correo: 'admin@local.test',
      contrasena: 'AdminPass123!'
    });

    const token = loginResponse.data.token;

    const rutaPayload = {
      nombre: 'Ruta CA-4: San Salvador - Puerto de La Libertad (Prueba)',
      waypoints_json: [
        { lat: 13.6800, lng: -89.2300 },
        { lat: 13.6750, lng: -89.2350 },
        { lat: 13.6700, lng: -89.2400 },
        { lat: 13.6650, lng: -89.2450 },
        { lat: 13.6600, lng: -89.2500 },
        { lat: 13.6550, lng: -89.2530 },
        { lat: 13.6500, lng: -89.2560 },
        { lat: 13.6450, lng: -89.2580 },
        { lat: 13.6400, lng: -89.2600 },
        { lat: 13.6300, lng: -89.2630 },
        { lat: 13.6200, lng: -89.2660 },
        { lat: 13.6100, lng: -89.2700 }
      ]
    };

    const response = await axios.post(`${BACKEND_URL}/api/rutas`, rutaPayload, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const id_ruta = response.data.id_ruta;
    log(colors.green, `✓ Ruta creada con ID: ${id_ruta}`);
    return id_ruta;
  } catch (error) {
    log(colors.red, `✗ Error creando ruta: ${error.response?.data?.error || error.message}`);
    return null;
  }
}

/**
 * Crear un envío en el backend
 */
async function crearEnvio(id_ruta) {
  try {
    // Obtener token
    const loginResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      correo: 'admin@local.test',
      contrasena: 'AdminPass123!'
    });

    const token = loginResponse.data.token;

    // Generar código de rastreo único
    const codigo_rastreo = `SHIP-${Date.now()}`;

    const envioPayload = {
      codigo_rastreo,
      origen: 'San Salvador',
      destino: 'Puerto de La Libertad',
      id_ruta,
      temp_max_permitida: 5.0,
      temp_min_permitida: 0.0,
      estado: 'EN_TRANSITO'
    };

    const response = await axios.post(`${BACKEND_URL}/api/envios`, envioPayload, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const id_envio = response.data.id_envio;
    log(colors.green, `✓ Envío creado con ID: ${id_envio}`);
    log(colors.cyan, `   Código de rastreo: ${codigo_rastreo}`);
    return id_envio;
  } catch (error) {
    log(colors.red, `✗ Error creando envío: ${error.response?.data?.error || error.message}`);
    return null;
  }
}

/**
 * Crear un vehículo en el backend
 */
async function crearVehiculo() {
  try {
    // Obtener token
    const loginResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      correo: 'admin@local.test',
      contrasena: 'AdminPass123!'
    });

    const token = loginResponse.data.token;

    const placa = `SV-${Math.random().toString(36).substring(7).toUpperCase()}`;

    const vehiculoPayload = {
      placa,
      activo: true
    };

    const response = await axios.post(`${BACKEND_URL}/api/vehiculos`, vehiculoPayload, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const id_vehiculo = response.data.id_vehiculo;
    log(colors.green, `✓ Vehículo creado con ID: ${id_vehiculo}`);
    log(colors.cyan, `   Placa: ${placa}`);
    return id_vehiculo;
  } catch (error) {
    log(colors.red, `✗ Error creando vehículo: ${error.response?.data?.error || error.message}`);
    return null;
  }
}

/**
 * Asignar vehículo a envío
 */
async function asignarVehiculo(id_envio, id_vehiculo) {
  try {
    // Obtener token
    const loginResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      correo: 'admin@local.test',
      contrasena: 'AdminPass123!'
    });

    const token = loginResponse.data.token;

    const payload = {
      id_envio,
      id_vehiculo
    };

    await axios.post(`${BACKEND_URL}/api/envios-vehiculos`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    });

    log(colors.green, `✓ Vehículo ${id_vehiculo} asignado al envío ${id_envio}`);
  } catch (error) {
    log(colors.red, `✗ Error asignando vehículo: ${error.response?.data?.error || error.message}`);
  }
}

/**
 * Iniciar viaje en el simulador
 */
async function iniciarViaje(id_envio, id_ruta, waypoints) {
  try {
    const payload = {
      id_envio,
      id_ruta,
      temp_min_permitida: 0.0,
      temp_max_permitida: 5.0,
      waypoints
    };

    const response = await axios.post(`${SIMULATOR_URL}/api/simulator/journeys/start`, payload);
    log(colors.green, `✓ Viaje iniciado para envío ${id_envio}`);
    return true;
  } catch (error) {
    log(colors.red, `✗ Error iniciando viaje: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

/**
 * Obtener estado del viaje
 */
async function obtenerEstadoViaje(id_envio) {
  try {
    const response = await axios.get(`${SIMULATOR_URL}/api/simulator/journeys/${id_envio}`);
    const data = response.data;

    log(colors.cyan, `\n📊 Estado del viaje (envío ${id_envio}):`);
    log(colors.cyan, `   - Estado: ${data.estado}`);
    log(colors.cyan, `   - Progreso: ${data.progreso.toFixed(1)}%`);
    log(colors.cyan, `   - Tiempo: ${data.tiempo_transcurrido_seg}s / ${data.duracion_total_seg}s`);
    log(colors.cyan, `   - Temperatura: ${data.telemetria_actual.temperatura.toFixed(2)}°C`);
    log(colors.cyan, `   - Humedad: ${data.telemetria_actual.humedad.toFixed(1)}%`);
    log(colors.cyan, `   - Batería: ${data.telemetria_actual.porcentaje_bateria.toFixed(0)}%`);
    log(colors.cyan, `   - Incidentes: ${data.incidentes.length}`);

    return data;
  } catch (error) {
    log(colors.red, `✗ Error obteniendo estado: ${error.response?.data?.error || error.message}`);
    return null;
  }
}

/**
 * Crear incidente de temperatura alta
 */
async function crearIncidenteTemperatura(id_envio) {
  try {
    await axios.post(`${SIMULATOR_URL}/api/simulator/incidents/${id_envio}/temperatura-alta`);
    log(colors.red, `🔴 Incidente de temperatura alta creado para envío ${id_envio}`);
  } catch (error) {
    log(colors.red, `✗ Error creando incidente: ${error.message}`);
  }
}

/**
 * Crear incidente de batería baja
 */
async function crearIncidenteBateria(id_envio) {
  try {
    await axios.post(`${SIMULATOR_URL}/api/simulator/incidents/${id_envio}/bateria-baja`);
    log(colors.red, `🔴 Incidente de batería baja creado para envío ${id_envio}`);
  } catch (error) {
    log(colors.red, `✗ Error creando incidente: ${error.message}`);
  }
}

/**
 * Obtener incidentes desde el backend
 */
async function obtenerIncidentes(id_envio) {
  try {
    const loginResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      correo: 'admin@local.test',
      contrasena: 'AdminPass123!'
    });

    const token = loginResponse.data.token;

    const response = await axios.get(`${BACKEND_URL}/api/incidentes`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const incidentesEnvio = response.data.filter(i => i.id_envio === id_envio);
    log(colors.blue, `\n🚨 Incidentes registrados (${incidentesEnvio.length}):`);
    incidentesEnvio.forEach(i => {
      log(colors.blue, `   - ${i.tipo_incidente}: ${i.descripcion}`);
    });

    return incidentesEnvio;
  } catch (error) {
    log(colors.red, `✗ Error obteniendo incidentes: ${error.message}`);
    return [];
  }
}

/**
 * Flujo de prueba completo
 */
async function flujoCompleto() {
  log(colors.yellow, '\n========================================');
  log(colors.yellow, 'PRUEBA COMPLETA DEL SIMULADOR');
  log(colors.yellow, '========================================\n');

  // 1. Verificar simulador
  const simuladorOk = await verificarSimulador();
  if (!simuladorOk) process.exit(1);

  // 2. Crear ruta
  log(colors.yellow, '\n📍 Creando ruta...');
  const waypoints = [
    { lat: 13.6800, lng: -89.2300 },
    { lat: 13.6750, lng: -89.2350 },
    { lat: 13.6700, lng: -89.2400 },
    { lat: 13.6650, lng: -89.2450 },
    { lat: 13.6600, lng: -89.2500 },
    { lat: 13.6550, lng: -89.2530 },
    { lat: 13.6500, lng: -89.2560 },
    { lat: 13.6450, lng: -89.2580 },
    { lat: 13.6400, lng: -89.2600 },
    { lat: 13.6300, lng: -89.2630 },
    { lat: 13.6200, lng: -89.2660 },
    { lat: 13.6100, lng: -89.2700 }
  ];

  const id_ruta = await crearRuta();
  if (!id_ruta) process.exit(1);

  // 3. Crear envío
  log(colors.yellow, '\n📦 Creando envío...');
  const id_envio = await crearEnvio(id_ruta);
  if (!id_envio) process.exit(1);

  // 4. Crear vehículo
  log(colors.yellow, '\n🚛 Creando vehículo...');
  const id_vehiculo = await crearVehiculo();
  if (!id_vehiculo) process.exit(1);

  // 5. Asignar vehículo
  log(colors.yellow, '\n🔗 Asignando vehículo...');
  await asignarVehiculo(id_envio, id_vehiculo);

  // 6. Iniciar viaje
  log(colors.yellow, '\n🚀 Iniciando viaje...');
  const viajeIniciado = await iniciarViaje(id_envio, id_ruta, waypoints);
  if (!viajeIniciado) process.exit(1);

  // 7. Monitorear viaje por 30 segundos
  log(colors.yellow, '\n⏱ Monitoreando viaje (30 segundos)...\n');

  for (let i = 0; i < 6; i++) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Esperar 5 segundos
    const estado = await obtenerEstadoViaje(id_envio);

    // Crear incidente a mitad del viaje
    if (i === 2) {
      log(colors.yellow, '\n⚠️ Provocando incidente de temperatura...');
      await crearIncidenteTemperatura(id_envio);
    }

    // Crear otro incidente
    if (i === 4) {
      log(colors.yellow, '\n⚠️ Provocando incidente de batería...');
      await crearIncidenteBateria(id_envio);
    }
  }

  // 8. Obtener incidentes finales
  log(colors.yellow, '\n🔍 Obteniendo incidentes del backend...');
  await obtenerIncidentes(id_envio);

  log(colors.green, '\n✅ Prueba completada exitosamente\n');
}

// Ejecutar
flujoCompleto().catch(error => {
  log(colors.red, `Error fatal: ${error.message}`);
  process.exit(1);
});
