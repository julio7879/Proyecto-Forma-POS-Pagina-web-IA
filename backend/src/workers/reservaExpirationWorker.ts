import { prisma } from '../config/database.js';
import { InventoryLedgerService } from '../modules/04-inventario/InventoryLedgerService.js';

/**
 * Worker para cancelar transferencias web vencidas con SKIP LOCKED (RN-WEB-09, CA-39).
 * Se ejecuta periódicamente sin bloquear transacciones concurrentes del Admin o del POS.
 * Cumple con Kardex Único (RN-GEN-02) liberando reserva blanda a través de InventoryLedgerService.
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

      // Libera la reserva blanda a través del Kardex Ledger (RN-GEN-02, RN-WEB-09)
      const movimientos = lineas.map((linea) => ({
        tipo: 'LIBERACION_RESERVA_WEB' as const,
        ubicacionId: pedido.ubicacionAsignadaId,
        varianteId: linea.varianteId,
        cantidadConSigno: -linea.cantidad,
        afectaSaldo: 'RESERVADO_BLANDO' as const,
        documentoTipo: 'PEDIDO_WEB' as const,
        documentoId: pedido.id,
        usuarioId: 1, // Sistema / Administrador
        motivo: 'Expiración automática TTL 24h transferencia bancaria (RN-WEB-09)',
      }));

      await InventoryLedgerService.registrarMovimientosBatch(tx, movimientos);

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
