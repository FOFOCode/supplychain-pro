const db = require('../config/db');
const { emitEvent } = require('../socket');

exports.listEnvios = async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM envios ORDER BY fecha_creacion DESC LIMIT 100');
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

exports.getEnvio = async (req, res, next) => {
  try {
    const id = req.params.id;
    const [rows] = await db.query('SELECT * FROM envios WHERE id_envio = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Envío no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.createEnvio = async (req, res, next) => {
  try {
    const { codigo_rastreo, origen, destino, id_ruta = null, temp_max_permitida, temp_min_permitida, id_vehiculo } = req.body;

    // Validaciones básicas
    if (!codigo_rastreo || !origen || !destino || temp_min_permitida === undefined || temp_max_permitida === undefined) {
      return res.status(400).json({ error: 'Faltan campos obligatorios para crear el envío' });
    }

    const tMin = Number(temp_min_permitida);
    const tMax = Number(temp_max_permitida);
    if (Number.isNaN(tMin) || Number.isNaN(tMax)) {
      return res.status(400).json({ error: 'Límites de temperatura inválidos' });
    }
    if (tMin > tMax) {
      return res.status(400).json({ error: 'La temperatura mínima no puede ser mayor que la máxima' });
    }

    // Verificar código de rastreo duplicado
    const [existing] = await db.query('SELECT id_envio FROM envios WHERE codigo_rastreo = ?', [codigo_rastreo]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Código de rastreo duplicado' });
    }

    const [result] = await db.query(
      'INSERT INTO envios (codigo_rastreo, origen, destino, id_ruta, temp_max_permitida, temp_min_permitida) VALUES (?, ?, ?, ?, ?, ?)',
      [codigo_rastreo, origen, destino, id_ruta, tMax, tMin]
    );
    const id_envio = result.insertId;
    emitEvent('envio:created', {
      id_envio,
      codigo_rastreo,
      origen,
      destino,
      id_ruta,
      temp_max_permitida: tMax,
      temp_min_permitida: tMin,
      estado: 'EN_TRANSITO'
    });
    // Si se proporcionó id_vehiculo, intentar registrar la asignación (silencioso en caso de error)
    if (id_vehiculo) {
      try {
        await db.query('INSERT INTO envios_vehiculos (id_envio, id_vehiculo) VALUES (?, ?)', [id_envio, id_vehiculo]);
      } catch (e) {
        // Ignorar errores de FK o duplicados aquí; el envío ya fue creado.
      }
    }

    res.status(201).json({ id_envio });
  } catch (err) {
    next(err);
  }
};

exports.updateEnvio = async (req, res, next) => {
  try {
    const id = req.params.id;
    const fields = req.body;
    const keys = Object.keys(fields);
    if (!keys.length) return res.status(400).json({ error: 'No hay campos para actualizar' });
    const values = keys.map(k => fields[k]);
    const set = keys.map(k => `${k} = ?`).join(', ');
    await db.query(`UPDATE envios SET ${set} WHERE id_envio = ?`, [...values, id]);
    
    emitEvent('envio:updated', {
      id_envio: Number(id),
      ...fields
    });
    
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

exports.deleteEnvio = async (req, res, next) => {
  try {
    const id = req.params.id;
    await db.query('DELETE FROM envios WHERE id_envio = ?', [id]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

