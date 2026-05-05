const db = require('../config/db');

exports.listAsignaciones = async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT ev.*, v.placa, e.codigo_rastreo FROM envios_vehiculos ev JOIN vehiculos v ON ev.id_vehiculo = v.id_vehiculo JOIN envios e ON ev.id_envio = e.id_envio ORDER BY fecha_asignacion DESC');
    res.json(rows);
  } catch (err) { next(err); }
};

exports.createAsignacion = async (req, res, next) => {
  try {
    const { id_envio, id_vehiculo } = req.body;
    const [result] = await db.query('INSERT INTO envios_vehiculos (id_envio, id_vehiculo) VALUES (?, ?)', [id_envio, id_vehiculo]);
    res.status(201).json({ id_envio_vehiculo: result.insertId });
  } catch (err) { next(err); }
};

exports.getAsignacion = async (req, res, next) => {
  try {
    const id = req.params.id;
    const [rows] = await db.query('SELECT * FROM envios_vehiculos WHERE id_envio_vehiculo = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Asignación no encontrada' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};
