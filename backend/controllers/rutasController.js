const db = require('../config/db');

exports.listRutas = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT id_ruta, nombre, waypoints_json, fecha_creacion FROM rutas ORDER BY id_ruta DESC LIMIT 200'
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

exports.createRuta = async (req, res, next) => {
  try {
    // Esquema simple: { nombre, waypoints_json }
    const { nombre, waypoints_json } = req.body;
    if (!nombre) return res.status(400).json({ error: 'Falta nombre de la ruta' });

    if (waypoints_json === undefined || waypoints_json === null) {
      return res.status(400).json({ error: 'Falta waypoints_json' });
    }

    const waypointsPayload = typeof waypoints_json === 'string' ? waypoints_json : JSON.stringify(waypoints_json);

    const [result] = await db.query(
      'INSERT INTO rutas (nombre, waypoints_json) VALUES (?, ?)',
      [nombre, waypointsPayload]
    );
    res.status(201).json({ id_ruta: result.insertId });
  } catch (err) {
    next(err);
  }
};

exports.getRuta = async (req, res, next) => {
  try {
    const id = req.params.id;
    const [rows] = await db.query('SELECT * FROM rutas WHERE id_ruta = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Ruta no encontrada' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};
