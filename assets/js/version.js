/* =========================================================
 Proyecto      : Cotizador de Vehículos Teojama
 Archivo       : version.js
 Versión       : V 2.0
 Compilación   : 1.16
 Estado        : ESTABLE
 Descripción   : Control centralizado de versión de la app
========================================================= */

const APP_VERSION = "V 2.0 · Compilación 1.38";

/* Inyecta versión en todos los elementos .app-version */
document.addEventListener("DOMContentLoaded", () => {
  document
    .querySelectorAll(".app-version")
    .forEach(el => el.textContent = APP_VERSION);
});

7
