/*************************************************
 * Archivo: ui.js
 * Proyecto: Cotizador Vehículos Teojama
 * Versión: V 1.0 · Compilación 3.06
 * Fix:
 * - Restaurar planes de dispositivo
 * - Corregir renderTablaFinanciamiento
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
    if (chkDispositivo.checked) cargarPlanesDispositivo();
    else appState.dispositivo = null;
  });

  selDevicePlan.addEventListener("change", () => {
    const plan = devicePlans.find(p => p.Plan === selDevicePlan.value);
    if (!plan) return;

    appState.dispositivo = plan;
    lblDeviceProvider.textContent = plan.Proveedor;
    lblDeviceValue.textContent = Number(plan.Valor).toFixed(2);
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
  sel.innerHTML = "";

  const activos = devicePlans.filter(p => p.Activo === true);

  activos.forEach(p =>
    addOption(sel, p.Plan, p.Plan)
  );

  if (activos.length === 1) {
    sel.value = activos[0].Plan;
    sel.dispatchEvent(new Event("change"));
  }
}

/* =============================
   CÁLCULO + RENDER
============================= */
function calcularCotizacion() {
  const pvp = Number(document.getElementById("pvp").textContent || 0);
  const entrada = Number(document.getElementById("inputEntrada").value || 0);
  const seguro = appState.incluyeSeguro
    ? Number(document.getElementById("inputSeguro").value || 0)
    : 0;
  const dispositivo = appState.incluyeDispositivo
    ? Number(appState.dispositivo?.Valor || 0)
    : 0;

  if (!pvp || !appState.plazo) {
    alert("Complete la selección antes de calcular");
    return;
  }

  renderTablaFinanciamiento({
    pvp,
    seguro,
    dispositivo,
    entrada
  });
}

/* =============================
   TABLA
============================= */
function renderTablaFinanciamiento(data) {
  const html = `
    <table border="1">
      <tr><th>Concepto</th><th>Valor</th></tr>
      <tr><td>PVP Vehículo</td><td>$${data.pvp.toFixed(2)}</td></tr>
      <tr><td>Dispositivo</td><td>$${data.dispositivo.toFixed(2)}</td></tr>
      <tr><td>Seguro</td><td>$${data.seguro.toFixed(2)}</td></tr>
      <tr><td>Cuota de entrada</td><td>$${data.entrada.toFixed(2)}</td></tr>
    </table>
  `;

  document.getElementById("tablaFinanciamiento").innerHTML = html;
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
