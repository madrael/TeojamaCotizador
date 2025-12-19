let vehicles = [];
let rates = [];

const appState = {
  tipoVehiculo: null,
  marca: null,
  modelo: null,
  tasa: null,
  plazo: null
};

document.addEventListener("DOMContentLoaded", async () => {
  vehicles = await loadVehicles();
  rates = await loadRates();

  initUI();
});

function initUI() {
  const selectTipoVehiculo = document.getElementById("selectTipoVehiculo");
  const selectMarca = document.getElementById("selectMarca");
  const selectModelo = document.getElementById("selectModelo");
  const selectTasa = document.getElementById("selectTasa");
  const selectPlazo = document.getElementById("selectPlazo");

  selectTipoVehiculo.addEventListener("change", () => {
    appState.tipoVehiculo = selectTipoVehiculo.value;

    resetSelect(selectMarca, "Seleccione");
    resetSelect(selectModelo, "Seleccione");
    resetSelect(selectTasa, "Seleccione una tasa");
    resetSelect(selectPlazo, "Seleccione un plazo");

    document.getElementById("pvp").textContent = "";

    if (!appState.tipoVehiculo) return;

    const marcas = [
      ...new Set(
        vehicles
          .filter(v => v.TipoVehiculo === appState.tipoVehiculo)
          .map(v => v.Marca)
      )
    ];

    marcas.forEach(m => addOption(selectMarca, m, m));
    selectMarca.disabled = false;
  });

  selectMarca.addEventListener("change", () => {
    appState.marca = selectMarca.value;

    resetSelect(selectModelo, "Seleccione");
    resetSelect(selectTasa, "Seleccione una tasa");
    resetSelect(selectPlazo, "Seleccione un plazo");

    document.getElementById("pvp").textContent = "";

    if (!appState.marca) return;

    const modelos = vehicles.filter(
      v =>
        v.TipoVehiculo === appState.tipoVehiculo &&
        v.Marca === appState.marca
    );

    modelos.forEach(m => addOption(selectModelo, m.Modelo, m.Modelo));
    selectModelo.disabled = false;
  });

  selectModelo.addEventListener("change", () => {
    appState.modelo = selectModelo.value;

    resetSelect(selectTasa, "Seleccione una tasa");
    resetSelect(selectPlazo, "Seleccione un plazo");

    if (!appState.modelo) return;

    const vehiculo = vehicles.find(
      v =>
        v.TipoVehiculo === appState.tipoVehiculo &&
        v.Marca === appState.marca &&
        v.Modelo === appState.modelo
    );

    if (vehiculo) {
      document.getElementById("pvp").textContent = vehiculo.PVP.toFixed(2);
      cargarTasas();
    }
  });

  selectTasa.addEventListener("change", () => {
    appState.tasa = selectTasa.value;

    resetSelect(selectPlazo, "Seleccione un plazo");

    const tasa = rates.find(r => r.IdTasa === appState.tasa);
    if (!tasa) return;

    tasa.Plazos.forEach(p =>
      addOption(selectPlazo, p.VPlazo, `${p.VPlazo} meses`)
    );

    selectPlazo.disabled = false;
  });

  selectPlazo.addEventListener("change", () => {
    appState.plazo = selectPlazo.value;
  });
}

function cargarTasas() {
  const selectTasa = document.getElementById("selectTasa");

  resetSelect(selectTasa, "Seleccione una tasa");

  rates.forEach(t =>
    addOption(selectTasa, t.IdTasa, `${t.TasaAnual}%`)
  );

  selectTasa.disabled = false;
}

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
