const db = require('../config/db');

exports.createRegistro = async (req, res, next) => {
  try {
    const { id_envio, latitud, longitud, temperatura, humedad, porcentaje_bateria, marca_tiempo_dispositivo } = req.body;
    const [result] = await db.query(
      'INSERT INTO registros_telemetria (id_envio, latitud, longitud, temperatura, humedad, porcentaje_bateria, marca_tiempo_dispositivo) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id_envio, latitud, longitud, temperatura, humedad, porcentaje_bateria, marca_tiempo_dispositivo]
    );
    res.status(201).json({ id_registro_telemetria: result.insertId });
  } catch (err) { next(err); }
};

exports.getRegistro = async (req, res, next) => {
  try {
    const id = req.params.id;
    const [rows] = await db.query('SELECT * FROM registros_telemetria WHERE id_registro_telemetria = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Registro no encontrado' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};

exports.listRegistrosPorEnvio = async (req, res, next) => {
  try {
    const id = req.params.id;
    const limit = parseInt(req.query.limit || '100', 10);
    const since = req.query.since; // ISO timestamp optional
    let sql = 'SELECT * FROM registros_telemetria WHERE id_envio = ?';
    const params = [id];
    if (since) { sql += ' AND marca_tiempo_dispositivo >= ?'; params.push(since); }
    sql += ' ORDER BY marca_tiempo_dispositivo DESC LIMIT ?'; params.push(limit);
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) { next(err); }
};
