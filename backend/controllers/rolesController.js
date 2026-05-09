const db = require('../config/db');

exports.listRoles = async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM roles ORDER BY nombre');
    res.json(rows);
  } catch (err) { next(err); }
};

exports.createRol = async (req, res, next) => {
  try {
    const { nombre, descripcion } = req.body;
    const [result] = await db.query('INSERT INTO roles (nombre, descripcion) VALUES (?, ?)', [nombre, descripcion]);
    res.status(201).json({ id_rol: result.insertId });
  } catch (err) { next(err); }
};
