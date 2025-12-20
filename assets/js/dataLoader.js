/*************************************************
 * Archivo: dataLoader.js
 * Proyecto: Cotizador Vehículos Teojama
 * Versión: V 1.0 · Compilación 3.03
 * Cambio: Corrección carga de Rates / DevicePlans
 *************************************************/

// dataLoader.js
// Carga y cache de catálogos (MVP – GitHub Pages)

/**
 * Cache en memoria
 */
const cache = {
  vehicles: null,
  rates: null,
  devicePlans: null
};

/**
 * Función genérica para cargar JSON
 */
async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Error cargando ${path}`);
  }
  return await response.json();
}

/**
 * Vehículos
 */
async function loadVehicles() {
  if (!cache.vehicles) {
    cache.vehicles = await loadJson("data/Vehicles.json");
  }
  return cache.vehicles;
}

/**
 * Tasas
 */
async function loadRates() {
  if (!cache.rates) {
    cache.rates = await loadJson("data/Rates.json");
  }
  return cache.rates;
}

/**
 * Dispositivos
 */
async function loadDevicePlans() {
  if (!cache.devicePlans) {
    cache.devicePlans = await loadJson("data/DevicePlans.json");
  }
  return cache.devicePlans;
}

/**
 * Limpia cache (debug)
 */
function clearCache() {
  cache.vehicles = null;
  cache.rates = null;
  cache.devicePlans = null;
}
