/*************************************************
 * Archivo: ui.js
 * Proyecto: Cotizador Vehículos Teojama
 * Versión: V 2.0
 * Compilación: 2.00
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
let additionalComponents = [];

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
  
  dispositivo: null,
  componentesSeleccionados: []
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
  additionalComponents = await loadAdditionalComponents(); 
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

function round5(v) {
  return Math.round(v * 100000) / 100000;
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
   
  /*const inputSeguro = getEl("inputSeguro");*/
  /*const inputLucroCesante = getEl("inputLucroCesante");*/

  const chkLucroCesante = getEl("chkLucroCesante");
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
    inputDescPorcentaje.value = "";
    inputValorDesc.value = "";
    inputPvpFinal.value = pvpBase.toFixed(2);
    recalcularValorEntradaDesdePVPEfectivo();
    return;
  }

  if (active === inputValorDesc && valRaw === "") {
    inputValorDesc.value = "";
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

    inputDescPorcentaje.value = round5((val / pvpBase) * 100).toFixed(5);
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
  inputDescPorcentaje.value = round5(porc).toFixed(5);;
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

  inputEntradaPorcentaje.value = round5(porc).toFixed(5);
  inputEntrada.value = round2((pvp * porc) / 100).toFixed(2);
}

function recalcularValorEntradaDesdePVPEfectivo() {
  const pvp = getPVPEfectivo();
  const porc = parseFloat(inputEntradaPorcentaje.value);

  if (!pvp || isNaN(porc)) return;
   inputEntrada.value = round2((pvp * porc) / 100).toFixed(2);

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
    inputEntrada.value = round2((pvp * porc) / 100).toFixed(2);
  }
});

// Usuario edita valor de entrada (manual)
inputEntrada?.addEventListener("input", () => {
  const pvp = getPVPEfectivo();
  const val = parseFloat(inputEntrada.value);

  if (!isNaN(val) && pvp > 0) {
    inputEntradaPorcentaje.value = round5((val / pvp) * 100).toFixed(5);
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
    appState.componentesSeleccionados = [];
    renderComponentes();

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

  if (!appState.modelo) {
    alert("Debe seleccionar los datos del vehículo");
    chkSeguro.checked = false;
    return;
  }

  appState.incluyeSeguro = chkSeguro.checked;

  const insuranceContainer = getEl("insuranceContainer");
  const selectLucro = getEl("selectLucroCesante");

  insuranceContainer.style.display = chkSeguro.checked ? "block" : "none";

  if (!chkSeguro.checked) {
    chkLucroCesante.checked = false;
    chkLucroCesante.disabled = true;

    selectLucro.innerHTML = "";
    selectLucro.disabled = true;

    appState.incluyeLucroCesante = false;
    return;
  }

  cargarProveedoresSeguro();
  evaluarLucroCesantePorProveedor();
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
   
getEl("selectInsuranceProvider")?.addEventListener("change", () => {
  evaluarLucroCesantePorProveedor();
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

btnCalcular?.addEventListener("click", async () => {
  try {
    const veh = vehicles.find(v =>
      v.TipoVehiculo === appState.tipoVehiculo &&
      v.Marca === appState.marca &&
      v.Modelo === appState.modelo
    );

    if (!veh) {
      alert("No se encontró el vehículo seleccionado.");
      return;
    }

    if (!appState.tasa) {
      alert("Debe seleccionar una tasa.");
      return;
    }

    if (!appState.plazo) {
      alert("Debe seleccionar un plazo.");
      return;
    }

    const tasaObj = rates.find(r => r.IdTasa === appState.tasa);
    const tasaAnual = tasaObj ? Number(tasaObj.TasaAnual) / 100 : 0;

    const input = {
      vehicle: veh,
      vehiclePrice: getPVPEfectivo(),  // 👈 AGREGAR ESTA LÍNEA
      entry: Number(inputEntrada?.value) || 0,
      rate: tasaAnual,
      term: Number(appState.plazo) || 0,
      devicePlan: appState.dispositivo ? appState.dispositivo.idPlan : null,
      additionalComponents: appState.componentesSeleccionados || [],
      insuranceSelected: !!appState.incluyeSeguro,
      insuranceTotal: 0,
      lucroCesanteSelected: !!appState.incluyeLucroCesante,
      lucroCesanteAnnual: Number(getEl("selectLucroCesante")?.value) || 0
    };

      const data = await loadAllData();
      const result = calculateQuote(input, data);
      window.lastQuoteResult = result;
      console.log("Resultado quoteEngine:", result);
      await renderTablaFinanciamiento();
     
  } catch (error) {
    console.error("Error al calcular cotización:", error);
    alert("Ocurrió un error al calcular la cotización. Revise consola.");
  }
}
);
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

function evaluarLucroCesantePorProveedor() {
  const chkLucro = getEl("chkLucroCesante");
  const select = getEl("selectLucroCesante");
  const providerId = getEl("selectInsuranceProvider")?.value;
  const tipoVehiculo = appState.tipoVehiculo;
  const edad = parseInt(getEl("inputEdadCliente")?.value || 0);

  chkLucro.checked = false;
  chkLucro.disabled = true;
  select.innerHTML = "";
  select.disabled = true;
  appState.incluyeLucroCesante = false;

  const config = lucroCesanteConfig.find(c =>
    c.active &&
    c.providerId === providerId &&
    c.aplicaTipoVehiculo.includes(tipoVehiculo)
  );

  if (!config) return;

  chkLucro.disabled = false;

  if (edad >= config.edadMinima && edad <= config.edadMaxima) {

    config.valorCoberturasAnual.forEach(valor => {
      const opt = document.createElement("option");
      opt.value = valor;
      opt.textContent = valor;
      select.appendChild(opt);
    });

    select.value = config.CoberturaAnualPorDefecto;
    select.disabled = !config.editable;

    chkLucro.checked = true;
    appState.incluyeLucroCesante = true;
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
   COMPONENTES ADICIONALES
================================================= */

function renderComponentes() {

  const container = getEl("componentsContainer");
  if (!container) return;

  container.innerHTML = "";

  if (!appState.tipoVehiculo) {
    container.innerHTML = "<p>Seleccione primero un tipo de vehículo.</p>";
    return;
  }

  const disponibles = additionalComponents
    .filter(c => c.activo)
    .filter(c => c.aplicaTipoVehiculo.includes(appState.tipoVehiculo));

  if (!disponibles.length) {
    container.innerHTML = "<p>No existen componentes disponibles.</p>";
    return;
  }

  // 🔹 Agrupación doble: grupoComponente → ProveedorMarca
  const estructura = {};

  disponibles.forEach(comp => {

    const grupo = comp.grupoComponente || "Otros";
    const proveedor = comp.ProveedorMarca || "General";

    if (!estructura[grupo]) {
      estructura[grupo] = {};
    }

    if (!estructura[grupo][proveedor]) {
      estructura[grupo][proveedor] = [];
    }

    estructura[grupo][proveedor].push(comp);
  });

  Object.keys(estructura).forEach((nombreGrupo, indexGrupo) => {

    const detailsGrupo = document.createElement("details");
    detailsGrupo.className = "component-group";

    /*if (indexGrupo === 0) detailsGrupo.open = true;*/

    const summaryGrupo = document.createElement("summary");
    summaryGrupo.textContent = nombreGrupo;

    detailsGrupo.appendChild(summaryGrupo);

    Object.keys(estructura[nombreGrupo]).forEach(nombreProveedor => {

      const detailsProveedor = document.createElement("details");
      detailsProveedor.className = "component-subgroup";

      const summaryProveedor = document.createElement("summary");
      summaryProveedor.textContent = nombreProveedor;

      detailsProveedor.appendChild(summaryProveedor);

      estructura[nombreGrupo][nombreProveedor].forEach(comp => {

        const wrapper = document.createElement("div");
        wrapper.className = "component-item";

        const checked = appState.componentesSeleccionados
          .some(c => c.componentId === comp.componentId);

        wrapper.innerHTML = `
          <label style="display:flex; justify-content:space-between; width:100%;">
            <span>${comp.descripcion} — $${comp.valorPVP.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            <input type="checkbox" value="${comp.componentId}" ${checked ? "checked" : ""} />
          </label>
        `;

        const checkbox = wrapper.querySelector("input");

        checkbox.addEventListener("change", () => {

          if (checkbox.checked) {
            if (!appState.componentesSeleccionados.some(c => c.componentId === comp.componentId)) {
              appState.componentesSeleccionados.push(comp);
            }
          } else {
            appState.componentesSeleccionados =
              appState.componentesSeleccionados.filter(
                c => c.componentId !== comp.componentId
              );
          }

          recalcularPVPConComponentes();
        });

        detailsProveedor.appendChild(wrapper);
      });

      detailsGrupo.appendChild(detailsProveedor);
    });

    container.appendChild(detailsGrupo);
  });
}

/* Funcion para recalcular el pvp con componentes */
function recalcularPVPConComponentes() {

  const base = getPVPEfectivo();

  const totalComponentes = appState.componentesSeleccionados
    .filter(c => c.financiable)
    .reduce((acc, c) => acc + c.valorPVP, 0);

  const nuevoTotal = base + totalComponentes;

  const lbl = getEl("pvpTotalConComponentes"); // este ID debes tenerlo en HTML

  if (lbl) {
    lbl.textContent =
      `$${nuevoTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  }
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
