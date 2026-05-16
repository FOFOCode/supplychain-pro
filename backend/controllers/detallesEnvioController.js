const db = require('../config/db');

exports.listDetalles = async (req, res, next) => {
  try {
    const id_envio = req.query.envio;
    if (!id_envio) return res.status(400).json({ error: 'Falta parámetro envio' });
    const [rows] = await db.query('SELECT de.*, p.nombre, p.codigo_sku FROM detalles_envio de JOIN productos p ON de.id_producto = p.id_producto WHERE de.id_envio = ?', [id_envio]);
    res.json(rows);
  } catch (err) { next(err); }
};

exports.createDetalle = async (req, res, next) => {
  try {
    const { id_producto, id_envio, cantidad, peso_kg } = req.body;
    const [result] = await db.query('INSERT INTO detalles_envio (id_producto, id_envio, cantidad, peso_kg) VALUES (?, ?, ?, ?)', [id_producto, id_envio, cantidad, peso_kg]);
    res.status(201).json({ id_detalle_envio: result.insertId });
  } catch (err) { next(err); }
};

exports.deleteDetalle = async (req, res, next) => {
  try {
    const id = req.params.id;
    await db.query('DELETE FROM detalles_envio WHERE id_detalle_envio = ?', [id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
};
