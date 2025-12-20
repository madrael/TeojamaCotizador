function calcularFinanciamiento({
  montoFinanciar,
  tasaAnual,
  plazoMeses
}) {
  const tasaMensual = (tasaAnual / 100) / 12;

  const cuota =
    (montoFinanciar * tasaMensual) /
    (1 - Math.pow(1 + tasaMensual, -plazoMeses));

  const totalPagado = cuota * plazoMeses;
  const intereses = totalPagado - montoFinanciar;

  return {
    cuotaMensual: cuota,
    totalPagado,
    intereses
  };
}
