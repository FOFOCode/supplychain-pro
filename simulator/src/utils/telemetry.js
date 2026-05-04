/**
 * Generación de telemetría simulada
 */

const { randomBetween } = require('./calculations');

/**
 * Simula cambios en la telemetría
 */
function generarTelemetria(telemetriaAnterior, tempMinPermitida, tempMaxPermitida) {
  const temp = telemetriaAnterior?.temperatura || randomBetween(tempMinPermitida, tempMaxPermitida);
  const humedad = telemetriaAnterior?.humedad || randomBetween(55, 75);
  const bateria = (telemetriaAnterior?.porcentaje_bateria || 100) - randomBetween(0, 0.5);

  return {
    temperatura: Math.max(
      tempMinPermitida - 5,
      Math.min(tempMaxPermitida + 5, temp + randomBetween(-0.5, 0.5))
    ),
    humedad: Math.max(30, Math.min(95, humedad + randomBetween(-2, 2))),
    porcentaje_bateria: Math.max(0, Math.min(100, bateria))
  };
}

module.exports = {
  generarTelemetria
};
