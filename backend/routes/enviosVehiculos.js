const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/enviosVehiculosController');
const { authenticate } = require('../middlewares/auth');
const requireRole = require('../middlewares/requireRole');

// Listar asignaciones envío-vehículo (lectura)
router.get('/', authenticate, ctrl.listAsignaciones);
// Crear asignación (ADMIN)
router.post('/', authenticate, requireRole('ADMIN'), ctrl.createAsignacion);
// Obtener asignación por id (lectura)
router.get('/:id', authenticate, ctrl.getAsignacion);

module.exports = router;
