/*************************************************
 * Archivo: ui.js
 * Proyecto: Cotizador Vehículos Teojama
 * Versión: V 1.0 · Compilación 3.10
 * Fix:
 * - Cálculo correcto valor dispositivo por plazo
 *************************************************/

let vehicles = [];
let rates = [];
let devicePlans = [];

const appState = {
  tipoVehiculo: null,
  marca: null,
  modelo: null,
  tasa: null,
  plazo: null,
  incluyeSeguro: false,
  incluyeDispositivo: false,
  dispositivo: null
};

/* =============================
   INIT
============================= */
document.addEventListener("DOMContentLoaded", async () => {
  vehicles = await loadVehicles();
  rates = await loadRates();
  devicePlans = await loadDevicePlans();
  initUI();
});

/* =============================
   UI INIT
============================= */
function initUI() {
  const selTipo = document.getElementById("selectTipoVehiculo");
  const selMarca = document.getElementById("selectMarca");
  const selModelo = document.getElementById("selectModelo");
  const selTasa = document.getElementById("selectTasa");
  const selPlazo = document.getElementById("selectPlazo");

  const chkSeguro = document.getElementById("chkSeguro");
  const inpSeguro = document.getElementById("inputSeguro");

  const chkDispositivo = document.getElementById("chkDispositivo");
  const deviceContainer = document.getElementById("deviceContainer");
  const selDevicePlan = document.getElementById("selectDevicePlan");
  const lblDeviceProvider = document.getElementById("deviceProvider");
  const lblDeviceValue = document.getElementById("deviceValue");

  const btnCalcular = document.getElementById("btnCalcular");

  /* ===== Tipo / Marca / Modelo ===== */
  selTipo.addEventListener("change", () => {
    resetAll();
    appState.tipoVehiculo = selTipo.value;

    [...new Set(
      vehicles.filter(v => v.TipoVehiculo === appState.tipoVehiculo)
              .map(v => v.Marca)
    )].forEach(m => addOption(selMarca, m, m));
  });

  selMarca.addEventListener("change", () => {
    resetSelect(selModelo);
    appState.marca = selMarca.value;

    vehicles.filter(v =>
      v.TipoVehiculo === appState.tipoVehiculo &&
      v.Marca === appState.marca
    ).forEach(v => addOption(selModelo, v.Modelo, v.Modelo));
  });

  selModelo.addEventListener("change", () => {
    resetSelect(selTasa);
    resetSelect(selPlazo);
    appState.modelo = selModelo.value;

    const veh = vehicles.find(v =>
      v.TipoVehiculo === appState.tipoVehiculo &&
      v.Marca === appState.marca &&
      v.Modelo === appState.modelo
    );

    document.getElementById("pvp").textContent =
      veh ? Number(veh.PVP).toFixed(2) : "0.00";

    rates.forEach(r =>
      addOption(selTasa, r.IdTasa, `${r.TasaAnual}%`)
    );
  });

  /* ===== Tasa ===== */
  selTasa.addEventListener("change", () => {
    resetSelect(selPlazo);
    appState.tasa = selTasa.value;

    const tasaObj = rates.find(r => r.IdTasa === appState.tasa);
    tasaObj?.Plazos.forEach(p =>
      addOption(selPlazo, p.VPlazo, `${p.VPlazo} meses`)
    );
  });

  /* ===== Plazo ===== */
  selPlazo.addEventListener("change", () => {
    appState.plazo = Number(selPlazo.value);
    actualizarValorDispositivo();
  });

  /* ===== Seguro ===== */
  chkSeguro.addEventListener("change", () => {
    appState.incluyeSeguro = chkSeguro.checked;
    inpSeguro.disabled = !chkSeguro.checked;
    if (!chkSeguro.checked) inpSeguro.value = "";
  });

  /* ===== Dispositivo ===== */
  chkDispositivo.addEventListener("change", () => {
    appState.incluyeDispositivo = chkDispositivo.checked;
    deviceContainer.style.display = chkDispositivo.checked ? "block" : "none";
    chkDispositivo.checked ? cargarPlanesDispositivo() : limpiarDispositivo();
  });

  selDevicePlan.addEventListener("change", () => {
    appState.dispositivo = devicePlans.find(p => p.codigo === selDevicePlan.value);
    lblDeviceProvider.textContent = appState.dispositivo?.proveedor || "";
    actualizarValorDispositivo();
  });

  btnCalcular.addEventListener("click", () => {
    alert("Motor financiero pendiente (siguiente iteración)");
  });
}

/* =============================
   DISPOSITIVO
============================= */
function actualizarValorDispositivo() {
  const lbl = document.getElementById("deviceValue");

  if (!appState.dispositivo || !appState.plazo) {
    lbl.textContent = "$0.00";
    return;
  }

  const anios = appState.plazo / 12;
  const valor = appState.dispositivo.valoresPorAnio?.[anios];

  lbl.textContent = valor
    ? `$${Number(valor).toFixed(2)}`
    : "$0.00";
}

function cargarPlanesDispositivo() {
  const sel = document.getElementById("selectDevicePlan");
  sel.options.length = 0;
  addOption(sel, "", "Seleccione plan");

  devicePlans
    .filter(p => p.activo === true && p.codigo)
    .forEach(p => addOption(sel, p.codigo, p.codigo));
}

function limpiarDispositivo() {
  const sel = document.getElementById("selectDevicePlan");
  sel.options.length = 0;
  document.getElementById("deviceProvider").textContent = "";
  document.getElementById("deviceValue").textContent = "$0.00";
  appState.dispositivo = null;
}

/* =============================
   UTILS
============================= */
function resetAll() {
  ["selectMarca", "selectModelo", "selectTasa", "selectPlazo"]
    .forEach(id => resetSelect(document.getElementById(id)));
}

function resetSelect(sel) {
  sel.options.length = 0;
  addOption(sel, "", "Seleccione");
}

function addOption(sel, value, text) {
  const o = document.createElement("option");
  o.value = value;
  o.textContent = text;
  sel.appendChild(o);
}
