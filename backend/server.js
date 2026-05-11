require("dotenv").config(); //Cargar variables d entorno
const express = require("express"); //Crear servidor web
const cors = require("cors"); //Para permitir solicitudes desde otro dominio

const db = require("./config/db");

const app = express(); //Instancia del servidor
 //Evitar errores al consumir en React
const allowedOrigins = [
  
];

app.use(cors({
  origin: function (origin, callback) {
    // Permitir solicitudes sin origin (como curl o Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('No permitido por CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));
app.use(express.json()); //Recibir los datos en JSON

// Verificar conexión a la base de datos usando el pool promise
(async () => {
  try {
    await db.query('SELECT 1');
    console.log('Conectado a la base de datos MySQL (pool)');
  } catch (err) {
    console.error('Error conectando a la base de datos:', err);
    process.exit(1);
  }
})();

// Montar rutas (modulares)
const enviosRoutes = require("./routes/envios");
const incidentesRoutes = require("./routes/incidentes");
const productosRoutes = require("./routes/productos");
const rutasRoutes = require("./routes/rutas");
const vehiculosRoutes = require("./routes/vehiculos");
const enviosVehiculosRoutes = require("./routes/enviosVehiculos");
const registrosRoutes = require("./routes/registrosTelemetria");
const detallesEnvioRoutes = require("./routes/detallesEnvio");
const rolesRoutes = require("./routes/roles");
const usuariosRoutes = require("./routes/usuarios");
const authRoutes = require("./routes/auth");
const errorHandler = require("./middlewares/errorHandler");

app.get("/", (req, res) => res.json({ ok: true, service: "SupplyChain Pro - Backend" }));

app.use("/api/envios", enviosRoutes);
app.use("/api/incidentes", incidentesRoutes);
app.use("/api/productos", productosRoutes);
app.use("/api/rutas", rutasRoutes);
app.use("/api/vehiculos", vehiculosRoutes);
app.use("/api/envios-vehiculos", enviosVehiculosRoutes);
app.use("/api/registros", registrosRoutes);
app.use("/api/detalles-envio", detallesEnvioRoutes);
app.use("/api/roles", rolesRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/auth", authRoutes);

// Middleware para manejo de errores (centralizado)
app.use(errorHandler);

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en el puerto ${PORT}`);
});