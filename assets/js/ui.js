/*************************************************
 * Archivo: ui.js
 * Proyecto: Cotizador Vehículos Teojama
 * Versión: V 1.0 · Compilación 3.06
 * Fix definitivo:
 * - Corrección carga planes dispositivo
 * - Compatible con DevicePlans.json real
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

  console.log("Device plans cargados:", devicePlans);

  initUI();
});

/* =============================
   UI
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

    if (chkDispositivo.checked) {
      cargarPlanesDispositivo();
    } else {
      appState.dispositivo = null;
      selDevicePlan.innerHTML = "";
      lblDeviceProvider.textContent = "";
      lblDeviceValue.textContent = "0.00";
    }
  });

  selDevicePlan.addEventListener("change", () => {
    const plan = devicePlans.find(p => p.PlanName === selDevicePlan.value);
    if (!plan) return;

    appState.dispositivo = plan;
    lblDeviceProvider.textContent = plan.Provider;
    lblDeviceValue.textContent = Number(plan.Price).toFixed(2);
  });

  /* ===== Tipo ===== */
  selTipo.addEventListener("change", () => {
    resetAll();
    appState.tipoVehiculo = selTipo.value;

    const marcas = [...new Set(
      vehicles.filter(v => v.TipoVehiculo === appState.tipoVehiculo)
              .map(v => v.Marca)
    )];

    marcas.forEach(m => addOption(selMarca, m, m));
  });

  /* ===== Marca ===== */
  selMarca.addEventListener("change", () => {
    resetSelect(selModelo);
    appState.marca = selMarca.value;

    const modelos = vehicles.filter(v =>
      v.TipoVehiculo === appState.tipoVehiculo &&
      v.Marca === appState.marca
    );

    modelos.forEach(m => addOption(selModelo, m.Modelo, m.Modelo));
  });

  /* ===== Modelo ===== */
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
  });

  /* ===== Calcular ===== */
  btnCalcular.addEventListener("click", calcularCotizacion);
}

/* =============================
   DISPOSITIVO
============================= */
function cargarPlanesDispositivo() {
  const sel = document.getElementById("selectDevicePlan");
  sel.innerHTML = `<option value="">Seleccione plan</option>`;

  devicePlans.forEach(p => {
    addOption(sel, p.PlanName, p.PlanName);
  });

  if (devicePlans.length === 1) {
    sel.value = devicePlans[0].PlanName;
    sel.dispatchEvent(new Event("change"));
  }
}

/* =============================
   CÁLCULO (base)
============================= */
function calcularCotizacion() {
  alert("Motor financiero pendiente (siguiente iteración)");
}

/* =============================
   UTILS
============================= */
function resetAll() {
  ["selectMarca", "selectModelo", "selectTasa", "selectPlazo"]
    .forEach(id => resetSelect(document.getElementById(id)));
}

function resetSelect(sel) {
  sel.innerHTML = `<option value="">Seleccione</option>`;
}

function addOption(sel, value, text) {
  const o = document.createElement("option");
  o.value = value;
  o.textContent = text;
  sel.appendChild(o);
}

