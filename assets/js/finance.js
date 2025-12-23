/* =========================================================
 Proyecto      : Cotizador de Vehículos Teojama
 Archivo       : finance.js
 Versión       : V 1.0
 Compilación   : 3.24
 Estado        : ESTABLE – FIX DISPOSITIVO POR PLAZO
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
   Dispositivo por plazo
========================= */

function getValorDispositivoPorPlazo(plazoMeses) {
  const dispositivo = window.appState?.dispositivo;
  if (!dispositivo || !dispositivo.plan) return 0;

  const valores = dispositivo.plan.valoresPorAnio;
  if (!valores) return 0;

  const anios = String(plazoMeses / 12);
  return Number(valores[anios]) || 0;
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
  });

  marcarPlazoActivo(plazoSeleccionado);
}

/* =========================
   Binding botón
========================= */

function bindFinance() {
  const btn = document.getElementById("btnCalcular");
  if (!btn) return;

  btn.addEventListener(
    "click",
    e => {
      e.preventDefault();
      e.stopImmediatePropagation();
      renderTablaFinanciamiento();
    },
    true
  );
}

document.addEventListener("DOMContentLoaded", bindFinance);
