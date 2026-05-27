/**
 * EstadísticasView - Dashboard de Estadísticas Avanzado
 * Muestra gráficas interactivas sobre vehículos, rutas, y tipos de incidentes.
 * Permite navegar al mapa haciendo clic en los datos.
 */

import { useState, useMemo, useEffect } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useEstadisticas } from "../hooks/useEstadisticas.js";
import FiltersPanel from "./FiltersPanel.jsx";
import { getIncidentTypeColor, getIncidentTypeLabel, formatShipmentId } from "../utils/formatters.js";
import { geoService } from "../services/geoService.js";
import "./styles/ConfiguracionView.css";

// Removed STATIC_COLORS and getColor function

// Componente de resolución de ubicación asíncrono basado en coordenadas
function IncidentLocation({ lat, lon }) {
  const [address, setAddress] = useState("Cargando ubicación...");

  useEffect(() => {
    let active = true;
    if (lat == null || lon == null) {
      setAddress("Ubicación desconocida");
      return;
    }

    geoService
      .reverseGeocode(Number(lat), Number(lon))
      .then((addr) => {
        if (active) {
          setAddress(addr);
        }
      })
      .catch(() => {
        if (active) {
          setAddress(`Coord: ${Number(lat).toFixed(4)}, ${Number(lon).toFixed(4)}`);
        }
      });

    return () => {
      active = false;
    };
  }, [lat, lon]);

  return <span>📍 {address}</span>;
}

export default function EstadísticasView({ onNavigateToMap }) {
  const [filters, setFilters] = useState({
    startDate: getDefaultStartDate(),
    endDate: new Date().toISOString().split("T")[0],
    vehiculoId: "",
    rutaId: "",
    envioId: "",
  });

  const { vehiculos, rutas, tipos, incidentes, resumen, loading, error, refreshEstadisticas } = useEstadisticas(filters);

  // Memoiza los datos procesados para las gráficas para evitar recálculos innecesarios
  const { processedVehiculos, processedRutas, allIncidentTypes } = useMemo(() => {
    const allTypes = new Set();
    (vehiculos || []).forEach(v => {
      if (v && v.tipos) {
        Object.keys(v.tipos).forEach(t => allTypes.add(t));
      }
    });
    (rutas || []).forEach(r => {
      if (r && r.tipos) {
        Object.keys(r.tipos).forEach(t => allTypes.add(t));
      }
    });
    const allIncidentTypes = Array.from(allTypes);

    const processData = (data, keyField) => {
      return data.map(item => ({
        [keyField]: item[keyField],
        ...allIncidentTypes.reduce((acc, type) => {
          acc[type] = item.tipos[type] || 0;
          return acc;
        }, {}),
      }));
    };

    return {
      processedVehiculos: processData(vehiculos, 'vehiculo'),
      processedRutas: processData(rutas, 'ruta'),
      allIncidentTypes,
    };
  }, [vehiculos, rutas]);

  function getDefaultStartDate() {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split("T")[0];
  }

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleChartClick = (data, type) => {
    if (onNavigateToMap) {
      onNavigateToMap({ data, type });
    }
  };

  if (loading && !vehiculos?.length) {
    return (
      <div className="config-view-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="config-view-container">
      {/* Panel de Filtros */}
      <FiltersPanel onFiltersChange={handleFiltersChange} />

      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <p>⚠️ {error}</p>
          <button onClick={refreshEstadisticas} className="retry-btn">
            Reintentar
          </button>
        </div>
      )}

      {/* Resumen General */}
      {resumen && (
        <div className="summary-cards">
          <div className="card">
            <h3>Total Incidentes</h3>
            <p className="big-number">{resumen.total}</p>
          </div>
          <div className="card">
            <h3>Tipos Registrados</h3>
            <p className="big-number">{tipos?.length || 0}</p>
          </div>
          <div className="card">
            <h3>Vehículos Afectados</h3>
            <p className="big-number">{vehiculos?.length || 0}</p>
          </div>
          <div className="card">
            <h3>Rutas Afectadas</h3>
            <p className="big-number">{rutas?.length || 0}</p>
          </div>
        </div>
      )}

      {/* Gráficas */}
      <div className="charts-grid">
        {/* Gráfica de Vehículos */}
        <div className="chart-container clickable">
          <h3>📦 Incidentes por Vehículo (Desglosado)</h3>
          {processedVehiculos?.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={processedVehiculos}
                onClick={(state) => {
                  if (state.activeTooltipIndex !== undefined) {
                    handleChartClick(vehiculos[state.activeTooltipIndex], "vehiculo");
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="vehiculo"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip cursor={{ fill: "rgba(0, 0, 0, 0.1)" }} />
                <Legend />
                {allIncidentTypes.map((type) => (
                  <Bar
                    key={type}
                    dataKey={type}
                    stackId="a"
                    fill={getIncidentTypeColor(type)}
                    name={getIncidentTypeLabel(type)}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="empty-message">Sin datos disponibles</p>
          )}
          <p className="hint-text">💡 Haz clic en una barra para ver detalles en el mapa</p>
        </div>

        {/* Gráfica de Rutas */}
        <div className="chart-container clickable">
          <h3>🛣️ Incidentes por Ruta (Desglosado)</h3>
          {processedRutas?.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={processedRutas}
                onClick={(state) => {
                  if (state.activeTooltipIndex !== undefined) {
                    handleChartClick(rutas[state.activeTooltipIndex], "ruta");
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="ruta"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip cursor={{ fill: "rgba(0, 0, 0, 0.1)" }} />
                <Legend />
                {allIncidentTypes.map((type) => (
                  <Bar
                    key={type}
                    dataKey={type}
                    stackId="a"
                    fill={getIncidentTypeColor(type)}
                    name={getIncidentTypeLabel(type)}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="empty-message">Sin datos disponibles</p>
          )}
          <p className="hint-text">💡 Haz clic en una barra para ver detalles en el mapa</p>
        </div>

        {/* Gráfica de Tipos de Incidentes */}
        <div className="chart-container full-width">
          <h3>⚠️ Distribución por Tipo</h3>
          {tipos?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={tipos}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ tipo_incidente, total_incidentes }) =>
                    `${getIncidentTypeLabel(tipo_incidente)}: ${total_incidentes}`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="total_incidentes"
                  nameKey="tipo_incidente"
                >
                  {tipos.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getIncidentTypeColor(entry.tipo_incidente)} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, getIncidentTypeLabel(name)]} />
                <Legend formatter={(value) => getIncidentTypeLabel(value)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="empty-message">Sin datos disponibles</p>
          )}
        </div>
      </div>

      {/* Tabla Detallada de Tipos */}
      <div className="details-section">
        <h3>📋 Detalle de Tipos de Incidentes</h3>
        {tipos?.length > 0 ? (
          <div className="table-wrapper">
            <table className="details-table">
              <thead>
                <tr>
                  <th>Tipo de Incidente</th>
                  <th>Total</th>
                  <th>Primer Incidente</th>
                  <th>Último Incidente</th>
                </tr>
              </thead>
              <tbody>
                {tipos.map((tipo, idx) => (
                  <tr key={idx}>
                    <td>{getIncidentTypeLabel(tipo.tipo_incidente)}</td>
                    <td className="number">{tipo.total_incidentes}</td>
                    <td>{new Date(tipo.primer_incidente).toLocaleDateString()}</td>
                    <td>{new Date(tipo.ultimo_incidente).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-message">Sin datos disponibles</p>
        )}
      </div>

      {/* Tabla Detallada por Incidente */}
      <div className="details-section" style={{ marginTop: "32px" }}>
        <h3>📋 Registro de Incidentes Detallado</h3>
        {incidentes?.length > 0 ? (
          <div className="table-wrapper">
            <table className="details-table">
              <thead>
                <tr>
                  <th>Incidente</th>
                  <th>Envío</th>
                  <th>Vehículo</th>
                  <th>Ubicación (Localidad / Ciudad)</th>
                  <th>Valores</th>
                  <th>Fecha y Hora</th>
                </tr>
              </thead>
              <tbody>
                {incidentes.map((inc, idx) => {
                  const typeColor = getIncidentTypeColor(inc.tipo_incidente);
                  const shipmentCode = inc.codigo_rastreo || formatShipmentId(inc.id_envio);
                  const vehicleLabel = inc.vehiculo_placa || (inc.id_vehiculo ? `#${inc.id_vehiculo}` : "Sin asignar");

                  const dateFormatted = new Date(inc.fecha_incidente).toLocaleDateString();
                  const timeFormatted = new Date(inc.fecha_incidente).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <tr key={inc.id_incidente || idx}>
                      <td>
                        <span style={{ 
                          display: "inline-flex", 
                          alignItems: "center", 
                          gap: "8px", 
                          fontWeight: 600,
                          color: typeColor
                        }}>
                          <span style={{ 
                            width: "8px", 
                            height: "8px", 
                            borderRadius: "50%", 
                            backgroundColor: typeColor,
                            display: "inline-block"
                          }}></span>
                          {getIncidentTypeLabel(inc.tipo_incidente)}
                        </span>
                      </td>
                      <td>
                        <strong style={{ color: "var(--color-primary)" }}>{shipmentCode}</strong>
                      </td>
                      <td>{vehicleLabel}</td>
                      <td>
                        <span style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)" }}>
                          <IncidentLocation lat={inc.latitud} lon={inc.longitud} />
                        </span>
                      </td>
                      <td>
                        {inc.valor_registrado != null ? (
                          <span style={{ fontSize: "0.9rem" }}>
                            {inc.valor_registrado} (Límite: {inc.valor_limite || "N/A"})
                          </span>
                        ) : (
                          <span style={{ color: "var(--color-text-tertiary)" }}>—</span>
                        )}
                      </td>
                      <td>
                        <span style={{ whiteSpace: "nowrap" }}>{dateFormatted} {timeFormatted}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-message">Sin datos de incidentes disponibles</p>
        )}
      </div>
    </div>
  );
}

