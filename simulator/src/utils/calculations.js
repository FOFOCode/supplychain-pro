/**
 * Utilidades de cálculo: Distancia, interpolación, etc.
 */

/**
 * Calcula la distancia entre dos puntos usando Haversine
 */
function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distancia = R * c;
  return distancia * 1000; // Convertir a metros
}

/**
 * Genera un número aleatorio entre min y max
 */
function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * Interpola entre dos puntos geográficos
 */
function interpolarPunto(punto1, punto2, progreso) {
  return {
    lat: punto1.lat + (punto2.lat - punto1.lat) * progreso,
    lng: punto1.lng + (punto2.lng - punto1.lng) * progreso
  };
}

module.exports = {
  calcularDistancia,
  randomBetween,
  interpolarPunto
};
