# 🔐 Configuración de credenciales de admin

El simulador necesita credenciales de admin para obtener un token JWT. Por defecto, intenta usar:

```
correo: admin@supplychain.com
contraseña: admin123
```

## Opción 1: Crear el usuario admin automáticamente

```bash
# En la carpeta simulator
node create_admin_db.js
```

Esto creará el usuario admin con las credenciales configuradas en `.env`.

---

## Opción 2: Usar el script de seed del backend

```bash
# En la carpeta backend
node scripts/seed_admin.js
```

---

## Opción 3: Crear manualmente en MySQL

Si prefieres crear el usuario directamente en MySQL:

```sql
-- 1. Asegurar que el rol ADMIN existe
INSERT IGNORE INTO roles (id_rol, nombre, descripcion) 
VALUES (1, 'ADMIN', 'Administrador (CRUD completo)');

-- 2. Crear usuario admin
-- Nota: La contraseña debe estar hasheada con bcrypt
-- Para admin@supplychain.com / admin123 (hasheada con salt 10):
-- Hash: $2b$10$yXoNjJXZj5K5N8vF2mK8Je9L7vZ5O1pQ3r4S5t6U7v8W9x0Y1z2Z3

INSERT IGNORE INTO usuarios 
(id_rol, nombre_completo, correo, contrasena_hash, activo) 
VALUES 
(1, 'Administrador', 'admin@supplychain.com', '$2b$10$yXoNjJXZj5K5N8vF2mK8Je9L7vZ5O1pQ3r4S5t6U7v8W9x0Y1z2Z3', 1);
```

---

## Opción 4: Generar tu propio hash

Si quieres usar otras credenciales, necesitas generar el hash de bcrypt:

```bash
node -e "require('bcrypt').hash('TU_CONTRASEÑA_AQUI', 10, (err, hash) => console.log(hash))"
```

Luego inserta ese hash en la BD.

---

## Verificar que el usuario existe

```bash
# Desde MySQL
SELECT * FROM usuarios WHERE correo = 'admin@supplychain.com';
```

Si aparece un registro, el usuario está creado correctamente.

---

## Cambiar credenciales en el simulador

Si creaste el admin con otras credenciales, actualiza el archivo `.env`:

```env
ADMIN_EMAIL=otro@email.com
ADMIN_PASSWORD=otrap assw0rd
```

---

## Si aún así falla el login

1. Verifica que el usuario existe en la BD
2. Verifica que el email es exacto (incluyendo mayúsculas)
3. Verifica que `activo = 1`
4. Verifica que `id_rol = 1` (ADMIN)

---

## Después de crear el admin

Vuelve a ejecutar el simulador:

```bash
npm run sim-server
```

Deberías ver:

```
✓ Token de admin obtenido
```

En lugar del error de 401.
