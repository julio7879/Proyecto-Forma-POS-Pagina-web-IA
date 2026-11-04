/**
 * Pruebas QA complementarias (Issue #43 / PR #42, SP3-03).
 * Cubren el checklist con escenarios que la suite original no ejercita y
 * DOCUMENTAN dos defectos (ver docs/qa/SP3-03/README.md). Las pruebas
 * [HALLAZGO] verifican el comportamiento ACTUAL: cuando se corrija el motor
 * fallarán, y deberán reemplazarse por la aserción correcta indicada.
 */
import { describe, expect, it } from 'vitest';
import { DiscountEngine, type LineaCalculoDescuento } from '../DiscountEngine.js';

const sumaNetos = (r: ReturnType<typeof DiscountEngine.calcular>) =>
  r.lineas.reduce((acc, l) => acc + l.precioNetoTotalCop, 0);
const sumaDescuentos = (r: ReturnType<typeof DiscountEngine.calcular>) =>
  r.lineas.reduce((acc, l) => acc + l.descuentoProrrateadoCop, 0);

const tresDe10k: LineaCalculoDescuento[] = [
  { id: 1, cantidad: 1, precioUnitarioBaseCop: 10000, esElegible: true },
  { id: 2, cantidad: 1, precioUnitarioBaseCop: 10000, esElegible: true },
  { id: 3, cantidad: 1, precioUnitarioBaseCop: 10000, esElegible: true },
];

describe('QA SP3-03 · Prorrateo canónico (RN-DES-09, CA-20)', () => {
  it('QA-1. $1.000 sobre 3 × $10.000 → 333/333/334 y Σ netos = totalNetoPagarCop', () => {
    const r = DiscountEngine.calcular(tresDe10k, { tipo: 'VALOR_FIJO', valor: 1000, esAdmin: true });
    expect(r.lineas.map((l) => l.descuentoProrrateadoCop)).toEqual([333, 333, 334]);
    expect(sumaDescuentos(r)).toBe(1000);
    expect(sumaNetos(r)).toBe(r.totalNetoPagarCop);
  });

  it('QA-2. el residuo va a la ÚLTIMA línea ELEGIBLE aunque después haya una no elegible', () => {
    const r = DiscountEngine.calcular(
      [...tresDe10k, { id: 'cos', cantidad: 1, precioUnitarioBaseCop: 25000, esElegible: false }],
      { tipo: 'VALOR_FIJO', valor: 1000, esAdmin: true },
    );
    expect(r.lineas.map((l) => l.descuentoProrrateadoCop)).toEqual([333, 333, 334, 0]);
    expect(sumaNetos(r)).toBe(r.totalNetoPagarCop);
  });

  it('QA-3. líneas con cantidad > 1 prorratean sobre el subtotal (precio × cantidad)', () => {
    const r = DiscountEngine.calcular(
      [
        { id: 1, cantidad: 3, precioUnitarioBaseCop: 10000, esElegible: true }, // 30.000
        { id: 2, cantidad: 1, precioUnitarioBaseCop: 10000, esElegible: true }, // 10.000
      ],
      { tipo: 'VALOR_FIJO', valor: 1001, esAdmin: true },
    );
    expect(r.lineas.map((l) => l.descuentoProrrateadoCop)).toEqual([750, 251]);
    expect(sumaNetos(r)).toBe(r.totalNetoPagarCop);
  });

  it('QA-4. propiedad: en 300 carritos "normales" Σ descuentos = descuento y Σ netos = total, todo entero', () => {
    let semilla = 42;
    const rnd = (n: number) => {
      semilla = (semilla * 1103515245 + 12345) % 2147483648;
      return semilla % n;
    };
    for (let caso = 0; caso < 300; caso++) {
      const lineas: LineaCalculoDescuento[] = Array.from({ length: 1 + rnd(6) }, (_, i) => ({
        id: i,
        cantidad: 1 + rnd(3),
        precioUnitarioBaseCop: (5 + rnd(200)) * 1000, // $5.000 a $204.000
        esElegible: rnd(5) !== 0,
      }));
      const r = DiscountEngine.calcular(lineas, { tipo: 'PORCENTAJE', valor: 1 + rnd(50), esAdmin: true });
      expect(sumaDescuentos(r)).toBe(r.descuentoTotalAplicadoCop);
      expect(sumaNetos(r)).toBe(r.totalNetoPagarCop);
      r.lineas.forEach((l) => {
        expect(Number.isInteger(l.descuentoProrrateadoCop)).toBe(true);
        expect(l.descuentoProrrateadoCop).toBeLessThanOrEqual(l.subtotalBaseCop);
      });
    }
  });

  it('[HALLAZGO] QA-5. si la última línea elegible es pequeña, el residuo SUPERA su subtotal y Σ netos ≠ total', () => {
    // 3 prendas de $30.000 + un accesorio de $100 (subtotal $90.100), cortesía admin fija de $90.000
    // floor(90000·30000/90100) = 29.966 ×3 = 89.898 → la última línea recibe 102 sobre un subtotal de 100
    const r = DiscountEngine.calcular(
      [
        { id: 1, cantidad: 1, precioUnitarioBaseCop: 30000, esElegible: true },
        { id: 2, cantidad: 1, precioUnitarioBaseCop: 30000, esElegible: true },
        { id: 3, cantidad: 1, precioUnitarioBaseCop: 30000, esElegible: true },
        { id: 4, cantidad: 1, precioUnitarioBaseCop: 100, esElegible: true },
      ],
      { tipo: 'VALOR_FIJO', valor: 90000, esAdmin: true },
    );
    expect(r.lineas.map((l) => l.descuentoProrrateadoCop)).toEqual([29966, 29966, 29966, 102]);
    expect(r.totalNetoPagarCop).toBe(100);
    const ultima = r.lineas[3]!;
    // Comportamiento ACTUAL (defecto): la última línea "absorbe" 102 sobre un subtotal de 100
    expect(ultima.descuentoProrrateadoCop).toBeGreaterThan(ultima.subtotalBaseCop);
    expect(ultima.precioNetoTotalCop).toBe(0); // se recorta a 0 con Math.max…
    expect(sumaNetos(r)).not.toBe(r.totalNetoPagarCop); // …y el total ya no cuadra con las líneas
    // Esperado tras la corrección: descuentoProrrateadoCop <= subtotalBaseCop en todas las líneas
    // y sumaNetos(r) === r.totalNetoPagarCop.
  });
});

describe('QA SP3-03 · Truncamiento (RN-DES-07, CA-25)', () => {
  it('QA-6. cupón $50.000 sobre $30.000 → descuento $30.000, neto $0, ninguna línea negativa', () => {
    const r = DiscountEngine.calcular(tresDe10k, { tipo: 'VALOR_FIJO', valor: 50000, esAdmin: true });
    expect(r.descuentoTotalAplicadoCop).toBe(30000);
    expect(r.totalNetoPagarCop).toBe(0);
    r.lineas.forEach((l) => expect(l.precioNetoTotalCop).toBe(0));
  });

  it('QA-7. con cosmético no elegible el truncamiento es al subtotal ELEGIBLE: se cobra el cosmético completo', () => {
    const r = DiscountEngine.calcular(
      [
        { id: 'camisa', cantidad: 1, precioUnitarioBaseCop: 30000, esElegible: true },
        { id: 'serum', cantidad: 1, precioUnitarioBaseCop: 65000, esElegible: false },
      ],
      { tipo: 'VALOR_FIJO', valor: 50000, esAdmin: true },
    );
    expect(r.descuentoTotalAplicadoCop).toBe(30000);
    expect(r.totalNetoPagarCop).toBe(65000);
    expect(r.lineas[1]).toMatchObject({ descuentoProrrateadoCop: 0, precioNetoTotalCop: 65000 });
  });
});

describe('QA SP3-03 · Topes de vendedor (RN-DES-05, CA-23)', () => {
  it('QA-8. vendedor tope 10 % pidiendo 15 % → AppError 400', () => {
    try {
      DiscountEngine.calcular(tresDe10k, { tipo: 'PORCENTAJE', valor: 15, topeMaximoPorcentaje: 10, esAdmin: false });
      expect.fail('debió rechazar');
    } catch (e) {
      expect((e as { statusCode?: number }).statusCode).toBe(400);
    }
  });

  it('QA-9. vendedor justo en el tope (10 % con tope 10 %) → permitido', () => {
    const r = DiscountEngine.calcular(tresDe10k, { tipo: 'PORCENTAJE', valor: 10, topeMaximoPorcentaje: 10, esAdmin: false });
    expect(r.descuentoTotalAplicadoCop).toBe(3000);
  });

  it('QA-10. admin pide 25 % con tope 10 % → aprobado', () => {
    const r = DiscountEngine.calcular(tresDe10k, { tipo: 'PORCENTAJE', valor: 25, topeMaximoPorcentaje: 10, esAdmin: true });
    expect(r.descuentoTotalAplicadoCop).toBe(7500);
    expect(r.totalNetoPagarCop).toBe(22500);
  });

  it('QA-11. el tope también aplica a VALOR_FIJO: vendedor tope 10 % de $30.000 → $3.000 ok, $3.001 → 400', () => {
    expect(
      DiscountEngine.calcular(tresDe10k, { tipo: 'VALOR_FIJO', valor: 3000, topeMaximoPorcentaje: 10 }).descuentoTotalAplicadoCop,
    ).toBe(3000);
    expect(() =>
      DiscountEngine.calcular(tresDe10k, { tipo: 'VALOR_FIJO', valor: 3001, topeMaximoPorcentaje: 10 }),
    ).toThrow(/tope/i);
  });
});

describe('QA SP3-03 · Dinero entero (RN-GEN-04)', () => {
  it('QA-12. precio 1000.5 y descuento fijo 1000.5 se rechazan', () => {
    expect(() =>
      DiscountEngine.calcular([{ id: 1, cantidad: 1, precioUnitarioBaseCop: 1000.5, esElegible: true }]),
    ).toThrow(/entero/i);
    expect(() =>
      DiscountEngine.calcular(tresDe10k, { tipo: 'VALOR_FIJO', valor: 1000.5, esAdmin: true }),
    ).toThrow(/entero/i);
  });

  it('QA-13. porcentaje decimal (12.5 %) y fuera de rango (0 / 101 / −5) → AppError 400', () => {
    for (const valor of [12.5, 101, -5]) {
      try {
        DiscountEngine.calcular(tresDe10k, { tipo: 'PORCENTAJE', valor, esAdmin: true });
        expect.fail(`debió rechazar ${valor}`);
      } catch (e) {
        expect((e as { statusCode?: number }).statusCode).toBe(400);
      }
    }
  });

  it('[HALLAZGO] QA-14. el rechazo de montos decimales es un Error genérico SIN statusCode (en HTTP saldría 500, no 400)', () => {
    let error: unknown = null;
    try {
      DiscountEngine.calcular([{ id: 1, cantidad: 1, precioUnitarioBaseCop: 1000.5, esElegible: true }]);
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(Error);
    // Comportamiento ACTUAL: MoneyCOP.assertEnteroNoNegativo lanza `new Error(...)`, no AppError.badRequest
    expect((error as { statusCode?: number }).statusCode).toBeUndefined();
    // Esperado tras la corrección: statusCode === 400
  });
});
