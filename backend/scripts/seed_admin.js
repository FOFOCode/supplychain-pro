require('dotenv').config();

const bcrypt = require('bcrypt');
const db = require('../config/db');

async function main() {
  const correo = process.env.ADMIN_EMAIL;
  const contrasena = process.env.ADMIN_PASSWORD;
  const nombreCompleto = process.env.ADMIN_NAME || 'Administrador';

  if (!correo || !contrasena) {
    console.error('Faltan variables: ADMIN_EMAIL y ADMIN_PASSWORD (y opcional ADMIN_NAME)');
    process.exit(2);
  }

  await db.query(
    "INSERT IGNORE INTO roles (id_rol, nombre, descripcion) VALUES (1, 'ADMIN', 'Administrador (CRUD completo)'), (2, 'USUARIO', 'Usuario de solo lectura')"
  );

  const [existing] = await db.query('SELECT id_usuario FROM usuarios WHERE correo = ? LIMIT 1', [correo]);
  if (existing.length) {
    console.log(`Usuario admin ya existe: ${correo}`);
    process.exit(0);
  }

  const hash = await bcrypt.hash(contrasena, 10);
  const [result] = await db.query(
    'INSERT INTO usuarios (id_rol, nombre_completo, correo, contrasena_hash, activo) VALUES (?, ?, ?, ?, true)',
    [1, nombreCompleto, correo, hash]
  );

  console.log(`Admin creado id_usuario=${result.insertId} correo=${correo}`);
}

main().catch((err) => {
  console.error('seed_admin error:', err);
  process.exit(1);
});
