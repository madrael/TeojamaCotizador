/* =========================================================
 Proyecto      : Cotizador de Vehículos Teojama
 Archivo       : finance.js
 Versión       : V 1.0
 Compilación   : 3.25
 Estado        : ESTABLE – FIX ROBUSTO DISPOSITIVO POR PLAZO
 Descripción   : Motor financiero con tabla multi-plazo.
                 El valor del dispositivo varía según el plazo
                 (valoresPorAnio) y se resuelve desde DOM + catálogo.
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
  return Number(inp?.value) || 0;
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

/**
 * Devuelve el plan seleccionado, intentando:
 * 1) window.appState.dispositivo.plan
 * 2) dataset del option seleccionado (si UI lo pone)
 * 3) buscar en DevicePlans.json (vía loadDevicePlans)
 */
async function resolveDevicePlan() {
  // 1) AppState (si existe)
  const planState = window.appState?.dispositivo?.plan;
  if (planState) return planState;

  // 2) DOM option dataset
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
      } catch (_) {
        // si no es JSON válido, seguimos con lookup
      }
    }

    // 3) Lookup en catálogo por value (idPlan o codigo)
    const value = (sel.value || "").trim();
    if (value) {
      try {
        // loadDevicePlans viene de dataLoader.js
        const plans = await (typeof loadDevicePlans === "function"
          ? loadDevicePlans()
          : Promise.resolve(null));

        if (Array.isArray(plans)) {
          // value puede ser idPlan (num) o codigo (string)
          const asNum = Number(value);
          const found =
            plans.find(p => Number(p.idPlan) === asNum) ||
            plans.find(p => String(p.codigo) === value) ||
            plans.find(p => String(p.idPlan) === value);

          if (found) return found;
        }
      } catch (e) {
        console.warn("No se pudo cargar DevicePlans para lookup:", e);
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

/**
 * Actualiza el panel izquierdo (Proveedor / Valor) usando el plazo seleccionado.
 * Si no hay plazo seleccionado, usa 12.
 */
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
  valueEl.textContent = (Number.isFinite(val) && val > 0) ? val.toFixed(2) : "-";
}

/* =========================
   Cuota francesa
========================= */

function cuotaFrancesa(monto, tasaAnual, plazoMeses) {
  if (monto <= 0 || plazoMeses <= 0) return 0;

  const tasaMensual = tasaAnual / 12;
  if (tasaMensual === 0) return monto / plazoMeses;

  const f = Math.pow(1 + tasaMensual, plazoMeses);
  return (monto * tasaMensual * f) / (f - 1);
}

/* =========================
   Render tabla
========================= */

async function renderTablaFinanciamiento() {
  const pvp = getPVP();
  const entrada = getEntrada();
  const seguro = getSeguro();
  const tasaAnual = getTasaAnual();

  const plazoSeleccionado =
    Number(document.getElementById("selectPlazo")?.value) || 0;

  limpiarPlazoActivo();

  for (const plazo of PLAZOS_FIJOS) {
    const dispositivo = await getValorDispositivoPorPlazo(plazo);

    const montoTotal = pvp + dispositivo;
    const montoFinanciar = Math.max(montoTotal - entrada, 0);
    const cuota = cuotaFrancesa(montoFinanciar, tasaAnual, plazo);

    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = money(val);
    };

    set(`pvp-${plazo}`, pvp);
    set(`device-${plazo}`, dispositivo);
    set(`total-${plazo}`, montoTotal);
    set(`entrada-${plazo}`, entrada);
    set(`fin-${plazo}`, montoFinanciar);
    set(`cuota-${plazo}`, cuota);
    set(`seguro-${plazo}`, seguro);
  }

  marcarPlazoActivo(plazoSeleccionado);

  // Panel izquierdo: valor del dispositivo depende del plazo seleccionado
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

  // Si cambia plazo o plan, refrescar el resumen del dispositivo (panel izquierdo)
  const plazoSel = document.getElementById("selectPlazo");
  const planSel = document.getElementById("selectDevicePlan");
  const chkDev = document.getElementById("chkDispositivo");

  plazoSel?.addEventListener("change", () => renderResumenDispositivo());
  planSel?.addEventListener("change", () => renderResumenDispositivo());
  chkDev?.addEventListener("change", () => renderResumenDispositivo());
}

document.addEventListener("DOMContentLoaded", bindFinance);

