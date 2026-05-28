/**
 * GET /api/monitoring/status
 *
 * Agrega el estado de las tres herramientas de monitoreo:
 *   - Pingdom  : consulta la API REST externa de Pingdom con PINGDOM_API_TOKEN
 *   - Fail2ban : parsea el archivo de log montado como volumen compartido
 *   - Munin    : consulta el protocolo de texto de munin-node en el puerto 4949
 *
 * Todas las fuentes son opcionales; si una falla, devuelve su bloque con
 * status="error" y un mensaje, sin romper las demás.
 */

const express = require("express");
const fs = require("fs");
const net = require("net");
const https = require("https");
const { authenticate } = require("../middlewares/auth");

const router = express.Router();

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Hace una petición HTTPS GET y devuelve el body parseado como JSON.
 * Lanza un Error si el status HTTP >= 400.
 */
function httpsGetJson(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = { headers };
    https
      .get(url, options, (res) => {
        let raw = "";
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => {
          if (res.statusCode >= 400) {
            return reject(
              new Error(`HTTP ${res.statusCode}: ${raw.slice(0, 200)}`),
            );
          }
          try {
            resolve(JSON.parse(raw));
          } catch {
            reject(new Error("Respuesta de Pingdom no es JSON válido"));
          }
        });
      })
      .on("error", reject);
  });
}

/**
 * Abre una conexión TCP a munin-node, envía "list\n" y lee las métricas
 * básicas disponibles. Devuelve un objeto con valores de CPU, memoria, etc.
 */
function queryMuninNode(host, port, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let buffer = "";
    let plugins = [];
    let metrics = {};
    let currentPlugin = "";
    let phase = "banner"; // banner → list → fetch → done

    const cleanup = (errMsg) => {
      socket.destroy();
      if (errMsg) reject(new Error(errMsg));
    };

    socket.setTimeout(timeoutMs);
    socket.on("timeout", () => cleanup("Timeout conectando a munin-node"));
    socket.on("error", (err) => cleanup(err.message));

    socket.on("data", (chunk) => {
      buffer += chunk.toString();

      // Esperamos la línea de bienvenida del daemon
      if (phase === "banner" && buffer.includes("\n")) {
        buffer = "";
        phase = "list";
        socket.write("list\n");
        return;
      }

      // Recibimos la lista de plugins disponibles
      if (phase === "list" && buffer.includes("\n")) {
        const line = buffer.trim();
        buffer = "";
        // Filtramos plugins relevantes para el panel
        const wanted = [
          "cpu",
          "memory",
          "df",
          "load",
          "uptime",
          "docker_stats_",
        ];
        plugins = line
          .split(" ")
          .filter((p) => wanted.some((w) => p.startsWith(w)));

        if (!plugins.length) {
          socket.write("quit\n");
          socket.destroy();
          resolve({ available: false, detail: "Sin plugins relevantes" });
          return;
        }

        phase = "fetch";
        // Pedimos el primer plugin
        currentPlugin = plugins.shift();
        socket.write(`fetch ${currentPlugin}\n`);
        return;
      }

      // Recibimos los valores de cada plugin
      if (phase === "fetch") {
        // Un bloque de munin termina con ".\n"
        if (!buffer.includes(".\n")) return;

        const block = buffer;
        buffer = "";

        // Parsear líneas: "metric.value NNN"
        block.split("\n").forEach((line) => {
          const match = line.match(/^([\w.-]+)\s+([\d.]+)/);
          if (!match) return;
          const metricKey = match[1].replace(/\.value$/, "");
          const metricValue = parseFloat(match[2]);
          if (Number.isNaN(metricValue) || !currentPlugin) return;
          metrics[`${currentPlugin}.${metricKey}`] = metricValue;
        });

        if (plugins.length) {
          currentPlugin = plugins.shift();
          socket.write(`fetch ${currentPlugin}\n`);
        } else {
          socket.write("quit\n");
          socket.destroy();
          resolve({ available: true, metrics: normalizeMuninMetrics(metrics) });
        }
      }
    });

    socket.connect(port, host);
  });
}

function normalizeMuninMetrics(metrics = {}) {
  const normalized = { ...metrics };

  // CPU: convertir contadores acumulados a porcentaje relativo.
  const cpuFields = [
    "cpu.user",
    "cpu.system",
    "cpu.idle",
    "cpu.nice",
    "cpu.iowait",
    "cpu.irq",
    "cpu.softirq",
    "cpu.steal",
    "cpu.guest",
  ];
  const cpuTotal = cpuFields.reduce(
    (sum, key) => sum + (normalized[key] || 0),
    0,
  );
  if (cpuTotal > 100) {
    const cpuUser = normalized["cpu.user"] || 0;
    const cpuSystem = normalized["cpu.system"] || 0;
    const cpuIdle = normalized["cpu.idle"] || 0;
    normalized["cpu.user"] = (cpuUser / cpuTotal) * 100;
    normalized["cpu.system"] = (cpuSystem / cpuTotal) * 100;
    normalized["cpu.idle"] = (cpuIdle / cpuTotal) * 100;
  }

  // Memoria: sumar componentes comunes cuando no hay total.
  if (normalized["memory.total"] == null) {
    const memoryParts = [
      normalized["memory.apps"],
      normalized["memory.cached"],
      normalized["memory.cache"],
      normalized["memory.buffers"],
      normalized["memory.buffered"],
      normalized["memory.slab"],
      normalized["memory.free"],
    ].filter((value) => Number.isFinite(value));
    const memoryTotal = memoryParts.reduce((sum, value) => sum + value, 0);
    if (memoryTotal > 0) {
      normalized["memory.total"] = memoryTotal;
    }
  }

  // Disco: encontrar la primera pareja used/total y mapearla a root.
  if (normalized["df.root.used"] == null) {
    const usedKey = Object.keys(normalized).find(
      (key) => key.startsWith("df.") && key.endsWith(".used"),
    );
    if (usedKey) normalized["df.root.used"] = normalized[usedKey];
  }
  if (normalized["df.root.total"] == null) {
    const totalKey = Object.keys(normalized).find(
      (key) =>
        key.startsWith("df.") &&
        (key.endsWith(".total") || key.endsWith(".size")),
    );
    if (totalKey) normalized["df.root.total"] = normalized[totalKey];
  }

  // Si el plugin df entrega porcentaje en un solo valor (df.<mount>), usarlo como %.
  if (
    normalized["df.root.used"] == null ||
    normalized["df.root.total"] == null
  ) {
    const dfPercentKey = Object.keys(normalized).find((key) => {
      if (!key.startsWith("df.")) return false;
      return key.split(".").length === 2; // df.<mount>
    });
    if (dfPercentKey && Number.isFinite(normalized[dfPercentKey])) {
      normalized["df.root.used"] = normalized[dfPercentKey];
      normalized["df.root.total"] = 100;
    }
  }

  return normalized;
}

/**
 * Lee el log de Fail2ban y extrae las últimas N IPs baneadas hoy.
 * El log tiene líneas como:
 *   2025-05-26 14:03:12,777 fail2ban.actions [NOTICE] [backend-brute] Ban 1.2.3.4
 */
function parseFailbanLog(logPath, maxEntries = 10) {
  if (!fs.existsSync(logPath)) {
    return { available: false, detail: `Log no encontrado: ${logPath}` };
  }

  const content = fs.readFileSync(logPath, "utf8");
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const banPattern =
    /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}),\d+ .* Ban (.+)$/gm;

  const bans = [];
  let match;
  while ((match = banPattern.exec(content)) !== null) {
    bans.push({ timestamp: match[1], ip: match[2].trim() });
  }

  const todayBans = bans.filter((b) => b.timestamp.startsWith(today));
  const recent = bans.slice(-maxEntries).reverse();

  return {
    available: true,
    bans_today: todayBans.length,
    total_bans: bans.length,
    recent_bans: recent,
  };
}

// ─── Endpoint principal ──────────────────────────────────────────────────────

/**
 * @openapi
 * /api/monitoring/status:
 *   get:
 *     tags: [Monitoring]
 *     summary: Estado agregado de Pingdom, Fail2ban y Munin
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Estado de las herramientas de monitoreo
 *       401:
 *         description: Token inválido o ausente
 */
router.get("/status", authenticate, async (req, res) => {
  const pingdomToken = process.env.PINGDOM_API_TOKEN;
  const muninHost = process.env.MUNIN_NODE_HOST || "monitoring-munin-node";
  const muninPort = parseInt(process.env.MUNIN_NODE_PORT || "4949", 10);
  const fail2banLog =
    process.env.FAIL2BAN_LOG_PATH || "/var/log/fail2ban/fail2ban.log";

  // Ejecutar las tres fuentes en paralelo; ninguna bloquea a las otras
  const [pingdomResult, muninResult, fail2banResult] = await Promise.allSettled(
    [
      // ── Pingdom ──────────────────────────────────────────────────────────────
      (async () => {
        if (!pingdomToken) {
          return {
            status: "unconfigured",
            detail: "PINGDOM_API_TOKEN no definido",
          };
        }
        const data = await httpsGetJson(
          "https://api.pingdom.com/api/3.1/checks",
          {
            Authorization: `Bearer ${pingdomToken}`,
            "App-Key": pingdomToken,
          },
        );
        const checks = (data.checks || []).map((c) => ({
          id: c.id,
          name: c.name,
          hostname: c.hostname,
          status: c.status, // "up" | "down" | "unknown" | "paused"
          last_response_time: c.lastresponsetime,
          last_check: c.lasttesttime
            ? new Date(c.lasttesttime * 1000).toISOString()
            : null,
        }));
        const anyDown = checks.some((c) => c.status === "down");
        return {
          status: anyDown ? "down" : "up",
          checks,
        };
      })(),

      // ── Munin ─────────────────────────────────────────────────────────────────
      (async () => {
        return await queryMuninNode(muninHost, muninPort);
      })(),

      // ── Fail2ban ──────────────────────────────────────────────────────────────
      (async () => {
        return parseFailbanLog(fail2banLog);
      })(),
    ],
  );

  const formatResult = (settled, toolName) => {
    if (settled.status === "fulfilled") return settled.value;
    return {
      status: "error",
      detail: settled.reason?.message || `Error en ${toolName}`,
    };
  };

  return res.status(200).json({
    timestamp: new Date().toISOString(),
    pingdom: formatResult(pingdomResult, "Pingdom"),
    munin: formatResult(muninResult, "Munin"),
    fail2ban: formatResult(fail2banResult, "Fail2ban"),
  });
});

module.exports = router;
