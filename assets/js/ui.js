/*************************************************
 * Archivo: ui.js
 * Proyecto: Cotizador Vehículos Teojama
 * Versión: V 1.0 · Compilación 3.11
 * Cambios:
 * - Reglas de negocio para planes de dispositivo
 * - Filtro por tipoCliente
 * - Prioridad por coincidencia de tasa
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

  tipoCliente: "NORMAL", // preparado para UI (NORMAL | COLABORADOR | REFINANCIADO)

  incluyeSeguro: false,
  incluyeLucroCesante: false,
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

  const chkSeguro = document.getElementById("chkLucroCesante");
  const inpSeguro = document.getElementById("inputLucroCesante ");

  const chkDispositivo = document.getElementById("chkDispositivo");
  const deviceContainer = document.getElementById("deviceContainer");
  const selDevicePlan = document.getElementById("selectDevicePlan");
  const lblDeviceProvider = document.getElementById("deviceProvider");

  const btnCalcular = document.getElementById("btnCalcular");

  /* ===== Tipo / Marca / Modelo ===== */
  selTipo.addEventListener("change", () => {
    resetAll();
    appState.tipoVehiculo = selTipo.value;

    [...new Set(
      vehicles
        .filter(v => v.TipoVehiculo === appState.tipoVehiculo)
        .map(v => v.Marca)
    )].forEach(m => addOption(selMarca, m, m));
  });

  selMarca.addEventListener("change", () => {
    resetSelect(selModelo);
    appState.marca = selMarca.value;

    vehicles
      .filter(v =>
        v.TipoVehiculo === appState.tipoVehiculo &&
        v.Marca === appState.marca
      )
      .forEach(v => addOption(selModelo, v.Modelo, v.Modelo));
  });

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

    if (appState.incluyeDispositivo) {
      cargarPlanesDispositivo();
    }
  });

  /* ===== Plazo ===== */
  selPlazo.addEventListener("change", () => {
    appState.plazo = Number(selPlazo.value);
    actualizarValorDispositivo();
  });

  /* ===== Seguro ===== */
  chkSeguro.addEventListener("change", () => {
    appState.incluyeSeguro = chkSeguro.checked;
    inpSeguro.disabled = !chkSeguro.checked;
    if (!chkSeguro.checked) inpSeguro.value = "";
  });

  /* ===== Lucro cesante ===== */
  chkLucroCesante.addEventListener("change", () => {
    appState.incluyeLucroCesante = chkLucroCesante.checked;
    inputLucroCesante.disabled = !chkLucroCesante.checked;
    if (!chkLucroCesante.checked) inputLucroCesante.value = "";
  });

  /* ===== Dispositivo ===== */
  chkDispositivo.addEventListener("change", () => {
    appState.incluyeDispositivo = chkDispositivo.checked;
    deviceContainer.style.display = chkDispositivo.checked ? "block" : "none";

    chkDispositivo.checked
      ? cargarPlanesDispositivo()
      : limpiarDispositivo();
  });

  selDevicePlan.addEventListener("change", () => {
    appState.dispositivo =
      devicePlans.find(p => p.codigo === selDevicePlan.value) || null;

    lblDeviceProvider.textContent =
      appState.dispositivo?.proveedor || "";

    actualizarValorDispositivo();
  });

  btnCalcular.addEventListener("click", () => {
    alert("Motor financiero pendiente (siguiente iteración)");
  });
}

/* =============================
   DISPOSITIVO – REGLAS DE NEGOCIO
============================= */
function cargarPlanesDispositivo() {
  const sel = document.getElementById("selectDevicePlan");
  sel.options.length = 0;
  addOption(sel, "", "Seleccione plan");

  if (!appState.tasa) return;

  const tasaCredito = rates.find(r => r.IdTasa === appState.tasa)?.TasaAnual;

  let planes = devicePlans
    .filter(p =>
      p.activo === true &&
      p.tipoCliente === appState.tipoCliente
    )
    .map(p => ({
      ...p,
      coincideTasa: p.tasaDispositivo === tasaCredito
    }))
    .sort((a, b) => {
      if (a.coincideTasa !== b.coincideTasa) {
        return a.coincideTasa ? -1 : 1;
      }
      return a.prioridad - b.prioridad;
    });

  planes.forEach(p => {
    addOption(
      sel,
      p.codigo,
      `${p.proveedor} – ${p.tipoPlan} – ${p.tasaDispositivo}%`
    );
  });

  const auto = planes.find(p => p.coincideTasa);
  if (auto) {
    sel.value = auto.codigo;
    appState.dispositivo = auto;
    document.getElementById("deviceProvider").textContent = auto.proveedor;
    actualizarValorDispositivo();
  }
}

function actualizarValorDispositivo() {
  const lbl = document.getElementById("deviceValueDisplay");

  if (!appState.dispositivo || !appState.plazo) {
    lbl.textContent = "-";
    return;
  }

  const anios = appState.plazo / 12;
  const valor = appState.dispositivo.valoresPorAnio?.[anios];

  lbl.textContent = valor
    ? Number(valor).toFixed(2)
    : "-";
}

function limpiarDispositivo() {
  const sel = document.getElementById("selectDevicePlan");
  sel.options.length = 0;
  document.getElementById("deviceProvider").textContent = "";
  document.getElementById("deviceValueDisplay").textContent = "-";
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
  sel.options.length = 0;
  addOption(sel, "", "Seleccione");
}

function addOption(sel, value, text) {
  const o = document.createElement("option");
  o.value = value;
  o.textContent = text;
  sel.appendChild(o);
}

/* ==========================
   Tabs - Inputs izquierda
   ========================== */
document.addEventListener("DOMContentLoaded", () => {
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabPanels = document.querySelectorAll(".tab-panel");

  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetTab = btn.dataset.tab;

      // Botones
      tabButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      // Paneles
      tabPanels.forEach(panel => {
        panel.classList.toggle(
          "active",
          panel.id === targetTab
        );
      });
    });
  });
});

document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {

    document.querySelectorAll(".tab-btn")
      .forEach(b => b.classList.remove("active"));

    document.querySelectorAll(".tab-panel")
      .forEach(p => p.classList.remove("active"));

    btn.classList.add("active");
    document.getElementById(btn.dataset.tab)
      .classList.add("active");
  });
});

