/**
 * Pruebas QA complementarias de dominio (Issue #48 / PR #47, SP4-01).
 * DaneShippingCalculator y OrderAssignmentEngine son dominio puro: no requieren BD.
 * Cubren casos del checklist que checkoutDANE.test.ts no ejercita (desempate por ID,
 * sedes inactivas, excepción vs zona en el desempate, carrito repartido, etc.).
 */
import { describe, expect, it } from 'vitest';
import {
  DaneShippingCalculator,
  TARIFAS_ZONAS_DEFAULT,
  type InfoMunicipioDane,
} from '../domain/DaneShippingCalculator.js';
import { OrderAssignmentEngine, type EvaluacionSede } from '../domain/OrderAssignmentEngine.js';

const mun = (codigoDane: string, departamentoId: string, regionId: number, atendidoWeb = true): InfoMunicipioDane => ({
  codigoDane,
  departamentoId,
  regionId,
  atendidoWeb,
});

const CUCUTA = mun('54001', '54', 1);
const OCANA = mun('54498', '54', 1);
const BUCARAMANGA = mun('68001', '68', 1);
const BOGOTA = mun('11001', '11', 2);
const SIN_COBERTURA = mun('99999', '99', 9, false);

const sede = (
  id: number,
  municipioDane: InfoMunicipioDane,
  stock: Record<number, number>,
  extra: Partial<EvaluacionSede> = {},
): EvaluacionSede => ({
  id,
  nombre: `Sede ${id}`,
  activa: true,
  despachaWeb: true,
  prioridadDespacho: 100,
  municipioDane,
  saldos: new Map(
    Object.entries(stock).map(([v, d]) => [Number(v), { varianteId: Number(v), disponible: d, bloqueadoDespachoWeb: false }]),
  ),
  ...extra,
});

const statusDe = (fn: () => unknown) => {
  try {
    fn();
  } catch (e) {
    return (e as { statusCode?: number }).statusCode;
  }
  return 'SIN_ERROR';
};

describe('QA SP4-01 · Zonas DANE (RF-WEB-02)', () => {
  const casosZona: Array<{ n: string; origen: InfoMunicipioDane; destino: InfoMunicipioDane; zona: number; tarifa: number }> = [
    { n: 'Zona 1 · mismo municipio', origen: CUCUTA, destino: CUCUTA, zona: 1, tarifa: 8000 },
    { n: 'Zona 2 · mismo departamento', origen: CUCUTA, destino: OCANA, zona: 2, tarifa: 12000 },
    { n: 'Zona 3 · misma región', origen: CUCUTA, destino: BUCARAMANGA, zona: 3, tarifa: 16000 },
    { n: 'Zona 4 · otra región', origen: CUCUTA, destino: BOGOTA, zona: 4, tarifa: 22000 },
  ];
  for (const c of casosZona) {
    it(c.n, () => {
      expect(DaneShippingCalculator.calcular(c.origen, c.destino)).toMatchObject({
        zona: c.zona,
        tarifaCop: c.tarifa,
        esExcepcion: false,
      });
    });
  }

  it('QA-1. las 4 tarifas por defecto son enteros COP (RN-GEN-04)', () => {
    Object.values(TARIFAS_ZONAS_DEFAULT).forEach((t) => expect(Number.isInteger(t.tarifaCop)).toBe(true));
  });

  it('QA-2. la excepción es DIRECCIONAL: Cúcuta→Bogotá no aplica a Bogotá→Cúcuta', () => {
    const exc = [{ municipioOrigenId: '54001', municipioDestinoId: '11001', tarifaCop: 9000, diasEstimados: 2 }];
    expect(DaneShippingCalculator.calcular(CUCUTA, BOGOTA, exc)).toMatchObject({ zona: 0, tarifaCop: 9000, esExcepcion: true });
    expect(DaneShippingCalculator.calcular(BOGOTA, CUCUTA, exc)).toMatchObject({ zona: 4, tarifaCop: 22000 });
  });

  it('QA-3. CA-37 tiene prioridad sobre la excepción: destino sin cobertura → 422 aunque exista excepción', () => {
    const exc = [{ municipioOrigenId: '54001', municipioDestinoId: '99999', tarifaCop: 1000, diasEstimados: 1 }];
    expect(statusDe(() => DaneShippingCalculator.calcular(CUCUTA, SIN_COBERTURA, exc))).toBe(422);
  });
});

describe('QA SP4-01 · Asignación de sede (CA-35, CA-36)', () => {
  const carrito = [{ varianteId: 1, cantidad: 2 }];

  it('QA-4. CA-36 nivel 3: misma tarifa y misma prioridad → gana el MENOR ID', () => {
    const r = OrderAssignmentEngine.seleccionarSedeDespacho(carrito, CUCUTA, [
      sede(9, CUCUTA, { 1: 5 }, { prioridadDespacho: 10 }),
      sede(4, CUCUTA, { 1: 5 }, { prioridadDespacho: 10 }),
      sede(7, CUCUTA, { 1: 5 }, { prioridadDespacho: 10 }),
    ]);
    expect(r.sede.id).toBe(4);
  });

  it('QA-5. el orden de entrada no cambia el resultado (determinismo)', () => {
    const sedes = [
      sede(1, BOGOTA, { 1: 5 }, { prioridadDespacho: 10 }),
      sede(2, OCANA, { 1: 5 }, { prioridadDespacho: 30 }),
      sede(3, OCANA, { 1: 5 }, { prioridadDespacho: 20 }),
    ];
    const a = OrderAssignmentEngine.seleccionarSedeDespacho(carrito, CUCUTA, sedes).sede.id;
    const b = OrderAssignmentEngine.seleccionarSedeDespacho(carrito, CUCUTA, [...sedes].reverse()).sede.id;
    expect(a).toBe(3); // Zona 2 ($12.000) gana a Zona 4; entre las dos de Ocaña gana prioridad 20
    expect(b).toBe(a);
  });

  it('QA-6. la tarifa (nivel 1) manda sobre la prioridad (nivel 2): sede lejana con prioridad 1 pierde', () => {
    const r = OrderAssignmentEngine.seleccionarSedeDespacho(carrito, CUCUTA, [
      sede(1, BOGOTA, { 1: 5 }, { prioridadDespacho: 1 }),
      sede(2, CUCUTA, { 1: 5 }, { prioridadDespacho: 99 }),
    ]);
    expect(r.sede.id).toBe(2);
  });

  it('QA-7. una excepción de tarifa más barata cambia la sede ganadora', () => {
    const exc = [{ municipioOrigenId: '11001', municipioDestinoId: '54001', tarifaCop: 5000, diasEstimados: 3 }];
    const r = OrderAssignmentEngine.seleccionarSedeDespacho(
      carrito,
      CUCUTA,
      [sede(1, CUCUTA, { 1: 5 }), sede(2, BOGOTA, { 1: 5 })],
      exc,
    );
    expect(r.sede.id).toBe(2);
    expect(r.tarifaEnvio).toMatchObject({ tarifaCop: 5000, esExcepcion: true });
  });

  it('QA-8. CA-35: el carrito repartido entre sedes (A tiene v1, B tiene v2) → 409, nunca envío dividido', () => {
    const items = [
      { varianteId: 1, cantidad: 1 },
      { varianteId: 2, cantidad: 1 },
    ];
    expect(
      statusDe(() =>
        OrderAssignmentEngine.seleccionarSedeDespacho(items, CUCUTA, [sede(1, CUCUTA, { 1: 9 }), sede(2, CUCUTA, { 2: 9 })]),
      ),
    ).toBe(409);
  });

  it('QA-9. CA-35: suma entre sedes alcanza pero ninguna sola → 409', () => {
    expect(
      statusDe(() =>
        OrderAssignmentEngine.seleccionarSedeDespacho([{ varianteId: 1, cantidad: 5 }], CUCUTA, [
          sede(1, CUCUTA, { 1: 3 }),
          sede(2, CUCUTA, { 1: 3 }),
        ]),
      ),
    ).toBe(409);
  });

  it('QA-10. stock exacto (disponible = pedido) sí es apto', () => {
    const r = OrderAssignmentEngine.seleccionarSedeDespacho([{ varianteId: 1, cantidad: 3 }], CUCUTA, [sede(1, CUCUTA, { 1: 3 })]);
    expect(r.sede.id).toBe(1);
  });

  it('QA-11. se ignoran sedes inactivas o con despachaWeb=false aunque sean las más baratas', () => {
    const r = OrderAssignmentEngine.seleccionarSedeDespacho(carrito, CUCUTA, [
      sede(1, CUCUTA, { 1: 9 }, { activa: false }),
      sede(2, CUCUTA, { 1: 9 }, { despachaWeb: false }),
      sede(3, BOGOTA, { 1: 9 }),
    ]);
    expect(r.sede.id).toBe(3);
  });

  it('QA-12. carrito vacío → 400', () => {
    expect(statusDe(() => OrderAssignmentEngine.seleccionarSedeDespacho([], CUCUTA, [sede(1, CUCUTA, { 1: 9 })]))).toBe(400);
  });
});
