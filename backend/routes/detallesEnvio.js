const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/detallesEnvioController');
const { authenticate } = require('../middlewares/auth');
const requireRole = require('../middlewares/requireRole');

// Listar detalles por envío (lectura)
router.get('/', authenticate, ctrl.listDetalles);
// Crear detalle (ADMIN)
router.post('/', authenticate, requireRole('ADMIN'), ctrl.createDetalle);
// Eliminar detalle (ADMIN)
router.delete('/:id', authenticate, requireRole('ADMIN'), ctrl.deleteDetalle);

module.exports = router;
