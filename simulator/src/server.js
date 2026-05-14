require("dotenv").config();
const express = require("express");

// Importar rutas
const journeyRoutes = require("./routes/journeys");
const incidentRoutes = require("./routes/incidents");

// Importar controladores
const incidentController = require("./controllers/incidentController");
const {
  restoreJourneys,
  persistJourneys,
} = require("./controllers/journeyController");

const app = express();
const PORT = process.env.SIMULATOR_PORT || 3001;
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

// Middleware
app.use(express.json());

// Rutas
app.get("/", (req, res) => {
  res.json({
    ok: true,
    service: "SupplyChain Pro - Simulador de Camión",
    port: PORT,
    version: "1.0.0",
  });
});

app.use("/api/simulator/journeys", journeyRoutes);
app.use("/api/simulator/incidents", incidentRoutes);

// Health check
app.get("/api/simulator/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err);
  void next;
  res.status(500).json({ error: err.message });
});

// Inicialización
async function iniciar() {
  app.listen(PORT, async () => {
    console.log(`\n🚀 Simulador de Camión iniciado en puerto ${PORT}`);
    console.log(`📡 Backend URL: ${BACKEND_URL}\n`);

    // Obtener token de admin
    await incidentController.getAdminToken();

    const restored = restoreJourneys();
    if (restored) {
      console.log(`♻ Viajes restaurados: ${restored}`);
    }
  });
}

process.on("SIGTERM", () => {
  persistJourneys();
  process.exit(0);
});

process.on("SIGINT", () => {
  persistJourneys();
  process.exit(0);
});

iniciar().catch((error) => {
  console.error("Error iniciando simulador:", error);
  process.exit(1);
});
