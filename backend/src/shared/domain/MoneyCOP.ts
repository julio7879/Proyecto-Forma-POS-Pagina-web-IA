/**
 * Objeto de Valor y Utilidad Aritmética para Pesos Colombianos Enteros (RN-GEN-04, RN-DES-08, RN-DES-09, RN-DEV-07)
 * Prohibido el uso de decimales o punto flotante sin redondeo entero inmediato.
 */
export class MoneyCOP {
  /**
   * Valida que un monto sea un entero válido en COP.
   */
  static assertEnteroNoNegativo(valor: number, nombreCampo = 'monto'): number {
    if (!Number.isInteger(valor) || valor < 0) {
      throw new Error(`El campo ${nombreCampo} debe ser un número entero mayor o igual a 0 en COP. Recibido: ${valor}`);
    }
    return valor;
  }

  /**
   * Calcula un descuento porcentual redondeando la mitad hacia arriba (RN-DES-08).
   */
  static calcularDescuentoPorcentual(baseElegibleCop: number, porcentajeEntero: number): number {
    this.assertEnteroNoNegativo(baseElegibleCop, 'baseElegibleCop');
    if (!Number.isInteger(porcentajeEntero) || porcentajeEntero <= 0 || porcentajeEntero > 100) {
      throw new Error(`Porcentaje inválido: ${porcentajeEntero}. Debe ser un entero entre 1 y 100.`);
    }
    return Math.round((baseElegibleCop * porcentajeEntero) / 100);
  }

  /**
   * Prorratea un descuento total D entre múltiples líneas elegibles usando piso()
   * y asignando el residuo exacto a la última línea elegible (RN-DES-09, CA-20).
   */
  static prorratearDescuentoPorLinea(descuentoTotalCop: number, subtotalesElegiblesCop: number[]): number[] {
    this.assertEnteroNoNegativo(descuentoTotalCop, 'descuentoTotalCop');
    if (subtotalesElegiblesCop.length === 0 || descuentoTotalCop === 0) {
      return subtotalesElegiblesCop.map(() => 0);
    }

    const baseTotalElegible = subtotalesElegiblesCop.reduce((acc, val) => acc + val, 0);
    if (baseTotalElegible <= 0) {
      return subtotalesElegiblesCop.map(() => 0);
    }

    const descuentoEfectivo = Math.min(descuentoTotalCop, baseTotalElegible);
    const partes: number[] = [];
    let sumaAcumulada = 0;

    for (let i = 0; i < subtotalesElegiblesCop.length; i++) {
      if (i === subtotalesElegiblesCop.length - 1) {
        // El residuo va exactamente a la última línea elegible (CA-20)
        partes.push(descuentoEfectivo - sumaAcumulada);
      } else {
        const subtotal = subtotalesElegiblesCop[i] ?? 0;
        const parte = Math.floor((descuentoEfectivo * subtotal) / baseTotalElegible);
        partes.push(parte);
        sumaAcumulada += parte;
      }
    }
    return partes;
  }

  /**
   * Calcula el monto exacto a reembolsar en una devolución parcial o final de una línea (RN-DEV-07, CA-26).
   * Si se devuelve el resto completo de unidades de la línea, entrega exactamente el saldo restante.
   */
  static calcularReembolsoDevolucionLinea(params: {
    netoPagadoLineaCop: number;
    cantidadVendida: number;
    cantidadDevueltaPrevia: number;
    reembolsadoAcumuladoPrevioCop: number;
    cantidadADevolverAhora: number;
  }): number {
    const {
      netoPagadoLineaCop,
      cantidadVendida,
      cantidadDevueltaPrevia,
      reembolsadoAcumuladoPrevioCop,
      cantidadADevolverAhora,
    } = params;

    if (cantidadADevolverAhora <= 0 || cantidadDevueltaPrevia + cantidadADevolverAhora > cantidadVendida) {
      throw new Error('La cantidad a devolver supera las unidades disponibles para devolución en esta línea (RN-DEV-06).');
    }

    const esUltimaDevolucionDeLaLinea = (cantidadDevueltaPrevia + cantidadADevolverAhora) === cantidadVendida;
    if (esUltimaDevolucionDeLaLinea) {
      return Math.max(0, netoPagadoLineaCop - reembolsadoAcumuladoPrevioCop);
    }

    return Math.round((netoPagadoLineaCop / cantidadVendida) * cantidadADevolverAhora);
  }

  /**
   * Calcula el efectivo esperado de una sesión de caja incluyendo sangrías, gastos menores e ingresos manuales (RN-CAJ-06).
   */
  static calcularEfectivoEsperadoSesion(params: {
    baseContadaCop: number;
    ventasEfectivoCop: number;
    reembolsosEfectivoCop: number;
    sangriasRetirosCop: number;
    gastosMenoresCop: number;
    ingresosManualesCop: number;
  }): number {
    const {
      baseContadaCop,
      ventasEfectivoCop,
      reembolsosEfectivoCop,
      sangriasRetirosCop,
      gastosMenoresCop,
      ingresosManualesCop,
    } = params;

    this.assertEnteroNoNegativo(baseContadaCop, 'baseContadaCop');
    this.assertEnteroNoNegativo(ventasEfectivoCop, 'ventasEfectivoCop');
    this.assertEnteroNoNegativo(reembolsosEfectivoCop, 'reembolsosEfectivoCop');
    this.assertEnteroNoNegativo(sangriasRetirosCop, 'sangriasRetirosCop');
    this.assertEnteroNoNegativo(gastosMenoresCop, 'gastosMenoresCop');
    this.assertEnteroNoNegativo(ingresosManualesCop, 'ingresosManualesCop');

    const totalIngresos = baseContadaCop + ventasEfectivoCop + ingresosManualesCop;
    const totalEgresos = reembolsosEfectivoCop + sangriasRetirosCop + gastosMenoresCop;

    return totalIngresos - totalEgresos;
  }

  /**
   * Calcula el efectivo a entregar al cierre de caja garantizando que no sea negativo (RN-CAJ-10).
   * efectivoAEntregar = max(0, efectivoContadoCierreCop - baseConfiguradaCop)
   */
  static calcularEfectivoAEntregar(efectivoContadoCierreCop: number, baseConfiguradaCop: number): number {
    this.assertEnteroNoNegativo(efectivoContadoCierreCop, 'efectivoContadoCierreCop');
    this.assertEnteroNoNegativo(baseConfiguradaCop, 'baseConfiguradaCop');
    return Math.max(0, efectivoContadoCierreCop - baseConfiguradaCop);
  }
}
