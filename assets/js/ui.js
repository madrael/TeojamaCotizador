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
        v.TipoVehiculo === appState.tipoVeh
