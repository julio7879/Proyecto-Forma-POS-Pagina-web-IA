import {
    COLORES,
    banner,
    boton,
    enmascararTelefono,
    escapeHtml,
    formatearCop,
    fuente,
    renderLayout,
    urlSegura,
} from './emailLayout.js';

export interface ItemPedidoEmail {
    sku: string;
    nombre: string;
    talla?: string;
    color?: string;
    cantidad: number;
    precioUnitarioCop: number;
    subtotalCop: number;
}

export interface DatosConfirmacionPedidoEmail {
    referenciaPedido: string; // PED-YYYY-XXXXXX
    fechaPedidoBogota: string; // Formateada DD/MM/YYYY hh:mm a.m./p.m.
    clienteNombre: string;
    clienteEmail: string;
    clienteTelefono?: string;
    departamentoDane: string;
    municipioDane: string;
    direccionEntrega: string;
    items: ItemPedidoEmail[];
    subtotalCop: number;
    descuentoCop?: number;
    costoEnvioCop: number;
    totalCop: number;
    metodoPago: 'TRANSFERENCIA' | 'CONTRAENTREGA';
    instruccionesTransferencia?: {
        banco: string;
        tipoCuenta: string;
        numeroCuenta: string;
        titular: string;
        nit: string;
        enlaceComprobante?: string;
    };
}

const celda = `font-family:${fuente};font-size:14px;color:${COLORES.texto};padding:10px 6px;border-bottom:1px solid ${COLORES.borde};`;

const filaItem = (item: ItemPedidoEmail): string => {
    const variante = [item.talla && `Talla ${item.talla}`, item.color && `Color ${item.color}`]
        .filter(Boolean)
        .map((v) => escapeHtml(v))
        .join(' · ');
    return `
        <tr>
          <td style="${celda}">
            <div style="font-weight:600;">${escapeHtml(item.nombre)}</div>
            <div class="small" style="font-size:12px;color:${COLORES.textoSecundario};">SKU ${escapeHtml(item.sku)}${variante ? ` · ${variante}` : ''}</div>
          </td>
          <td align="center" style="${celda}">${escapeHtml(item.cantidad)}</td>
          <td align="right" style="${celda}white-space:nowrap;">${escapeHtml(formatearCop(item.precioUnitarioCop))}</td>
          <td align="right" style="${celda}white-space:nowrap;font-weight:600;">${escapeHtml(formatearCop(item.subtotalCop))}</td>
        </tr>`;
};

const filaTotal = (etiqueta: string, valor: string, opciones: { destacado?: boolean; color?: string } = {}): string => `
        <tr>
          <td style="font-family:${fuente};padding:6px 0;font-size:${opciones.destacado ? '17px' : '14px'};color:${opciones.destacado ? COLORES.texto : COLORES.textoSecundario};font-weight:${opciones.destacado ? 800 : 400};">${escapeHtml(etiqueta)}</td>
          <td align="right" style="font-family:${fuente};padding:6px 0;font-size:${opciones.destacado ? '20px' : '14px'};color:${opciones.color ?? COLORES.texto};font-weight:${opciones.destacado ? 800 : 600};white-space:nowrap;">${escapeHtml(valor)}</td>
        </tr>`;

const seccionTitulo = (texto: string): string =>
    `<div style="font-family:${fuente};font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${COLORES.cian};margin:24px 0 8px 0;">${escapeHtml(texto)}</div>`;

const bloqueTransferencia = (datos: DatosConfirmacionPedidoEmail): string => {
    const aviso = banner(
        '⏳',
        'Tienes 24 horas para pagar',
        'Cuentas con un plazo máximo de <b>24 horas</b> para realizar la transferencia y adjuntar tu comprobante. ' +
        'Pasado ese tiempo, tu reserva expirará automáticamente y los productos serán liberados.',
        COLORES.alertaAmbar,
    );
    const t = datos.instruccionesTransferencia;
    if (!t) {
        return `${aviso}<p style="font-family:${fuente};font-size:14px;color:${COLORES.textoSecundario};">Escríbenos a soporte para recibir los datos bancarios de pago.</p>`;
    }
    const fila = (k: string, v: string): string =>
        `<tr><td style="font-family:${fuente};font-size:13px;color:${COLORES.textoSecundario};padding:4px 0;width:38%;">${escapeHtml(k)}</td><td style="font-family:${fuente};font-size:14px;color:${COLORES.texto};padding:4px 0;font-weight:600;">${escapeHtml(v)}</td></tr>`;
    const enlace = urlSegura(t.enlaceComprobante);
    return `${aviso}
${seccionTitulo('Datos para tu transferencia')}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${COLORES.borde};border-radius:12px;background:rgba(15,23,42,0.55);">
  <tr><td style="padding:12px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      ${fila('Banco', t.banco)}
      ${fila('Tipo de cuenta', t.tipoCuenta)}
      ${fila('Número de cuenta', t.numeroCuenta)}
      ${fila('Titular', t.titular)}
      ${fila('NIT', t.nit)}
    </table>
  </td></tr>
</table>
${enlace ? boton('Reportar comprobante de pago', enlace) : ''}`;
};

const bloqueContraentrega = (): string =>
    banner(
        '💵',
        'Pago contra entrega',
        'Debes entregar el <b>valor total en efectivo exacto</b> al transportador en el momento de la entrega física de tu pedido.',
        COLORES.cian,
    );

export function renderOrderConfirmationHtml(datos: DatosConfirmacionPedidoEmail): string {
    const descuento = datos.descuentoCop && datos.descuentoCop > 0 ? datos.descuentoCop : 0;
    const telefono = datos.clienteTelefono
        ? `<div style="font-size:13px;color:${COLORES.textoSecundario};">Tel. ${escapeHtml(enmascararTelefono(datos.clienteTelefono))}</div>`
        : '';

    const contenido = `
            <h1 style="margin:0 0 6px 0;font-family:${fuente};font-size:24px;line-height:30px;color:${COLORES.texto};">¡Gracias por tu compra, ${escapeHtml(datos.clienteNombre)}!</h1>
            <p style="margin:0 0 20px 0;font-family:${fuente};font-size:14px;line-height:21px;color:${COLORES.textoSecundario};">Recibimos tu pedido y ya lo estamos procesando.</p>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px 0;border:1px solid ${COLORES.borde};border-radius:12px;background:rgba(148,163,184,0.08);">
              <tr>
                <td class="stack" style="padding:14px 16px;font-family:${fuente};">
                  <div style="font-size:12px;color:${COLORES.textoSecundario};">Referencia del pedido</div>
                  <div style="font-size:19px;font-weight:800;color:${COLORES.cian};letter-spacing:1px;">${escapeHtml(datos.referenciaPedido)}</div>
                </td>
                <td class="stack" align="right" style="padding:14px 16px;font-family:${fuente};">
                  <div style="font-size:12px;color:${COLORES.textoSecundario};">Fecha (hora Colombia)</div>
                  <div style="font-size:14px;font-weight:600;color:${COLORES.texto};">${escapeHtml(datos.fechaPedidoBogota)}</div>
                </td>
              </tr>
            </table>

            ${datos.metodoPago === 'TRANSFERENCIA' ? bloqueTransferencia(datos) : bloqueContraentrega()}

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td class="stack" valign="top" style="width:50%;padding-right:12px;font-family:${fuente};font-size:14px;line-height:21px;color:${COLORES.texto};">
                  ${seccionTitulo('Cliente')}
                  <div style="font-weight:600;">${escapeHtml(datos.clienteNombre)}</div>
                  <div style="color:${COLORES.textoSecundario};">${escapeHtml(datos.clienteEmail)}</div>
                  ${telefono}
                </td>
                <td class="stack" valign="top" style="width:50%;font-family:${fuente};font-size:14px;line-height:21px;color:${COLORES.texto};">
                  ${seccionTitulo('Entrega')}
                  <div style="font-weight:600;">${escapeHtml(datos.municipioDane)}, ${escapeHtml(datos.departamentoDane)}</div>
                  <div style="color:${COLORES.textoSecundario};">${escapeHtml(datos.direccionEntrega)}</div>
                </td>
              </tr>
            </table>

            ${seccionTitulo('Tu pedido')}
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <th align="left" style="font-family:${fuente};font-size:12px;color:${COLORES.textoSecundario};padding:6px;border-bottom:1px solid ${COLORES.borde};">Producto / Variante</th>
                <th align="center" style="font-family:${fuente};font-size:12px;color:${COLORES.textoSecundario};padding:6px;border-bottom:1px solid ${COLORES.borde};">Cant.</th>
                <th align="right" style="font-family:${fuente};font-size:12px;color:${COLORES.textoSecundario};padding:6px;border-bottom:1px solid ${COLORES.borde};">Precio unit.</th>
                <th align="right" style="font-family:${fuente};font-size:12px;color:${COLORES.textoSecundario};padding:6px;border-bottom:1px solid ${COLORES.borde};">Total</th>
              </tr>${datos.items.map(filaItem).join('')}
            </table>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:14px;">${filaTotal('Subtotal productos', formatearCop(datos.subtotalCop))}${descuento > 0 ? filaTotal('Descuento aplicado', `-${formatearCop(descuento)}`, { color: COLORES.exito }) : ''
        }${filaTotal('Flete / Envío', formatearCop(datos.costoEnvioCop))}
              <tr><td colspan="2" style="border-top:1px solid ${COLORES.borde};font-size:0;line-height:0;height:8px;">&nbsp;</td></tr>${filaTotal('Total a pagar', formatearCop(datos.totalCop), { destacado: true, color: COLORES.cian })}
            </table>`;

    return renderLayout({
        titulo: `Confirmación de pedido ${datos.referenciaPedido}`,
        preheader: `Recibimos tu pedido ${datos.referenciaPedido}. Total: ${formatearCop(datos.totalCop)}`,
        contenido,
    });
}