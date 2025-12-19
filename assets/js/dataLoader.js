// dataLoader.js
// Carga y cache de catálogos (MVP – GitHub Pages)

/**
 * Cache en memoria
 * Simula un backend
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
    cache.vehicles = await loadJson("./data/Vehicles.json");
  }
  return cache.vehicles;
}

/**
 * Tasas de financiamiento
 */
async function loadRates() {
  if (!cache.rates) {
    cache.rates = await loadJson("./data/Rates.json");
  }
  return cache.rates;
}

/**
 * Planes de dispositivo
 */
async function loadDevicePlans() {
  if (!cache.devicePlans) {
    cache.devicePlans = await loadJson("./data/DevicePlans.json");
  }
  return cache.devicePlans;
}

/**
 * Limpia el cache (útil para pruebas)
 */
function clearCache() {
  cache.vehicles = null;
  cache.rates = null;
  cache.devicePlans = null;
}
