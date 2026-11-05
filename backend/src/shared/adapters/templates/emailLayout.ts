/**
 * Utilidades y layout compartido de las plantillas de correo (Obsidian Navy / Liquid Glass).
 * Solo HTML "email-safe": tablas, estilos en línea y un único bloque <style> para móviles.
 */

export const COLORES = {
    fondo: '#0F172A',
    tarjeta: '#1E293B',
    borde: '#334155',
    cian: '#38BDF8',
    indigo: '#6366F1',
    texto: '#F8FAFC',
    textoSecundario: '#94A3B8',
    alertaAmbar: '#FBBF24',
    exito: '#34D399',
} as const;

export const SOPORTE_EMAIL = 'soporte@tiendaforma.com';
const FUENTE = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

/** Escapa texto para HTML (contenido y atributos). Protección XSS / inyección de HTML. */
export const escapeHtml = (valor: unknown): string =>
    String(valor ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

/** Pesos colombianos enteros con separador de miles: $120.000 COP (RN-GEN-04). */
export const formatearCop = (monto: number): string => {
    const entero = Number.isFinite(monto) ? Math.round(monto) : 0;
    const signo = entero < 0 ? '-' : '';
    return `${signo}$${String(Math.abs(entero)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} COP`;
};

/** Fecha oficial de Colombia (RN-GEN-05): DD/MM/YYYY hh:mm a. m./p. m. */
export const formatearFechaBogota = (fecha: Date): string =>
    new Intl.DateTimeFormat('es-CO', {
        timeZone: 'America/Bogota',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    })
        .format(fecha)
        .replace(/[\u00a0\u202f]/g, ' ')
        .replace(',', '');

/** Devuelve la URL escapada solo si es http(s); si no, undefined (bloquea javascript:, data:, etc.). */
export const urlSegura = (url: string | undefined): string | undefined => {
    if (!url) return undefined;
    try {
        const u = new URL(url.trim());
        return u.protocol === 'https:' || u.protocol === 'http:' ? escapeHtml(u.toString()) : undefined;
    } catch {
        return undefined;
    }
};

/** Enmascara un teléfono dejando solo los 4 últimos dígitos (Ley 1581). */
export const enmascararTelefono = (tel: string): string => {
    const digitos = tel.replace(/\D/g, '');
    return digitos.length > 4 ? `*** *** ${digitos.slice(-4)}` : '***';
};

export const boton = (texto: string, urlEscapada: string): string => `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0 4px 0;">
  <tr>
    <td align="center" bgcolor="${COLORES.indigo}" style="border-radius:10px;background:${COLORES.indigo};background-image:linear-gradient(135deg,${COLORES.cian},${COLORES.indigo});">
      <a href="${urlEscapada}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:13px 26px;font-family:${FUENTE};font-size:15px;font-weight:700;color:#0F172A;text-decoration:none;border-radius:10px;">${escapeHtml(texto)}</a>
    </td>
  </tr>
</table>`;

export const banner = (emoji: string, titulo: string, texto: string, color: string): string => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px 0;">
  <tr>
    <td style="padding:14px 16px;border:1px solid ${color};border-left:4px solid ${color};border-radius:12px;background:rgba(148,163,184,0.08);font-family:${FUENTE};">
      <div style="font-size:15px;font-weight:700;color:${color};margin-bottom:4px;">${emoji} ${escapeHtml(titulo)}</div>
      <div style="font-size:14px;line-height:21px;color:${COLORES.texto};">${texto}</div>
    </td>
  </tr>
</table>`;

export const fuente = FUENTE;

interface LayoutOpciones {
    titulo: string;
    preheader: string;
    contenido: string;
}

/** Envoltorio común: cabecera FORMA, tarjeta centrada (max 600px) y pie con Ley 1581. */
export const renderLayout = ({ titulo, preheader, contenido }: LayoutOpciones): string => `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${escapeHtml(titulo)}</title>
<style>
  @media only screen and (max-width:620px) {
    .container { width:100% !important; }
    .px { padding-left:16px !important; padding-right:16px !important; }
    .stack { display:block !important; width:100% !important; padding-right:0 !important; padding-bottom:12px !important; }
    .small { font-size:12px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${COLORES.fondo};font-family:${FUENTE};color:${COLORES.texto};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${COLORES.fondo};">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${COLORES.fondo}" style="background:${COLORES.fondo};">
  <tr>
    <td align="center" style="padding:24px 12px;">
      <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
        <tr>
          <td align="center" style="padding:8px 0 20px 0;">
            <div style="font-family:${FUENTE};font-size:34px;font-weight:800;letter-spacing:10px;color:${COLORES.texto};">FORMA</div>
            <div style="font-family:${FUENTE};font-size:12px;letter-spacing:3px;color:${COLORES.cian};text-transform:uppercase;margin-top:4px;">Moda Colombiana Multisede</div>
          </td>
        </tr>
        <tr>
          <td bgcolor="${COLORES.cian}" style="height:4px;line-height:4px;font-size:0;border-radius:4px 4px 0 0;background:${COLORES.cian};background-image:linear-gradient(90deg,${COLORES.cian},${COLORES.indigo});">&nbsp;</td>
        </tr>
        <tr>
          <td class="px" bgcolor="${COLORES.tarjeta}" style="background:${COLORES.tarjeta};border:1px solid ${COLORES.borde};border-top:0;border-radius:0 0 16px 16px;padding:28px 28px 24px 28px;">
${contenido}
          </td>
        </tr>
        <tr>
          <td align="center" class="px" style="padding:20px 16px 8px 16px;font-family:${FUENTE};font-size:12px;line-height:18px;color:${COLORES.textoSecundario};">
            Tratamos tus datos personales conforme a la Ley 1581 de 2012 de Protección de Datos Personales.
            Nunca te pediremos contraseñas ni datos bancarios por correo.<br>
            ¿Necesitas ayuda? Escríbenos a <a href="mailto:${SOPORTE_EMAIL}" style="color:${COLORES.cian};text-decoration:none;">${SOPORTE_EMAIL}</a><br>
            &copy; ${new Date().getFullYear()} Forma Moda S.A.S. Todos los derechos reservados.
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;