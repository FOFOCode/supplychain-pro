const path = require('path');
const swaggerJSDoc = require('swagger-jsdoc');

const serverPort = process.env.PORT || 5000;

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'SupplyChain Pro Backend API',
      version: '1.0.0',
      description: 'Documentacion de endpoints del backend para monitoreo logistico.',
    },
    servers: [{ url: process.env.SWAGGER_SERVER_URL || `http://localhost:${serverPort}`, description: 'Servidor local' }],
    components: {
      securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
      schemas: {
        LoginRequest: { type: 'object', properties: { correo: { type: 'string' }, contrasena: { type: 'string' } }, required: ['correo', 'contrasena'] },
        LoginResponse: { type: 'object', properties: { token: { type: 'string' }, user: { type: 'object' } } },
      },
    },
  },
  apis: [path.join(__dirname, '../server.js'), path.join(__dirname, '../routes/*.js'), path.join(__dirname, '../controllers/*.js')],
};

module.exports = swaggerJSDoc(options);
