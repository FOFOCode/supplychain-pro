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
    servers: [
      {
        url: process.env.SWAGGER_SERVER_URL || `http://localhost:${serverPort}`,
        description: 'Servidor local',
      },
    ],
    tags: [
      { name: 'Docs', description: 'Recursos de documentacion OpenAPI/Swagger' },
      { name: 'Health', description: 'Estado operativo del backend y la base de datos' },
      { name: 'Auth', description: 'Autenticacion y sesion de usuario' },
      { name: 'Envios', description: 'Gestion de envios' },
      { name: 'Vehiculos', description: 'Gestion de vehiculos' },
      { name: 'EnviosVehiculos', description: 'Asignaciones entre envios y vehiculos' },
      { name: 'Registros', description: 'Telemetria de envios' },
      { name: 'Incidentes', description: 'Incidentes de calidad y operacion' },
      { name: 'Productos', description: 'Catalogo de productos' },
      { name: 'DetallesEnvio', description: 'Detalle de productos por envio' },
      { name: 'Roles', description: 'Administracion de roles' },
      { name: 'Usuarios', description: 'Administracion de usuarios' },
      { name: 'Rutas', description: 'Rutas logisticas' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: {
        HealthResponse: {
          type: 'object',
          properties: { ok: { type: 'boolean', example: true }, service: { type: 'string', example: 'backend' }, timestamp: { type: 'string', format: 'date-time' } },
        },
        DbStatusResponse: {
          type: 'object',
          properties: { ok: { type: 'boolean', example: true }, db: { type: 'string', example: 'connected' }, timestamp: { type: 'string', format: 'date-time' } },
        },
        ErrorResponse: { type: 'object', properties: { ok: { type: 'boolean', example: false }, message: { type: 'string', example: 'Database unavailable' } } },
        LoginRequest: { type: 'object', properties: { correo: { type: 'string' }, contrasena: { type: 'string' } }, required: ['correo', 'contrasena'] },
        LoginResponse: { type: 'object', properties: { token: { type: 'string' }, user: { type: 'object' } } },
        Usuario: { type: 'object', properties: { id: { type: 'integer' }, nombre: { type: 'string' }, correo: { type: 'string' }, rol_id: { type: 'integer' } } },
        Envio: { type: 'object', properties: { id: { type: 'integer' }, origen: { type: 'string' }, destino: { type: 'string' }, estado: { type: 'string' }, fecha_creacion: { type: 'string', format: 'date-time' } } },
        Vehiculo: { type: 'object', properties: { id: { type: 'integer' }, placa: { type: 'string' }, tipo: { type: 'string' } } },
        Incidente: { type: 'object', properties: { id: { type: 'integer' }, envio_id: { type: 'integer' }, descripcion: { type: 'string' }, gravedad: { type: 'string' } } },
        Producto: { type: 'object', properties: { id: { type: 'integer' }, nombre: { type: 'string' }, peso: { type: 'number' } } },
        DetalleEnvio: { type: 'object', properties: { id: { type: 'integer' }, envio_id: { type: 'integer' }, producto_id: { type: 'integer' }, cantidad: { type: 'integer' } } },
        Ruta: { type: 'object', properties: { id: { type: 'integer' }, nombre: { type: 'string' }, distancia_km: { type: 'number' } } },
        RegistroTelemetria: { type: 'object', properties: { id: { type: 'integer' }, vehiculo_id: { type: 'integer' }, lat: { type: 'number' }, lng: { type: 'number' }, velocidad: { type: 'number' }, ts: { type: 'string', format: 'date-time' } } },
      },
    },
    paths: {
      '/api/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Iniciar sesion',
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } } },
          responses: { '200': { description: 'Login successful', content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } } }, '401': { description: 'Credenciales inválidas' } },
        },
      },
      '/api/auth/me': { get: { tags: ['Auth'], summary: 'Obtener usuario autenticado', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Usuario', content: { 'application/json': { schema: { $ref: '#/components/schemas/Usuario' } } } } } },
      '/api/envios': { get: { tags: ['Envios'], summary: 'Listar envios', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Lista envios' } } }, post: { tags: ['Envios'], summary: 'Crear envio (ADMIN)', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Envio' } } } }, responses: { '201': { description: 'Envio creado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Envio' } } } } } },
      '/api/envios/{id}': { get: { tags: ['Envios'], summary: 'Obtener envio por id', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Envio', content: { 'application/json': { schema: { $ref: '#/components/schemas/Envio' } } } } } }, put: { tags: ['Envios'], summary: 'Actualizar envio (ADMIN)', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Envio' } } } }, responses: { '200': { description: 'Envio actualizado' } } }, delete: { tags: ['Envios'], summary: 'Eliminar envio (ADMIN)', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '204': { description: 'Eliminado' } } },
      '/api/vehiculos': { get: { tags: ['Vehiculos'], summary: 'Listar vehiculos', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Lista' } } }, post: { tags: ['Vehiculos'], summary: 'Crear vehiculo (ADMIN)', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Vehiculo' } } } }, responses: { '201': { description: 'Vehiculo creado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Vehiculo' } } } } } },
      '/api/vehiculos/{id}': { get: { tags: ['Vehiculos'], summary: 'Obtener vehiculo por id', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Vehiculo', content: { 'application/json': { schema: { $ref: '#/components/schemas/Vehiculo' } } } } } }, put: { tags: ['Vehiculos'], summary: 'Actualizar vehiculo (ADMIN)', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Vehiculo' } } } }, responses: { '200': { description: 'Vehiculo actualizado' } } }, delete: { tags: ['Vehiculos'], summary: 'Eliminar vehiculo (ADMIN)', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '204': { description: 'Eliminado' } } },
      '/api/envios-vehiculos': { get: { tags: ['EnviosVehiculos'], summary: 'Listar asignaciones', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Lista' } } }, post: { tags: ['EnviosVehiculos'], summary: 'Crear asignacion (ADMIN)', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { envio_id: { type: 'integer' }, vehiculo_id: { type: 'integer' } }, required: ['envio_id','vehiculo_id'] } } } }, responses: { '201': { description: 'Asignacion creada' } } },
      '/api/envios-vehiculos/{id}': { get: { tags: ['EnviosVehiculos'], summary: 'Obtener asignacion por id', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Asignacion' } } },
      '/api/registros': { post: { tags: ['Registros'], summary: 'Crear registro de telemetria', requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RegistroTelemetria' } } } }, responses: { '201': { description: 'Registro creado' } } } ,
      '/api/registros/envio/{id}': { get: { tags: ['Registros'], summary: 'Listar telemetria por envio', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Lista registros' } } } ,
      '/api/registros/{id}': { get: { tags: ['Registros'], summary: 'Obtener registro por id', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Registro', content: { 'application/json': { schema: { $ref: '#/components/schemas/RegistroTelemetria' } } } } } } ,
      '/api/incidentes': { get: { tags: ['Incidentes'], summary: 'Listar incidentes', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Lista' } } }, post: { tags: ['Incidentes'], summary: 'Crear incidente (ADMIN)', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Incidente' } } } }, responses: { '201': { description: 'Incidente creado' } } },
      '/api/incidentes/{id}': { get: { tags: ['Incidentes'], summary: 'Obtener incidente por id', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Incidente', content: { 'application/json': { schema: { $ref: '#/components/schemas/Incidente' } } } } } } ,
      '/api/productos': { get: { tags: ['Productos'], summary: 'Listar productos', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Lista' } } }, post: { tags: ['Productos'], summary: 'Crear producto (ADMIN)', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Producto' } } } }, responses: { '201': { description: 'Producto creado' } } },
      '/api/productos/{id}': { get: { tags: ['Productos'], summary: 'Obtener producto por id', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Producto', content: { 'application/json': { schema: { $ref: '#/components/schemas/Producto' } } } } } }, put: { tags: ['Productos'], summary: 'Actualizar producto (ADMIN)', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Producto' } } } }, responses: { '200': { description: 'Producto actualizado' } } }, delete: { tags: ['Productos'], summary: 'Eliminar producto (ADMIN)', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '204': { description: 'Eliminado' } } } ,
      '/api/detalles-envio': { get: { tags: ['DetallesEnvio'], summary: 'Listar detalles de envio', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Lista' } } }, post: { tags: ['DetallesEnvio'], summary: 'Crear detalle de envio (ADMIN)', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/DetalleEnvio' } } } }, responses: { '201': { description: 'Detalle creado' } } },
      '/api/detalles-envio/{id}': { delete: { tags: ['DetallesEnvio'], summary: 'Eliminar detalle de envio (ADMIN)', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '204': { description: 'Eliminado' } } } ,
      '/api/roles': { get: { tags: ['Roles'], summary: 'Listar roles', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Lista' } } }, post: { tags: ['Roles'], summary: 'Crear rol (ADMIN)', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { nombre: { type: 'string' } }, required: ['nombre'] } } } }, responses: { '201': { description: 'Rol creado' } } },
      '/api/usuarios': { get: { tags: ['Usuarios'], summary: 'Listar usuarios', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Lista' } } }, post: { tags: ['Usuarios'], summary: 'Crear usuario (ADMIN)', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Usuario' } } } }, responses: { '201': { description: 'Usuario creado' } } },
      '/api/usuarios/{id}': { get: { tags: ['Usuarios'], summary: 'Obtener usuario por id', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Usuario', content: { 'application/json': { schema: { $ref: '#/components/schemas/Usuario' } } } } } }, put: { tags: ['Usuarios'], summary: 'Actualizar usuario (ADMIN)', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Usuario' } } } }, responses: { '200': { description: 'Usuario actualizado' } } } ,
      '/api/rutas': { get: { tags: ['Rutas'], summary: 'Listar rutas', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Lista' } } }, post: { tags: ['Rutas'], summary: 'Crear ruta (ADMIN)', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Ruta' } } } }, responses: { '201': { description: 'Ruta creada' } } },
      '/api/rutas/{id}': { get: { tags: ['Rutas'], summary: 'Obtener ruta por id', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Ruta', content: { 'application/json': { schema: { $ref: '#/components/schemas/Ruta' } } } } } },
    },
  },
  apis: [path.join(__dirname, '../server.js'), path.join(__dirname, '../routes/*.js'), path.join(__dirname, '../controllers/*.js')],
};

module.exports = swaggerJSDoc(options);
