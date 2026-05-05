const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/productosController');
const { authenticate } = require('../middlewares/auth');
const requireRole = require('../middlewares/requireRole');

// Listar productos (lectura)
router.get('/', authenticate, ctrl.listProductos);
// Obtener producto (lectura)
router.get('/:id', authenticate, ctrl.getProducto);
// Crear producto (ADMIN)
router.post('/', authenticate, requireRole('ADMIN'), ctrl.createProducto);
// Actualizar producto (ADMIN)
router.put('/:id', authenticate, requireRole('ADMIN'), ctrl.updateProducto);
// Eliminar producto (ADMIN)
router.delete('/:id', authenticate, requireRole('ADMIN'), ctrl.deleteProducto);

module.exports = router;
