/* =========================================================
 Proyecto      : Cotizador de Vehículos Teojama
 Archivo       : finance.js
 Versión       : V 1.0
 Compilación   : 3.23
 Estado        : ESTABLE – AJUSTE DISPOSITIVO POR PLAZO
 Descripción   : Motor financiero con tabla multiazo.
                 El valor del dispositivo varía según
                 el plazo (valoresPorAnio).
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
   Lectura de valores base
========================= */

function getPVP() {
  const el = document.getElementById("pvp");
  if (!el) return 0;
  return Number(el.textContent.replace(/[^0-9.]/g, "")) || 0;
}

function getEntrada() {
  const el = document.getElementById("inputEntrada");
  return Number(el?.value) || 0;
}

function getSeguro() {
  const chk = document.getElementById("chkSeguro");
  const inp = document.getElementById("inputSeguro");
  if (!chk?.checked) return 0;
  return Number(inp?.value) || 0;
}

/* =========================
   Dispositivo por plazo
========================= */

function getPlanDispositivoSeleccionado() {
  if (!window.appState?.dispositivo) return null;
  return window.appState.dispositivo;
}

function getValorDispositivoPorPlazo(plazoMeses) {
  const plan = getPlanDispositivoSeleccionado();
  if (!plan || !plan.valoresPorAnio) return 0;

  const anios = String(plazoMeses / 12);
  return Number(plan.valoresPorAnio[anios]) || 0;
}

/* =========================
   Tasa y cuota
========================= */

function getTasaAnual() {
  const sel = document.getElementById("selectTasa");
  if (!sel || sel.selectedIndex < 0) return 0;

  const raw =
    sel.options[sel.selectedIndex].textContent || "";

  const match = raw.match(/(\d+(\.\d+)?)/);
  if (!match) return 0;

  return Number(match[1]) / 100;
}

function cuotaFrancesa(monto, tasaAnual, plazoMeses) {
  if (monto <= 0 || plazoMeses <= 0) return 0;

  const tasaMensual = tasaAnual / 12;
  if (tasaMensual <= 0) {
    return monto / plazoMeses;
  }

  const factor = Math.pow(1 + tasaMensual, plazoMeses);
  return (monto * tasaMensual * factor) / (factor - 1);
}

/* =========================
   Render principal
========================= */

function renderTablaFinanciamiento() {
  const pvp = getPVP();
  const entrada = getEntrada();
  const seguro = getSeguro();
  const tasaAnual = getTasaAnual();

  const plazoSeleccionado =
    Number(document.getElementById("selectPlazo")?.value) || 0;

  limpiarPlazoActivo();

  PLAZOS_FIJOS.forEach(plazo => {
    const dispositivo = getValorDispositivoPorPlazo(plazo);

    const montoTotal = pvp + dispositivo;
    const montoFinanciar = Math.max(montoTotal - entrada, 0);

    const cuota = cuotaFrancesa(
      montoFinanciar,
      tasaAnual,
      plazo
    );

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
  });

  marcarPlazoActivo(plazoSeleccionado);
}

/* =========================
   Binding botón calcular
========================= */

function bindFinance() {
  const btn = document.getElementById("btnCalcular");
  if (!btn) return;

  btn.addEventListener(
    "click",
    e => {
      e.preventDefault();
      e.stopImmediatePropagation(); // bloquea lógica antigua
      renderTablaFinanciamiento();
    },
    true
  );
}

document.addEventListener("DOMContentLoaded", bindFinance);

