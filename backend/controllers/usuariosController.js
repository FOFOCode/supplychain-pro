const db = require('../config/db');
const bcrypt = require('bcrypt');

exports.listUsuarios = async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT id_usuario, id_rol, nombre_completo, correo, activo, fecha_creacion, ultimo_acceso FROM usuarios ORDER BY fecha_creacion DESC');
    res.json(rows);
  } catch (err) { next(err); }
};

exports.getUsuario = async (req, res, next) => {
  try {
    const id = req.params.id;
    const [rows] = await db.query('SELECT id_usuario, id_rol, nombre_completo, correo, activo, fecha_creacion, ultimo_acceso FROM usuarios WHERE id_usuario = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};

exports.createUsuario = async (req, res, next) => {
  try {
    const { id_rol, nombre_completo, correo, contrasena } = req.body;
    const hash = await bcrypt.hash(contrasena, 10);
    const [result] = await db.query('INSERT INTO usuarios (id_rol, nombre_completo, correo, contrasena_hash) VALUES (?, ?, ?, ?)', [id_rol, nombre_completo, correo, hash]);
    res.status(201).json({ id_usuario: result.insertId });
  } catch (err) { next(err); }
};

exports.updateUsuario = async (req, res, next) => {
  try {
    const id = req.params.id;
    const fields = { ...req.body };
    if (fields.contrasena) {
      fields.contrasena_hash = await bcrypt.hash(fields.contrasena, 10);
      delete fields.contrasena;
    }
    const keys = Object.keys(fields);
    if (!keys.length) return res.status(400).json({ error: 'No hay campos para actualizar' });
    const values = keys.map(k => fields[k]);
    const set = keys.map(k => `${k} = ?`).join(', ');
    await db.query(`UPDATE usuarios SET ${set} WHERE id_usuario = ?`, [...values, id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
};
