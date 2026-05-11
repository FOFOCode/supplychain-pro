require("dotenv").config(); //Cargar variables d entorno
const express = require("express"); //Crear servidor web
const cors = require("cors"); //Para permitir solicitudes desde otro dominio

const db = require("./config/db");

const app = express(); //Instancia del servidor

const allowedOrigins = [
  process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  'http://127.0.0.1:5173',
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

db.connect((err) => {
  if (err) {
    console.error("Error conectando a la base de datos:", err);
    process.exit(1); // Sale de la aplicación en caso de error
  }
  console.log("Conectado a la base de datos MySQL");
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en el puerto ${PORT}`);
});

// Rutas