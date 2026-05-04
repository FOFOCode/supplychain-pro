-- SupplyChain Pro (versión simple)
-- En este esquema los INCIDENTES los crea el SIMULADOR (no se calculan por zonas/geofence en el backend).
-- Recomendado: MySQL 8.x

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS detalles_envio;
DROP TABLE IF EXISTS incidentes;
DROP TABLE IF EXISTS registros_telemetria;
DROP TABLE IF EXISTS envios_vehiculos;
DROP TABLE IF EXISTS vehiculos;
DROP TABLE IF EXISTS envios;
DROP TABLE IF EXISTS rutas;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS productos;

SET FOREIGN_KEY_CHECKS = 1;

-- 1) Rutas planificadas (sin tipos espaciales; el simulador solo necesita waypoints)
CREATE TABLE rutas (
  id_ruta INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  waypoints_json JSON NOT NULL,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2) Envíos (carga monitoreada)
CREATE TABLE envios (
  id_envio INT AUTO_INCREMENT PRIMARY KEY,
  codigo_rastreo VARCHAR(100) UNIQUE NOT NULL,
  origen VARCHAR(255) NOT NULL,
  destino VARCHAR(255) NOT NULL,
  id_ruta INT NULL,
  temp_max_permitida DECIMAL(5,2) NOT NULL,
  temp_min_permitida DECIMAL(5,2) NOT NULL,
  estado ENUM('EN_TRANSITO', 'ENTREGADO', 'INCIDENTE_REPORTADO', 'CANCELADO') DEFAULT 'EN_TRANSITO',
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_ruta) REFERENCES rutas(id_ruta) ON DELETE SET NULL
);

-- 3) Vehículos / camiones
CREATE TABLE vehiculos (
  id_vehiculo INT AUTO_INCREMENT PRIMARY KEY,
  placa VARCHAR(20) UNIQUE NOT NULL,
  activo BOOLEAN DEFAULT TRUE
);

-- 4) Asignación envío-vehículo
CREATE TABLE envios_vehiculos (
  id_envio_vehiculo INT AUTO_INCREMENT PRIMARY KEY,
  id_envio INT NOT NULL,
  id_vehiculo INT NOT NULL,
  fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_envio) REFERENCES envios(id_envio) ON DELETE CASCADE,
  FOREIGN KEY (id_vehiculo) REFERENCES vehiculos(id_vehiculo) ON DELETE CASCADE,
  UNIQUE KEY unica_envio_vehiculo (id_envio, id_vehiculo)
);

-- 5) Telemetría (alta frecuencia)
CREATE TABLE registros_telemetria (
  id_registro_telemetria BIGINT AUTO_INCREMENT PRIMARY KEY,
  id_envio INT NOT NULL,
  latitud DECIMAL(10,8) NOT NULL,
  longitud DECIMAL(11,8) NOT NULL,
  temperatura DECIMAL(5,2) NOT NULL,
  humedad DECIMAL(5,2) NULL,
  porcentaje_bateria INT NULL,
  marca_tiempo_dispositivo TIMESTAMP NOT NULL,
  marca_tiempo_servidor TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_envio) REFERENCES envios(id_envio) ON DELETE CASCADE,
  CHECK (porcentaje_bateria IS NULL OR (porcentaje_bateria BETWEEN 0 AND 100))
);

CREATE INDEX idx_envio_tiempo_dispositivo ON registros_telemetria (id_envio, marca_tiempo_dispositivo DESC);

-- 6) Incidentes (creados por el simulador)
-- Nota: id_registro_telemetria es NULLABLE para permitir incidentes “por evento/botón” aunque no haya registro exacto.
CREATE TABLE incidentes (
  id_incidente BIGINT AUTO_INCREMENT PRIMARY KEY,
  id_envio INT NOT NULL,
  id_registro_telemetria BIGINT NULL,
  tipo_incidente VARCHAR(60) NOT NULL,
  valor_registrado DECIMAL(10,2) NULL,
  valor_limite DECIMAL(10,2) NULL,
  descripcion TEXT,
  origen_evento ENUM('SIMULADOR') DEFAULT 'SIMULADOR',
  metadata_json JSON NULL,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_envio) REFERENCES envios(id_envio) ON DELETE RESTRICT,
  FOREIGN KEY (id_registro_telemetria) REFERENCES registros_telemetria(id_registro_telemetria) ON DELETE SET NULL
);

CREATE INDEX idx_incidentes_envio_fecha ON incidentes (id_envio, fecha_creacion DESC);

-- 7) Productos
CREATE TABLE productos (
  id_producto INT AUTO_INCREMENT PRIMARY KEY,
  codigo_sku VARCHAR(50) UNIQUE NOT NULL,
  nombre VARCHAR(150) NOT NULL,
  descripcion TEXT
);

-- 8) Detalle / manifiesto de envío
CREATE TABLE detalles_envio (
  id_detalle_envio INT AUTO_INCREMENT PRIMARY KEY,
  id_producto INT NOT NULL,
  id_envio INT NOT NULL,
  cantidad INT NOT NULL,
  peso_kg DECIMAL(8,2) NOT NULL,
  FOREIGN KEY (id_envio) REFERENCES envios(id_envio) ON DELETE CASCADE,
  FOREIGN KEY (id_producto) REFERENCES productos(id_producto) ON DELETE RESTRICT,
  UNIQUE KEY unica_envio_producto (id_envio, id_producto)
);

-- 9) Roles (solo ADMIN y USUARIO)
CREATE TABLE roles (
  id_rol INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) UNIQUE NOT NULL,
  descripcion VARCHAR(255)
);

-- 10) Usuarios
CREATE TABLE usuarios (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  id_rol INT NOT NULL,
  nombre_completo VARCHAR(150) NOT NULL,
  correo VARCHAR(150) UNIQUE NOT NULL,
  contrasena_hash VARCHAR(255) NOT NULL,
  activo BOOLEAN DEFAULT TRUE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ultimo_acceso TIMESTAMP NULL,
  FOREIGN KEY (id_rol) REFERENCES roles(id_rol) ON DELETE RESTRICT
);

-- Seeds mínimos (opcional)
INSERT IGNORE INTO roles (id_rol, nombre, descripcion)
VALUES
  (1, 'ADMIN', 'Administrador (CRUD completo)'),
  (2, 'USUARIO', 'Usuario de solo lectura');
