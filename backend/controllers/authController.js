const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.login = async (req, res, next) => {
  try {
    const { correo, contrasena } = req.body;
    if (!correo || !contrasena) return res.status(400).json({ error: 'correo y contrasena son requeridos' });
    const [rows] = await db.query('SELECT u.id_usuario, u.contrasena_hash, r.nombre AS rol, u.nombre_completo FROM usuarios u JOIN roles r ON u.id_rol = r.id_rol WHERE u.correo = ?', [correo]);
    if (!rows.length) return res.status(401).json({ error: 'Credenciales inválidas' });
    const user = rows[0];
    const ok = await bcrypt.compare(contrasena, user.contrasena_hash);
    if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });
    const payload = { id_usuario: user.id_usuario, rol: user.rol };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'change_this_secret', { expiresIn: process.env.JWT_EXPIRY || '8h' });
    res.json({ token, user: { id_usuario: user.id_usuario, nombre_completo: user.nombre_completo, rol: user.rol } });
  } catch (err) { next(err); }
};

exports.me = async (req, res, next) => {
  try {
    // `authenticate` middleware ya puso `req.user`
    const { id_usuario } = req.user;
    const [rows] = await db.query('SELECT id_usuario, id_rol, nombre_completo, correo, activo, fecha_creacion, ultimo_acceso FROM usuarios WHERE id_usuario = ?', [id_usuario]);
    if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};
