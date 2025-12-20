/*************************************************
 * Archivo: ui.js
 * Proyecto: Cotizador Vehículos Teojama
 * Versión: V 1.0 · Compilación 3.06
 * Cambios:
 * - Selección de plan de dispositivo
 * - Botón calcular funcional
 * - Render Detalle Financiamiento
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

const PLAZOS = [12, 24, 36, 48, 60];

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
    cargarPlanesDispositivo();
  });

  selDevicePlan.addEventListener("change", () => {
    const plan = devicePlans.find(p => p.id === selDevicePlan.value);
    if (!plan) return;
    appState.dispositivo = plan;
    lblDeviceProvider.textContent = plan.proveedor;
    lblDeviceValue.textContent = plan.valor.toFixed(2);
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

  devicePlans
    .filter(p => p.activo)
    .forEach(p =>
      addOption(sel, p.id, p.plan)
    );

  if (devicePlans.length === 1) {
    sel.value = devicePlans[0].id;
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
  const dispositivo = appState.dispositivo?.valor || 0;

  const tasaObj = rates.find(r => r.IdTasa === appState.tasa);

  if (!pvp || !tasaObj || !appState.plazo) {
    alert("Complete la selección antes de calcular");
    return;
  }

  const montoTotal = pvp + seguro + dispositivo;
  const montoFinanciar = montoTotal - entrada;

  renderTablaFinanciamiento({
    pvp,
    seguro,
    dispositivo,
    montoTotal,
    entrada,
    montoFinanciar,
    tasaAnual: tasaObj.TasaAnual
  });
}

/* =============================
   TABLA
============================= */
function renderTablaFinanciamiento(data) {
  let html = `<table border="1"><tr><th>Concepto</th>`;
  PLAZOS.forEach(p => html += `<th>${p} meses</th>`);
  html += `</tr>`;

  fila(html, "PVP Vehículo", data.pvp);
  fila(html, "Dispositivo", data.dispositivo);
  fila(html, "Seguro", data.seguro);
  fila(html, "Monto total", data.montoTotal);
  fila(html, "Cuota de entrada", data.entrada);
  fila(html, "Monto a financiar", data.montoFinanciar);

  document.getElementById("tablaFinanciamiento").innerHTML = html + "</table>";
}

function fila(html, label, value) {
  html += `<tr><td>${label}</td>`;
  PLAZOS.forEach(() => html += `<td>$${value.toFixed(2)}</td>`);
  html += `</tr>`;
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
