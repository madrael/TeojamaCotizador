/*************************************************
 * Archivo      : finance.js
 * Proyecto     : Cotizador Vehículos Teojama
 * Versión      : V 1.0
 * Compilación  : 3.23.1
 * Estado       : ESTABLE
 * Descripción  : Motor financiero base
 *               (amortización francesa)
 *************************************************/

/**
 * Calcula la cuota mensual usando amortización francesa
 */
function calcularCuotaMensual(monto, tasaAnual, plazoMeses) {
  const tasaMensual = (tasaAnual / 100) / 12;

  if (monto <= 0 || plazoMeses <= 0) {
    return 0;
  }

  if (tasaMensual === 0) {
    return monto / plazoMeses;
  }

  return monto *
    (tasaMensual * Math.pow(1 + tasaMensual, plazoMeses)) /
    (Math.pow(1 + tasaMensual, plazoMeses) - 1);
}

/**
 * Ejecuta la cotización completa
 * @param {object} appState Estado actual de la UI
 */
function calcularCotizacion(appState) {

  // --- Valores base ---
  const pvp = Number(document.getElementById("pvp")?.textContent) || 0;
  const entrada = Number(document.getElementById("inputEntrada")?.value) || 0;

  const seguro = appState.incluyeSeguro
    ? Number(document.getElementById("inputSeguro")?.value) || 0
    : 0;

  const dispositivo = appState.incluyeDispositivo && appState.dispositivo
    ? Number(document.getElementById("deviceValueDisplay")?.textContent) || 0
    : 0;

  // --- Tasa y plazo ---
  const tasaCredito = appState.tasa
    ? Number(
        document.querySelector(
          `#selectTasa option[value="${appState.tasa}"]`
        )?.textContent.replace("%", "")
      )
    : 0;

  const plazo = Number(appState.plazo) || 0;

  // --- Cálculos ---
  const montoFinanciado = Math.max(pvp - entrada, 0);
  const cuota = calcularCuotaMensual(
    montoFinanciado,
    tasaCredito,
    plazo
  );

  const totalCredito = cuota * plazo;

  return {
    pvp,
    entrada,
    montoFinanciado,
    tasaCredito,
    plazo,
    cuota,
    totalCredito,
    seguro,
    dispositivo,
    totalOperacion:
      totalCredito + seguro + dispositivo
  };
}

/**
 * Renderiza resultados en pantalla
 */
function mostrarResultado(resultado) {
  const div = document.getElementById("tablaFinanciamiento");
  if (!div) return;

  div.innerHTML = `
    <div class="fin-row"><span>PVP</span><strong>$${resultado.pvp.toFixed(2)}</strong></div>
    <div class="fin-row"><span>Entrada</span><strong>$${resultado.entrada.toFixed(2)}</strong></div>
    <div class="fin-row"><span>Monto financiado</span><strong>$${resultado.montoFinanciado.toFixed(2)}</strong></div>
    <div class="fin-row"><span>Tasa anual</span><strong>${resultado.tasaCredito}%</strong></div>
    <div class="fin-row"><span>Plazo</span><strong>${resultado.plazo} meses</strong></div>
    <hr />
    <div class="fin-row"><span>Cuota mensual</span><strong>$${resultado.cuota.toFixed(2)}</strong></div>
    <div class="fin-row"><span>Total crédito</span><strong>$${resultado.totalCredito.toFixed(2)}</strong></div>
    <div class="fin-row"><span>Seguro</span><strong>$${resultado.seguro.toFixed(2)}</strong></div>
    <div class="fin-row"><span>Dispositivo</span><strong>$${resultado.dispositivo.toFixed(2)}</strong></div>
    <hr />
    <div class="fin-row"><span>Total operación</span><strong>$${resultado.totalOperacion.toFixed(2)}</strong></div>
  `;
}
