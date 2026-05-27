/**
 * Utilidades de formato para el dashboard
 */

/**
 * Formatea un ID de envío a formato humanizado
 * Ejemplo: 1 -> ENV-NEW-0001
 */
export function formatShipmentId(id) {
  if (!id) return "ENV-NEW-0000";
  const numStr = String(id).padStart(4, "0");
  return `ENV-NEW-${numStr}`;
}

/**
 * Genera un color según tipo de incidente
 */
export function getIncidentTypeColor(tipo) {
  const colors = {
    RUPTURA_CADENA_FRIO: "#ef4444",
    TEMPERATURA_CRITICA: "#db2777",
    BATERIA_BAJA: "#eab308",
    GEOFENCE_VIOLATION: "#f97316",
    VIOLACION_GEOFENCE: "#f97316",
    OUT_OF_BOUNDS: "#2563eb",
    DESVIO_RUTA: "#2563eb",
    STORAGE_FULL: "#7c3aed",
    VOLUMEN_LLENO: "#7c3aed",
    PERDIDA_SENAL: "#6b7280",
    HUMEDAD_CRITICA: "#0891b2",
    ERROR_SENSOR: "#059669",
  };
  return colors[(tipo || "").toString().toUpperCase()] || "#6b7280";
}

/**
 * Obtiene etiqueta traducida del tipo de incidente
 */
export function getIncidentTypeLabel(tipo) {
  const labels = {
    RUPTURA_CADENA_FRIO: "🥶 Ruptura de Cadena de Frío",
    TEMPERATURA_CRITICA: "🌡️ Temperatura Crítica",
    BATERIA_BAJA: "🔋 Batería Baja",
    GEOFENCE_VIOLATION: "🗺️ Violación de Geofence",
    VIOLACION_GEOFENCE: "🗺️ Violación de Geofence",
    OUT_OF_BOUNDS: "🗺️ Desvío de Ruta",
    DESVIO_RUTA: "🗺️ Desvío de Ruta",
    STORAGE_FULL: "📦 Volumen Lleno",
    VOLUMEN_LLENO: "📦 Volumen Lleno",
    PERDIDA_SENAL: "📡 Pérdida de Señal",
    HUMEDAD_CRITICA: "💧 Humedad Crítica",
    ERROR_SENSOR: "⚙️ Error de Sensor",
  };
  return labels[(tipo || "").toString().toUpperCase()] || tipo || "Incidente";
}

/**
 * Obtiene explicación detallada del incidente
 */
export function getIncidentExplanation(incident) {
  const tipo = (incident.tipo_incidente || "").toString().toUpperCase();
  const valorReg = incident.valor_registrado;
  const valorLim = incident.valor_limite;

  const explanations = {
    RUPTURA_CADENA_FRIO: `Ruptura de la cadena de frío detectada. Temperatura registrada: ${valorReg}°C. Límite permitido: ${valorLim}°C.`,
    TEMPERATURA_CRITICA: `Temperatura crítica detectada en el envío. Se registró ${valorReg}°C cuando el límite es ${valorLim}°C.`,
    BATERIA_BAJA: `Batería del dispositivo de telemetría baja. Nivel: ${valorReg}%.`,
    GEOFENCE_VIOLATION: `El vehículo se salió de la zona permitida (geofence).`,
    VIOLACION_GEOFENCE: `El vehículo se salió de la zona permitida (geofence).`,
    OUT_OF_BOUNDS: `El vehículo se ha desviado de la ruta planificada.`,
    DESVIO_RUTA: `El vehículo se ha desviado de la ruta planificada.`,
    STORAGE_FULL: `El volumen de almacenamiento del dispositivo o contenedor de carga ha alcanzado su capacidad máxima.`,
    VOLUMEN_LLENO: `El volumen de almacenamiento del dispositivo o contenedor de carga ha alcanzado su capacidad máxima.`,
    PERDIDA_SENAL: `Pérdida de señal del dispositivo de telemetría.`,
    HUMEDAD_CRITICA: `Humedad crítica detectada. Nivel: ${valorReg}%.`,
    ERROR_SENSOR: `Error en uno o más sensores del dispositivo.`,
  };

  return explanations[tipo] || incident.descripcion || "Incidente registrado en el sistema.";
}
