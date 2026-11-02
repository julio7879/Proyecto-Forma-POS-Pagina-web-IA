import { describe, it, expect } from 'vitest';
import { MoneyCOP } from '../MoneyCOP.js';

describe('MoneyCOP', () => {
  it('valida enteros no negativos correctamente', () => {
    expect(MoneyCOP.assertEnteroNoNegativo(15000)).toBe(15000);
    expect(MoneyCOP.assertEnteroNoNegativo(0)).toBe(0);
    expect(() => MoneyCOP.assertEnteroNoNegativo(150.5)).toThrow();
    expect(() => MoneyCOP.assertEnteroNoNegativo(-100)).toThrow();
  });

  it('calcula descuento porcentual redondeando hacia arriba (RN-DES-08)', () => {
    // 15.000 con 10% = 1.500
    expect(MoneyCOP.calcularDescuentoPorcentual(15000, 10)).toBe(1500);
    // 15.005 con 10% = 1500.5 -> 1501
    expect(MoneyCOP.calcularDescuentoPorcentual(15005, 10)).toBe(1501);
  });

  it('prorratea descuentos asignando el residuo a la última línea elegible (RN-DES-09, CA-20)', () => {
    // Descuento total: 10.000 COP entre 3 líneas de 30.000 cada una (total 90.000)
    // 10000 * 30000 / 90000 = 3333.33 -> Math.floor = 3333
    // Línea 1: 3333, Línea 2: 3333, Línea 3 (residuo): 10000 - 6666 = 3334
    const partes = MoneyCOP.prorratearDescuentoPorLinea(10000, [30000, 30000, 30000]);
    expect(partes).toEqual([3333, 3333, 3334]);
    expect(partes.reduce((a, b) => a + b, 0)).toBe(10000);
  });

  it('calcula reembolso exacto protegiendo saldos de la línea (RN-DEV-07, CA-26)', () => {
    // 2 unidades vendidas por 50.000 total neto.
    // Devolución 1ra unidad: 25.000
    const dev1 = MoneyCOP.calcularReembolsoDevolucionLinea({
      netoPagadoLineaCop: 50000,
      cantidadVendida: 2,
      cantidadDevueltaPrevia: 0,
      reembolsadoAcumuladoPrevioCop: 0,
      cantidadADevolverAhora: 1,
    });
    expect(dev1).toBe(25000);

    // Devolución 2da unidad (final): devuelve exactamente el saldo pendiente
    const dev2 = MoneyCOP.calcularReembolsoDevolucionLinea({
      netoPagadoLineaCop: 50000,
      cantidadVendida: 2,
      cantidadDevueltaPrevia: 1,
      reembolsadoAcumuladoPrevioCop: 25000,
      cantidadADevolverAhora: 1,
    });
    expect(dev2).toBe(25000);
  });

  it('calcula efectivo esperado considerando sangrias, gastos menores e ingresos (RN-CAJ-06)', () => {
    // Base contada: 200.000
    // Ventas efectivo: 1.500.000
    // Reembolsos devueltos en efectivo: 50.000
    // Sangría / retiro a caja fuerte: 1.000.000
    // Gasto menor (aseo): 20.000
    // Ingreso manual sencillo: 30.000
    // Esperado: 200.000 + 1.500.000 - 50.000 - 1.000.000 - 20.000 + 30.000 = 660.000
    const esperado = MoneyCOP.calcularEfectivoEsperadoSesion({
      baseContadaCop: 200000,
      ventasEfectivoCop: 1500000,
      reembolsosEfectivoCop: 50000,
      sangriasRetirosCop: 1000000,
      gastosMenoresCop: 20000,
      ingresosManualesCop: 30000,
    });
    expect(esperado).toBe(660000);
  });

  it('calcula efectivo a entregar al cierre de caja sin arrojar valores negativos (RN-CAJ-10)', () => {
    // Caso 1: Efectivo contado 660.000, base configurada 200.000 -> entrega 460.000
    expect(MoneyCOP.calcularEfectivoAEntregar(660000, 200000)).toBe(460000);

    // Caso 2: Efectivo contado 180.000 (descuadre menor a la base), base configurada 200.000 -> entrega 0 (max(0, -20.000))
    expect(MoneyCOP.calcularEfectivoAEntregar(180000, 200000)).toBe(0);
  });
});
