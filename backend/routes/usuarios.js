const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/usuariosController');
const { authenticate } = require('../middlewares/auth');
const requireRole = require('../middlewares/requireRole');

// Listar usuarios (no incluye contrasena) (lectura)
router.get('/', authenticate, ctrl.listUsuarios);
// Obtener usuario (lectura)
router.get('/:id', authenticate, ctrl.getUsuario);
// Crear usuario (ADMIN)
router.post('/', authenticate, requireRole('ADMIN'), ctrl.createUsuario);
// Actualizar usuario (ADMIN)
router.put('/:id', authenticate, requireRole('ADMIN'), ctrl.updateUsuario);

module.exports = router;
