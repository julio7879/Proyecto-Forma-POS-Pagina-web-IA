import { describe, it, expect } from 'vitest';
import { ColombiaTime } from '../ColombiaTime.js';

describe('ColombiaTime', () => {
  it('obtiene fecha y mes de negocio en formato YYYY-MM-DD y YYYY-MM', () => {
    // 2026-11-02T19:00:00Z -> en UTC-5 son las 14:00 del 2026-11-02
    const utcDate = new Date('2026-11-02T19:00:00Z');
    expect(ColombiaTime.toFechaNegocioColombia(utcDate)).toBe('2026-11-02');
    expect(ColombiaTime.toMesNegocioColombia(utcDate)).toBe('2026-11');
  });

  it('determina si una sesión de caja pertenece al día actual en Colombia (RN-CAJ-11)', () => {
    const ahora = new Date('2026-11-02T15:00:00Z'); // 10:00 AM Colombia
    expect(ColombiaTime.esSesionDelDiaActual('2026-11-02', ahora)).toBe(true);
    expect(ColombiaTime.esSesionDelDiaActual('2026-11-01', ahora)).toBe(false);
  });

  it('valida el plazo calendario POS de 5 días desde la fecha raíz (RN-DEV-03, CA-27, CA-63)', () => {
    const ventaRaiz = new Date('2026-11-01T15:00:00Z');
    const dentroDePlazo = new Date('2026-11-06T15:00:00Z'); // 5 días exactos
    const fueraDePlazo = new Date('2026-11-07T15:00:00Z'); // 6 días

    expect(ColombiaTime.estaDentroDePlazoCalendarioPOS(ventaRaiz, 5, dentroDePlazo)).toBe(true);
    expect(ColombiaTime.estaDentroDePlazoCalendarioPOS(ventaRaiz, 5, fueraDePlazo)).toBe(false);
  });

  it('valida el plazo de 5 días hábiles web excluyendo fines de semana y festivos (RN-DEV-14, CA-65)', () => {
    // Supongamos entrega un miércoles: 2026-11-04
    // Jueves 05 (día 1)
    // Viernes 06 (día 2)
    // Sábado 07 (fin de semana - salta)
    // Domingo 08 (fin de semana - salta)
    // Lunes 09 (supongamos festivo: 2026-11-09) -> salta
    // Martes 10 (día 3)
    // Miércoles 11 (día 4)
    // Jueves 12 (día 5 - vence hoy al final del día)
    // Viernes 13 (día 6 - expirado)
    const entrega = new Date('2026-11-04T15:00:00Z');
    const festivos = ['2026-11-09'];

    const dentroJueves12 = new Date('2026-11-12T15:00:00Z');
    const fueraViernes13 = new Date('2026-11-13T15:00:00Z');

    expect(ColombiaTime.estaDentroDePlazoHabilesWeb(entrega, festivos, 5, dentroJueves12)).toBe(true);
    expect(ColombiaTime.estaDentroDePlazoHabilesWeb(entrega, festivos, 5, fueraViernes13)).toBe(false);
  });
});
