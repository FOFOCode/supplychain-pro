const path = require("path");
const swaggerJSDoc = require("swagger-jsdoc");

const serverPort = process.env.PORT || 5000;

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "SupplyChain Pro Backend API",
      version: "1.0.0",
      description:
        "Documentacion de endpoints del backend para monitoreo logistico.",
    },
    servers: [
      {
        url: process.env.SWAGGER_SERVER_URL || `http://localhost:${serverPort}`,
        description: "Servidor local",
      },
    ],
    tags: [
      {
        name: "Docs",
        description: "Recursos de documentacion OpenAPI/Swagger",
      },
      {
        name: "Health",
        description: "Estado operativo del backend y la base de datos",
      },
      {
        name: "Auth",
        description: "Autenticacion y sesion de usuario",
      },
      {
        name: "Envios",
        description: "Gestion de envios",
      },
      {
        name: "Vehiculos",
        description: "Gestion de vehiculos",
      },
      {
        name: "EnviosVehiculos",
        description: "Asignaciones entre envios y vehiculos",
      },
      {
        name: "Registros",
        description: "Telemetria de envios",
      },
      {
        name: "Incidentes",
        description: "Incidentes de calidad y operacion",
      },
      {
        name: "Productos",
        description: "Catalogo de productos",
      },
      {
        name: "DetallesEnvio",
        description: "Detalle de productos por envio",
      },
      {
        name: "Roles",
        description: "Administracion de roles",
      },
      {
        name: "Usuarios",
        description: "Administracion de usuarios",
      },
      {
        name: "Rutas",
        description: "Rutas logisticas",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        HealthResponse: {
          type: "object",
          properties: {
            ok: {
              type: "boolean",
              example: true,
            },
            service: {
              type: "string",
              example: "backend",
            },
            timestamp: {
              type: "string",
              format: "date-time",
            },
          },
        },
        DbStatusResponse: {
          type: "object",
          properties: {
            ok: {
              type: "boolean",
              example: true,
            },
            db: {
              type: "string",
              example: "connected",
            },
            timestamp: {
              type: "string",
              format: "date-time",
            },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            ok: {
              type: "boolean",
              example: false,
            },
            message: {
              type: "string",
              example: "Database unavailable",
            },
          },
        },
      },
    },
    paths: {
      "/api/auth/login": {
        post: { tags: ["Auth"], summary: "Iniciar sesion" },
      },
      "/api/auth/me": {
        get: {
          tags: ["Auth"],
          summary: "Obtener usuario autenticado",
          security: [{ bearerAuth: [] }],
        },
      },
      "/api/envios": {
        get: {
          tags: ["Envios"],
          summary: "Listar envios",
          security: [{ bearerAuth: [] }],
        },
        post: {
          tags: ["Envios"],
          summary: "Crear envio (ADMIN)",
          security: [{ bearerAuth: [] }],
        },
      },
      "/api/envios/{id}": {
        get: {
          tags: ["Envios"],
          summary: "Obtener envio por id",
          security: [{ bearerAuth: [] }],
        },
        put: {
          tags: ["Envios"],
          summary: "Actualizar envio (ADMIN)",
          security: [{ bearerAuth: [] }],
        },
        delete: {
          tags: ["Envios"],
          summary: "Eliminar envio (ADMIN)",
          security: [{ bearerAuth: [] }],
        },
      },
      "/api/vehiculos": {
        get: {
          tags: ["Vehiculos"],
          summary: "Listar vehiculos",
          security: [{ bearerAuth: [] }],
        },
        post: {
          tags: ["Vehiculos"],
          summary: "Crear vehiculo (ADMIN)",
          security: [{ bearerAuth: [] }],
        },
      },
      "/api/vehiculos/{id}": {
        get: {
          tags: ["Vehiculos"],
          summary: "Obtener vehiculo por id",
          security: [{ bearerAuth: [] }],
        },
        put: {
          tags: ["Vehiculos"],
          summary: "Actualizar vehiculo (ADMIN)",
          security: [{ bearerAuth: [] }],
        },
        delete: {
          tags: ["Vehiculos"],
          summary: "Eliminar vehiculo (ADMIN)",
          security: [{ bearerAuth: [] }],
        },
      },
      "/api/envios-vehiculos": {
        get: {
          tags: ["EnviosVehiculos"],
          summary: "Listar asignaciones",
          security: [{ bearerAuth: [] }],
        },
        post: {
          tags: ["EnviosVehiculos"],
          summary: "Crear asignacion (ADMIN)",
          security: [{ bearerAuth: [] }],
        },
      },
      "/api/envios-vehiculos/{id}": {
        get: {
          tags: ["EnviosVehiculos"],
          summary: "Obtener asignacion por id",
          security: [{ bearerAuth: [] }],
        },
      },
      "/api/registros": {
        post: {
          tags: ["Registros"],
          summary: "Crear registro de telemetria",
        },
      },
      "/api/registros/envio/{id}": {
        get: {
          tags: ["Registros"],
          summary: "Listar telemetria por envio",
          security: [{ bearerAuth: [] }],
        },
      },
      "/api/registros/{id}": {
        get: {
          tags: ["Registros"],
          summary: "Obtener registro por id",
          security: [{ bearerAuth: [] }],
        },
      },
      "/api/incidentes": {
        get: {
          tags: ["Incidentes"],
          summary: "Listar incidentes",
          security: [{ bearerAuth: [] }],
        },
        post: {
          tags: ["Incidentes"],
          summary: "Crear incidente (ADMIN)",
          security: [{ bearerAuth: [] }],
        },
      },
      "/api/incidentes/{id}": {
        get: {
          tags: ["Incidentes"],
          summary: "Obtener incidente por id",
          security: [{ bearerAuth: [] }],
        },
      },
      "/api/productos": {
        get: {
          tags: ["Productos"],
          summary: "Listar productos",
          security: [{ bearerAuth: [] }],
        },
        post: {
          tags: ["Productos"],
          summary: "Crear producto (ADMIN)",
          security: [{ bearerAuth: [] }],
        },
      },
      "/api/productos/{id}": {
        get: {
          tags: ["Productos"],
          summary: "Obtener producto por id",
          security: [{ bearerAuth: [] }],
        },
        put: {
          tags: ["Productos"],
          summary: "Actualizar producto (ADMIN)",
          security: [{ bearerAuth: [] }],
        },
        delete: {
          tags: ["Productos"],
          summary: "Eliminar producto (ADMIN)",
          security: [{ bearerAuth: [] }],
        },
      },
      "/api/detalles-envio": {
        get: {
          tags: ["DetallesEnvio"],
          summary: "Listar detalles de envio",
          security: [{ bearerAuth: [] }],
        },
        post: {
          tags: ["DetallesEnvio"],
          summary: "Crear detalle de envio (ADMIN)",
          security: [{ bearerAuth: [] }],
        },
      },
      "/api/detalles-envio/{id}": {
        delete: {
          tags: ["DetallesEnvio"],
          summary: "Eliminar detalle de envio (ADMIN)",
          security: [{ bearerAuth: [] }],
        },
      },
      "/api/roles": {
        get: {
          tags: ["Roles"],
          summary: "Listar roles",
          security: [{ bearerAuth: [] }],
        },
        post: {
          tags: ["Roles"],
          summary: "Crear rol (ADMIN)",
          security: [{ bearerAuth: [] }],
        },
      },
      "/api/usuarios": {
        get: {
          tags: ["Usuarios"],
          summary: "Listar usuarios",
          security: [{ bearerAuth: [] }],
        },
        post: {
          tags: ["Usuarios"],
          summary: "Crear usuario (ADMIN)",
          security: [{ bearerAuth: [] }],
        },
      },
      "/api/usuarios/{id}": {
        get: {
          tags: ["Usuarios"],
          summary: "Obtener usuario por id",
          security: [{ bearerAuth: [] }],
        },
        put: {
          tags: ["Usuarios"],
          summary: "Actualizar usuario (ADMIN)",
          security: [{ bearerAuth: [] }],
        },
      },
      "/api/rutas": {
        get: {
          tags: ["Rutas"],
          summary: "Listar rutas",
          security: [{ bearerAuth: [] }],
        },
        post: {
          tags: ["Rutas"],
          summary: "Crear ruta (ADMIN)",
          security: [{ bearerAuth: [] }],
        },
      },
      "/api/rutas/{id}": {
        get: {
          tags: ["Rutas"],
          summary: "Obtener ruta por id",
          security: [{ bearerAuth: [] }],
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
