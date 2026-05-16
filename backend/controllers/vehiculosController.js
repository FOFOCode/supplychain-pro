const db = require('../config/db');

exports.listVehiculos = async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM vehiculos ORDER BY id_vehiculo');
    res.json(rows);
  } catch (err) { next(err); }
};

exports.getVehiculo = async (req, res, next) => {
  try {
    const id = req.params.id;
    const [rows] = await db.query('SELECT * FROM vehiculos WHERE id_vehiculo = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Vehículo no encontrado' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};

exports.createVehiculo = async (req, res, next) => {
  try {
    const { placa, activo } = req.body;
    const [result] = await db.query('INSERT INTO vehiculos (placa, activo) VALUES (?, ?)', [placa, activo ?? true]);
    res.status(201).json({ id_vehiculo: result.insertId });
  } catch (err) { next(err); }
};

exports.updateVehiculo = async (req, res, next) => {
  try {
    const id = req.params.id;
    const fields = req.body;
    const keys = Object.keys(fields);
    if (!keys.length) return res.status(400).json({ error: 'No hay campos para actualizar' });
    const values = keys.map(k => fields[k]);
    const set = keys.map(k => `${k} = ?`).join(', ');
    await db.query(`UPDATE vehiculos SET ${set} WHERE id_vehiculo = ?`, [...values, id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
};

exports.deleteVehiculo = async (req, res, next) => {
  try {
    const id = req.params.id;
    await db.query('DELETE FROM vehiculos WHERE id_vehiculo = ?', [id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
};
