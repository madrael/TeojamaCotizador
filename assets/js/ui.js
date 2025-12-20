/*************************************************
 * UI PRINCIPAL – COTIZADOR TEOJAMA
 * V 1.0 – Compilación 3.03
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
   INIT (CLAVE)
============================= */
document.addEventListener("DOMContentLoaded", async () => {
  try {
    vehicles = await loadVehicles();
    rates = await loadRates();
    devicePlans = await loadDevicePlans();

    console.log("Datos cargados:", {
      vehicles: vehicles.length,
      rates: rates.length,
      devicePlans: devicePlans.length
    });

    initUI();
  } catch (e) {
    console.error("Error cargando datos", e);
    alert("Error cargando datos base del cotizador");
  }
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

    resetSelect(selMarca);
    resetSelect(selModelo);
    resetSelect(selTasa);
    resetSelect(selPlazo);
    limpiarResultados();

    if (!appState.tipoVehiculo) return;

    const marcas = [...new Set(
      vehicles
        .filter(v => v.TipoVehiculo === appState.tipoVehiculo)
        .map(v => v.Marca)
    )];

    marcas.forEach(m => addOption(selMarca, m, m));
  });

  /* =============================
     MARCA
  ============================= */
  selMarca.addEventListener("change", () => {
    appState.marca = selMarca.value;

    resetSelect(selModelo);
    resetSelect(selTasa);
    resetSelect(selPlazo);
    limpiarResultados();

    const modelos = vehicles.filter(v =>
      v.TipoVehiculo === appState.tipoVehiculo &&
      v.Marca === appState.marca
    );

    modelos.forEach(m => addOption(selModelo, m.Modelo, m.Modelo));
  });

  /* =============================
     MODELO
  ============================= */
  selModelo.addEventListener("change", () => {
    appState.modelo = selModelo.value;

    resetSelect(selTasa);
    resetSelect(selPlazo);
    limpiarResultados();

    const veh = vehicles.find(v =>
      v.TipoVehiculo === appState.tipoVehiculo &&
      v.Marca === appState.marca &&
      v.Modelo === appState.modelo
    );

    if (!veh) return;

    document.getElementById("pvp").textContent =
      Number(veh.PVP).toFixed(2);

    // 🔑 Cargar tasas SOLO si existen
    if (!rates || rates.length === 0) {
      console.warn("Rates vacío");
      return;
    }

    rates.forEach(t =>
      addOption(selTasa, t.IdTasa, `${t.TasaAnual}%`)
    );
  });

  /* =============================
     TASA
  ============================= */
  selTasa.addEventListener("change", () => {
    appState.tasa = selTasa.value;

    resetSelect(selPlazo);
    limpiarResultados();

    const tasaObj = rates.find(r => r.IdTasa === appState.tasa);
    if (!tasaObj || !tasaObj.Plazos) return;

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
   UTILS
============================= */
function resetSelect(sel) {
  sel.innerHTML = `<option value="">Seleccione</option>`;
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
