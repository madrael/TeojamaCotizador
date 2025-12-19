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
  vehicles = await loadVehicles();
  rates = await loadRates();
  devicePlans = await loadDevicePlans();
  initUI();
});

function initUI() {
  const chkDispositivo = document.getElementById("chkDispositivo");
  const selectPlazo = document.getElementById("selectPlazo");

  chkDispositivo.addEventListener("change", () => {
    appState.incluyeDispositivo = chkDispositivo.checked;
    actualizarDispositivo();
  });

  selectPlazo.addEventListener("change", () => {
    appState.plazo = Number(selectPlazo.value);
    actualizarDispositivo();
  });
}

/* =========================
   DISPOSITIVO
========================= */
function actualizarDispositivo() {
  const cont = document.getElementById("deviceInfo");

  if (!appState.incluyeDispositivo || !appState.plazo) {
    cont.style.display = "none";
    appState.dispositivo = null;
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
