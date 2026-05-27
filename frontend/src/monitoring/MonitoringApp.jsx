import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../dashboard/hooks/useAuth.js";
import "../App.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001/api";

export default function MonitoringApp() {
  const { user, token, logout, isAuthenticated } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshInterval, setRefreshInterval] = useState(30); // segundos
  const [loginForm, setLoginForm] = useState({ correo: "", contrasena: "" });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const fetchStatus = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE}/monitoring/status`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Error al obtener los datos de monitoreo");
      }
      const resData = await response.json();
      setData(resData);
      setError("");
    } catch (err) {
      setError(err.message || "Fallo en la comunicación con el servidor");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchStatus();
  }, [isAuthenticated, fetchStatus]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(fetchStatus, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated, refreshInterval, fetchStatus]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Credenciales incorrectas");
      }
      localStorage.setItem("token", result.token);
      localStorage.setItem("supplychain-user", JSON.stringify(result.user));
      // Forzar recarga simple
      window.location.reload();
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.reload();
  };

  if (!isAuthenticated) {
    return (
      <div className="app-shell">
        <header className="app-header">
          <div className="brand">
            <span className="brand-kicker">MONITOREO</span>
            <strong>SupplyChain Pro</strong>
          </div>
          <nav className="app-nav">
            <Link to="/" className="app-nav-link">
              ⚙ Simulador
            </Link>
            <Link to="/dashboard" className="app-nav-link">
              🗺 Dashboard
            </Link>
            <Link to="/monitoring" className="app-nav-link active">
              📊 Monitoreo
            </Link>
          </nav>
        </header>
        <main className="app-main">
          <div className="login-card">
            <div className="login-header">
              <p className="kicker">Acceso restringido</p>
              <h2>Panel de Monitoreo</h2>
              <p>
                Inicia sesión para ver el estado de Pingdom, Fail2ban y Munin.
              </p>
            </div>
            {loginError && <div className="alert error">{loginError}</div>}
            <form className="login-form" onSubmit={handleLogin}>
              <label>
                Correo
                <input
                  type="email"
                  value={loginForm.correo}
                  onChange={(e) =>
                    setLoginForm({ ...loginForm, correo: e.target.value })
                  }
                  required
                />
              </label>
              <label>
                Contraseña
                <input
                  type="password"
                  value={loginForm.contrasena}
                  onChange={(e) =>
                    setLoginForm({ ...loginForm, contrasena: e.target.value })
                  }
                  required
                />
              </label>
              <button
                className="primary-button"
                type="submit"
                disabled={loginLoading}
              >
                {loginLoading ? "Cargando..." : "Ingresar"}
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  // Parse metrics helpers for Munin
  const metrics = data?.munin?.metrics || {};
  const hasMunin = data?.munin?.available;

  // Calculate CPU/Mem usage percentage based on typical output
  const cpuUser = metrics["cpu.user"] || 0;
  const cpuSystem = metrics["cpu.system"] || 0;
  const cpuIdle = metrics["cpu.idle"] || 100;
  const cpuUsed = 100 - cpuIdle;

  const memTotal = metrics["memory.total"] || 0;
  const memFree = metrics["memory.free"] || 0;
  const memUsed = memTotal - memFree;
  const memPct = memTotal > 0 ? (memUsed / memTotal) * 100 : 0;

  const diskUsed = metrics["df._dev_sda1.used"] || metrics["df.root.used"] || 0;
  const diskTotal =
    metrics["df._dev_sda1.total"] || metrics["df.root.total"] || 0;
  const diskIsPercent = diskTotal > 0 && diskTotal <= 100;
  const diskPct =
    diskTotal > 0
      ? diskIsPercent
        ? diskUsed
        : (diskUsed / diskTotal) * 100
      : 0;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-kicker">MONITOREO GENERAL</span>
          <strong>SupplyChain Pro</strong>
        </div>

        <nav className="app-nav">
          <Link to="/" className="app-nav-link">
            ⚙ Simulador
          </Link>
          <Link to="/dashboard" className="app-nav-link">
            🗺 Dashboard
          </Link>
          <Link to="/monitoring" className="app-nav-link active">
            📊 Monitoreo
          </Link>
        </nav>

        <div className="header-actions">
          <span className="user-chip">
            {user?.nombre_completo} · {user?.rol}
          </span>
          <button className="ghost-button" type="button" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="app-main">
        {error && <div className="alert error">{error}</div>}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <div>
            <h1 style={{ fontSize: "1.8rem", color: "var(--ink-strong)" }}>
              Estado del Sistema
            </h1>
            <p className="muted">
              Monitoreo activo de disponibilidad, seguridad y recursos
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <span className="muted" style={{ fontSize: "0.85rem" }}>
              Auto-refresh:
            </span>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              style={{
                padding: "6px 12px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
              }}
            >
              <option value={10}>10s</option>
              <option value={30}>30s</option>
              <option value={60}>60s</option>
            </select>
            <button
              className="secondary-button"
              onClick={fetchStatus}
              disabled={loading}
            >
              {loading ? "Actualizando..." : "Refrescar"}
            </button>
          </div>
        </div>

        <div
          className="simulation-layout"
          style={{ gridTemplateColumns: "1fr 1fr", gap: "24px" }}
        >
          {/* SECCIÓN PINGDOM */}
          <div
            className="panel-card"
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div className="card-title" style={{ margin: 0 }}>
                🟢 Uptime (Pingdom)
              </div>
              {data?.pingdom?.status === "up" ? (
                <span
                  className="status-pill"
                  style={{ background: "#e9f7ec", color: "#1d5b35" }}
                >
                  Todo Operativo
                </span>
              ) : data?.pingdom?.status === "down" ? (
                <span className="status-pill blocked">Alerta de Caída</span>
              ) : (
                <span className="status-pill">Sin Configurar</span>
              )}
            </div>

            {data?.pingdom?.status === "unconfigured" ? (
              <div className="info-banner">
                Configure la variable <code>PINGDOM_API_TOKEN</code> en el
                backend para habilitar la visualización del estado de sus
                endpoints.
              </div>
            ) : (
              <div style={{ display: "grid", gap: "12px" }}>
                {data?.pingdom?.checks?.map((check) => (
                  <div
                    key={check.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px",
                      background: "#faf6f1",
                      borderRadius: "12px",
                      border: "1px solid #efe4d9",
                    }}
                  >
                    <div>
                      <strong
                        style={{ display: "block", color: "var(--ink-strong)" }}
                      >
                        {check.name}
                      </strong>
                      <span className="muted" style={{ fontSize: "0.8rem" }}>
                        {check.hostname}
                      </span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span
                        className={`status-pill ${check.status === "up" ? "reachable" : "blocked"}`}
                        style={{ fontSize: "0.75rem", padding: "2px 8px" }}
                      >
                        {check.status.toUpperCase()}
                      </span>
                      {check.last_response_time && (
                        <div
                          className="muted"
                          style={{ fontSize: "0.8rem", marginTop: "4px" }}
                        >
                          {check.last_response_time} ms
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {(!data?.pingdom?.checks ||
                  data?.pingdom?.checks.length === 0) && (
                  <div
                    className="muted"
                    style={{ textAlign: "center", padding: "20px" }}
                  >
                    No se encontraron checks registrados en esta cuenta de
                    Pingdom.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECCIÓN FAIL2BAN */}
          <div
            className="panel-card"
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div className="card-title" style={{ margin: 0 }}>
                🛡️ Seguridad (Fail2ban)
              </div>
              {data?.fail2ban?.available ? (
                <span
                  className="status-pill"
                  style={{ background: "#e9f7ec", color: "#1d5b35" }}
                >
                  Protección Activa
                </span>
              ) : (
                <span className="status-pill blocked">Inactivo</span>
              )}
            </div>

            {!data?.fail2ban?.available ? (
              <div className="info-banner">
                No se pudo conectar con el daemon de Fail2ban. Asegúrese de que
                el contenedor <code>monitoring-fail2ban</code> está iniciado y
                compartiendo logs.
              </div>
            ) : (
              <div>
                <div className="meta-grid" style={{ marginBottom: "16px" }}>
                  <div>
                    <span>Baneos Hoy</span>
                    <strong style={{ color: "var(--accent-strong)" }}>
                      {data.fail2ban.bans_today}
                    </strong>
                  </div>
                  <div>
                    <span>Total Baneos Históricos</span>
                    <strong>{data.fail2ban.total_bans}</strong>
                  </div>
                </div>

                <div
                  className="card-title"
                  style={{ fontSize: "0.95rem", marginBottom: "8px" }}
                >
                  Baneos Recientes:
                </div>
                <div
                  style={{
                    maxHeight: "200px",
                    overflowY: "auto",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    background: "#faf6f1",
                  }}
                >
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "0.85rem",
                      textAlign: "left",
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          borderBottom: "1px solid var(--border)",
                          background: "#efe4d9",
                        }}
                      >
                        <th
                          style={{
                            padding: "8px 12px",
                            fontWeight: "600",
                            color: "var(--ink-strong)",
                          }}
                        >
                          IP
                        </th>
                        <th
                          style={{
                            padding: "8px 12px",
                            fontWeight: "600",
                            color: "var(--ink-strong)",
                          }}
                        >
                          Timestamp
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.fail2ban.recent_bans?.map((b, i) => (
                        <tr
                          key={i}
                          style={{ borderBottom: "1px solid var(--border)" }}
                        >
                          <td
                            style={{
                              padding: "8px 12px",
                              fontWeight: "600",
                              color: "var(--accent-strong)",
                            }}
                          >
                            {b.ip}
                          </td>
                          <td
                            style={{
                              padding: "8px 12px",
                              color: "var(--muted)",
                            }}
                          >
                            {b.timestamp}
                          </td>
                        </tr>
                      ))}
                      {(!data.fail2ban.recent_bans ||
                        data.fail2ban.recent_bans.length === 0) && (
                        <tr>
                          <td
                            colSpan="2"
                            style={{
                              padding: "16px",
                              textAlign: "center",
                              color: "var(--muted)",
                            }}
                          >
                            Ninguna IP ha sido baneada recientemente.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* SECCIÓN MUNIN (MÉTRICAS DE RECURSOS) */}
          <div
            className="panel-card"
            style={{
              gridColumn: "1 / -1",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div className="card-title" style={{ margin: 0 }}>
                📊 Recursos del Servidor (Munin)
              </div>
              {hasMunin ? (
                <span
                  className="status-pill"
                  style={{ background: "#e9f7ec", color: "#1d5b35" }}
                >
                  Conectado
                </span>
              ) : (
                <span className="status-pill blocked">Nodo Inaccesible</span>
              )}
            </div>

            {!hasMunin ? (
              <div className="info-banner">
                No se pudo conectar a munin-node (puerto 4949). Revise si el
                servicio <code>monitoring-munin-node</code> está corriendo.
              </div>
            ) : (
              <div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "20px",
                    marginBottom: "20px",
                  }}
                >
                  {/* CPU CARD */}
                  <div
                    style={{
                      background: "#faf6f1",
                      padding: "16px",
                      borderRadius: "12px",
                      border: "1px solid #efe4d9",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "8px",
                      }}
                    >
                      <span
                        className="muted"
                        style={{ fontWeight: "600", fontSize: "0.8rem" }}
                      >
                        CPU
                      </span>
                      <strong style={{ color: "var(--ink-strong)" }}>
                        {cpuUsed.toFixed(1)}%
                      </strong>
                    </div>
                    <div className="storage-meter">
                      <div
                        className={`storage-fill ${cpuUsed > 80 ? "full" : ""}`}
                        style={{ width: `${Math.min(cpuUsed, 100)}%` }}
                      />
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: "8px",
                        fontSize: "0.75rem",
                      }}
                      className="muted"
                    >
                      <span>User: {cpuUser.toFixed(0)}%</span>
                      <span>Sys: {cpuSystem.toFixed(0)}%</span>
                    </div>
                  </div>

                  {/* MEMORIA CARD */}
                  <div
                    style={{
                      background: "#faf6f1",
                      padding: "16px",
                      borderRadius: "12px",
                      border: "1px solid #efe4d9",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "8px",
                      }}
                    >
                      <span
                        className="muted"
                        style={{ fontWeight: "600", fontSize: "0.8rem" }}
                      >
                        Memoria RAM
                      </span>
                      <strong style={{ color: "var(--ink-strong)" }}>
                        {memPct.toFixed(1)}%
                      </strong>
                    </div>
                    <div className="storage-meter">
                      <div
                        className={`storage-fill ${memPct > 85 ? "full" : ""}`}
                        style={{ width: `${Math.min(memPct, 100)}%` }}
                      />
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: "8px",
                        fontSize: "0.75rem",
                      }}
                      className="muted"
                    >
                      <span>
                        Usada: {(memUsed / 1024 / 1024).toFixed(0)} MB
                      </span>
                      <span>
                        Total: {(memTotal / 1024 / 1024).toFixed(0)} MB
                      </span>
                    </div>
                  </div>

                  {/* DISCO CARD */}
                  <div
                    style={{
                      background: "#faf6f1",
                      padding: "16px",
                      borderRadius: "12px",
                      border: "1px solid #efe4d9",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "8px",
                      }}
                    >
                      <span
                        className="muted"
                        style={{ fontWeight: "600", fontSize: "0.8rem" }}
                      >
                        Disco Principal
                      </span>
                      <strong style={{ color: "var(--ink-strong)" }}>
                        {diskPct.toFixed(1)}%
                      </strong>
                    </div>
                    <div className="storage-meter">
                      <div
                        className={`storage-fill ${diskPct > 90 ? "full" : ""}`}
                        style={{ width: `${Math.min(diskPct, 100)}%` }}
                      />
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: "8px",
                        fontSize: "0.75rem",
                      }}
                      className="muted"
                    >
                      <span>
                        Usado:{" "}
                        {diskIsPercent
                          ? `${diskUsed.toFixed(1)}%`
                          : `${(diskUsed / 1024 / 1024 / 1024).toFixed(1)} GB`}
                      </span>
                      <span>
                        Total:{" "}
                        {diskIsPercent
                          ? "100%"
                          : `${(diskTotal / 1024 / 1024 / 1024).toFixed(1)} GB`}
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "rgba(216,76,64,0.06)",
                    padding: "14px 20px",
                    borderRadius: "12px",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div>
                    <strong
                      style={{
                        color: "var(--ink-strong)",
                        fontSize: "0.95rem",
                      }}
                    >
                      ¿Deseas ver las gráficas históricas detalladas?
                    </strong>
                    <p
                      className="muted"
                      style={{ fontSize: "0.85rem", marginTop: "2px" }}
                    >
                      Munin genera reportes visuales cada 5 minutos de
                      rendimiento, red y almacenamiento.
                    </p>
                  </div>
                  <a
                    href="http://localhost:8081"
                    target="_blank"
                    rel="noreferrer"
                    className="primary-button"
                    style={{ textDecoration: "none", fontSize: "0.85rem" }}
                  >
                    Ver Gráficas en Puerto 8081
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
