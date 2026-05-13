const db = require('../config/db');

exports.listProductos = async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM productos ORDER BY nombre');
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

exports.getProducto = async (req, res, next) => {
  try {
    const id = req.params.id;
    const [rows] = await db.query('SELECT * FROM productos WHERE id_producto = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.createProducto = async (req, res, next) => {
  try {
    const { codigo_sku, nombre, descripcion } = req.body;
    const [result] = await db.query('INSERT INTO productos (codigo_sku, nombre, descripcion) VALUES (?, ?, ?)', [codigo_sku, nombre, descripcion]);
    res.status(201).json({ id_producto: result.insertId });
  } catch (err) {
    next(err);
  }
};

exports.updateProducto = async (req, res, next) => {
  try {
    const id = req.params.id;
    const fields = req.body;
    const keys = Object.keys(fields);
    if (!keys.length) return res.status(400).json({ error: 'No hay campos para actualizar' });
    const values = keys.map(k => fields[k]);
    const set = keys.map(k => `${k} = ?`).join(', ');
    await db.query(`UPDATE productos SET ${set} WHERE id_producto = ?`, [...values, id]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

exports.deleteProducto = async (req, res, next) => {
  try {
    const id = req.params.id;
    await db.query('DELETE FROM productos WHERE id_producto = ?', [id]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};
