/* =========================================================
 Proyecto      : Cotizador de Vehículos Teojama
 Archivo       : finance.js
 Versión       : V 1.0
 Compilación   : 3.23
 Estado        : AJUSTE – TABLA MULTIPLAZO + RESALTADO
 Descripción   : Calcula y pinta el detalle de financiamiento
                 en formato tabular (12/24/36/48/60), resaltando
                 el plazo seleccionado por el usuario.
========================================================= */

const PLAZOS_FIJOS = [12, 24, 36, 48, 60];

function fmtMoney(value) {
  const n = Number(value) || 0;
  return `$${n.toFixed(2)}`;
}

function getTasaAnualDecimal() {
  const sel = document.getElementById("selectTasa");
  if (!sel) return 0;

  const opt = sel.options[sel.selectedIndex];
  const raw = (opt?.value ?? opt?.textContent ?? "").toString().trim();

  const pctMatch = raw.match(/(\d+(\.\d+)?)/);
  if (!pctMatch) return 0;

  const num = Number(pctMatch[1]);
  if (!Number.isFinite(num)) return 0;

  return num > 1 ? (num / 100) : num;
}

function cuotaFrancesa(monto, tasaAnualDecimal, plazoMeses) {
  const P = Number(monto) || 0;
  const n = Number(plazoMeses) || 0;
  if (P <= 0 || n <= 0) return 0;

  const i = (Number(tasaAnualDecimal) || 0) / 12;
  if (i <= 0) return P / n;

  const factor = Math.pow(1 + i, n);
  return P * (i * factor) / (factor - 1);
}

function clearPlazoActivo() {
  document.querySelectorAll(".plazo-activo").forEach(el => el.classList.remove("plazo-activo"));
}

function setPlazoActivo(plazo) {
  if (!plazo) return;
  document.querySelectorAll(`[data-plazo="${plazo}"]`).forEach(el => el.classList.add("plazo-activo"));
}

async function getDeviceValueByPlazo(plazoMeses) {
  const chk = document.getElementById("chkDispositivo");
  const sel = document.getElementById("selectDevicePlan");
  if (!chk?.checked || !sel?.value) return 0;

  if (typeof loadDevicePlans !== "function") return 0;

  const plans = await loadDevicePlans();
  const idPlan = Number(sel.value);
  const plan = plans?.find(p => Number(p.idPlan) === idPlan) || null;
  if (!plan || !plan.valoresPorAnio) return 0;

  const years = String(Math.round((Number(plazoMeses) || 0) / 12));
  const val = plan.valoresPorAnio?.[years];
  return Number(val) || 0;
}

function getSeguroValue() {
  const chk = document.getElementById("chkSeguro");
  const inp = document.getElementById("inputSeguro");
  if (!chk?.checked) return 0;
  return Number(inp?.value) || 0;
}

function getPvpValue() {
  const el = document.getElementById("pvp");
  const raw = (el?.textContent ?? "").toString().replace(/[^0-9.]/g, "");
  return Number(raw) || 0;
}

function getEntradaValue() {
  const el = document.getElementById("inputEntrada");
  return Number(el?.value) || 0;
}

async function renderTablaFinanciamiento() {
  const pvp = getPvpValue();
  const entrada = getEntradaValue();
  const seguro = getSeguroValue();
  const tasaAnual = getTasaAnualDecimal();

  const plazoSelEl = document.getElementById("selectPlazo");
  const plazoSeleccionado = Number(plazoSelEl?.value) || 0;

  clearPlazoActivo();

  for (const plazo of PLAZOS_FIJOS) {
    const device = await getDeviceValueByPlazo(plazo);

    // MVP según formato solicitado:
    // Monto total = PVP + Dispositivo (Seguro se muestra como fila aparte)
    const montoTotal = pvp + device;
    const montoFinanciar = Math.max(montoTotal - entrada, 0);
    const cuotaMensual = cuotaFrancesa(montoFinanciar, tasaAnual, plazo);

    const set = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };

    set(`pvp-${plazo}`, fmtMoney(pvp));
    set(`device-${plazo}`, fmtMoney(device));
    set(`total-${plazo}`, fmtMoney(montoTotal));
    set(`entrada-${plazo}`, fmtMoney(entrada));
    set(`fin-${plazo}`, fmtMoney(montoFinanciar));
    set(`cuota-${plazo}`, fmtMoney(cuotaMensual));
    set(`seguro-${plazo}`, fmtMoney(seguro));
  }

  setPlazoActivo(plazoSeleccionado);
}

function bindFinanceButton() {
  const btn = document.getElementById("btnCalcular");
  if (!btn) return;

  // CAPTURE para bloquear el alert viejo de ui.js sin editar ui.js
  btn.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopImmediatePropagation();

    try {
      await renderTablaFinanciamiento();
    } catch (err) {
      console.error("Error en motor financiero:", err);
    }
  }, true);
}

document.addEventListener("DOMContentLoaded", bindFinanceButton);
