import { prisma } from '../config/database.js';

/**
 * Worker de Integridad del Kardex (RN-INV-04).
 * Audita que no existan discrepancias entre SaldoStock y el historial inmutable de MovimientoInventario.
 */
export async function auditarIntegridadKardex(): Promise<{ discrepanciasDetectadas: number }> {
  // Compara la sumatoria de movimientos con el saldo físico actual
  const saldos = await prisma.saldoStock.findMany({
    select: {
      ubicacionId: true,
      varianteId: true,
      fisico: true,
    },
  });

  let discrepancias = 0;

  for (const saldo of saldos) {
    const aggregate = await prisma.movimientoInventario.aggregate({
      where: {
        ubicacionId: saldo.ubicacionId,
        varianteId: saldo.varianteId,
        afectaSaldo: 'FISICO',
      },
      _sum: {
        cantidadConSigno: true,
      },
    });

    const sumaCalculada = aggregate._sum.cantidadConSigno ?? 0;

    if (sumaCalculada !== saldo.fisico) {
      discrepancias++;
      console.warn(
        `[AUDITORIA KARDEX] Discrepancia en Ubicacion ${saldo.ubicacionId}, Variante ${saldo.varianteId}: Saldo físico=${saldo.fisico}, Suma Kardex=${sumaCalculada}`
      );
    }
  }

  return { discrepanciasDetectadas: discrepancias };
}
