const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');

// Login: devuelve JWT
router.post('/login', ctrl.login);
// Obtener datos del usuario autenticado
router.get('/me', authenticate, ctrl.me);

module.exports = router;
