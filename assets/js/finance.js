/* =========================================================
 Proyecto      : Cotizador de Vehículos Teojama
 Archivo       : finance.js
 Versión       : V 2.0
 Compilación   : 1.68
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
  return 0;
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
  const entrada = getEntrada();

  const plazoSeleccionado =
    Number(document.getElementById("selectPlazo")?.value) || 0;

  const quoteResult = window.lastQuoteResult || null;

  limpiarPlazoActivo();

  for (const plazo of PLAZOS_FIJOS) {
    const dispositivo = await getValorDispositivoPorPlazo(plazo);

    const set = (id, val) => {
      const el = document.getElementById(id);
      if (!el) return;

      if (typeof val === "string") {
        el.textContent = val;
      } else {
        el.textContent = money(val);
      }
    };

    let vehiclePrice = getPVP();
    let componentsTotal = 0;
    let seguroAnualPlazo = 0;
    let montoTotal = vehiclePrice + dispositivo;
    let montoFinanciar = Math.max(montoTotal - entrada, 0);

    if (quoteResult) {
      vehiclePrice = Number(quoteResult.breakdown?.vehiclePrice) || 0;
      componentsTotal = Number(quoteResult.breakdown?.componentsTotal) || 0;

      if (plazo === plazoSeleccionado) {
        montoTotal =
          vehiclePrice +
          componentsTotal +
          Number(quoteResult.breakdown?.deviceTotal || 0) +
          Number(quoteResult.breakdown?.insuranceTotal || 0);

        montoFinanciar =
          Number(quoteResult.breakdown?.financedAmount) || 0;
      } else {
        montoTotal =
          vehiclePrice +
          componentsTotal +
          dispositivo;

        montoFinanciar =
          Math.max(montoTotal - entrada, 0);
      }

      if (quoteResult.yearlySummary && plazo <= plazoSeleccionado) {
        const yearIndex = Math.ceil(plazo / 12) - 1;
        seguroAnualPlazo =
          Number(quoteResult.yearlySummary[yearIndex]?.seguroAnualBase) || 0;
      }
    }

    set(`pvp-${plazo}`, vehiclePrice);
    set(`components-${plazo}`, componentsTotal);
    set(`seguro-total-${plazo}`, seguroAnualPlazo);
    set(`device-${plazo}`, dispositivo);
    set(`entrada-${plazo}`, entrada);
    set(`total-${plazo}`, montoTotal);
    set(`fin-${plazo}`, montoFinanciar);

    if (plazo === plazoSeleccionado && quoteResult) {
      renderResumenPorAnio(
        quoteResult.yearlySummary,
        quoteResult.finance.term
      );
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
// SEGURO – CÁLCULO DE PRIMAS ANUALES
// =========================================
function calcularPrimasSeguroAnuales(input, data, vehicle) {

  if (!input.insuranceSelected) {
    return {
      insuranceAnnuals: [],
      insuranceTotal: 0,
      brokerRule: null,
      insuranceRate: 0
    };
  }

  const providerId = input.insuranceProviderId;
  const rules = data?.insuranceRules;

  if (!providerId || !rules?.brokers?.[providerId]) {
    console.warn("No se encontró regla de seguro para proveedor:", providerId);
    return {
      insuranceAnnuals: [],
      insuranceTotal: 0,
      brokerRule: null,
      insuranceRate: 0
    };
  }

  const brokerRule = rules.brokers[providerId];

  if (!brokerRule.active) {
    console.warn("Broker de seguro inactivo:", providerId);
    return {
      insuranceAnnuals: [],
      insuranceTotal: 0,
      brokerRule,
      insuranceRate: 0
    };
  }

  const tipoVehiculo = vehicle.TipoVehiculo;

  if (
    Array.isArray(brokerRule.appliesTo) &&
    !brokerRule.appliesTo.includes(tipoVehiculo)
  ) {
    console.warn(`El broker ${providerId} no aplica para ${tipoVehiculo}`);
    return {
      insuranceAnnuals: [],
      insuranceTotal: 0,
      brokerRule,
      insuranceRate: 0
    };
  }

  const baseField = brokerRule.baseField || "PVPSIVA";
  const baseSeguro =
    Number(input.vehicleInsuranceBase) ||
    Number(vehicle?.[baseField]) ||
    Number(vehicle?.PVPSIVA) ||
    0;

  const marca = vehicle.Marca || "";
  const brandRates = brokerRule.vehicle?.brandRates || {};
  const defaultRate = Number(brokerRule.vehicle?.defaultRate) || 0;

  const insuranceRate =
    brandRates[marca] != null
      ? Number(brandRates[marca])
      : defaultRate;

  if (!insuranceRate || insuranceRate <= 0) {
    console.warn("No existe tasa válida para seguro:", {
      providerId,
      marca,
      insuranceRate
    });

    return {
      insuranceAnnuals: [],
      insuranceTotal: 0,
      brokerRule,
      insuranceRate: 0
    };
  }

const term = Number(input.term) || 0;
const years = Math.ceil(term / 12);
const depreciation = brokerRule.depreciationByYear || {};

let feeRate = 0;

const fees = brokerRule.vehicle?.fees;

if (fees?.apply && fees?.items) {
  feeRate = Object.values(fees.items).reduce((acc, val) => {
    return acc + (Number(val) || 0);
  }, 0);
}

const insuranceAnnuals = [];

for (let y = 1; y <= years; y++) {
  const factor =
    depreciation[String(y)] != null
      ? Number(depreciation[String(y)])
      : Number(depreciation[String(Object.keys(depreciation).length)]) || 1;

  const primaBase = baseSeguro * insuranceRate * factor;
  const primaAnual = primaBase * (1 + feeRate);

  insuranceAnnuals.push(Number(primaAnual.toFixed(2)));
}
 
  const insuranceTotal = insuranceAnnuals.reduce((acc, val) => {
    return acc + (Number(val) || 0);
  }, 0);

  return {
    insuranceAnnuals,
    insuranceTotal: Number(insuranceTotal.toFixed(2)),
    brokerRule,
    insuranceRate,
    baseSeguro
  };
}

// =========================================
// SEGURO – FINANCIAMIENTO
// =========================================
function calcularCreditoSeguro(insuranceTotal, annualRate, term) {

  const capital = Number(insuranceTotal) || 0;
  const tasaAnual = Number(annualRate) || 0;
  const plazo = Number(term) || 0;

  if (capital <= 0 || plazo <= 0) {
    return {
      monthlyPayment: 0,
      totalInterest: 0,
      totalPaid: 0
    };
  }

  const tasaMensual = tasaAnual / 100 / 12;

  let cuota = 0;

  if (tasaMensual > 0) {
    cuota =
      capital *
      (tasaMensual * Math.pow(1 + tasaMensual, plazo)) /
      (Math.pow(1 + tasaMensual, plazo) - 1);
  } else {
    cuota = capital / plazo;
  }

  const totalPagado = cuota * plazo;
  const totalInteres = totalPagado - capital;

  return {
    monthlyPayment: Number(cuota.toFixed(2)),
    totalInterest: Number(totalInteres.toFixed(2)),
    totalPaid: Number(totalPagado.toFixed(2))
  };
}


// =========================================
// QUOTE ENGINE (ORQUESTADOR)
// =========================================
function calculateQuote(input, data) {

  // 1. VEHÍCULO
  const vehicle = data?.vehiclesByCode?.[input.vehicle?.ItemCode];
  if (!vehicle) {
    throw new Error(`No se encontró el vehículo con código: ${input.vehicle?.ItemCode}`);
  }

  const vehiclePrice =
  Number(input.vehiclePrice) ||
  Number(vehicle.PVPSIVA) ||
  Number(vehicle.PVP) ||
  0;

  // 2. ENTRADA
  const entry = Number(input.entry) || 0;

  // 3. COMPONENTES ADICIONALES
  let componentsTotal = 0;

  if (Array.isArray(input.additionalComponents)) {
    componentsTotal = input.additionalComponents.reduce((acc, item) => {
      return acc + (Number(item.valorPVP) || 0);
    }, 0);
  }

  // 4. BASE VEHÍCULO + COMPONENTES
  const vehicleCreditValue = vehiclePrice + componentsTotal;
  const baseAmount = Math.max(vehicleCreditValue - entry, 0);

  // 5. DISPOSITIVO
  let deviceTotal = 0;

  if (input.devicePlan) {
    const plan = data?.devicePlansById?.[input.devicePlan];

    if (plan && plan.valoresPorAnio) {
      const yearsDevice = String(Math.ceil((Number(input.term) || 0) / 12));
      deviceTotal = Number(plan.valoresPorAnio[yearsDevice]) || 0;
    }
  }

  // 6. SEGURO / LUCRO CESANTE
     const insuranceCalc = calcularPrimasSeguroAnuales(input, data, vehicle);

   let insuranceTotal = Number(insuranceCalc.insuranceTotal) || 0;

 const insuranceCredit = calcularCreditoSeguro(
  insuranceTotal,
  input.rate,
  input.term
);
   const lucroCesanteAnnual =
         input.insuranceSelected && input.lucroCesanteSelected
         ? Number(input.lucroCesanteAnnual) || 0
    : 0;

  // 7. FINANCIAMIENTO
  const rate = Number(input.rate) || 0;
  const term = Number(input.term) || 0;
  const years = Math.ceil(term / 12);

 let segurosAnuales = [];

if (Array.isArray(insuranceCalc.insuranceAnnuals) && insuranceCalc.insuranceAnnuals.length > 0) {
  segurosAnuales = insuranceCalc.insuranceAnnuals.map(v => Number(v) || 0);
} else {
  segurosAnuales = Array.from({ length: years }, () => 0);
}

  const insuranceTotalWithLucro =
    segurosAnuales.reduce((acc, val) => acc + (Number(val) || 0), 0) +
    (lucroCesanteAnnual * years);

  const financedAmount = baseAmount + deviceTotal + insuranceTotalWithLucro;

  const cuotaVehiculoMensual = cuotaFrancesa(baseAmount, rate, term);
  const totalVehiculoPayable = cuotaVehiculoMensual * term;
  const interesVehiculo = totalVehiculoPayable - baseAmount;

  const deviceRate = Number(input.deviceRate) || rate;
  const cuotaDispositivoMensual = cuotaFrancesa(deviceTotal, deviceRate, term);
  const totalDispositivoPayable = cuotaDispositivoMensual * term;
  const interesDispositivo = totalDispositivoPayable - deviceTotal;

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

  const monthlyPayment =
    cuotaVehiculoMensual +
    cuotaDispositivoMensual +
    cuotaSeguroMensualBase;

  const totalPayable =
    totalVehiculoPayable +
    totalDispositivoPayable +
    totalSeguroPayable;

  const totalInterest =
    interesVehiculo +
    interesDispositivo +
    interesSeguro;

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
      componentsTotal,
      vehicleCreditValue,
      entry,
      baseAmount,
      deviceTotal,
      insuranceTotal: insuranceTotalWithLucro,
      lucroCesanteTotal: lucroCesanteAnnual * years,
      financedAmount
    },
      insurance: {
      providerId: input.insuranceProviderId || null,
      rate: insuranceCalc.insuranceRate || 0,
      baseSeguro: insuranceCalc.baseSeguro || 0,
      annuals: segurosAnuales,
      totalBase: insuranceTotal
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
