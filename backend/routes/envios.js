const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/enviosController');
const { authenticate } = require('../middlewares/auth');
const requireRole = require('../middlewares/requireRole');

// Lista de envíos (lectura: requiere autenticación)
router.get('/', authenticate, ctrl.listEnvios);
// Obtener un envío por id (lectura)
router.get('/:id', authenticate, ctrl.getEnvio);
// Crear nuevo envío (escritura: solo ADMIN)
router.post('/', authenticate, requireRole('ADMIN'), ctrl.createEnvio);
// Actualizar envío (escritura: solo ADMIN)
router.put('/:id', authenticate, requireRole('ADMIN'), ctrl.updateEnvio);
// Eliminar envío (escritura: solo ADMIN)
router.delete('/:id', authenticate, requireRole('ADMIN'), ctrl.deleteEnvio);

module.exports = router;
