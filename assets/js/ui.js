// ui.js
// UI del cotizador – Etapa 1 (Vehículos)

import { getVehicles } from "./dataLoader.js";

document.addEventListener("DOMContentLoaded", async () => {

  // =========================
  // Elementos del DOM
  // =========================
  const brandSelect = document.getElementById("brand");
  const modelSelect = document.getElementById("model");
  const pvpField = document.getElementById("pvp");
  const vehicleTypeField = document.getElementById("vehicle-type");

  // =========================
  // Cargar vehículos
  // =========================
  const vehicles = await getVehicles();

  // =========================
  // Poblar marcas (únicas)
  // =========================
  const brands = [...new Set(vehicles.map(v => v.Marca))].sort();

  brandSelect.innerHTML = `<option value="">Seleccione marca</option>`;
  brands.forEach(brand => {
    const opt = document.createElement("option");
    opt.value = brand;
    opt.textContent = brand;
    brandSelect.appendChild(opt);
  });

  // =========================
  // Evento: cambio de marca
  // =========================
  brandSelect.addEventListener("change", () => {
    const selectedBrand = brandSelect.value;

    modelSelect.innerHTML = `<option value="">Seleccione modelo</option>`;
    pvpField.textContent = "-";
    vehicleTypeField.textContent = "-";

    if (!selectedBrand) return;

    const models = vehicles.filter(v => v.Marca === selectedBrand);

    models.forEach(v => {
      const opt = document.createElement("option");
      opt.value = v.Modelo;
      opt.textContent = `${v.Modelo} ${v["Version Modelo"]}`;
      modelSelect.appendChild(opt);
    });
  });

  // =========================
  // Evento: cambio de modelo
  // =========================
  modelSelect.addEventListener("change", () => {
    const selectedBrand = brandSelect.value;
    const selectedModel = modelSelect.value;

    if (!selectedBrand || !selectedModel) return;

    const vehicle = vehicles.find(
      v => v.Marca === selectedBrand && v.Modelo === selectedModel
    );

    if (!vehicle) return;

    pvpField.textContent = `$${Number(vehicle.PVP).toLocaleString("es-EC")}`;
    vehicleTypeField.textContent = vehicle.TipoVehiculo;
  });

});
