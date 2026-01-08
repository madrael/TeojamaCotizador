/* =========================================================
 Proyecto      : Cotizador de Vehículos Teojama
 Archivo       : finance.js
 Versión       : V 1.1
 Compilación   : 3.26
 Estado        : AJUSTE MODELO FINANCIERO (SEGURO FINANCIADO)
 Descripción   :
   - Seguro anual se financia
   - Seguro anual se prorratea por plazo
   - Dispositivo sigue variando por plazo
   - Cuota francesa se calcula sobre el total financiado
========================================================= */

const PLAZOS_FIJOS = [12, 24, 36, 48, 60];

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
  setText("summary-tasa", `${(tasaAnual * 100).toFixed(2)}%`);
  setText("summary-tasa-detail", `${(tasaAnual * 100).toFixed(2)}%`);
  setText("summary-plazo", `${plazo} meses`);
  setText("summary-capital", money(montoFinanciar));
  setText("summary-seguro", money(seguroAnual));
  setText("summary-dispositivo", money(dispositivoTotal));
  setText("summary-interes", money(totalInteres));
  setText("summary-total-pagar", money(totalPagar));
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

  limpiarPlazoActivo();

  for (const plazo of PLAZOS_FIJOS) {
    const dispositivo = await getValorDispositivoPorPlazo(plazo);

    // 🔹 MODELO FINANCIERO CORREGIDO
    const montoTotal = pvp + seguroAnual + dispositivo;
    const montoFinanciar = Math.max(montoTotal - entrada, 0);
    const cuota = cuotaFrancesa(montoFinanciar, tasaAnual, plazo);

    // 🔹 Prorrateo informativo
    const cuotaSeguro = seguroAnual / plazo;
    const cuotaDispositivo = dispositivo / plazo; // ahora se renderiza en UI

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

    // ✅ NUEVO: Seguro anual TOTAL (fila "Seguro anual")
    set(`seguro-total-${plazo}`, seguroAnual > 0 ? seguroAnual : "—");

    set(`device-${plazo}`, dispositivo);
    set(`total-${plazo}`, montoTotal);
    set(`entrada-${plazo}`, entrada);
    set(`fin-${plazo}`, montoFinanciar);
    set(`cuota-${plazo}`, cuota);

    // ⚠️ mismo ID existente: ahora es cuota mensual del seguro
    set(`seguro-${plazo}`, seguroAnual > 0 ? cuotaSeguro : "—");

    // ✅ NUEVO: Cuota dispositivo
    set(`device-cuota-${plazo}`, dispositivo > 0 ? cuotaDispositivo : "—");

    // ✅ NUEVO: Total cuota mensual = cuota crédito + cuota seguro + cuota dispositivo
    const totalCuota = cuota + cuotaSeguro + cuotaDispositivo;
    set(`total-cuota-${plazo}`, totalCuota);

    // === NUEVO: Resumen tipo banco (solo para plazo seleccionado) ===
    if (plazo === plazoSeleccionado) {
      renderResumenCredito({
        plazo,
        tasaAnual,
        cuota,
        montoFinanciar,
        seguroAnual,
        dispositivoTotal: dispositivo
      });
    }
  }

  marcarPlazoActivo(plazoSeleccionado);
  await renderResumenDispositivo();
}

/* =========================
   Binding
========================= */

function bindFinance() {
  const btn = document.getElementById("btnCalcular");
  if (btn) {
    btn.addEventListener(
      "click",
      async e => {
        e.preventDefault();
        e.stopImmediatePropagation();
        await renderTablaFinanciamiento();
      },
      true
    );
  }

  const plazoSel = document.getElementById("selectPlazo");
  const planSel = document.getElementById("selectDevicePlan");
  const chkDev = document.getElementById("chkDispositivo");

  // Antes: solo actualizaba panel dispositivo.
  // Ahora: también refresca tabla + resumen (sin romper lo anterior).
  plazoSel?.addEventListener("change", async () => {
    await renderResumenDispositivo();
    await renderTablaFinanciamiento();
  });

  planSel?.addEventListener("change", async () => {
    await renderResumenDispositivo();
    await renderTablaFinanciamiento();
  });

  chkDev?.addEventListener("change", async () => {
    await renderResumenDispositivo();
    await renderTablaFinanciamiento();
  });
}

document.addEventListener("DOMContentLoaded", bindFinance);



