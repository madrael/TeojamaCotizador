/*************************************************
 * UI PRINCIPAL – COTIZADOR TEOJAMA
 * V 1.0 – Compilación 00003.01
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

  const btnCalcular = document.getElementById("btnCalcular");

  /* =============================
     SEGURO
  ============================= */
  chkSeguro.addEventListener("change", () => {
    appState.incluyeSeguro = chkSeguro.checked;
    inpSeguro.disabled = !chkSeguro.checked;
    if (!chkSeguro.checked) inpSeguro.value = "";
    limpiarResultados();
  });

  /* =============================
     DISPOSITIVO
  ============================= */
  chkDispositivo.addEventListener("change", () => {
    appState.incluyeDispositivo = chkDispositivo.checked;
    actualizarDispositivo();
    limpiarResultados();
  });

  /* =============================
     TIPO VEHÍCULO
  ============================= */
  selTipo.addEventListener("change", () => {
    appState.tipoVehiculo = selTipo.value;

    resetSelect(selMarca, true);
    resetSelect(selModelo, true);
    resetSelect(selTasa, false);
    resetSelect(selPlazo, false);
    limpiarResultados();

    if (!appState.tipoVehiculo) return;

    const marcas = [...new Set(
      vehicles
        .filter(v => v.TipoVehiculo === appState.tipoVehiculo)
        .map(v => v.Marca)
    )];

    marcas.forEach(m => addOption(selMarca, m, m));
    selMarca.disabled = false;
  });

  /* =============================
     MARCA
  ============================= */
  selMarca.addEventListener("change", () => {
    appState.marca = selMarca.value;

    resetSelect(selModelo, true);
    resetSelect(selTasa, false);
    resetSelect(selPlazo, false);
    limpiarResultados();

    const modelos = vehicles.filter(v =>
      v.TipoVehiculo === appState.tipoVehiculo &&
      v.Marca === appState.marca
    );

    modelos.forEach(m => addOption(selModelo, m.Modelo, m.Modelo));
    selModelo.disabled = false;
  });

  /* =============================
     MODELO
  ============================= */
  selModelo.addEventListener("change", () => {
    appState.modelo = selModelo.value;

    resetSelect(selTasa, false);
    resetSelect(selPlazo, false);
    limpiarResultados();

    const veh = vehicles.find(v =>
      v.TipoVehiculo === appState.tipoVehiculo &&
      v.Marca === appState.marca &&
      v.Modelo === appState.modelo
    );

    if (!veh) return;

    document.getElementById("pvp").textContent =
      Number(veh.PVP).toFixed(2);

    rates.forEach(t =>
      addOption(selTasa, t.IdTasa, `${t.TasaAnual}%`)
    );
  });

  /* =============================
     TASA
  ============================= */
  selTasa.addEventListener("change", () => {
    appState.tasa = selTasa.value;

    resetSelect(selPlazo, false);
    limpiarResultados();

    const tasaObj = rates.find(r => r.IdTasa === appState.tasa);
    if (!tasaObj) return;

    tasaObj.Plazos.forEach(p =>
      addOption(selPlazo, p.VPlazo, `${p.VPlazo} meses`)
    );
  });

  /* =============================
     PLAZO
  ============================= */
  selPlazo.addEventListener("change", () => {
    appState.plazo = Number(selPlazo.value);
    actualizarDispositivo();
    limpiarResultados();
  });

  /* =============================
     CALCULAR
  ============================= */
  btnCalcular.addEventListener("click", calcularCotizacion);
}

/* =============================
   DISPOSITIVO
============================= */
function actualizarDispositivo() {
  if (!appState.incluyeDispositivo || !appState.plazo) {
    appState.dispositivo = null;
    return;
  }

  const plazoAnios = appState.plazo / 12;

  const plan = devicePlans
    .filter(p => p.activo)
    .sort((a, b) => a.prioridad - b.prioridad)[0];

  const valor = plan?.valoresPorAnio[plazoAnios];
  if (!valor) return;

  appState.dispositivo = { valor };
}

/* =============================
   CÁLCULO
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

  const filaFija = (label, value) => {
    html += `<tr><td>${label}</td>`;
    PLAZOS.forEach(() => html += `<td>$${value.toFixed(2)}</td>`);
    html += `</tr>`;
  };

  filaFija("PVP Vehículo", data.pvp);
  filaFija("Dispositivo Satelital", data.dispositivo);
  filaFija("Seguro", data.seguro);
  filaFija("Monto total", data.montoTotal);
  filaFija("Cuota de entrada", data.entrada);
  filaFija("Monto a financiar", data.montoFinanciar);

  html += `<tr><td colspan="6"><hr/></td></tr>`;

  const cuotas = [];
  const cuotasSeguro = [];

  PLAZOS.forEach(p => {
    const r = calcularFinanciamiento({
      montoFinanciar: data.montoFinanciar,
      tasaAnual: data.tasaAnual,
      plazoMeses: p
    });
    cuotas.push(r.cuotaMensual);
    cuotasSeguro.push(data.seguro / p);
  });

  html += filaVariable("Cuota mensual", cuotas);
  html += filaVariable("Cuota seguro", cuotasSeguro);

  html += `<tr><td colspan="6"><hr/></td></tr>`;

  const total = cuotas.map((c, i) => c + cuotasSeguro[i]);
  html += filaVariable("Cuota total", total);

  html += `</table>`;
  document.getElementById("tablaFinanciamiento").innerHTML = html;
}

/* =============================
   UTILS
============================= */
function resetSelect(sel, disable = false) {
  sel.innerHTML = `<option value="">Seleccione</option>`;
  sel.disabled = disable;
}

function addOption(sel, value, text) {
  const o = document.createElement("option");
  o.value = value;
  o.textContent = text;
  sel.appendChild(o);
}

function limpiarResultados() {
  document.getElementById("tablaFinanciamiento").innerHTML = "";
}
