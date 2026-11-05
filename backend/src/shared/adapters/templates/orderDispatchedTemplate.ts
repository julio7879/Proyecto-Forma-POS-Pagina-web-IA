import { COLORES, boton, escapeHtml, fuente, renderLayout, urlSegura } from './emailLayout.js';

export interface DatosDespachoEmail {
    referenciaPedido: string;
    clienteNombre: string;
    /** Correo del cliente (destinatario del aviso de despacho). */
    clienteEmail: string;
    transportadora: string;
    guiaTransportadora: string;
    enlaceRastreo?: string;
    municipioDane: string;
    departamentoDane: string;
    direccionEntrega: string;
}

export function renderOrderDispatchedHtml(datos: DatosDespachoEmail): string {
    const rastreo = urlSegura(datos.enlaceRastreo);
    const dato = (k: string, v: string, grande = false): string => `
              <tr>
                <td style="font-family:${fuente};font-size:13px;color:${COLORES.textoSecundario};padding:6px 0;width:38%;">${escapeHtml(k)}</td>
                <td style="font-family:${fuente};font-size:${grande ? '18px' : '14px'};color:${grande ? COLORES.cian : COLORES.texto};font-weight:${grande ? 800 : 600};padding:6px 0;letter-spacing:${grande ? '1px' : '0'};">${escapeHtml(v)}</td>
              </tr>`;

    const contenido = `
            <h1 style="margin:0 0 6px 0;font-family:${fuente};font-size:24px;line-height:30px;color:${COLORES.texto};">📦 ¡Tu pedido va en camino!</h1>
            <p style="margin:0 0 20px 0;font-family:${fuente};font-size:14px;line-height:21px;color:${COLORES.textoSecundario};">Hola ${escapeHtml(datos.clienteNombre)}, tu pedido <b style="color:${COLORES.cian};">${escapeHtml(datos.referenciaPedido)}</b> ya fue entregado a la transportadora.</p>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${COLORES.borde};border-radius:12px;background:rgba(148,163,184,0.08);">
              <tr><td style="padding:12px 16px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${dato('Referencia', datos.referenciaPedido)}${dato('Transportadora', datos.transportadora)}${dato('Número de guía', datos.guiaTransportadora, true)}
                </table>
              </td></tr>
            </table>
            ${rastreo ? boton('Rastrear mi paquete', rastreo) : ''}

            <div style="font-family:${fuente};font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${COLORES.cian};margin:24px 0 8px 0;">Dirección de entrega confirmada</div>
            <div style="font-family:${fuente};font-size:14px;line-height:21px;color:${COLORES.texto};">
              <div style="font-weight:600;">${escapeHtml(datos.municipioDane)}, ${escapeHtml(datos.departamentoDane)}</div>
              <div style="color:${COLORES.textoSecundario};">${escapeHtml(datos.direccionEntrega)}</div>
            </div>`;

    return renderLayout({
        titulo: `Tu pedido ${datos.referenciaPedido} va en camino`,
        preheader: `Guía ${datos.guiaTransportadora} con ${datos.transportadora}`,
        contenido,
    });
}