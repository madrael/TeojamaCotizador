/*************************************************
 * FINANCE.JS
 * Motor de cálculo financiero
 * Sistema francés – cuota fija
 * V 1.0 – Compilación 00002
 *************************************************/

/**
 * Calcula financiamiento bajo sistema francés
 * @param {Object} params
 * @param {number} params.montoFinanciar  Monto total a financiar
 * @param {number} params.tasaAnual       Tasa anual en porcentaje (ej: 12.5)
 * @param {number} params.plazoMeses      Plazo en meses
 * @returns {Object}
 */
function calcularFinanciamiento({ montoFinanciar, tasaAnual, plazoMeses }) {
  montoFinanciar = Number(montoFinanciar);
  tasaAnual = Number(tasaAnual);
  plazoMeses = Number(plazoMeses);

  if (montoFinanciar <= 0 || plazoMeses <= 0) {
    return {
      cuotaMensual: 0,
      totalPagado: 0,
      intereses: 0
    };
  }

  // Caso especial: tasa 0%
  if (tasaAnual === 0) {
    const cuota = montoFinanciar / plazoMeses;
    return {
      cuotaMensual: cuota,
      totalPagado: montoFinanciar,
      intereses: 0
    };
  }

  const tasaMensual = (tasaAnual / 100) / 12;

  const cuotaMensual =
    (montoFinanciar * tasaMensual) /
    (1 - Math.pow(1 + tasaMensual, -plazoMeses));

  const totalPagado = cuotaMensual * plazoMeses;
  const intereses = totalPagado - montoFinanciar;

  return {
    cuotaMensual,
    totalPagado,
    intereses
  };
}
