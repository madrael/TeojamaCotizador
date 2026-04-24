/* =========================================================
 Proyecto      : Cotizador de Vehículos Teojama
 Archivo       : finance.js
 Versión       : V 2.0
 Compilación   : 1.58
 Estado        : AJUSTE MODELO FINANCIERO (SEGURO FINANCIADO)
 Descripción   :
   - Seguro anual se financia
   - Seguro anual se prorratea por plazo
   - Dispositivo sigue variando por plazo
   - Cuota francesa se calcula sobre el total financiado
========================================================= */

const PLAZOS_FIJOS = [12, 24, 36, 48, 60, 72];

/* =========================
   Utilidades
========================= */

function money(value) {
  const n = Number(value) || 0;
  return `$${n.toFixed(2)}`;
}

function limpiarPlazoActivo() {
  document
    .querySelectorAll(".plazo-activo")
    .forEach(el => el.classList.remove("plazo-activo"));
}

function marcarPlazoActivo(plazo) {
  if (!plazo) return;
  document
    .querySelectorAll(`[data-plazo="${plazo}"]`)
    .forEach(el => el.classList.add("plazo-activo"));
}

/* =========================
   Valores base
========================= */

function getPVP() {
  const el = document.getElementById("pvp");
  if (!el) return 0;
  return Number(el.textContent.replace(/[^0-9.]/g, "")) || 0;
}

function getEntrada() {
  return Number(document.getElementById("inputEntrada")?.value) || 0;
}

function getSeguro() {
  const chk = document.getElementById("chkSeguro");
  const inp = document.getElementById("inputSeguro");
  if (!chk?.checked) return 0;
  return Number(inp?.value) || 0; // valor ANUAL
}

function getTasaAnual() {
  const sel = document.getElementById("selectTasa");
  if (!sel || sel.selectedIndex < 0) return 0;

  const txt = sel.options[sel.selectedIndex].textContent;
  const match = txt.match(/(\d+(\.\d+)?)/);
  return match ? Number(match[1]) / 100 : 0;
}

/* =========================
   Dispositivo (resolución robusta)
========================= */

function isDispositivoActivo() {
  return !!document.getElementById("chkDispositivo")?.checked;
}

async function resolveDevicePlan() {
  const planState = window.appState?.dispositivo?.plan;
  if (planState) return planState;

  const sel = document.getElementById("selectDevicePlan");
  if (sel && sel.selectedIndex >= 0) {
    const opt = sel.options[sel.selectedIndex];
    const raw =
      opt?.dataset?.planJson ||
      opt?.dataset?.plan ||
      opt?.getAttribute("data-plan-json") ||
      opt?.getAttribute("data-plan");

    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.valoresPorAnio) return parsed;
      } catch (_) {}
    }

    const value = (sel.value || "").trim();
    if (value) {
      try {
        const plans = await (typeof loadDevicePlans === "function"
          ? loadDevicePlans()
          : Promise.resolve(null));

        if (Array.isArray(plans)) {
          const asNum = Number(value);
          const found =
            plans.find(p => Number(p.idPlan) === asNum) ||
            plans.find(p => String(p.codigo) === value) ||
            plans.find(p => String(p.idPlan) === value);

          if (found) return found;
        }
      } catch (e) {
        console.warn("No se pudo cargar DevicePlans:", e);
      }
    }
  }
  return null;
}

function getValorPorAnio(plan, plazoMeses) {
  if (!plan?.valoresPorAnio) return 0;
  const anios = String(plazoMeses / 12);
  return Number(plan.valoresPorAnio[anios]) || 0;
}

async function getValorDispositivoPorPlazo(plazoMeses) {
  if (!isDispositivoActivo()) return 0;
  const plan = await resolveDevicePlan();
  if (!plan) return 0;
  return getValorPorAnio(plan, plazoMeses);
}

/* =========================
   Panel izquierdo
========================= */

async function renderResumenDispositivo() {
  const providerEl = document.getElementById("deviceProvider");
  const valueEl = document.getElementById("deviceValueDisplay");
  const container = document.getElementById("deviceContainer");

  if (!container || !providerEl || !valueEl) return;

  if (!isDispositivoActivo()) {
    valueEl.textContent = "-";
    providerEl.textContent = "-";
    return;
  }

  const plan = await resolveDevicePlan();
  if (!plan) {
    valueEl.textContent = "-";
    providerEl.textContent = "-";
    return;
  }

  const plazoSel = Number(document.getElementById("selectPlazo")?.value) || 12;
  const val = getValorPorAnio(plan, plazoSel);

  providerEl.textContent = plan.proveedor || "-";
  valueEl.textContent =
    Number.isFinite(val) && val > 0 ? val.toFixed(2) : "-";
}

/* =========================
   Cuota francesa
========================= */

function cuotaFrancesa(monto, tasaAnual, plazoMeses) {
  if (monto <= 0 || plazoMeses <= 0) return 0;

  const tasaMensual = typeof getTasaMensualNominal === "function"
  ? getTasaMensualNominal(tasaAnual)
  : tasaAnual / 12;
  if (tasaMensual === 0) return monto / plazoMeses;

  const f = Math.pow(1 + tasaMensual, plazoMeses);
  return (monto * tasaMensual * f) / (f - 1);
}

/* =========================
   Resumen tipo banco (nuevo)
========================= */

function renderResumenCredito({
  plazo,
  tasaAnual,
  cuota,
  montoFinanciar,
  seguroAnual,
  dispositivoTotal
}) {
  const totalInteres = (cuota * plazo) - montoFinanciar;
  const totalPagar = cuota * plazo;

  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  setText("summary-cuota", money(cuota));
  setText("summary-tasa", `${(tasaAnual * 100).toFixed(5)}%`);
  setText("summary-tasa-detail", `${(tasaAnual * 100).toFixed(5)}%`);
  setText("summary-plazo", `${plazo} meses`);
  setText("summary-capital", money(montoFinanciar));
  setText("summary-seguro", money(seguroAnual));
  setText("summary-dispositivo", money(dispositivoTotal));
  setText("summary-interes", money(totalInteres));
  setText("summary-total-pagar", money(totalPagar));
}

/* =========================
   Render resumen por año
========================= */

function renderResumenPorAnio(yearlySummary, term) {
  const container = document.getElementById("creditSummaryByYear");
  if (!container) return;

  if (!Array.isArray(yearlySummary) || yearlySummary.length === 0) {
    container.innerHTML = "<p>No hay información para mostrar.</p>";
    return;
  }

  const years = Math.ceil((Number(term) || 0) / 12);

  const title = document.getElementById("creditSummaryTitle");
  if (title) {
      title.textContent = `Resumen del crédito a ${term} meses`;
  }
  

  let headers = "";
  let rowVehiculo = "";
  let rowDispositivo = "";
  let rowSeguroBase = "";
  let rowLucroCesante = "";
  let rowSeguroTotal = "";
  let rowTotal = "";

  for (let i = 0; i < years; i++) {
    const item = yearlySummary[i] || {
      cuotaVehiculo: 0,
      cuotaDispositivo: 0,
      seguroAnualBase: 0,
      lucroCesanteAnnual: 0,
      cuotaSeguro: 0,
      cuotaTotalMensual: 0     
    };

    const monthsInYear = (i === years - 1 && term % 12 !== 0) ? term % 12 : 12;
    const cuotaSeguroBase = (Number(item.seguroAnualBase) || 0) / 12;
    const cuotaLucroCesante = (Number(item.lucroCesanteAnnual) || 0) / 12;
    
    headers += `<th>${i + 1}er año<br><small>${monthsInYear} meses</small></th>`;
    rowVehiculo += `<td>${money(item.cuotaVehiculo)}</td>`;
    rowDispositivo += `<td>${money(item.cuotaDispositivo)}</td>`;
    rowSeguroBase += `<td>${money(cuotaSeguroBase)}</td>`;
    rowLucroCesante += `<td>${money(cuotaLucroCesante)}</td>`;
    rowSeguroTotal += `<td>${money(item.cuotaSeguro)}</td>`;
    rowTotal += `<td><strong>${money(item.cuotaTotalMensual)}</strong></td>`;
  }

  container.innerHTML = `
    <table class="finance-table">
      <thead>
        <tr>
          <th>Concepto</th>
          ${headers}
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="concepto">Cuota fija vehículo</td>
          ${rowVehiculo}
        </tr>
        <tr>
          <td class="concepto">Rastreo Satelital</td>
          ${rowDispositivo}
        </tr>
        <tr>
          <td class="concepto">Seguro mensual</td>
          ${rowSeguroBase}
        </tr>
        <tr>
          <td class="concepto">Lucro cesante</td>
          ${rowLucroCesante}
        </tr>
        <tr>
          <td class="concepto"><strong>Total seguro mensual</strong></td>
          ${rowSeguroTotal}
        </tr>
        <tr class="finance-separator">
          <td colspan="${years + 1}"></td>
        </tr>
        <tr>
          <td class="concepto"><strong>Cuota Total Mensual</strong></td>
          ${rowTotal}
        </tr>
      </tbody>
    </table>
  `;
}

/* =========================
   Render tabla
========================= */

async function renderTablaFinanciamiento() {
  const pvp = getPVP();
  const entrada = getEntrada();
  const seguroAnual = getSeguro();
  const tasaAnual = getTasaAnual();

  const plazoSeleccionado =
    Number(document.getElementById("selectPlazo")?.value) || 0;

  let quoteResult = null;

  if (window.lastQuoteResult) {
    quoteResult = window.lastQuoteResult;
  }

  limpiarPlazoActivo();

  for (const plazo of PLAZOS_FIJOS) {
    const dispositivo = await getValorDispositivoPorPlazo(plazo);

    // 🔹 MODELO FINANCIERO TABLA SUPERIOR
    const montoTotal = pvp + seguroAnual + dispositivo;
    const montoFinanciar = Math.max(montoTotal - entrada, 0);

    const set = (id, val) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (typeof val === "string") {
        el.textContent = val;
      } else {
        el.textContent = money(val);
      }
    };

    set(`pvp-${plazo}`, pvp);

    // Seguro anual total
    let seguroAnualPlazo = 0;

    if (quoteResult?.yearlySummary && plazo <= plazoSeleccionado) {
      const yearIndex = Math.ceil(plazo / 12) - 1;
      seguroAnualPlazo =
        Number(quoteResult.yearlySummary[yearIndex]?.seguroAnualBase) || 0;
    }

set(`seguro-total-${plazo}`, seguroAnualPlazo > 0 ? seguroAnualPlazo : "$0.00");

    set(`device-${plazo}`, dispositivo);
    set(`total-${plazo}`, montoTotal);
    set(`entrada-${plazo}`, entrada);
    set(`fin-${plazo}`, montoFinanciar);

    // Resumen inferior por año
    if (plazo === plazoSeleccionado && quoteResult) {
      renderResumenPorAnio(quoteResult.yearlySummary, quoteResult.finance.term);
    }
  }

  marcarPlazoActivo(plazoSeleccionado);
  await renderResumenDispositivo();
}

/* =========================
   Binding
========================= */

function bindFinance() {
  const plazoSel = document.getElementById("selectPlazo");
  const planSel = document.getElementById("selectDevicePlan");
  const chkDev = document.getElementById("chkDispositivo");

  plazoSel?.addEventListener("change", async () => {
    await renderResumenDispositivo();

    if (window.lastQuoteResult) {
      await renderTablaFinanciamiento();
    }
  });

  planSel?.addEventListener("change", async () => {
    await renderResumenDispositivo();

    if (window.lastQuoteResult) {
      await renderTablaFinanciamiento();
    }
  });

  chkDev?.addEventListener("change", async () => {
    await renderResumenDispositivo();

    if (window.lastQuoteResult) {
      await renderTablaFinanciamiento();
    }
  });
}

document.addEventListener("DOMContentLoaded", bindFinance);

// =========================================
// QUOTE ENGINE (ORQUESTADOR)
// =========================================
function calculateQuote(input, data) {

  // 1. VEHÍCULO
  const vehicle = data?.vehiclesByCode?.[input.vehicle?.ItemCode];
  if (!vehicle) {
    throw new Error(`No se encontró el vehículo con código: ${input.vehicle?.ItemCode}`);
  }

  const vehiclePrice = Number(vehicle.PVP) || 0;

  // 2. ENTRADA
  const entry = Number(input.entry) || 0;

  // 3. BASE
  const baseAmount = Math.max(vehiclePrice - entry, 0);

  // 4. COMPONENTES
  let additionalTotal = 0;

  // 4.1 Dispositivo
  if (input.devicePlan) {
    const plan = data?.devicePlansById?.[input.devicePlan];

    if (plan && plan.valoresPorAnio) {
      const years = String(Math.ceil((Number(input.term) || 0) / 12));
      additionalTotal += Number(plan.valoresPorAnio[years]) || 0;
    }
  }

  // 4.2 Componentes adicionales financiables
  if (Array.isArray(input.additionalComponents)) {
    additionalTotal += input.additionalComponents.reduce((acc, item) => {
      return acc + (Number(item.valorPVP) || 0);
    }, 0);
  }

// 5. SEGURO / LUCRO CESANTE
let insuranceTotal = 0;

const lucroCesanteAnnual =
  input.insuranceSelected && input.lucroCesanteSelected
    ? Number(input.lucroCesanteAnnual) || 0
    : 0;

if (input.insuranceSelected && Array.isArray(input.insuranceAnnuals) && input.insuranceAnnuals.length > 0) {
  insuranceTotal = input.insuranceAnnuals.reduce((acc, val) => {
    return acc + (Number(val) || 0);
  }, 0);
}

  // 6. FINANCIAMIENTO
  const rate = Number(input.rate) || 0;
  const term = Number(input.term) || 0;
  const years = Math.ceil(term / 12);

  let segurosAnuales = [];

  if (Array.isArray(input.insuranceAnnuals) && input.insuranceAnnuals.length > 0) {
    segurosAnuales = input.insuranceAnnuals.map(v => Number(v) || 0);
  } else if (insuranceTotal > 0 && years > 0) {
    const promedioAnual = insuranceTotal / years;
    segurosAnuales = Array.from({ length: years }, () => promedioAnual);
  } else {
    segurosAnuales = Array.from({ length: years }, () => 0);
  }

  const insuranceTotalWithLucro =
    segurosAnuales.reduce((acc, val) => acc + (Number(val) || 0), 0) +
    (lucroCesanteAnnual * years);

  const financedAmount = baseAmount + additionalTotal + insuranceTotalWithLucro;

  const cuotaVehiculoMensual = cuotaFrancesa(baseAmount, rate, term);
  const totalVehiculoPayable = cuotaVehiculoMensual * term;
  const interesVehiculo = totalVehiculoPayable - baseAmount;

  const cuotaDispositivoMensual = cuotaFrancesa(additionalTotal, rate, term);
  const totalDispositivoPayable = cuotaDispositivoMensual * term;
  const interesDispositivo = totalDispositivoPayable - additionalTotal;

  const cuotaSeguroMensualBase = cuotaFrancesa(insuranceTotalWithLucro, rate, term);
  const totalSeguroPayable = cuotaSeguroMensualBase * term;
  const interesSeguro = totalSeguroPayable - insuranceTotalWithLucro;

  const yearlySummary = [];

  for (let y = 1; y <= years; y++) {
    const seguroAnualBase = Number(segurosAnuales[y - 1]) || 0;
    const seguroAnual = seguroAnualBase + lucroCesanteAnnual;
    const cuotaSeguroMensual = seguroAnual / 12;

    const cuotaTotalMensual =
      cuotaVehiculoMensual +
      cuotaDispositivoMensual +
      cuotaSeguroMensual;

    yearlySummary.push({
      year: y,
      seguroAnualBase,
      lucroCesanteAnnual,
      seguroAnual,
      cuotaVehiculo: cuotaVehiculoMensual,
      cuotaDispositivo: cuotaDispositivoMensual,
      cuotaSeguro: cuotaSeguroMensual,
      cuotaTotalMensual
    });
  }

  const monthlyPayment = cuotaVehiculoMensual + cuotaDispositivoMensual + cuotaSeguroMensualBase;
  const totalPayable = totalVehiculoPayable + totalDispositivoPayable + totalSeguroPayable;
  const totalInterest = interesVehiculo + interesDispositivo + interesSeguro;

  return {
    vehicle: {
      itemCode: vehicle.ItemCode,
      modelo: vehicle.Modelo,
      versionModelo: vehicle.VersionModelo || vehicle["Version Modelo"] || "",
      marca: vehicle.Marca,
      tipoVehiculo: vehicle.TipoVehiculo,
      pvp: vehiclePrice,
      idClase: vehicle.IdClase,
      idSubClase: vehicle.IdSubClase
    },
    breakdown: {
      vehiclePrice,
      entry,
      baseAmount,
      additionalTotal,
      insuranceTotal: insuranceTotalWithLucro,
      lucroCesanteTotal: lucroCesanteAnnual * years,
      financedAmount
    },
    finance: {
      rate,
      term,
      years,
      monthlyPayment,
      totalInterest,
      totalPayable,
      vehicle: {
        monthly: cuotaVehiculoMensual,
        total: totalVehiculoPayable,
        interest: interesVehiculo
      },
      device: {
        monthly: cuotaDispositivoMensual,
        total: totalDispositivoPayable,
        interest: interesDispositivo
      },
      insurance: {
        monthly: cuotaSeguroMensualBase,
        total: totalSeguroPayable,
        interest: interesSeguro
      }
    },
    yearlySummary
  };
}
