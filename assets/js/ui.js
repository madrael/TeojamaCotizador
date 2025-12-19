// ui.js
// UI del cotizador – Vehículo (con filtro por tipo)

import { getVehicles } from "./dataLoader.js";

document.addEventListener("DOMContentLoaded", async () => {

  const typeSelect = document.getElementById("vehicle-type-select");
  const brandSelect = document.getElementById("brand");
  const modelSelect = document.getElementById("model");
  const pvpField = document.getElementById("pvp");
  const vehicleTypeField = document.getElementById("vehicle-type");

  const vehicles = await getVehicles();

  // =========================
  // Cambio de tipo de vehículo
  // =========================
  typeSelect.addEventListener("change", () => {
    const selectedType = typeSelect.value;

    brandSelect.innerHTML = `<option value="">Seleccione marca</option>`;
    modelSelect.innerHTML = `<option value="">Seleccione modelo</option>`;
    pvpField.textContent = "-";
    vehicleTypeField.textContent = "-";

    brandSelect.disabled = true;
    modelSelect.disabled = true;

    if (!selectedType) return;

    const brands = [
      ...new Set(
        vehicles
          .filter(v => v.TipoVehiculo === selectedType)
          .map(v => v.Marca)
      )
    ].sort();

    brands.forEach(brand => {
      const opt = document.createElement("option");
      opt.value = brand;
      opt.textContent = brand;
      brandSelect.appendChild(opt);
    });

    brandSelect.disabled = false;
  });

  // =========================
  // Cambio de marca
  // =========================
  brandSelect.addEventListener("change", () => {
    const selectedType = typeSelect.value;
    const selectedBrand = brandSelect.value;

    modelSelect.innerHTML = `<option value="">Seleccione modelo</option>`;
    pvpField.textContent = "-";
    vehicleTypeField.textContent = "-";

    modelSelect.disabled = true;

    if (!selectedBrand) return;

    const models = vehicles.filter(
      v =>
        v.TipoVehiculo === selectedType &&
        v.Marca === selectedBrand
    );

    models.forEach(v => {
      const opt = document.createElement("option");
      opt.value = v.Modelo;
      opt.textContent = `${v.Modelo} ${v["Version Modelo"]}`;
      modelSelect.appendChild(opt);
    });

    modelSelect.disabled = false;
  });

  // =========================
  // Cambio de modelo
  // =========================
  modelSelect.addEventListener("change", () => {
    const selectedType = typeSelect.value;
    const selectedBrand = brandSelect.value;
    const selectedModel = modelSelect.value;

    if (!selectedModel) return;

    const vehicle = vehicles.find(
      v =>
        v.TipoVehiculo === selectedType &&
        v.Marca === selectedBrand &&
        v.Modelo === selectedModel
    );

    if (!vehicle) return;

    pvpField.textContent = `$${Number(vehicle.PVP).toLocaleString("es-EC")}`;
    vehicleTypeField.textContent = vehicle.TipoVehiculo;
  });

});
