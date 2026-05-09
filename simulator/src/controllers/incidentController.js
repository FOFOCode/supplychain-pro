/**
 * Controlador de incidentes
 */

const axios = require('axios');
const { activeJourneys } = require('./journeyController');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

let adminToken = null;

/**
 * Obtiene token de admin
 */
async function getAdminToken() {
  try {
    const response = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      correo: process.env.ADMIN_EMAIL || 'admin@supplychain.com',
      contrasena: process.env.ADMIN_PASSWORD || 'admin123'
    });
    adminToken = response.data.token;
    console.log('✓ Token de admin obtenido');
    return adminToken;
  } catch (error) {
    console.error('✗ Error obteniendo token de admin:', error.message);
    return null;
  }
}

/**
 * Crea un incidente en el backend
 */
async function crearIncidente(id_envio, tipo, payload) {
  try {
    if (!adminToken) {
      await getAdminToken();
    }

    const response = await axios.post(`${BACKEND_URL}/api/incidentes`, payload, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const journey = activeJourneys.get(id_envio);
    if (journey) {
      journey.incidentes.push({
        tipo,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`🔴 Incidente de ${tipo} creado para envío ${id_envio}`);
    return response.data;
  } catch (error) {
    console.error('Error creando incidente:', error.message);
    throw error;
  }
}

/**
 * Incidente: Temperatura alta
 */
async function incidenteTemperaturaAlta(id_envio) {
  const journey = activeJourneys.get(id_envio);
  if (!journey) throw new Error('Viaje no encontrado');

  journey.telemetria.temperatura = Math.min(journey.tempMax + 7, 25);

  return crearIncidente(id_envio, 'RUPTURA_CADENA_FRIO', {
    id_envio,
    id_registro_telemetria: journey.ultimoIdRegistroTelemetria,
    tipo_incidente: 'RUPTURA_CADENA_FRIO',
    valor_registrado: journey.telemetria.temperatura,
    valor_limite: journey.tempMax,
    descripcion: 'Temperatura excedió el máximo permitido durante el transporte',
    origen_evento: 'SIMULADOR',
    metadata_json: {
      evento: 'temperatura_alta',
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Incidente: Batería baja
 */
async function incidenteBateriaBaja(id_envio) {
  const journey = activeJourneys.get(id_envio);
  if (!journey) throw new Error('Viaje no encontrado');

  journey.telemetria.porcentaje_bateria = 5;

  return crearIncidente(id_envio, 'BATERIA_BAJA', {
    id_envio,
    id_registro_telemetria: journey.ultimoIdRegistroTelemetria,
    tipo_incidente: 'BATERIA_BAJA',
    valor_registrado: journey.telemetria.porcentaje_bateria,
    valor_limite: 10,
    descripcion: 'El dispositivo de monitoreo tiene batería baja',
    origen_evento: 'SIMULADOR',
    metadata_json: {
      evento: 'bateria_baja',
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Incidente: Violación de geofence
 */
async function incidenteGeofenceViolation(id_envio) {
  const journey = activeJourneys.get(id_envio);
  if (!journey) throw new Error('Viaje no encontrado');

  return crearIncidente(id_envio, 'VIOLACION_GEOFENCE', {
    id_envio,
    id_registro_telemetria: journey.ultimoIdRegistroTelemetria,
    tipo_incidente: 'VIOLACION_GEOFENCE',
    descripcion: 'El vehículo se encuentra fuera del perímetro autorizado',
    origen_evento: 'SIMULADOR',
    metadata_json: {
      evento: 'geofence_violation',
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Incidente: Volumen lleno
 */
async function incidenteVolumenLleno(id_envio) {
  const journey = activeJourneys.get(id_envio);
  if (!journey) throw new Error('Viaje no encontrado');

  return crearIncidente(id_envio, 'VOLUMEN_LLENO', {
    id_envio,
    id_registro_telemetria: journey.ultimoIdRegistroTelemetria,
    tipo_incidente: 'VOLUMEN_LLENO',
    descripcion: 'El volumen de almacenamiento del dispositivo está al 100%',
    origen_evento: 'SIMULADOR',
    metadata_json: {
      evento: 'volumen_lleno',
      porcentaje: 100,
      timestamp: new Date().toISOString()
    }
  });
}

module.exports = {
  getAdminToken,
  crearIncidente,
  incidenteTemperaturaAlta,
  incidenteBateriaBaja,
  incidenteGeofenceViolation,
  incidenteVolumenLleno,
  setAdminToken: (token) => { adminToken = token; }
};
