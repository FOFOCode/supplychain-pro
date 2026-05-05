const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/rolesController');
const { authenticate } = require('../middlewares/auth');
const requireRole = require('../middlewares/requireRole');

// Listar roles (lectura)
router.get('/', authenticate, ctrl.listRoles);
// Crear rol (ADMIN)
router.post('/', authenticate, requireRole('ADMIN'), ctrl.createRol);

module.exports = router;
