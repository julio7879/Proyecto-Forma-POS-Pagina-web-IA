/**
 * Utilidad de Zona Horaria Oficial de Negocio: America/Bogota (UTC-5) (RN-GEN-05, RN-CAJ-11, RN-DEV-03, RN-DEV-14)
 */
export class ColombiaTime {
  private static readonly TIMEZONE = 'America/Bogota';

  /**
   * Devuelve la fecha de negocio actual o de un Date en formato "YYYY-MM-DD" medida en America/Bogota.
   */
  static toFechaNegocioColombia(date: Date = new Date()): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: this.TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);

    const y = parts.find((p) => p.type === 'year')!.value;
    const m = parts.find((p) => p.type === 'month')!.value;
    const d = parts.find((p) => p.type === 'day')!.value;
    return `${y}-${m}-${d}`;
  }

  /**
   * Devuelve el mes de negocio en formato "YYYY-MM" medido en America/Bogota (RN-REP-04).
   */
  static toMesNegocioColombia(date: Date = new Date()): string {
    return this.toFechaNegocioColombia(date).slice(0, 7);
  }

  /**
   * Verifica si una sesión de caja abierta pertenece al día actual en Colombia (RN-CAJ-11, CA-56).
   */
  static esSesionDelDiaActual(fechaNegocioSesion: string, ahora: Date = new Date()): boolean {
    return fechaNegocioSesion === this.toFechaNegocioColombia(ahora);
  }

  /**
   * Verifica si una devolución POS está dentro de los N días calendario desde la venta raíz (RN-DEV-03, CA-27, CA-63).
   * Ejemplo: Venta el Día 1 -> vence a las 23:59:59 del Día (1 + plazoDias).
   */
  static estaDentroDePlazoCalendarioPOS(fechaVentaRaiz: Date, plazoDias = 5, ahora: Date = new Date()): boolean {
    const fechaRaizStr = this.toFechaNegocioColombia(fechaVentaRaiz);
    const fechaActualStr = this.toFechaNegocioColombia(ahora);

    const [y1 = 0, m1 = 1, d1 = 1] = fechaRaizStr.split('-').map(Number);
    const [y2 = 0, m2 = 1, d2 = 1] = fechaActualStr.split('-').map(Number);

    const utcRaiz = Date.UTC(y1, m1 - 1, d1);
    const utcActual = Date.UTC(y2, m2 - 1, d2);
    const diffDias = Math.floor((utcActual - utcRaiz) / (1000 * 60 * 60 * 24));

    return diffDias <= plazoDias;
  }

  /**
   * Verifica si una devolución comercial web está dentro de los N días hábiles desde la entrega (RN-DEV-14, CA-65).
   * Excluye sábados, domingos y días festivos de Colombia.
   */
  static estaDentroDePlazoHabilesWeb(
    fechaEntregaUtc: Date,
    festivosYyyyMmDd: string[] = [],
    plazoDiasHabiles = 5,
    ahora: Date = new Date()
  ): boolean {
    const fechaEntregaStr = this.toFechaNegocioColombia(fechaEntregaUtc);
    const fechaActualStr = this.toFechaNegocioColombia(ahora);

    if (fechaActualStr < fechaEntregaStr) return true;
    if (fechaActualStr === fechaEntregaStr) return true;

    const [y1 = 0, m1 = 1, d1 = 1] = fechaEntregaStr.split('-').map(Number);
    const [y2 = 0, m2 = 1, d2 = 1] = fechaActualStr.split('-').map(Number);

    let curr = new Date(Date.UTC(y1, m1 - 1, d1 + 1));
    const target = new Date(Date.UTC(y2, m2 - 1, d2));

    const festivosSet = new Set(festivosYyyyMmDd);
    let diasHabilesTranscurridos = 0;

    while (curr <= target) {
      const dayOfWeek = curr.getUTCDay(); // 0 = Domingo, 6 = Sábado
      const yyyy = curr.getUTCFullYear();
      const mm = String(curr.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(curr.getUTCDate()).padStart(2, '0');
      const fechaIso = `${yyyy}-${mm}-${dd}`;

      const esFinDeSemana = dayOfWeek === 0 || dayOfWeek === 6;
      const esFestivo = festivosSet.has(fechaIso);

      if (!esFinDeSemana && !esFestivo) {
        diasHabilesTranscurridos++;
      }

      curr.setUTCDate(curr.getUTCDate() + 1);
    }

    return diasHabilesTranscurridos <= plazoDiasHabiles;
  }
}
