require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

const DB = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'supplychange',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
};

const ADMIN = {
  correo: process.env.ADMIN_EMAIL || 'admin@local.test',
  contrasena: process.env.ADMIN_PASS || 'AdminPass123!',
  nombre_completo: process.env.ADMIN_NAME || 'Admin Inicial'
};

async function createAdmin() {
  const conn = await mysql.createConnection({ host: DB.host, user: DB.user, password: DB.password, database: DB.database, port: DB.port });
  try {
    console.log('Ensuring role ADMIN exists...');
    await conn.execute('INSERT IGNORE INTO roles (nombre, descripcion) VALUES (?, ?)', ['ADMIN', 'Rol administrador']);

    const [roles] = await conn.execute('SELECT id_rol FROM roles WHERE nombre = ? LIMIT 1', ['ADMIN']);
    if (!roles || roles.length === 0) throw new Error('ADMIN role not found after insert');
    const id_rol = roles[0].id_rol;

    // Hash password
    const hash = await bcrypt.hash(ADMIN.contrasena, 10);

    console.log('Creating admin user (if not exists)...');
    const [res] = await conn.execute('INSERT IGNORE INTO usuarios (id_rol, nombre_completo, correo, contrasena_hash, activo) VALUES (?, ?, ?, ?, 1)', [id_rol, ADMIN.nombre_completo, ADMIN.correo, hash]);

    // Check if inserted
    if (res && res.affectedRows && res.affectedRows > 0) console.log('Admin user created.');
    else console.log('Admin user already existed (no changes made).');

    console.log('Admin credentials:');
    console.log('  correo:', ADMIN.correo);
    console.log('  contrasena:', ADMIN.contrasena);
  } finally {
    await conn.end();
  }
}

createAdmin().catch(err => { console.error('Error creating admin:', err); process.exit(1); });
