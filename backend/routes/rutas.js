const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/rutasController');
const { authenticate } = require('../middlewares/auth');
const requireRole = require('../middlewares/requireRole');

// Listar rutas (lectura)
router.get('/', authenticate, ctrl.listRutas);
// Crear ruta (ADMIN)
router.post('/', authenticate, requireRole('ADMIN'), ctrl.createRuta);
// Obtener ruta (lectura)
router.get('/:id', authenticate, ctrl.getRuta);

module.exports = router;
