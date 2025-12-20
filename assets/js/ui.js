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

document.addEventListener("DOMContentLoaded", async () => {
  try {
    vehicles = await loadVehicles();
    rates = await loadRates();
    devicePlans = await loadDevicePlans();
    console.log(
      "Datos cargados:",
      vehicles.length,
      "vehículos,",
      rates.length,
      "tasas,",
      devicePlans.length,
      "planes dispositivo"
    );
  } catch (e) {
    console.error("Error cargando datos", e);
    vehicles = [];
    rates = [];
    devicePlans = [];
  }

  initUI();
});

function initUI() {
  const selectTipoVehiculo = document.getElementById("selectTipoVehiculo");
  const selectMarca = document.getElementById("selectMarca");
  const selectModelo = document.getElementById("selectModelo");
  const selectTasa = document.getElementById("selectTasa");
  const selectPlazo = document.getElementById("selectPlazo");

  const chkSeguro = document.getElementById("chkSeguro");
  const chkDispositivo = document.getElementById("chkDispositivo");

  /* =====================
     CHECKBOXES
  ===================== */
  chkSeguro.addEventListener("change", () => {
    appState.incluyeSeguro = chkSeguro.checked;
  });

  chkDispositivo.addEventListener("change", () => {
    appState.incluyeDispositivo = chkDispositivo.checked;
    actualizarDispositivo();
  });

  /* =====================
     TIPO VEHÍCULO
  ===================== */
  selectTipoVehiculo.addEventListener("change", () => {
    appState.tipoVehiculo = selectTipoVehiculo.value;

    resetSelect(selectMarca, "Seleccione");
    resetSelect(selectModelo, "Seleccione");
    resetSelect(selectTasa, "Seleccione una tasa");
    resetSelect(selectPlazo, "Seleccione un plazo");

    document.getElementById("pvp").textContent = "";
    ocultarDispositivo();

    if (!appState.tipoVehiculo) return;

    const marcas = [
      ...new Set(
        vehicles
          .filter(v => v.TipoVehiculo === appState.tipoVehiculo)
          .map(v => v.Marca)
      )
    ];

    marcas.forEach(m => addOption(selectMarca, m, m));
    selectMarca.disabled = marcas.length === 0;
  });

  /* =====================
     MARCA
  ===================== */
  selectMarca.addEventListener("change", () => {
    appState.marca = selectMarca.value;

    resetSelect(selectModelo, "Seleccione");
    resetSelect(selectTasa, "Seleccione una tasa");
    resetSelect(selectPlazo, "Seleccione un plazo");

    document.getElementById("pvp").textContent = "";
    ocultarDispositivo();

    if (!appState.marca) return;

    const modelos = vehicles.filter(
      v =>
        v.TipoVehiculo === appState.tipoVehiculo &&
        v.Marca === appState.marca
    );

    modelos.forEach(m => addOption(selectModelo, m.Modelo, m.Modelo));
    selectModelo.disabled = modelos.length === 0;
  });

  /* =====================
     MODELO
  ===================== */
  selectModelo.addEventListener("change", () => {
    appState.modelo = selectModelo.value;

    resetSelect(selectTasa, "Seleccione una tasa");
    resetSelect(selectPlazo, "Seleccione un plazo");

    document.getElementById("pvp").textContent = "";
    ocultarDispositivo();

    if (!appState.modelo) return;

    const vehiculo = vehicles.find(
      v =>
        v.TipoVehiculo === appState.tipoVehiculo &&
        v.Marca === appState.marca &&
        v.Modelo === appState.modelo
    );

    if (vehiculo) {
      document.getElementById("pvp").textContent = Number(vehiculo.PVP).toFixed(2);
      cargarTasas();
    }
  });

  /* =====================
     TASA
  ===================== */
  selectTasa.addEventListener("change", () => {
    appState.tasa = selectTasa.value;

    resetSelect(selectPlazo, "Seleccione un plazo");
    ocultarDispositivo();

    const tasa = rates.find(r => r.IdTasa === appState.tasa);
    if (!tasa) return;

    tasa.Plazos.forEach(p =>
      addOption(selectPlazo, p.VPlazo, `${p.VPlazo} meses`)
    );

    selectPlazo.disabled = false;
  });

  /* =====================
     PLAZO
  ===================== */
  selectPlazo.addEventListener("change", () => {
    appState.plazo = Number(selectPlazo.value);
    actualizarDispositivo();
  });
}

/* =====================
   TASAS
===================== */
function cargarTasas() {
  const selectTasa = document.getElementById("selectTasa");

  resetSelect(selectTasa, "Seleccione una tasa");

  rates.forEach(t =>
    addOption(selectTasa, t.IdTasa, `${t.TasaAnual}%`)
  );

  selectTasa.disabled = rates.length === 0;
}

/* =====================
   DISPOSITIVO
===================== */
function actualizarDispositivo() {
  const cont = document.getElementById("deviceInfo");

  if (!appState.incluyeDispositivo || !appState.plazo) {
    ocultarDispositivo();
    return;
  }

  const tipoCliente = "NORMAL";
  const plazoAnios = appState.plazo / 12;

  const planes = devicePlans
    .filter(p => p.activo && p.tipoCliente === tipoCliente)
    .sort((a, b) => a.prioridad - b.prioridad);

  if (planes.length === 0) return;

  const plan = planes[0];
  const valor = plan.valoresPorAnio[plazoAnios];

  if (!valor) return;

  appState.dispositivo = {
    proveedor: plan.proveedor,
    codigo: plan.codigo,
    valor
  };

  document.getElementById("devProveedor").textContent = plan.proveedor;
  document.getElementById("devPlan").textContent = plan.codigo;
  document.getElementById("devValor").textContent = valor.toFixed(2);

  cont.style.display = "block";
}

function ocultarDispositivo() {
  const cont = document.getElementById("deviceInfo");
  cont.style.display = "none";
  appState.dispositivo = null;
}

/* =====================
   UTILS
===================== */
function resetSelect(select, placeholder) {
  select.innerHTML = `<option value="">${placeholder}</option>`;
  select.disabled = true;
}

function addOption(select, value, text) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = text;
  select.appendChild(option);
}
