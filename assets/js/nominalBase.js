/* =========================================================
 Archivo       : nominalBase.js
 Descripción   : Configuración de base nominal de cálculo
                 de tasas de interés (360 / 365 días)
========================================================= */

window.NOMINAL_BASE = {
  DAYS_IN_YEAR: 360, // cambiar a 365 si se requiere
  DAYS_IN_MONTH: 30  // estándar bancario
};

function getTasaMensualNominal(tasaAnual) {
  if (!tasaAnual) return 0;

  return tasaAnual * (
    window.NOMINAL_BASE.DAYS_IN_MONTH /
    window.NOMINAL_BASE.DAYS_IN_YEAR
  );
}
