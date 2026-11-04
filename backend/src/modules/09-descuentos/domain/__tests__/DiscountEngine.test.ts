import { describe, expect, it } from 'vitest';
import { DiscountEngine, type LineaCalculoDescuento } from '../DiscountEngine.js';

describe('DiscountEngine - Motor Canónico de Descuentos (RN-DES-01 a 09, CA-19 a 25)', () => {
  it('1. Prorrateo exacto oficial CA-20 ($1.000 COP sobre 3 líneas de $10.000 COP -> 333, 333, 334)', () => {
    const lineas: LineaCalculoDescuento[] = [
      { id: 'item-1', cantidad: 1, precioUnitarioBaseCop: 10000, esElegible: true },
      { id: 'item-2', cantidad: 1, precioUnitarioBaseCop: 10000, esElegible: true },
      { id: 'item-3', cantidad: 1, precioUnitarioBaseCop: 10000, esElegible: true },
    ];

    const resultado = DiscountEngine.calcular(lineas, {
      tipo: 'VALOR_FIJO',
      valor: 1000,
      esAdmin: true,
    });

    expect(resultado.subtotalGeneralCop).toBe(30000);
    expect(resultado.subtotalElegibleCop).toBe(30000);
    expect(resultado.descuentoTotalAplicadoCop).toBe(1000);
    expect(resultado.totalNetoPagarCop).toBe(29000);

    // Verificación exacta por línea (CA-20: residuo a la última línea elegible)
    expect(resultado.lineas[0]?.descuentoProrrateadoCop).toBe(333);
    expect(resultado.lineas[0]?.precioNetoTotalCop).toBe(9667);

    expect(resultado.lineas[1]?.descuentoProrrateadoCop).toBe(333);
    expect(resultado.lineas[1]?.precioNetoTotalCop).toBe(9667);

    expect(resultado.lineas[2]?.descuentoProrrateadoCop).toBe(334);
    expect(resultado.lineas[2]?.precioNetoTotalCop).toBe(9666);

    // Suma cuadra al centavo entero
    const sumaDescuentos = resultado.lineas.reduce((acc, l) => acc + l.descuentoProrrateadoCop, 0);
    const sumaNetos = resultado.lineas.reduce((acc, l) => acc + l.precioNetoTotalCop, 0);

    expect(sumaDescuentos).toBe(1000);
    expect(sumaNetos).toBe(29000);
  });

  it('2. Promoción de valor fijo mayor al subtotal elegible se trunca a $0 COP (CA-25, RN-DES-07)', () => {
    const lineas: LineaCalculoDescuento[] = [
      { id: 'item-1', cantidad: 1, precioUnitarioBaseCop: 15000, esElegible: true },
      { id: 'item-2', cantidad: 1, precioUnitarioBaseCop: 15000, esElegible: true },
    ];

    // Descuento de $50.000 COP sobre $30.000 COP elegible
    const resultado = DiscountEngine.calcular(lineas, {
      tipo: 'VALOR_FIJO',
      valor: 50000,
      esAdmin: true,
    });

    expect(resultado.subtotalGeneralCop).toBe(30000);
    expect(resultado.descuentoTotalAplicadoCop).toBe(30000); // Truncado exactamente al subtotal
    expect(resultado.totalNetoPagarCop).toBe(0); // NUNCA negativo

    expect(resultado.lineas[0]?.precioNetoTotalCop).toBe(0);
    expect(resultado.lineas[1]?.precioNetoTotalCop).toBe(0);
  });

  it('3. Descuento porcentual (20% sobre $100.000 COP)', () => {
    const lineas: LineaCalculoDescuento[] = [
      { id: 'camisa', cantidad: 2, precioUnitarioBaseCop: 25000, esElegible: true }, // $50.000
      { id: 'pantalon', cantidad: 1, precioUnitarioBaseCop: 50000, esElegible: true }, // $50.000
    ];

    const resultado = DiscountEngine.calcular(lineas, {
      tipo: 'PORCENTAJE',
      valor: 20,
      esAdmin: true,
    });

    expect(resultado.subtotalGeneralCop).toBe(100000);
    expect(resultado.descuentoTotalAplicadoCop).toBe(20000);
    expect(resultado.totalNetoPagarCop).toBe(80000);

    expect(resultado.lineas[0]?.descuentoProrrateadoCop).toBe(10000);
    expect(resultado.lineas[0]?.precioNetoTotalCop).toBe(40000);

    expect(resultado.lineas[1]?.descuentoProrrateadoCop).toBe(10000);
    expect(resultado.lineas[1]?.precioNetoTotalCop).toBe(40000);
  });

  it('4. Prorrateo con líneas NO elegibles (los cosméticos no absorben descuento)', () => {
    const lineas: LineaCalculoDescuento[] = [
      { id: 'ropa-1', cantidad: 1, precioUnitarioBaseCop: 20000, esElegible: true },
      { id: 'ropa-2', cantidad: 1, precioUnitarioBaseCop: 20000, esElegible: true },
      { id: 'labial-cosmetico', cantidad: 1, precioUnitarioBaseCop: 30000, esElegible: false },
    ];

    // Descuento fijo de $10.000 COP solo aplicable a prendas elegibles
    const resultado = DiscountEngine.calcular(lineas, {
      tipo: 'VALOR_FIJO',
      valor: 10000,
      esAdmin: true,
    });

    expect(resultado.subtotalGeneralCop).toBe(70000);
    expect(resultado.subtotalElegibleCop).toBe(40000);
    expect(resultado.descuentoTotalAplicadoCop).toBe(10000);
    expect(resultado.totalNetoPagarCop).toBe(60000);

    // Las dos líneas de ropa absorben $5.000 c/u
    expect(resultado.lineas[0]?.descuentoProrrateadoCop).toBe(5000);
    expect(resultado.lineas[0]?.precioNetoTotalCop).toBe(15000);

    expect(resultado.lineas[1]?.descuentoProrrateadoCop).toBe(5000);
    expect(resultado.lineas[1]?.precioNetoTotalCop).toBe(15000);

    // El cosmético no recibe descuento (paga $30.000 neto completo)
    expect(resultado.lineas[2]?.descuentoProrrateadoCop).toBe(0);
    expect(resultado.lineas[2]?.precioNetoTotalCop).toBe(30000);
  });

  it('5. Validación de tope de vendedor en POS (CA-23, RN-DES-05) rechaza si se supera', () => {
    const lineas: LineaCalculoDescuento[] = [
      { id: 'item-1', cantidad: 1, precioUnitarioBaseCop: 100000, esElegible: true },
    ];

    // Vendedor con tope del 10% intenta aplicar 15%
    expect(() => {
      DiscountEngine.calcular(lineas, {
        tipo: 'PORCENTAJE',
        valor: 15,
        topeMaximoPorcentaje: 10,
        esAdmin: false,
      });
    }).toThrow(/supera el tope máximo permitido/i);

    // Vendedor con tope del 10% intenta aplicar monto fijo de $15.000 (15%)
    expect(() => {
      DiscountEngine.calcular(lineas, {
        tipo: 'VALOR_FIJO',
        valor: 15000,
        topeMaximoPorcentaje: 10,
        esAdmin: false,
      });
    }).toThrow(/supera el tope máximo permitido/i);
  });

  it('6. Administrador puede superar topes de vendedor sin restricción', () => {
    const lineas: LineaCalculoDescuento[] = [
      { id: 'item-1', cantidad: 1, precioUnitarioBaseCop: 100000, esElegible: true },
    ];

    // Admin aplica 25% aunque haya un tope de 10% asignado al contexto
    const resultado = DiscountEngine.calcular(lineas, {
      tipo: 'PORCENTAJE',
      valor: 25,
      topeMaximoPorcentaje: 10,
      esAdmin: true,
    });

    expect(resultado.descuentoTotalAplicadoCop).toBe(25000);
    expect(resultado.totalNetoPagarCop).toBe(75000);
  });

  it('7. Rechazo de montos no enteros o negativos (RN-GEN-04)', () => {
    const lineasConDecimal: LineaCalculoDescuento[] = [
      { id: 'item-1', cantidad: 1, precioUnitarioBaseCop: 10000.5, esElegible: true },
    ];

    expect(() => {
      DiscountEngine.calcular(lineasConDecimal);
    }).toThrow(/debe ser un número entero/i);

    const lineasNormales: LineaCalculoDescuento[] = [
      { id: 'item-1', cantidad: 1, precioUnitarioBaseCop: 10000, esElegible: true },
    ];

    expect(() => {
      DiscountEngine.calcular(lineasNormales, {
        tipo: 'VALOR_FIJO',
        valor: 500.5, // decimal no permitido
        esAdmin: true,
      });
    }).toThrow(/debe ser un número entero/i);
  });

  it('8. Sin descuento solicitado o valor 0 retorna totales base limpios', () => {
    const lineas: LineaCalculoDescuento[] = [
      { id: 'item-1', cantidad: 2, precioUnitarioBaseCop: 20000, esElegible: true },
    ];

    const sinSolicitud = DiscountEngine.calcular(lineas);
    expect(sinSolicitud.descuentoTotalAplicadoCop).toBe(0);
    expect(sinSolicitud.totalNetoPagarCop).toBe(40000);

    const conValorCero = DiscountEngine.calcular(lineas, {
      tipo: 'VALOR_FIJO',
      valor: 0,
      esAdmin: true,
    });
    expect(conValorCero.descuentoTotalAplicadoCop).toBe(0);
    expect(conValorCero.totalNetoPagarCop).toBe(40000);
  });
});
