const axios = require("axios");
const { emitEvent } = require('../socket');

const SIMULATOR_URL = process.env.SIMULATOR_URL || "http://localhost:3001";
const SIMULATOR_API = `${SIMULATOR_URL}/api/simulator`;

async function forwardRequest(method, path, data) {
  const url = `${SIMULATOR_API}${path}`;
  const response = await axios({
    method,
    url,
    data,
    timeout: 10000,
  });
  return response;
}

/**
 * @openapi
 * components:
 *   schemas:
 *     Estadisticas:
 *       type: object
 *       properties:
 *         resumen:
 *           type: object
 *           properties:
 *             total:
 *               type: integer
 *             porTipo:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   tipo_incidente:
 *                     type: string
 *                   total_incidentes:
 *                     type: integer
 *         vehiculos:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/EstadisticaVehiculo'
 *         rutas:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/EstadisticaRuta'
 *
 *     EstadisticaVehiculo:
 *       type: object
 *       properties:
 *         vehiculo:
 *           type: string
 *         total_incidentes:
 *           type: integer
 *         tipos:
 *           type: object
 *           additionalProperties:
 *             type: integer
 *
 *     EstadisticaRuta:
 *       type: object
 *       properties:
 *         ruta:
 *           type: string
 *         total_incidentes:
 *           type: integer
 *         tipos:
 *           type: object
 *           additionalProperties:
 *             type: integer
 */

// Helper para construir la cláusula WHERE de fechas
const getDateFilter = (startDate, endDate) => {
  if (!startDate && !endDate) return "";
  const start = startDate ? new Date(startDate) : new Date(0);
  const end = endDate ? new Date(endDate) : new Date();
  end.setHours(23, 59, 59, 999);
  return `i.fecha_incidente BETWEEN '${start}' AND '${end}'`;
};

// Helper para procesar y agrupar resultados
const processGroupedResults = (rows, keyField, nameField) => {
  const grouped = rows.reduce((acc, row) => {
    const key = row[keyField];
    if (!acc[key]) {
      acc[key] = {
        [nameField]: row[nameField],
        total_incidentes: 0,
        tipos: {}
      };
    }
    acc[key].total_incidentes += row.total_incidentes;
    acc[key].tipos[row.tipo_incidente] = row.total_incidentes;
    return acc;
  }, {});

  return Object.values(grouped);
};

exports.health = async (req, res, next) => {
  try {
    const response = await forwardRequest("get", "/health");
    res.status(response.status).json(response.data);
  } catch (err) {
    next(err);
  }
};

exports.listJourneys = async (req, res, next) => {
  try {
    const response = await forwardRequest("get", "/journeys");
    res.status(response.status).json(response.data);
  } catch (err) {
    next(err);
  }
};

exports.storageStatus = async (req, res, next) => {
  try {
    const idEnvio = req.query.id_envio ? String(req.query.id_envio) : "";
    const query = idEnvio ? `?id_envio=${encodeURIComponent(idEnvio)}` : "";
    const response = await forwardRequest("get", `/storage${query}`);
    res.status(response.status).json(response.data);
  } catch (err) {
    next(err);
  }
};

exports.getJourney = async (req, res, next) => {
  try {
    const response = await forwardRequest("get", `/journeys/${req.params.id_envio}`);
    res.status(response.status).json(response.data);
  } catch (err) {
    next(err);
  }
};

exports.startJourney = async (req, res, next) => {
  try {
    const response = await forwardRequest("post", "/journeys/start", req.body);
    res.status(response.status).json(response.data);
  } catch (err) {
    next(err);
  }
};

exports.pauseJourney = async (req, res, next) => {
  try {
    const response = await forwardRequest("post", `/journeys/${req.params.id_envio}/pause`);
    res.status(response.status).json(response.data);
  } catch (err) {
    next(err);
  }
};

exports.resumeJourney = async (req, res, next) => {
  try {
    const response = await forwardRequest("post", `/journeys/${req.params.id_envio}/resume`);
    res.status(response.status).json(response.data);
  } catch (err) {
    next(err);
  }
};

exports.stopJourney = async (req, res, next) => {
  try {
    const response = await forwardRequest("post", `/journeys/${req.params.id_envio}/stop`);
    res.status(response.status).json(response.data);
  } catch (err) {
    next(err);
  }
};

exports.temperaturaAlta = async (req, res, next) => {
  try {
    const response = await forwardRequest(
      "post",
      `/incidents/${req.params.id_envio}/temperatura-alta`
    );
    res.status(response.status).json(response.data);
  } catch (err) {
    next(err);
  }
};

exports.bateriaBaja = async (req, res, next) => {
  try {
    const response = await forwardRequest(
      "post",
      `/incidents/${req.params.id_envio}/bateria-baja`
    );
    res.status(response.status).json(response.data);
  } catch (err) {
    next(err);
  }
};

exports.geofenceViolation = async (req, res, next) => {
  try {
    const response = await forwardRequest(
      "post",
      `/incidents/${req.params.id_envio}/geofence-violation`
    );
    res.status(response.status).json(response.data);
  } catch (err) {
    next(err);
  }
};

exports.volumenLleno = async (req, res, next) => {
  try {
    const response = await forwardRequest(
      "post",
      `/incidents/${req.params.id_envio}/volumen-lleno`
    );
    res.status(response.status).json(response.data);
  } catch (err) {
    next(err);
  }
};

exports.getEstadisticas = async (req, res, next) => {
  try {
    const { startDate, endDate, vehiculoId, rutaId, envioId } = req.query;
    const dateFilter = getDateFilter(startDate, endDate);

    let filters = [dateFilter];
    if (vehiculoId) filters.push(`v.id_vehiculo = ${db.escape(vehiculoId)}`);
    if (rutaId) filters.push(`r.id_ruta = ${db.escape(rutaId)}`);
    if (envioId) filters.push(`e.id_envio = ${db.escape(envioId)}`);

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";

    const baseQuery = `
      FROM incidentes i
      LEFT JOIN envios e ON i.id_envio = e.id_envio
      LEFT JOIN envios_vehiculos ev ON e.id_envio = ev.id_envio
      LEFT JOIN vehiculos v ON ev.id_vehiculo = v.id_vehiculo
      LEFT JOIN rutas r ON e.id_ruta = r.id_ruta
      ${whereClause}
    `;

    // 1. Resumen general
    const [resumen] = await db.query(`SELECT COUNT(*) as total FROM incidentes i ${whereClause}`);
    
    // 2. Incidentes por tipo
    const [tipos] = await db.query(`
      SELECT 
        tipo_incidente, 
        COUNT(*) as total_incidentes,
        MIN(fecha_incidente) as primer_incidente,
        MAX(fecha_incidente) as ultimo_incidente
      ${baseQuery}
      GROUP BY tipo_incidente
      ORDER BY total_incidentes DESC
    `);

    // 3. Incidentes por vehículo (desglosado por tipo)
    const [vehiculos] = await db.query(`
      SELECT 
        COALESCE(v.placa, 'No Asignado') as vehiculo,
        i.tipo_incidente,
        COUNT(*) as total_incidentes
      ${baseQuery}
      GROUP BY vehiculo, i.tipo_incidente
      ORDER BY vehiculo, total_incidentes DESC
    `);

    // 4. Incidentes por ruta (desglosado por tipo)
    const [rutas] = await db.query(`
      SELECT 
        COALESCE(r.nombre, 'No Asignada') as ruta,
        i.tipo_incidente,
        COUNT(*) as total_incidentes
      ${baseQuery}
      GROUP BY ruta, i.tipo_incidente
      ORDER BY ruta, total_incidentes DESC
    `);

    res.json({
      resumen: {
        total: resumen[0].total,
        porTipo: tipos,
      },
      vehiculos: processGroupedResults(vehiculos, 'vehiculo', 'vehiculo'),
      rutas: processGroupedResults(rutas, 'ruta', 'ruta'),
      tipos,
    });
  } catch (err) {
    next(err);
  }
};
