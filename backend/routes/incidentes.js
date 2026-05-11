const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/incidentesController');
const { authenticate } = require('../middlewares/auth');
const requireRole = require('../middlewares/requireRole');

// Listar incidentes (lectura)
router.get('/', authenticate, ctrl.listIncidentes);
// Crear incidente (solo ADMIN o servicio interno)
router.post('/', authenticate, requireRole('ADMIN'), ctrl.createIncidente);
// Obtener incidente (lectura)
router.get('/:id', authenticate, ctrl.getIncidente);

module.exports = router;
