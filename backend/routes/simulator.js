const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/simulatorController");
const { authenticate } = require("../middlewares/auth");
const requireRole = require("../middlewares/requireRole");

/**
 * @openapi
 * /api/simulator/estadisticas:
 *   get:
 *     tags: [Simulator]
 *     summary: Obtiene estadísticas de incidentes (filtrables)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: vehiculoId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: rutaId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: envioId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Estadísticas generadas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Estadisticas'
 */
router.get("/estadisticas", authenticate, ctrl.getEstadisticas);

router.get("/health", authenticate, ctrl.health);
router.get("/storage", authenticate, ctrl.storageStatus);
router.get("/journeys", authenticate, ctrl.listJourneys);
router.get("/journeys/:id_envio", authenticate, ctrl.getJourney);

router.post("/journeys/start", authenticate, requireRole("ADMIN"), ctrl.startJourney);
router.post("/journeys/:id_envio/pause", authenticate, requireRole("ADMIN"), ctrl.pauseJourney);
router.post("/journeys/:id_envio/resume", authenticate, requireRole("ADMIN"), ctrl.resumeJourney);
router.post("/journeys/:id_envio/stop", authenticate, requireRole("ADMIN"), ctrl.stopJourney);

router.post("/incidents/:id_envio/temperatura-alta", authenticate, requireRole("ADMIN"), ctrl.temperaturaAlta);
router.post("/incidents/:id_envio/bateria-baja", authenticate, requireRole("ADMIN"), ctrl.bateriaBaja);
router.post("/incidents/:id_envio/geofence-violation", authenticate, requireRole("ADMIN"), ctrl.geofenceViolation);
router.post("/incidents/:id_envio/volumen-lleno", authenticate, requireRole("ADMIN"), ctrl.volumenLleno);

module.exports = router;
