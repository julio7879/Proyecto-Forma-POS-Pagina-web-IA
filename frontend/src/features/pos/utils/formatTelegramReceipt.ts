import { VentaTicketDTO } from '../types/ticket.types';

export function formatTelegramReceipt(ticket: VentaTicketDTO): string {
  const lineas = ticket.items
    .map(
      (item) =>
        `▪ ${item.cantidad}x ${item.nombre} (${item.talla}/${item.color})\n  SKU: \`${item.sku}\` - $${item.totalCop.toLocaleString('es-CO')}`
    )
    .join('\n');

  let infoPago = `Método de Pago: ${ticket.metodoPago}`;
  if (ticket.metodoPago === 'EFECTIVO' && ticket.montoRecibidoCop !== undefined) {
    infoPago += `\nRecibido: $${ticket.montoRecibidoCop.toLocaleString('es-CO')}`;
    if (ticket.cambioCop !== undefined) {
      infoPago += ` | Cambio: $${ticket.cambioCop.toLocaleString('es-CO')}`;
    }
  } else if (ticket.metodoPago === 'TRANSFERENCIA' && ticket.referenciaTransferencia) {
    infoPago += ` (Ref: \`${ticket.referenciaTransferencia}\`)`;
  }

  const clienteLinea = ticket.clienteNombre ? `👤 Cliente: ${ticket.clienteNombre}\n` : '';

  return (
    `🧾 *${ticket.nombreTienda}*\n` +
    `📍 ${ticket.nombreSede}\n` +
    `🎫 Comprobante: \`${ticket.consecutivo}\`\n` +
    `📅 ${ticket.fechaHora}\n` +
    `👤 Cajero: ${ticket.cajeroNombre}\n` +
    clienteLinea +
    `\n*Detalle de Prendas:*\n${lineas}\n\n` +
    `Subtotal: $${ticket.subtotalCop.toLocaleString('es-CO')}\n` +
    `Descuento: -$${ticket.descuentoTotalCop.toLocaleString('es-CO')}\n` +
    `*TOTAL: $${ticket.totalNetoCop.toLocaleString('es-CO')} COP*\n` +
    `${infoPago}\n\n` +
    `_Garantía de 30 días en tiendas físicas._`
  );
}