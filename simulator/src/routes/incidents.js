/**
 * Rutas de incidentes
 */

const express = require('express');
const router = express.Router();
const {
  incidenteTemperaturaAlta,
  incidenteBateriaBaja,
  incidenteGeofenceViolation,
  incidenteVolumenLleno
} = require('../controllers/incidentController');

/**
 * POST /api/simulator/incidents/:id_envio/temperatura-alta
 * Simula aumento de temperatura
 */
router.post('/:id_envio/temperatura-alta', async (req, res) => {
  try {
    const { id_envio } = req.params;
    await incidenteTemperaturaAlta(Number(id_envio));
    res.json({ success: true, mensaje: 'Incidente creado' });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/simulator/incidents/:id_envio/bateria-baja
 * Simula batería baja
 */
router.post('/:id_envio/bateria-baja', async (req, res) => {
  try {
    const { id_envio } = req.params;
    await incidenteBateriaBaja(Number(id_envio));
    res.json({ success: true, mensaje: 'Incidente creado' });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/simulator/incidents/:id_envio/geofence-violation
 * Simula violación de geofence
 */
router.post('/:id_envio/geofence-violation', async (req, res) => {
  try {
    const { id_envio } = req.params;
    await incidenteGeofenceViolation(Number(id_envio));
    res.json({ success: true, mensaje: 'Incidente creado' });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/simulator/incidents/:id_envio/volumen-lleno
 * Simula almacenamiento lleno
 */
router.post('/:id_envio/volumen-lleno', async (req, res) => {
  try {
    const { id_envio } = req.params;
    await incidenteVolumenLleno(Number(id_envio));
    res.json({ success: true, mensaje: 'Incidente creado' });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
