/*************************************************
 * Archivo: ui.js
 * Proyecto: Cotizador Vehículos Teojama
 * Versión: V 1.0 · Compilación 3.09
 * Cambios:
 * - Corrección definitiva carga planes dispositivo
 * - Uso de estructura real DevicePlans.json
 * - Sin regresiones funcionales
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

  console.log("DevicePlans cargados:", devicePlans);

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

  /* ===== Tipo de vehículo ===== */
  selTipo.addEventListener("change", () => {
    resetAll();
    appState.tipoVehiculo = selTipo.value;

    const marcas = [...new Set(
      vehicles
        .filter(v => v.TipoVehiculo === appState.tipoVehiculo)
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
      limpiarDispositivo();
    }
  });

  selDevicePlan.addEventListener("change", () => {
    const plan = devicePlans.find(p => p.codigo === selDevicePlan.value);
    if (!plan) return;

    appState.dispositivo = plan;
    lblDeviceProvider.textContent = plan.proveedor;
    lblDeviceValue.textContent = "-";
  });

  /* ===== Calcular ===== */
  btnCalcular.addEventListener("click", () => {
    alert("Motor financiero pendiente (siguiente iteración)");
  });
}

/* =============================
   DISPOSITIVO
============================= */
function cargarPlanesDispositivo() {
  const sel = document.getElementById("selectDevicePlan");
  sel.innerHTML = `<option value="">Seleccione plan</option>`;

  const planesValidos = devicePlans.filter(p =>
    p.activo === true &&
    typeof p.codigo === "string" &&
    p.codigo.trim() !== ""
  );

  console.log("Planes válidos dispositivo:", planesValidos);

  planesValidos.forEach(p => {
    addOption(sel, p.codigo, p.codigo);
  });

  if (planesValidos.length === 1) {
    sel.value = planesValidos[0].codigo;
    sel.dispatchEvent(new Event("change"));
  }
}

function limpiarDispositivo() {
  const sel = document.getElementById("selectDevicePlan");
  sel.innerHTML = "";
  document.getElementById("deviceProvider").textContent = "";
  document.getElementById("deviceValue").textContent = "-";
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
  sel.innerHTML = `<option value="">Seleccione</option>`;
}

function addOption(sel, value, text) {
  const o = document.createElement("option");
  o.value = value;
  o.textContent = text;
  sel.appendChild(o);
}

