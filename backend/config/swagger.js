const path = require("path");
const swaggerJSDoc = require("swagger-jsdoc");

const serverPort = process.env.PORT || 5000;
// Prefer explicit BACKEND_URL (useful when host port != container PORT),
// otherwise allow overriding with SWAGGER_SERVER_URL or derive from host port.
const serverUrl =
  process.env.SWAGGER_SERVER_URL ||
  process.env.BACKEND_URL ||
  `http://localhost:${process.env.BACKEND_HOST_PORT || serverPort}`;

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "SupplyChain Pro Backend API",
      version: "1.0.0",
      description: "Documentacion de endpoints del backend para monitoreo logistico.",
    },
    servers: [
      {
        url: serverUrl,
        description: "Servidor local",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
      schemas: {
        LoginRequest: {
          type: "object",
          properties: {
            correo: { type: "string" },
            contrasena: { type: "string" },
          },
          required: ["correo", "contrasena"],
        },
        LoginResponse: {
          type: "object",
          properties: { token: { type: "string" }, user: { type: "object" } },
        },
      },
    },
  },
  apis: [
    path.join(__dirname, "../server.js"),
    path.join(__dirname, "../routes/*.js"),
    path.join(__dirname, "../controllers/*.js"),
  ],
};

module.exports = swaggerJSDoc(options);
