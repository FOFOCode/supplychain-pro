/**
 * geoService.js - Servicio para geocodificación inversa.
 *
 * Utiliza la API pública de Nominatim (OpenStreetMap) para convertir
 * coordenadas (latitud, longitud) en direcciones legibles por humanos.
 *
 * Incluye un sistema de caché en memoria para evitar solicitudes
 * duplicadas para las mismas coordenadas durante la sesión,
 * mejorando el rendimiento y respetando los límites de la API.
 */

const cache = new Map();
const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/reverse";

/**
 * Obtiene el nombre de un lugar a partir de sus coordenadas.
 *
 * @param {number} lat - Latitud.
 * @param {number} lon - Longitud.
 * @returns {Promise<string>} El nombre del lugar o un texto de fallback.
 */
async function reverseGeocode(lat, lon) {
  if (lat == null || lon == null) {
    return "Ubicación desconocida";
  }

  const cacheKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  try {
    // Construir la URL para la API de Nominatim
    const url = `${NOMINATIM_ENDPOINT}?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`;

    const response = await fetch(url, {
      headers: {
        "Accept-Language": "es-ES,es;q=0.9",
      },
    });

    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    const data = await response.json();

    // Construir un nombre de lugar descriptivo a partir de la respuesta
    const { address } = data;
    let placeName = "Ubicación sin nombre";

    if (data.display_name) {
      // Prioridad 1: Usar el nombre para mostrar si está disponible
      placeName = data.display_name.split(",").slice(0, 3).join(", ");
    } else if (address) {
      // Prioridad 2: Construir a partir de las partes de la dirección
      placeName = [
        address.road || address.pedestrian,
        address.city || address.town || address.village,
        address.state,
      ]
        .filter(Boolean)
        .join(", ");
    }

    // Guardar en caché y devolver
    cache.set(cacheKey, placeName);
    return placeName;
  } catch (error) {
    console.error("Error en geocodificación inversa:", error);
    // En caso de error, guardar un fallback en caché para no reintentar
    cache.set(cacheKey, `Coord: ${lat.toFixed(2)}, ${lon.toFixed(2)}`);
    return `Coord: ${lat.toFixed(2)}, ${lon.toFixed(2)}`;
  }
}

export const geoService = {
  reverseGeocode,
};
