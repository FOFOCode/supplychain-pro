import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";
const SOCKET_URL = API_BASE.replace(/\/api\/?$/, "");
const STREAM_LIMIT = 120;

const EMPTY_LOGIN = {
  correo: "",
  contrasena: "",
};

function formatClock(value) {
  if (!value) return "--:--:--";
  const date = new Date(value);
  return date.toLocaleTimeString("es-ES", { hour12: false });
}

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("supplychain-user");
    return stored ? JSON.parse(stored) : null;
  });
  const [loginForm, setLoginForm] = useState(EMPTY_LOGIN);
  const [envios, setEnvios] = useState([]);
  const [rutas, setRutas] = useState([]);
  const [selectedEnvioId, setSelectedEnvioId] = useState("");
  const [selectedRutaId, setSelectedRutaId] = useState("");
  const [speed, setSpeed] = useState(6);
  const [stream, setStream] = useState([]);
  const [latestTelemetry, setLatestTelemetry] = useState(null);
  const [latestIncident, setLatestIncident] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const streamCounter = useRef(0);

  const isAdmin = user?.rol === "ADMIN";

  const authHeaders = useMemo(() => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [token]);

  const pushEvent = useCallback((type, payload) => {
    const entry = {
      id: `${Date.now()}-${streamCounter.current++}`,
      type,
      timestamp: new Date().toISOString(),
      payload,
    };
    setStream((prev) => [entry, ...prev].slice(0, STREAM_LIMIT));
  }, []);

  const fetchApi = useCallback(
    async (path, options = {}) => {
      const init = {
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        ...options,
      };

      if (init.body && typeof init.body !== "string") {
        init.body = JSON.stringify(init.body);
      }

      const response = await fetch(`${API_BASE}${path}`, init);
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || payload.message || response.statusText);
      }

      return payload;
    },
    [authHeaders]
  );

  const loadCatalogs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [enviosPayload, rutasPayload] = await Promise.all([
        fetchApi("/envios"),
        fetchApi("/rutas"),
      ]);
      setEnvios(enviosPayload);
      setRutas(rutasPayload);
      if (enviosPayload.length && !selectedEnvioId) {
        setSelectedEnvioId(String(enviosPayload[0].id_envio));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchApi, selectedEnvioId]);

  useEffect(() => {
    if (!token || !user) return;
    loadCatalogs();
  }, [token, user, loadCatalogs]);

  useEffect(() => {
    if (!selectedEnvioId) return;
    const envio = envios.find((item) => String(item.id_envio) === String(selectedEnvioId));
    if (envio?.id_ruta && String(envio.id_ruta) !== String(selectedRutaId)) {
      setSelectedRutaId(String(envio.id_ruta));
    }
  }, [envios, selectedEnvioId, selectedRutaId]);

  useEffect(() => {
    if (!token) return undefined;
    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
    });

    socket.on("socket:ready", (payload) => {
      pushEvent("system", { message: "Socket conectado", ...payload });
    });

    socket.on("telemetry:new", (payload) => {
      setLatestTelemetry(payload);
      pushEvent("telemetry", payload);
    });

    socket.on("incident:new", (payload) => {
      setLatestIncident(payload);
      pushEvent("incident", payload);
    });

    socket.on("connect_error", (err) => {
      pushEvent("system", { message: "Error de socket", detail: err.message });
    });

    return () => socket.disconnect();
  }, [token, pushEvent]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No se pudo iniciar sesion");

      setToken(result.token);
      setUser(result.user);
      localStorage.setItem("token", result.token);
      localStorage.setItem("supplychain-user", JSON.stringify(result.user));
      setLoginForm(EMPTY_LOGIN);
      setMessage("Sesion iniciada correctamente");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken("");
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("supplychain-user");
    setStream([]);
    setLatestTelemetry(null);
    setLatestIncident(null);
    setMessage("Sesion cerrada");
  };

  const selectedEnvio = envios.find((item) => String(item.id_envio) === String(selectedEnvioId));
  const selectedRuta = rutas.find((item) => String(item.id_ruta) === String(selectedRutaId));

  const waypoints = useMemo(() => {
    if (!selectedRuta?.waypoints_json) return null;
    try {
      const parsed = typeof selectedRuta.waypoints_json === "string"
        ? JSON.parse(selectedRuta.waypoints_json)
        : selectedRuta.waypoints_json;
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }, [selectedRuta]);

  const startJourney = async () => {
    if (!selectedEnvio || !selectedRuta) {
      setError("Selecciona un envio y una ruta para iniciar el viaje");
      return;
    }
    if (!waypoints || !waypoints.length) {
      setError("La ruta seleccionada no tiene waypoints validos");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await fetchApi("/simulator/journeys/start", {
        method: "POST",
        body: {
          id_envio: selectedEnvio.id_envio,
          id_ruta: selectedRuta.id_ruta,
          temp_min_permitida: selectedEnvio.temp_min_permitida,
          temp_max_permitida: selectedEnvio.temp_max_permitida,
          waypoints,
        },
      });
      setMessage("Viaje iniciado");
      pushEvent("system", {
        message: "Viaje iniciado",
        id_envio: selectedEnvio.id_envio,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const pauseJourney = async () => {
    if (!selectedEnvio) return;
    setLoading(true);
    setError("");
    try {
      await fetchApi(`/simulator/journeys/${selectedEnvio.id_envio}/pause`, {
        method: "POST",
      });
      setMessage("Viaje pausado");
      pushEvent("system", { message: "Viaje pausado", id_envio: selectedEnvio.id_envio });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resumeJourney = async () => {
    if (!selectedEnvio) return;
    setLoading(true);
    setError("");
    try {
      await fetchApi(`/simulator/journeys/${selectedEnvio.id_envio}/resume`, {
        method: "POST",
      });
      setMessage("Viaje reanudado");
      pushEvent("system", { message: "Viaje reanudado", id_envio: selectedEnvio.id_envio });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const stopJourney = async () => {
    if (!selectedEnvio) return;
    setLoading(true);
    setError("");
    try {
      await fetchApi(`/simulator/journeys/${selectedEnvio.id_envio}/stop`, {
        method: "POST",
      });
      setMessage("Viaje detenido");
      pushEvent("system", { message: "Viaje detenido", id_envio: selectedEnvio.id_envio });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const triggerIncident = async (path, label) => {
    if (!selectedEnvio) return;
    setLoading(true);
    setError("");
    try {
      await fetchApi(`/simulator/incidents/${selectedEnvio.id_envio}/${path}`, {
        method: "POST",
      });
      setMessage(label);
      pushEvent("system", { message: label, id_envio: selectedEnvio.id_envio });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderLogin = () => (
    <div className="login-card">
      <div className="login-header">
        <p className="kicker">Acceso restringido</p>
        <h2>Panel de simulacion</h2>
        <p>Ingresa con un usuario para acceder a los controles del simulador.</p>
      </div>
      <form className="login-form" onSubmit={handleLogin}>
        <label>
          Correo
          <input
            type="email"
            value={loginForm.correo}
            onChange={(event) => setLoginForm({ ...loginForm, correo: event.target.value })}
            required
          />
        </label>
        <label>
          Contrasena
          <input
            type="password"
            value={loginForm.contrasena}
            onChange={(event) => setLoginForm({ ...loginForm, contrasena: event.target.value })}
            required
          />
        </label>
        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </div>
  );

  const telemetryStatus = latestTelemetry || {};

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-kicker">SIMULADOR IOT</span>
          <strong>Control de Camiones</strong>
        </div>
        {token && user ? (
          <div className="header-actions">
            <span className="user-chip">
              {user.nombre_completo} · {user.rol}
            </span>
            <button className="ghost-button" type="button" onClick={handleLogout}>
              Cerrar sesion
            </button>
          </div>
        ) : null}
      </header>

      <main className="app-main">
        {error ? <div className="alert error">{error}</div> : null}
        {message ? <div className="alert success">{message}</div> : null}

        {!token || !user ? (
          renderLogin()
        ) : (
          <section className="simulation-layout">
            <div className="control-panel">
              <div className="panel-card diagram-card">
                <div className="card-title">Virtual Control Transacciones</div>
                <div className="diagram">
                  <div className="diagram-row">
                    <div className="diagram-node">Terminal</div>
                    <div className="diagram-node">Control</div>
                    <div className="diagram-node">Cliente</div>
                  </div>
                  <div className="diagram-row">
                    <div className="diagram-node">Contratos</div>
                    <div className="diagram-node">Auditoria</div>
                  </div>
                </div>
                <div className="diagram-caption">Cadena de custodia digital para cada envio</div>
              </div>

              <div className="panel-card control-card">
                <div className="card-title">Inyectar recorrido normal</div>
                <div className="form-row">
                  <label>
                    Envio
                    <select
                      value={selectedEnvioId}
                      onChange={(event) => setSelectedEnvioId(event.target.value)}
                    >
                      <option value="">Seleccionar</option>
                      {envios.map((item) => (
                        <option key={item.id_envio} value={item.id_envio}>
                          {item.codigo_rastreo || `Envio ${item.id_envio}`}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Ruta
                    <select
                      value={selectedRutaId}
                      onChange={(event) => setSelectedRutaId(event.target.value)}
                    >
                      <option value="">Seleccionar</option>
                      {rutas.map((item) => (
                        <option key={item.id_ruta} value={item.id_ruta}>
                          {item.nombre || `Ruta ${item.id_ruta}`}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="form-row slider-row">
                  <label>
                    Velocidad simulada
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={speed}
                      onChange={(event) => setSpeed(Number(event.target.value))}
                    />
                  </label>
                  <div className="speed-badge">{speed}x</div>
                </div>

                <div className="button-row">
                  <button
                    className="primary-button"
                    type="button"
                    disabled={loading || !isAdmin}
                    onClick={startJourney}
                  >
                    Iniciar recorrido
                  </button>
                  <button
                    className="secondary-button"
                    type="button"
                    disabled={loading || !isAdmin}
                    onClick={pauseJourney}
                  >
                    Pausar
                  </button>
                  <button
                    className="secondary-button"
                    type="button"
                    disabled={loading || !isAdmin}
                    onClick={resumeJourney}
                  >
                    Reanudar
                  </button>
                  <button
                    className="ghost-button"
                    type="button"
                    disabled={loading || !isAdmin}
                    onClick={stopJourney}
                  >
                    Detener
                  </button>
                </div>

                <div className="meta-grid">
                  <div>
                    <span>Temp min</span>
                    <strong>{selectedEnvio?.temp_min_permitida ?? "--"} C</strong>
                  </div>
                  <div>
                    <span>Temp max</span>
                    <strong>{selectedEnvio?.temp_max_permitida ?? "--"} C</strong>
                  </div>
                  <div>
                    <span>Origen</span>
                    <strong>{selectedEnvio?.origen ?? "--"}</strong>
                  </div>
                  <div>
                    <span>Destino</span>
                    <strong>{selectedEnvio?.destino ?? "--"}</strong>
                  </div>
                </div>
                {!isAdmin ? (
                  <div className="info-banner">Solo usuarios ADMIN pueden controlar el simulador.</div>
                ) : null}
              </div>

              <div className="panel-card incident-card">
                <div className="card-title">Inyectar rupturas</div>
                <div className="incident-buttons">
                  <button
                    className="danger-button"
                    type="button"
                    disabled={loading || !isAdmin}
                    onClick={() => triggerIncident("temperatura-alta", "Ruptura de cadena de frio")}
                  >
                    Ruptura cadena frio
                  </button>
                  <button
                    className="danger-button alt"
                    type="button"
                    disabled={loading || !isAdmin}
                    onClick={() => triggerIncident("geofence-violation", "Desvio de ruta (geofencing)")}
                  >
                    Desvio de ruta
                  </button>
                  <button
                    className="danger-button soft"
                    type="button"
                    disabled={loading || !isAdmin}
                    onClick={() => triggerIncident("bateria-baja", "Bateria baja (5%)")}
                  >
                    Bateria baja
                  </button>
                  <button
                    className="danger-button soft"
                    type="button"
                    disabled={loading || !isAdmin}
                    onClick={() => triggerIncident("volumen-lleno", "Volumen lleno (100%)")}
                  >
                    Volumen lleno
                  </button>
                </div>
              </div>

              <div className="panel-card status-card">
                <div className="card-title">Estado del viaje</div>
                <div className="status-grid">
                  <div>
                    <span>Temperatura</span>
                    <strong>{telemetryStatus.temperatura ?? "--"} C</strong>
                  </div>
                  <div>
                    <span>Humedad</span>
                    <strong>{telemetryStatus.humedad ?? "--"} %</strong>
                  </div>
                  <div>
                    <span>Bateria</span>
                    <strong>{telemetryStatus.porcentaje_bateria ?? "--"} %</strong>
                  </div>
                  <div>
                    <span>Ubicacion</span>
                    <strong>
                      {telemetryStatus.latitud !== undefined && telemetryStatus.longitud !== undefined
                        ? `${telemetryStatus.latitud}, ${telemetryStatus.longitud}`
                        : "--"}
                    </strong>
                  </div>
                </div>
                <div className="status-footer">
                  <div>
                    <span>Ultima telemetria</span>
                    <strong>{formatClock(telemetryStatus.marca_tiempo_dispositivo)}</strong>
                  </div>
                  <div>
                    <span>Ultimo incidente</span>
                    <strong>{latestIncident?.tipo_incidente || "--"}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="stream-panel">
              <div className="panel-card stream-card">
                <div className="stream-header">
                  <div>
                    <div className="card-title">Data Stream</div>
                    <p>Eventos de telemetria e incidentes en tiempo real.</p>
                  </div>
                  <button className="ghost-button" type="button" onClick={() => setStream([])}>
                    Limpiar
                  </button>
                </div>
                <div className="stream-body">
                  {stream.length ? (
                    stream.map((entry) => (
                      <div key={entry.id} className={`stream-line ${entry.type}`}>
                        <div className="stream-meta">
                          <span>{formatClock(entry.timestamp)}</span>
                          <span className="stream-type">{entry.type}</span>
                        </div>
                        <pre className="stream-json">{JSON.stringify(entry.payload)}</pre>
                      </div>
                    ))
                  ) : (
                    <div className="stream-empty">Esperando eventos del simulador...</div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
