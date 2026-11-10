import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, Loader2, Sparkles, Send } from 'lucide-react';
import { FormaLogo } from '../../../components/common/FormaLogo';
import { apiRequest } from '../../../api/apiClient';

export const PagoQrClientePage: React.FC = () => {
  const { consecutivo } = useParams<{ consecutivo: string }>();
  const [cargando, setCargando] = useState(true);
  const [pagado, setPagado] = useState(false);
  const [totalCop, setTotalCop] = useState<number>(0);
  const [sede, setSede] = useState('Punto Centro (Cúcuta)');

  // Formateador oficial COP entero (RN-GEN-04)
  const formatCOP = (val: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);

  useEffect(() => {
    if (!consecutivo) return;

    // 1. Obtener detalles de la cuenta/factura
    apiRequest<{ ok: boolean; totalCop: number; sede?: string; estado?: string }>(
      `/qr-pago/detalle/${consecutivo}`
    )
      .then((data) => {
        if (data.totalCop) setTotalCop(data.totalCop);
        if (data.sede) setSede(data.sede);
        if (data.estado === 'PAGADO') {
          setPagado(true);
          setCargando(false);
        } else {
          setCargando(false);
        }
      })
      .catch(() => {
        setCargando(false);
      });
  }, [consecutivo]);

  // F0: el cliente ya no aprueba el pago. Solo consulta el estado;
  // el cajero confirma la recepción desde el POS autenticado.
  useEffect(() => {
    if (!consecutivo || cargando || pagado) return;

    const timer = setInterval(async () => {
      try {
        const data = await apiRequest<{ ok: boolean; estado?: string }>(
          `/qr-pago/detalle/${consecutivo}`
        );
        if (data.estado === 'PAGADO') {
          setPagado(true);
        }
      } catch {
        // Sin conexión: se reintenta en el siguiente ciclo.
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [consecutivo, cargando, pagado]);

  return (
    <div className="min-h-screen bg-[#1C1311] text-[#E7DED2] flex flex-col justify-between items-center p-4 sm:p-6 select-none font-sans relative overflow-hidden">
      {/* Fondo estético Alta Costura con degradado sutil */}
      <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-[#661521]/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-[#D19650]/15 blur-3xl pointer-events-none" />

      {/* Cabecera */}
      <header className="w-full max-w-sm flex flex-col items-center pt-4 z-10">
        <FormaLogo variant="full" size="md" theme="light" />
        <div className="mt-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-bold text-[#D19650] uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Cobro QR en Caja Registradora</span>
        </div>
      </header>

      {/* Tarjeta Principal de Pago */}
      <main className="w-full max-w-sm my-auto py-6 z-10">
        <div className="p-6 rounded-3xl bg-white/10 backdrop-blur-2xl border-2 border-white/20 shadow-2xl space-y-5 text-center">
          <div>
            <span className="text-xs font-semibold text-[#E7DED2]/70 uppercase tracking-wider block">
              Comprobante de Venta
            </span>
            <strong className="text-xl font-mono text-white tracking-wide block mt-0.5">
              #{consecutivo}
            </strong>
            <span className="text-xs text-[#D19650] block mt-0.5">{sede}</span>
          </div>

          <div className="py-4 border-y border-white/15">
            <span className="text-xs font-bold text-[#E7DED2]/80 uppercase tracking-wider block">
              Total a Pagar
            </span>
            <div className="text-3xl sm:text-4xl font-black font-mono text-white mt-1">
              {totalCop > 0 ? formatCOP(totalCop) : '$308.000 COP'}
            </div>
            <span className="text-[11px] text-[#E7DED2]/60 mt-1 block">
              IVA 19% Incluido • Moneda Oficial COP
            </span>
          </div>

          {/* Estado del Cobro */}
          {cargando ? (
            <div className="py-4 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-[#D19650]" />
              <span className="text-xs font-medium text-[#E7DED2]/80">
                Verificando cuenta en tienda...
              </span>
            </div>
          ) : pagado ? (
            <div className="space-y-3 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">¡PAGO COBRADO CON ÉXITO!</h3>
                <p className="text-xs text-emerald-300 mt-1 leading-relaxed">
                  El cajero confirmó la recepción del pago en la terminal POS.
                </p>
              </div>

              {/* Botón para abrir el recibo en el bot de Telegram */}
              <a
                href={`https://t.me/Forma_Venta_Bot?start=recibo_${consecutivo?.replace(/^#/, '')}`}
                target="_blank"
                rel="noreferrer"
                className="mt-4 w-full min-h-[48px] py-2.5 px-4 rounded-2xl bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>Recibir Comprobante en Telegram</span>
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-400/30 text-amber-200 text-xs">
                <p className="font-bold flex items-center justify-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Esperando confirmación del cajero...</span>
                </p>
                <p className="text-[11px] text-amber-100/80 mt-1">
                  Muestra esta pantalla en caja. El pago se registra cuando el cajero confirma la recepción.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Pie de Página */}
      <footer className="w-full max-w-sm pb-2 text-center text-[11px] text-[#E7DED2]/50 z-10">
        FORMA ATELIER S.A.S. • Pago asistido en caja
      </footer>
    </div>
  );
};

export default PagoQrClientePage;
