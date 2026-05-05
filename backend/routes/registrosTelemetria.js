const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/registrosTelemetriaController');
const { authenticate } = require('../middlewares/auth');

// Insertar nuevo registro de telemetría (público para el simulador)
router.post('/', ctrl.createRegistro);
// Obtener últimos registros por envío (lectura)
router.get('/envio/:id', authenticate, ctrl.listRegistrosPorEnvio);
// Obtener registro por id (lectura)
router.get('/:id', authenticate, ctrl.getRegistro);

module.exports = router;
