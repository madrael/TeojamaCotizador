/*************************************************
 * Archivo: ui.js
 * Proyecto: Cotizador Vehículos Teojama
 * Versión: V 2.0
 * Compilación: 1.81
 * Estado: REORGANIZADO (sin cambios funcionales)
 *************************************************/

/* =================================================
   ESTADO GLOBAL
================================================= */

let vehicles = [];
let rates = [];
let devicePlans = [];
let insuranceProviders = [];
let lucroCesanteConfig = [];

const appState = {
  tipoVehiculo: null,
  marca: null,
  modelo: null,
  tasa: null,
  plazo: null,

  tipoCliente: "NORMAL",

  incluyeSeguro: false,
  incluyeLucroCesante: false,
  incluyeDispositivo: false,

  dispositivo: null
};

/* =================================================
   INIT
================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  vehicles = await loadVehicles();
  rates = await loadRates();
  devicePlans = await loadDevicePlans();
  insuranceProviders = await loadInsuranceProviders();
  lucroCesanteConfig = await loadLucroCesanteConfig();
  initUI();
});

/* =================================================
   DOM / SELECTORES
================================================= */

function getEl(id) {
  return document.getElementById(id);
}

/* =================================================
   UTILIDADES
================================================= */

function round2(v) {
  return Math.round(v * 100) / 100;
}

function getPVPBase() {
  const el = getEl("pvp");
  return el ? parseFloat(el.textContent.replace(/[^0-9.]/g, "")) || 0 : 0;
}

function getPVPEfectivo() {
  const el = getEl("inputPvpFinal");
  const val = el ? parseFloat(el.value) : NaN;
  return !isNaN(val) && val > 0 ? val : getPVPBase();
}

/* =================================================
   INIT UI
================================================= */

function initUI() {

  /* Selectores principales */
  const selTipoVehiculo = getEl("selectTipoVehiculo");
  const selMarca = getEl("selectMarca");
  const selModelo = getEl("selectModelo");
  const selTasa = getEl("selectTasa");
  const selPlazo = getEl("selectPlazo");
  const btnCalcular = getEl("btnCalcular");

  /* Inputs descuento / entrada */
  const inputDescPorcentaje = getEl("inputDescPorcentaje");
  const inputValorDesc = getEl("inputValorDesc");
  const inputPvpFinal = getEl("inputPvpFinal");
  const inputEntradaPorcentaje = getEl("inputEntradaPorcentaje");
  const inputEntrada = getEl("inputEntrada");

  /* Seguro / Lucro / Dispositivo */
  const chkSeguro = getEl("chkSeguro");
  const inputSeguro = getEl("inputSeguro");
  const chkLucroCesante = getEl("chkLucroCesante");
  const inputLucroCesante = getEl("inputLucroCesante");
  const chkDispositivo = getEl("chkDispositivo");
  const deviceContainer = getEl("deviceContainer");
  const selDevicePlan = getEl("selectDevicePlan");
  const lblDeviceProvider = getEl("deviceProvider");

  /* Prospecto */
  const selTipoPersona = getEl("selectTipoPersona");
  const inputIdentificacion = getEl("inputIdentificacion");
  const inputFechaNacimiento = getEl("inputFechaNacimiento");
  const inputEdadCliente = getEl("inputEdadCliente");

  /* año modelo */
  const inputAnioModelo = getEl("inputAnioModelo");

  if (inputAnioModelo && !inputAnioModelo.value) {
  inputAnioModelo.value = new Date().getFullYear();
  }
   
/* =================================================
   DESCUENTO (PVP → PVP EFECTIVO)
   FIX: no romper decimales, permitir borrar y recalcular
================================================= */

function resetDescuentoToBase() {
  const pvpBase = getPVPBase();
  if (!pvpBase) return;

  inputDescPorcentaje.value = "";
  inputValorDesc.value = "";
  inputPvpFinal.value = pvpBase.toFixed(2);
  recalcularValorEntradaDesdePVPEfectivo();
}

function recalcularDesdeDescuento() {
  const pvpBase = getPVPBase();
  if (!pvpBase) return;

  const active = document.activeElement;
  const porcRaw = inputDescPorcentaje.value.trim();
  const valRaw  = inputValorDesc.value.trim();

  /* ---- BORRADO COMPLETO → RESET ---- */
  if (active === inputDescPorcentaje && porcRaw === "") {
    inputDescPorcentaje.value = "";   // FIX: limpiar explícitamente
    inputValorDesc.value = "";
    inputPvpFinal.value = pvpBase.toFixed(2);
    recalcularValorEntradaDesdePVPEfectivo();
    return;
  }

  if (active === inputValorDesc && valRaw === "") {
    inputValorDesc.value = "";        // FIX: limpiar explícitamente
    inputDescPorcentaje.value = "";
    inputPvpFinal.value = pvpBase.toFixed(2);
    recalcularValorEntradaDesdePVPEfectivo();
    return;
  }

  /* ---- % → VALOR DESCUENTO ---- */
  if (active === inputDescPorcentaje) {
    const porc = parseFloat(porcRaw);
    if (isNaN(porc)) return;

    const desc = pvpBase * (porc / 100);
    inputValorDesc.value = round2(desc).toFixed(2);
    inputPvpFinal.value  = round2(pvpBase - desc).toFixed(2);
    recalcularValorEntradaDesdePVPEfectivo();
    return;
  }

  /* ---- VALOR → % DESCUENTO ---- */
  if (active === inputValorDesc) {
    const val = parseFloat(valRaw);
    if (isNaN(val)) return;

    inputDescPorcentaje.value = round2((val / pvpBase) * 100);
    inputPvpFinal.value       = round2(pvpBase - val).toFixed(2);
    recalcularValorEntradaDesdePVPEfectivo();
  }
}

function recalcularDesdePVPEfectivo() {
  const pvpBase = getPVPBase();
  if (!pvpBase) return;

  const pvpFinal = parseFloat(inputPvpFinal.value);
  if (isNaN(pvpFinal) || pvpFinal <= 0) return;

  // Si no hay descuento
  if (pvpFinal >= pvpBase) {
    inputDescPorcentaje.value = "";
    inputValorDesc.value = "";
    inputPvpFinal.value = pvpBase.toFixed(2);
    recalcularValorEntradaDesdePVPEfectivo();
    return;
  }

  const desc = pvpBase - pvpFinal;
  const porc = (desc / pvpBase) * 100;

  inputValorDesc.value = round2(desc).toFixed(2);
  inputDescPorcentaje.value = round2(porc);
  inputPvpFinal.value = round2(pvpFinal).toFixed(2);

  recalcularValorEntradaDesdePVPEfectivo();
}

/* LISTENERS */
inputDescPorcentaje?.addEventListener("input", recalcularDesdeDescuento);
inputValorDesc?.addEventListener("input", recalcularDesdeDescuento);

inputPvpFinal?.addEventListener("blur", () => {
  recalcularDesdePVPEfectivo();
});
   
/* =================================================
   ENTRADA – basada en PVP EFECTIVO
   Regla: descuento NO pisa % entrada
================================================= */

function recalcularEntradaDesdePVPEfectivo() {
  if (!selTasa.value) {
    inputEntrada.value = "";
    inputEntradaPorcentaje.value = "";
    return;
  }

  const tasa = rates.find(r => String(r.IdTasa) === String(selTasa.value));
  if (!tasa || tasa.PerEntrada == null) return;

  const pvp = getPVPEfectivo();
  const porc = parseFloat(tasa.PerEntrada);

  if (pvp <= 0 || isNaN(porc)) return;

  inputEntradaPorcentaje.value = porc;
  inputEntrada.value = round2((pvp * porc) / 100);
}

function recalcularValorEntradaDesdePVPEfectivo() {
  const pvp = getPVPEfectivo();
  const porc = parseFloat(inputEntradaPorcentaje.value);

  if (!pvp || isNaN(porc)) return;

  inputEntrada.value = round2((pvp * porc) / 100);

  // Si hay tasa seleccionada, la tasa gobierna el % base
  if (selTasa.value) {
    recalcularEntradaDesdePVPEfectivo();
  }
}

/* ---- LISTENERS ---- */

// Usuario edita % de entrada (manual)
inputEntradaPorcentaje?.addEventListener("input", () => {
  const pvp = getPVPEfectivo();
  const porc = parseFloat(inputEntradaPorcentaje.value);

  if (!isNaN(porc) && pvp > 0) {
    inputEntrada.value = round2((pvp * porc) / 100);
  }
});

// Usuario edita valor de entrada (manual)
inputEntrada?.addEventListener("input", () => {
  const pvp = getPVPEfectivo();
  const val = parseFloat(inputEntrada.value);

  if (!isNaN(val) && pvp > 0) {
    inputEntradaPorcentaje.value = round2((val / pvp) * 100);
  }
});

// Cambio de PVP efectivo (por descuento o edición directa)
inputPvpFinal?.addEventListener("blur", () => {
  recalcularValorEntradaDesdePVPEfectivo();
});

// Cambio de tasa
selTasa?.addEventListener("change", () => {
  recalcularEntradaDesdePVPEfectivo();
});

  /* =================================================
     IDENTIFICACIÓN – CÉDULA / RUC
  ================================================= */

  selTipoPersona?.addEventListener("change", () => {
    inputIdentificacion.value = "";
    inputIdentificacion.placeholder =
      selTipoPersona.value === "JURIDICA"
        ? "RUC (13 dígitos)"
        : "Cédula (10) o RUC (13)";
    inputIdentificacion.maxLength = 13;
  });

 inputIdentificacion?.addEventListener("blur", () => {
  const valor = inputIdentificacion.value.trim();
  if (!valor) return;

  if (!/^\d+$/.test(valor)) {
    alert("La identificación solo debe contener números");
    return;
  }

  if (selTipoPersona.value === "JURIDICA") {
    if (valor.length !== 13) {
      alert("Para persona jurídica debe ingresar un RUC de 13 dígitos");
      return;
    }
  } else {
    if (valor.length !== 10 && valor.length !== 13) {
      alert("Para persona natural ingrese una cédula (10 dígitos) o RUC (13 dígitos)");
      return;
    }
  }
});

  selTipoPersona?.dispatchEvent(new Event("change"));

  /* =================================================
     FECHA NACIMIENTO → EDAD
  ================================================= */

  inputFechaNacimiento?.addEventListener("change", () => {
    if (!inputFechaNacimiento.value) {
      inputEdadCliente.value = "";
      return;
    }

    const fn = new Date(inputFechaNacimiento.value);
    const hoy = new Date();
    let edad = hoy.getFullYear() - fn.getFullYear();
    const m = hoy.getMonth() - fn.getMonth();

    if (m < 0 || (m === 0 && hoy.getDate() < fn.getDate())) edad--;

    inputEdadCliente.value = edad > 0 && edad < 120 ? edad : "";
  });

  /* =================================================
     VEHÍCULO → MARCA → MODELO
  ================================================= */

  selTipoVehiculo?.addEventListener("change", () => {
    resetAll();
    appState.tipoVehiculo = selTipoVehiculo.value;

    [...new Set(
      vehicles
        .filter(v => v.TipoVehiculo === appState.tipoVehiculo)
        .map(v => v.Marca)
    )].forEach(m => addOption(selMarca, m, m));
  });

  selMarca?.addEventListener("change", () => {
    resetSelect(selModelo);
    appState.marca = selMarca.value;

    vehicles
      .filter(v => v.TipoVehiculo === appState.tipoVehiculo && v.Marca === appState.marca)
      .forEach(v => addOption(selModelo, v.Modelo, v.Modelo));
  });

  selModelo?.addEventListener("change", () => {
    resetSelect(selTasa);
    resetSelect(selPlazo);

    appState.modelo = selModelo.value;

    const veh = vehicles.find(v =>
      v.TipoVehiculo === appState.tipoVehiculo &&
      v.Marca === appState.marca &&
      v.Modelo === appState.modelo
    );

    getEl("pvp").textContent = veh ? Number(veh.PVP).toFixed(2) : "0.00";
    resetDescuentoToBase();
    
    rates.forEach(r => addOption(selTasa, r.IdTasa, `${r.TasaAnual}%`));
  });

  /* =================================================
     TASA / PLAZO
  ================================================= */

  selTasa?.addEventListener("change", () => {
    resetSelect(selPlazo);
    appState.tasa = selTasa.value;

    const tasaObj = rates.find(r => r.IdTasa === appState.tasa);
    tasaObj?.Plazos.forEach(p =>
      addOption(selPlazo, p.VPlazo, `${p.VPlazo} meses`)
    );
  });

  selPlazo?.addEventListener("change", () => {
    appState.plazo = Number(selPlazo.value);
    actualizarValorDispositivo();
  });

  /* =================================================
     SEGURO / LUCRO / DISPOSITIVO (UI)
  ================================================= */

  chkSeguro?.addEventListener("change", () => {

  // Validación mínima: modelo seleccionado
  if (!appState.modelo) {
    alert("Debe seleccionar los datos del vehículo");
    chkSeguro.checked = false;
    return;
  }

  appState.incluyeSeguro = chkSeguro.checked;

  const insuranceContainer = getEl("insuranceContainer");

  // Mostrar / ocultar contenedor
  insuranceContainer.style.display = chkSeguro.checked ? "block" : "none";

  // Input póliza
  inputSeguro.disabled = !chkSeguro.checked;

  if (!chkSeguro.checked) {
    inputSeguro.value = "";

    // Lucro cesante depende del seguro
    chkLucroCesante.checked = false;
    chkLucroCesante.disabled = true;

    inputLucroCesante.value = "";
    inputLucroCesante.disabled = true;
  } else {
    chkLucroCesante.disabled = false;
    cargarProveedoresSeguro(); 
  }
});

 /* lucro cesante */
 chkLucroCesante?.addEventListener("change", () => {

  const select = getEl("selectLucroCesante");

  if (!chkLucroCesante.checked) {
    select.innerHTML = "";
    select.disabled = true;
    appState.incluyeLucroCesante = false;
    return;
  }

  const providerId = getEl("selectInsuranceProvider").value;
  const tipoVehiculo = appState.tipoVehiculo;
  const edad = parseInt(getEl("inputEdadCliente")?.value || 0);

  const config = lucroCesanteConfig.find(c =>
    c.active &&
    c.providerId === providerId &&
    c.aplicaTipoVehiculo.includes(tipoVehiculo)
  );

  if (!config) {
    alert("Lucro cesante no disponible para este proveedor");
    chkLucroCesante.checked = false;
    return;
  }

  if (edad < config.edadMinima || edad > config.edadMaxima) {
    alert(`Lucro cesante aplica entre ${config.edadMinima} y ${config.edadMaxima} años`);
    chkLucroCesante.checked = false;
    return;
  }

  // Llenar combo
  select.innerHTML = "";

  config.valorCoberturasAnual.forEach(valor => {
    const opt = document.createElement("option");
    opt.value = valor;
    opt.textContent = valor;
    select.appendChild(opt);
  });

  // Seleccionar valor por defecto
  select.value = config.CoberturaAnualPorDefecto;

  select.disabled = !config.editable;

  appState.incluyeLucroCesante = true;
});

/* Selecciona Dispositivo */
  chkDispositivo?.addEventListener("change", () => {
    appState.incluyeDispositivo = chkDispositivo.checked;
    deviceContainer.style.display = chkDispositivo.checked ? "block" : "none";
    chkDispositivo.checked ? cargarPlanesDispositivo() : limpiarDispositivo();
  });

  selDevicePlan?.addEventListener("change", () => {
    appState.dispositivo =
      devicePlans.find(p => p.codigo === selDevicePlan.value) || null;

    lblDeviceProvider.textContent =
      appState.dispositivo?.proveedor || "";

    actualizarValorDispositivo();
  });

  btnCalcular?.addEventListener("click", () => {
    alert("Motor financiero pendiente (siguiente iteración)");
  });
}

/* SEGURO – Funcnion CARGA DE PROVEEDORES */

function cargarProveedoresSeguro() {

  const select = getEl("selectInsuranceProvider");
  select.options.length = 0;

  if (!insuranceProviders || !insuranceProviders.length) return;
  if (!appState.tipoVehiculo) return;

  const proveedores = insuranceProviders
    .filter(p => p.active)
    .map(p => {
      const linea = p.aplicaTipoVehiculo.find(
        l => l.TipoLinea === appState.tipoVehiculo
      );
      if (!linea) return null;
      return {
        id: p.providerId,
        nombre: p.providerName,
        prioridad: linea.Prioridad
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.prioridad - b.prioridad);

  proveedores.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.nombre;
    select.appendChild(opt);
  });

  if (proveedores.length) {
    select.value = proveedores[0].id;
  }
}


/* =================================================
   DISPOSITIVO – REGLAS
================================================= */

function cargarPlanesDispositivo() {
  const sel = getEl("selectDevicePlan");
  sel.options.length = 0;
  addOption(sel, "", "Seleccione plan");

  if (!appState.tasa) return;

  const tasaCredito =
    rates.find(r => r.IdTasa === appState.tasa)?.TasaAnual;

  const planes = devicePlans
    .filter(p => p.activo && p.tipoCliente === appState.tipoCliente)
    .map(p => ({ ...p, coincideTasa: p.tasaDispositivo === tasaCredito }))
    .sort((a, b) =>
      a.coincideTasa !== b.coincideTasa
        ? a.coincideTasa ? -1 : 1
        : a.prioridad - b.prioridad
    );

  planes.forEach(p =>
    addOption(sel, p.codigo, `${p.proveedor} – ${p.tipoPlan} – ${p.tasaDispositivo}%`)
  );

  const auto = planes.find(p => p.coincideTasa);
  if (auto) {
    sel.value = auto.codigo;
    appState.dispositivo = auto;
    getEl("deviceProvider").textContent = auto.proveedor;
    actualizarValorDispositivo();
  }
}

function actualizarValorDispositivo() {
  const lbl = getEl("deviceValueDisplay");

  if (!appState.dispositivo || !appState.plazo) {
    lbl.textContent = "-";
    return;
  }

  const anios = appState.plazo / 12;
  const val = appState.dispositivo.valoresPorAnio?.[anios];
  lbl.textContent = val ? Number(val).toFixed(2) : "-";
}

function limpiarDispositivo() {
  const sel = getEl("selectDevicePlan");
  sel.options.length = 0;
  getEl("deviceProvider").textContent = "";
  getEl("deviceValueDisplay").textContent = "-";
  appState.dispositivo = null;
}

/* =================================================
   HELPERS
================================================= */

function resetAll() {
  ["selectMarca", "selectModelo", "selectTasa", "selectPlazo"]
    .forEach(id => resetSelect(getEl(id)));
}

function resetSelect(sel) {
  if (!sel) return;
  sel.options.length = 0;
  addOption(sel, "", "Seleccione");
}

function addOption(sel, value, text) {
  if (!sel) return;
  const o = document.createElement("option");
  o.value = value;
  o.textContent = text;
  sel.appendChild(o);
}
