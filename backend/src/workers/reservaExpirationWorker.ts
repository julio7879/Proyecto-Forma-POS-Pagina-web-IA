import { prisma } from '../config/database.js';

/**
 * Worker para cancelar transferencias web vencidas con SKIP LOCKED (RN-WEB-09, CA-39).
 * Se ejecuta periódicamente sin bloquear transacciones concurrentes del Admin o del POS.
 */
export async function procesarExpiracionReservasWeb(): Promise<number> {
  const ahora = new Date();

  const pedidosExpirados = await prisma.$transaction(async (tx) => {
    // 1. Reclama pedidos vencidos sin colisionar con otros procesos concurrentes
    const pedidos = await tx.$queryRaw<Array<{ id: number; ubicacionAsignadaId: number }>>`
      SELECT id, "ubicacionAsignadaId"
      FROM "PedidoWeb"
      WHERE "estadoPedido" = 'RECIBIDO'
        AND "metodoPago" = 'TRANSFERENCIA'
        AND "reservaExpiraEn" IS NOT NULL
        AND "reservaExpiraEn" < ${ahora}
      LIMIT 50
      FOR UPDATE SKIP LOCKED;
    `;

    for (const pedido of pedidos) {
      // 2. Consulta las líneas del pedido para liberar la reserva blanda
      const lineas = await tx.lineaPedidoWeb.findMany({
        where: { pedidoId: pedido.id },
      });

      for (const linea of lineas) {
        await tx.saldoStock.update({
          where: {
            ubicacionId_varianteId: {
              ubicacionId: pedido.ubicacionAsignadaId,
              varianteId: linea.varianteId,
            },
          },
          data: {
            reservadoBlando: { decrement: linea.cantidad },
          },
        });
      }

      // 3. Pasa el pedido a CANCELADO
      await tx.pedidoWeb.update({
        where: { id: pedido.id },
        data: {
          estadoPedido: 'CANCELADO',
          fechaCancelacion: ahora,
          motivoCancelacionNoEntrega: 'Cancelación automática: Expiró el plazo de 24h para transferir (RN-WEB-09).',
          version: { increment: 1 },
        },
      });

      // 4. Agrega al historial de estados
      await tx.historialEstadoPedidoWeb.create({
        data: {
          pedidoId: pedido.id,
          estadoPedido: 'CANCELADO',
          estadoPago: 'PENDIENTE',
          observacion: 'TTL de transferencia bancaria expirado (24h). Reserva blanda liberada.',
        },
      });
    }

    return pedidos.length;
  });

  return pedidosExpirados;
}
