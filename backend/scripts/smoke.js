require('dotenv').config();

const { URL } = require('url');
const http = require('http');
const https = require('https');

function httpRequest(method, urlString, { headers = {}, json } = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;

    const body = json === undefined ? null : Buffer.from(JSON.stringify(json));

    const req = lib.request(
      {
        method,
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        headers: {
          ...(body ? { 'Content-Type': 'application/json', 'Content-Length': body.length } : {}),
          ...headers,
        },
      },
      (res) => {
        const chunks = [];
        res.on('data', (d) => chunks.push(d));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8');
          let parsed = null;
          try {
            parsed = raw ? JSON.parse(raw) : null;
          } catch {
            parsed = raw;
          }
          resolve({ status: res.statusCode, headers: res.headers, body: parsed, raw });
        });
      }
    );

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function assertStatus(name, res, allowed) {
  const ok = Array.isArray(allowed) ? allowed.includes(res.status) : res.status === allowed;
  if (!ok) {
    const details = typeof res.body === 'string' ? res.body : JSON.stringify(res.body);
    throw new Error(`${name} => status ${res.status} (esperado ${allowed}). Body: ${details}`);
  }
}

async function main() {
  const port = process.env.PORT || '3000';
  const baseUrl = process.env.API_BASE_URL || `http://localhost:${port}`;

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error('Faltan ADMIN_EMAIL y ADMIN_PASSWORD en .env para poder hacer login y probar endpoints ADMIN.');
    console.error('Tip: corre primero `npm run seed:admin` para crear el usuario ADMIN.');
    process.exit(2);
  }

  console.log(`Base URL: ${baseUrl}`);

  // Health
  {
    const res = await httpRequest('GET', `${baseUrl}/`);
    assertStatus('GET /', res, 200);
    if (!res.body || res.body.ok !== true) throw new Error('GET / no devolvió {ok:true}');
    console.log('OK  GET /');
  }

  // Login
  let token;
  {
    const res = await httpRequest('POST', `${baseUrl}/api/auth/login`, {
      json: { correo: adminEmail, contrasena: adminPassword },
    });
    assertStatus('POST /api/auth/login', res, 200);
    if (!res.body || !res.body.token) throw new Error('Login no devolvió token');
    token = res.body.token;
    console.log('OK  POST /api/auth/login');
  }

  const authz = { Authorization: `Bearer ${token}` };

  // /me
  {
    const res = await httpRequest('GET', `${baseUrl}/api/auth/me`, { headers: authz });
    assertStatus('GET /api/auth/me', res, 200);
    console.log('OK  GET /api/auth/me');
  }

  // Crear ruta
  let id_ruta;
  {
    const res = await httpRequest('POST', `${baseUrl}/api/rutas`, {
      headers: authz,
      json: {
        nombre: `Ruta Smoke ${Date.now()}`,
        waypoints_json: [
          { lat: 13.689, lng: -89.1872 },
          { lat: 13.69, lng: -89.19 },
        ],
      },
    });
    assertStatus('POST /api/rutas', res, [200, 201]);
    id_ruta = res.body && (res.body.id_ruta || res.body.id);
    if (!id_ruta) throw new Error('Crear ruta no devolvió id_ruta');
    console.log('OK  POST /api/rutas');
  }

  // Listar rutas
  {
    const res = await httpRequest('GET', `${baseUrl}/api/rutas`, { headers: authz });
    assertStatus('GET /api/rutas', res, 200);
    console.log('OK  GET /api/rutas');
  }

  // Crear envío
  let id_envio;
  {
    const res = await httpRequest('POST', `${baseUrl}/api/envios`, {
      headers: authz,
      json: {
        codigo_rastreo: `SMOKE-${Date.now()}`,
        origen: 'San Salvador',
        destino: 'Ahuachapán',
        id_ruta,
        temp_max_permitida: 5.0,
        temp_min_permitida: -5.0,
      },
    });
    assertStatus('POST /api/envios', res, [200, 201]);
    id_envio = res.body && (res.body.id_envio || res.body.id);
    if (!id_envio) throw new Error('Crear envío no devolvió id_envio');
    console.log('OK  POST /api/envios');
  }

  // Crear vehículo
  let id_vehiculo;
  {
    const res = await httpRequest('POST', `${baseUrl}/api/vehiculos`, {
      headers: authz,
      json: { placa: `P-${String(Date.now()).slice(-6)}`, activo: true },
    });
    assertStatus('POST /api/vehiculos', res, [200, 201]);
    id_vehiculo = res.body && (res.body.id_vehiculo || res.body.id);
    if (!id_vehiculo) throw new Error('Crear vehículo no devolvió id_vehiculo');
    console.log('OK  POST /api/vehiculos');
  }

  // Asignación
  {
    const res = await httpRequest('POST', `${baseUrl}/api/envios-vehiculos`, {
      headers: authz,
      json: { id_envio, id_vehiculo },
    });
    assertStatus('POST /api/envios-vehiculos', res, [200, 201]);
    console.log('OK  POST /api/envios-vehiculos');
  }

  // Telemetría (PUBLIC)
  let id_registro_telemetria;
  {
    const res = await httpRequest('POST', `${baseUrl}/api/registros`, {
      json: {
        id_envio,
        latitud: 13.689,
        longitud: -89.1872,
        temperatura: 6.2,
        humedad: 75,
        porcentaje_bateria: 85,
        marca_tiempo_dispositivo: new Date().toISOString(),
      },
    });
    assertStatus('POST /api/registros', res, [200, 201]);
    id_registro_telemetria = res.body && (res.body.id_registro_telemetria || res.body.id);
    console.log('OK  POST /api/registros');
  }

  // Registros por envío
  {
    const res = await httpRequest('GET', `${baseUrl}/api/registros/envio/${id_envio}?limit=10`, { headers: authz });
    assertStatus('GET /api/registros/envio/:id', res, 200);
    console.log('OK  GET /api/registros/envio/:id');
  }

  // Crear incidente (ADMIN)
  {
    const res = await httpRequest('POST', `${baseUrl}/api/incidentes`, {
      headers: authz,
      json: {
        id_envio,
        id_registro_telemetria: id_registro_telemetria || null,
        tipo_incidente: 'DESVIO',
        descripcion: 'Incidente provocado por smoke test',
        origen_evento: 'SIMULADOR',
        metadata_json: { accion: 'desvio' },
      },
    });
    assertStatus('POST /api/incidentes', res, [200, 201]);
    console.log('OK  POST /api/incidentes');
  }

  // Listar incidentes
  {
    const res = await httpRequest('GET', `${baseUrl}/api/incidentes`, { headers: authz });
    assertStatus('GET /api/incidentes', res, 200);
    console.log('OK  GET /api/incidentes');
  }

  console.log('\nSmoke test OK ✅');
}

main().catch((err) => {
  console.error('\nSmoke test FAILED ❌');
  console.error(err && err.message ? err.message : err);
  process.exit(1);
});
