/* =========================================================
 Proyecto      : Cotizador de Vehículos Teojama
 Archivo       : version.js
 Versión       : V 1.0
 Compilación   : 3.23
 Estado        : ESTABLE
 Descripción   : Control centralizado de versión de la app
========================================================= */

const APP_VERSION = "V 1.0 · Compilación 3.23.31";

/* Inyecta versión en todos los elementos .app-version */
document.addEventListener("DOMContentLoaded", () => {
  document
    .querySelectorAll(".app-version")
    .forEach(el => el.textContent = APP_VERSION);
});
