const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/vehiculosController');
const { authenticate } = require('../middlewares/auth');
const requireRole = require('../middlewares/requireRole');

// Listar vehículos (lectura)
router.get('/', authenticate, ctrl.listVehiculos);
// Obtener vehículo por id (lectura)
router.get('/:id', authenticate, ctrl.getVehiculo);
// Crear vehículo (ADMIN)
router.post('/', authenticate, requireRole('ADMIN'), ctrl.createVehiculo);
// Actualizar vehículo (ADMIN)
router.put('/:id', authenticate, requireRole('ADMIN'), ctrl.updateVehiculo);
// Eliminar vehículo (ADMIN)
router.delete('/:id', authenticate, requireRole('ADMIN'), ctrl.deleteVehiculo);

module.exports = router;
