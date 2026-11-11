import React, { useState, useMemo, useEffect } from 'react';
import {
  Lock,
  Unlock,
  Vault,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Minus,
  Clock,
  User,
  MapPin,
  Receipt,
  Printer,
  RotateCcw,
  ArrowDownRight,
  ArrowUpRight,
  Sparkles,
  FileCheck2,
  Eye,
  MessageSquare,
  History,
  Calculator,
} from 'lucide-react';
import {
  getSesionAbierta,
  getSesionesPorSede,
  abrirSesionCaja,
  registrarMovimientoCaja,
  anularMovimientoCaja,
  resumenSesion,
  cerrarSesionCaja,
  vincularSesionCajaBackend,
  CAJA_EVENT,
  type SesionCaja,
  type MovimientoCaja,
  type TipoMovimientoCaja,
} from '../utils/cajaStore';
import {
  asegurarSesionCaja,
  cerrarSesionBackend,
  obtenerSesionActiva,
  resolverUbicacionId,
} from '../services/posBackendService';
import { DetailDrawer } from '../components/DetailDrawer';

interface DenominacionBillete {
  valor: number;
  etiqueta: string;
  colorBadge: string;
}

const DENOMINACIONES_COP: DenominacionBillete[] = [
  { valor: 100000, etiqueta: 'Billetes de $100.000', colorBadge: 'bg-emerald-900 text-emerald-100' },
  { valor: 50000, etiqueta: 'Billetes de $50.000', colorBadge: 'bg-purple-900 text-purple-100' },
  { valor: 20000, etiqueta: 'Billetes de $20.000', colorBadge: 'bg-orange-800 text-orange-100' },
  { valor: 10000, etiqueta: 'Billetes de $10.000', colorBadge: 'bg-red-900 text-red-100' },
  { valor: 5000, etiqueta: 'Billetes de $5.000', colorBadge: 'bg-amber-900 text-amber-100' },
  { valor: 2000, etiqueta: 'Billetes de $2.000', colorBadge: 'bg-sky-900 text-sky-100' },
];

type SubcategoriaCaja = 'RESUMEN' | 'MOVIMIENTOS' | 'ARQUEO' | 'HISTORIAL';

const formatCOP = (valor: number): string => {
  const absVal = Math.abs(Math.trunc(valor));
  const formatted = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(absVal);
  return valor < 0 ? `-${formatted}` : formatted;
};

const formatBogotaDateTime = (iso?: string): string => {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('es-CO', {
      timeZone: 'America/Bogota',
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
};

const formatBogotaTime = (iso?: string): string => {
  try {
    return new Intl.DateTimeFormat('es-CO', {
      timeZone: 'America/Bogota',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(iso ? new Date(iso) : new Date());
  } catch {
    return '08:30:00 a. m.';
  }
};

const handleNumberKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (['-', '+', 'e', 'E', '.', ','].includes(e.key)) {
    e.preventDefault();
  }
};

const sanitizePositiveInt = (val: string): number => {
  const cleaned = val.replace(/[^0-9]/g, '');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : Math.max(0, parsed);
};

export const PosArqueoPage: React.FC = () => {
  const [sedeActiva, setSedeActiva] = useState<string>(
    () => localStorage.getItem('forma_pos_sede') || 'Punto Centro (Cúcuta)'
  );
  const [vendedorNombre, setVendedorNombre] = useState<string>(() => {
    try {
      const raw = localStorage.getItem('forma_pos_usuario') || localStorage.getItem('usuario');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.rol !== 'CLIENTE') {
          return parsed.nombreCompleto || parsed.nombre || 'Camilo Mendoza';
        }
      }
    } catch {
      /* noop */
    }
    return 'Camilo Mendoza';
  });

  const [, setStoreTick] = useState(0);
  const [horaActualBogota, setHoraActualBogota] = useState<string>(() => formatBogotaDateTime(new Date().toISOString()));

  // Subcategoría activa cuando el turno está abierto
  const [subcategoriaActiva, setSubcategoriaActiva] = useState<SubcategoriaCaja>('RESUMEN');

  // Formulario de Apertura de Turno (sin botones predeterminados — QA-POS-017)
  const [baseAperturaInput, setBaseAperturaInput] = useState<number>(0);
  const [observacionAperturaInput, setObservacionAperturaInput] = useState<string>('');
  const [turnoRecienAbierto, setTurnoRecienAbierto] = useState<SesionCaja | null>(null);
  const [turnoRecienCerrado, setTurnoRecienCerrado] = useState<SesionCaja | null>(null);

  // Teléfono para envío de comprobante de apertura/turno/cierre por WhatsApp (QA-POS-017)
  const [telefonoWhatsApp, setTelefonoWhatsApp] = useState<string>('3124508899');

  // Formulario de Movimientos de Efectivo (Retiro / Gasto / Reintegro)
  const [tipoRetiroInput, setTipoRetiroInput] = useState<TipoMovimientoCaja>('RETIRO_CAJA_FUERTE');
  const [montoRetiroInput, setMontoRetiroInput] = useState<number>(0);
  const [motivoRetiroInput, setMotivoRetiroInput] = useState<string>(
    'Traslado a caja fuerte por seguridad de gaveta'
  );
  const [motivoAnulacionInput, setMotivoAnulacionInput] = useState<string>(
    'Anulado por el cajero — Dinero devuelto a la gaveta'
  );
  const [mensajeRetiroExito, setMensajeRetiroExito] = useState<string | null>(null);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  // Conteo físico de efectivo (por denominaciones y digitación directa)
  const [modoConteoDirecto, setModoConteoDirecto] = useState<boolean>(false);
  const [efectivoContadoDirecto, setEfectivoContadoDirecto] = useState<number>(0);
  const [conteoBilletes, setConteoBilletes] = useState<Record<number, number>>({
    100000: 0,
    50000: 0,
    20000: 0,
    10000: 0,
    5000: 0,
    2000: 0,
  });
  const [monedasCopTotal, setMonedasCopTotal] = useState<number>(0);
  const [observacionCierreInput, setObservacionCierreInput] = useState<string>('');
  const [cuadreRevelado, setCuadreRevelado] = useState<boolean>(false);

  // Drawers de detalle (Movimiento o Sesión histórica)
  const [movimientoSeleccionado, setMovimientoSeleccionado] = useState<MovimientoCaja | null>(null);
  const [sesionSeleccionadaDrawer, setSesionSeleccionadaDrawer] = useState<SesionCaja | null>(null);
  const [drawerTab, setDrawerTab] = useState<string>('detalle');

  // Suscripción en tiempo real a cajaStore, ledger de ventas y localStorage
  useEffect(() => {
    const syncAll = () => {
      try {
        const rawSede = localStorage.getItem('forma_pos_sede');
        if (rawSede) setSedeActiva(rawSede);
        const rawUser = localStorage.getItem('usuario');
        if (rawUser) {
          const parsed = JSON.parse(rawUser);
          setVendedorNombre(parsed.nombreCompleto || parsed.nombre || 'Carlos Mendoza');
        }
      } catch {
        /* noop */
      }
      setStoreTick((t) => t + 1);
    };

    window.addEventListener(CAJA_EVENT, syncAll);
    window.addEventListener('forma-pos-ledger-update', syncAll);
    window.addEventListener('storage', syncAll);

    const timer = setInterval(() => {
      setHoraActualBogota(formatBogotaDateTime(new Date().toISOString()));
    }, 15000);

    return () => {
      window.removeEventListener(CAJA_EVENT, syncAll);
      window.removeEventListener('forma-pos-ledger-update', syncAll);
      window.removeEventListener('storage', syncAll);
      clearInterval(timer);
    };
  }, []);

  // Datos reales en vivo desde cajaStore para la sedeActiva (Cero Mocks)
  const sesionAbierta = getSesionAbierta(sedeActiva);
  const sesionesSede = getSesionesPorSede(sedeActiva);

  const resumen = useMemo(() => {
    if (!sesionAbierta) {
      return {
        ventasEfectivoCop: 0,
        efectivoRecibidoBrutoCop: 0,
        vueltosEntregadosCop: 0,
        ventasTransferenciaCop: 0,
        excedentesCambiosEfectivoCop: 0,
        excedentesCambiosTransferenciaCop: 0,
        reintegrosCambiosEfectivoCop: 0,
        retirosCop: 0,
        ingresosCop: 0,
        numeroVentas: 0,
        efectivoEsperadoCop: 0,
      };
    }
    return resumenSesion(sesionAbierta);
  }, [sesionAbierta, sesionesSede]);

  // Efectivo físico contado (denominaciones vs digitación directa)
  const efectivoPorDenominacionesCop = useMemo(() => {
    const totalBilletes = DENOMINACIONES_COP.reduce((acc, den) => {
      const cantidad = conteoBilletes[den.valor] || 0;
      return acc + den.valor * cantidad;
    }, 0);
    return totalBilletes + (Math.max(0, Math.trunc(monedasCopTotal)) || 0);
  }, [conteoBilletes, monedasCopTotal]);

  const efectivoFisicoDeclaradoCop = modoConteoDirecto
    ? Math.max(0, Math.trunc(efectivoContadoDirecto))
    : efectivoPorDenominacionesCop;

  const diferenciaArqueoCop = efectivoFisicoDeclaradoCop - resumen.efectivoEsperadoCop;

  // Validación estricta: monto a retirar no puede superar el efectivo disponible en caja
  const excedeEfectivoDisponible =
    tipoRetiroInput !== 'INGRESO_REINTEGRO' && montoRetiroInput > resumen.efectivoEsperadoCop;

  // Texto estructurado para WhatsApp (Apertura / Estado en vivo / Cierre de Turno — QA-POS-017)
  const construirTextoTicketWhatsApp = (sesion: SesionCaja, tipoTicket: 'APERTURA' | 'ESTADO' | 'CIERRE'): string => {
    const r = resumenSesion(sesion);
    const encabezado =
      tipoTicket === 'APERTURA'
        ? `🟢 *COMPROBANTE DE APERTURA DE TURNO #${sesion.turnoNumero}*`
        : tipoTicket === 'CIERRE'
        ? `🔒 *FACTURA / ACTA DE CIERRE DE TURNO #${sesion.turnoNumero}*`
        : `📊 *ESTADO CONTABLE DE TURNO #${sesion.turnoNumero}*`;

    return `${encabezado}
*FORMA BOUTIQUE — ${sesion.sede}*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*Vendedor:* ${sesion.vendedor}
*Hora Apertura (Bogotá):* ${formatBogotaDateTime(sesion.aperturaIso)}
${sesion.cierreIso ? `*Hora Cierre (Bogotá):* ${formatBogotaDateTime(sesion.cierreIso)}\n` : ''}*Observación Apertura:* ${sesion.observacionApertura || 'Apertura verificada'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*DESGLOSE DE GAVETA (COP):*
• Base Inicial Declarada: ${formatCOP(sesion.baseInicialCop)}
• Efectivo Recibido Clientes: ${formatCOP(r.efectivoRecibidoBrutoCop)}
• (-) Vueltos Entregados: -${formatCOP(r.vueltosEntregadosCop)}
• (=) Ventas Efectivo Netas: ${formatCOP(r.ventasEfectivoCop)}
• (+) Excedentes Cambios / Ingresos: ${formatCOP(r.excedentesCambiosEfectivoCop + r.ingresosCop)}
• (-) Retiros / Gastos / Reintegros: -${formatCOP(r.retirosCop + r.reintegrosCambiosEfectivoCop)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*EFECTIVO ESPERADO EN GAVETA:* ${formatCOP(r.efectivoEsperadoCop)}
${
  sesion.estado === 'CERRADA'
    ? `*EFECTIVO FÍSICO CONTADO:* ${formatCOP(sesion.efectivoContadoCop ?? 0)}\n*DIFERENCIA DE CUADRE:* ${formatCOP(sesion.diferenciaCop ?? 0)}\n*Nota Cierre:* ${sesion.observacionCierre || 'Sin novedades'}\n`
    : ''
}*Ventas por Transferencia QR:* ${formatCOP(r.ventasTransferenciaCop)} (${r.numeroVentas} ventas totales)`;
  };

  const enviarPorWhatsApp = (sesion: SesionCaja, tipoTicket: 'APERTURA' | 'ESTADO' | 'CIERRE') => {
    const telefonoLimpio = telefonoWhatsApp.replace(/\D/g, '').replace(/^57/, '');
    const textoResumenTurno = construirTextoTicketWhatsApp(sesion, tipoTicket);
    const url = `https://wa.me/57${telefonoLimpio}?text=${encodeURIComponent(textoResumenTurno)}`;
    window.open(url, '_blank');
  };

  // Acción: Abrir Turno de Caja (QA-POS-015, QA-POS-016, QA-POS-017)
  const handleAbrirTurnoCaja = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorValidacion(null);

    const baseEntera = Math.max(0, Math.trunc(baseAperturaInput));
    const obs =
      observacionAperturaInput.trim() ||
      `Apertura de turno registrada a las ${formatBogotaTime()} (America/Bogota)`;

    const nueva = abrirSesionCaja(sedeActiva, vendedorNombre, baseEntera, obs);
    setTurnoRecienAbierto(nueva);
    setTurnoRecienCerrado(null);
    setCuadreRevelado(false);
    setSubcategoriaActiva('RESUMEN');
    setObservacionAperturaInput('');

    if (import.meta.env.MODE !== 'test') {
      try {
        const ubicacionId = await resolverUbicacionId(sedeActiva);
        const backend = await asegurarSesionCaja(ubicacionId, baseEntera, obs);
        if (backend?.id) {
          vincularSesionCajaBackend(nueva.id, backend.id);
        }
      } catch (error) {
        const mensaje = error instanceof Error ? error.message : 'Error desconocido';
        setErrorValidacion(
          `Caja local abierta, pero el backend no confirmó: ${mensaje}. Las ventas no se asentarán hasta reconciliar.`
        );
      }
    }
  };

  // Acción: Registrar Movimiento de Efectivo (Retiro / Gasto / Reintegro)
  const handleRegistrarRetiro = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorValidacion(null);

    if (!sesionAbierta) {
      setErrorValidacion('Debes abrir un turno de caja antes de registrar movimientos.');
      return;
    }

    const monto = Math.max(0, Math.trunc(montoRetiroInput));
    if (monto <= 0) {
      setErrorValidacion('El monto debe ser un número entero mayor a cero.');
      return;
    }

    const esIngreso = tipoRetiroInput === 'INGRESO_REINTEGRO';

    if (!esIngreso && monto > resumen.efectivoEsperadoCop) {
      setErrorValidacion(
        `El monto a retirar (${formatCOP(monto)}) no puede superar el efectivo disponible en caja (${formatCOP(resumen.efectivoEsperadoCop)})`
      );
      return;
    }

    if (!motivoRetiroInput.trim()) {
      setErrorValidacion('Debes ingresar el motivo o concepto del movimiento de caja.');
      return;
    }

    const actualizada = registrarMovimientoCaja(sesionAbierta.id, {
      tipo: tipoRetiroInput,
      montoCop: monto,
      motivo: motivoRetiroInput.trim(),
      usuario: sesionAbierta.vendedor,
    });

    const ultimoMov = actualizada?.movimientos[actualizada.movimientos.length - 1];
    setMensajeRetiroExito(
      esIngreso
        ? `Reintegro / Ingreso ${ultimoMov?.comprobanteRef || ''} por ${formatCOP(monto)} registrado en gaveta correctamente.`
        : `Retiro ${ultimoMov?.comprobanteRef || ''} por ${formatCOP(monto)} registrado correctamente.`
    );
    setTimeout(() => setMensajeRetiroExito(null), 4000);
  };

  // Acción: Anular Movimiento de Efectivo
  const handleAnularMovimiento = (mov: MovimientoCaja) => {
    if (!sesionAbierta) return;
    const motivo =
      motivoAnulacionInput.trim() || 'Anulado por el cajero — Dinero devuelto a la gaveta';
    anularMovimientoCaja(sesionAbierta.id, mov.id, motivo);

    const esRetiro = mov.tipo !== 'INGRESO_REINTEGRO';
    setMensajeRetiroExito(
      esRetiro
        ? `Retiro ${mov.comprobanteRef} por ${formatCOP(mov.montoCop)} fue ANULADO y los fondos han vuelto a la gaveta.`
        : `Ingreso ${mov.comprobanteRef} por ${formatCOP(mov.montoCop)} fue ANULADO.`
    );
    setTimeout(() => setMensajeRetiroExito(null), 5000);
  };

  // Controles de denominaciones de billetes
  const handleCambiarCantidadBillete = (valor: number, delta: number) => {
    setModoConteoDirecto(false);
    setConteoBilletes((prev) => ({
      ...prev,
      [valor]: Math.max(0, (prev[valor] || 0) + delta),
    }));
  };

  const handleSetCantidadDirecta = (valor: number, strVal: string) => {
    setModoConteoDirecto(false);
    const parsed = sanitizePositiveInt(strVal);
    setConteoBilletes((prev) => ({ ...prev, [valor]: parsed }));
  };

  const handleSimularConteoExacto = () => {
    setModoConteoDirecto(false);
    let resto = Math.max(0, resumen.efectivoEsperadoCop);
    const mapa: Record<number, number> = {};
    for (const d of DENOMINACIONES_COP) {
      const cant = Math.floor(resto / d.valor);
      mapa[d.valor] = cant;
      resto -= cant * d.valor;
    }
    setConteoBilletes(mapa);
    setMonedasCopTotal(resto);
    setEfectivoContadoDirecto(resumen.efectivoEsperadoCop);
  };

  const handlePonerEnCero = () => {
    setConteoBilletes({
      100000: 0,
      50000: 0,
      20000: 0,
      10000: 0,
      5000: 0,
      2000: 0,
    });
    setMonedasCopTotal(0);
    setEfectivoContadoDirecto(0);
  };

  // Acción: Confirmar Arqueo y Cerrar Turno
  const handleConfirmarArqueoYCerrar = async () => {
    if (!sesionAbierta) return;
    setErrorValidacion(null);

    const mapaDenominaciones: Record<string, number> = {};
    for (const d of DENOMINACIONES_COP) {
      mapaDenominaciones[String(d.valor)] = conteoBilletes[d.valor] || 0;
    }
    if (monedasCopTotal > 0) {
      mapaDenominaciones['MONEDAS'] = monedasCopTotal;
    }

    const obsCierre =
      observacionCierreInput.trim() ||
      (diferenciaArqueoCop === 0
        ? 'Cuadre exacto verificado al cierre de turno'
        : `Diferencia de ${formatCOP(diferenciaArqueoCop)} registrada al cierre`);

    if (import.meta.env.MODE !== 'test') {
      try {
        const ubicacionId = await resolverUbicacionId(sedeActiva);
        const backendId = sesionAbierta.backendSesionCajaId;
        if (backendId) {
          await cerrarSesionBackend(backendId, efectivoFisicoDeclaradoCop, obsCierre);
        } else {
          const activa = await obtenerSesionActiva(ubicacionId);
          if (activa?.id) {
            await cerrarSesionBackend(activa.id, efectivoFisicoDeclaradoCop, obsCierre);
          }
        }
      } catch (error) {
        const mensaje = error instanceof Error ? error.message : 'Error desconocido';
        setErrorValidacion(
          `No se pudo cerrar la caja en el backend: ${mensaje}. Reintenta antes de cerrar el turno local.`
        );
        return;
      }
    }

    const cerrada = cerrarSesionCaja(
      sesionAbierta.id,
      efectivoFisicoDeclaradoCop,
      obsCierre,
      mapaDenominaciones
    );

    if (cerrada) {
      setTurnoRecienCerrado(cerrada);
      setTurnoRecienAbierto(null);
      setCuadreRevelado(true);
      handlePonerEnCero();
      setObservacionCierreInput('');
      setObservacionAperturaInput('');
      setBaseAperturaInput(0);
    }
  };

  return (
    <div className="min-h-full lg:h-full w-full overflow-y-auto bg-[#F4EFEA] text-[#1C1311] rounded-2xl border border-[#D8CFC6] shadow-inner p-2.5 sm:p-5 select-none font-sans">
      {/* =========================================================================
          CABECERA PRINCIPAL DE TURNO Y CAJA
      ========================================================================= */}
      <header className="bg-white rounded-2xl border-2 border-[#E2D9CE] shadow-sm p-4 sm:p-5 mb-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#661521] text-white flex items-center justify-center shrink-0 shadow-md">
              {sesionAbierta ? (
                <Unlock className="w-6 h-6 text-emerald-300" />
              ) : (
                <Lock className="w-6 h-6 text-[#D19650]" />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-[#1C1311] text-[#D19650] font-mono text-xs font-black uppercase tracking-wider">
                  {sesionAbierta
                    ? `Turno #${sesionAbierta.turnoNumero}`
                    : `Próximo Turno #${(sesionesSede[0]?.turnoNumero || 0) + 1}`}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-extrabold uppercase ${
                    sesionAbierta
                      ? 'bg-emerald-100 text-[#059669] border border-emerald-300'
                      : 'bg-amber-100 text-rose-800 border border-amber-300'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      sesionAbierta ? 'bg-[#059669] animate-pulse' : 'bg-rose-600'
                    }`}
                  />
                  {sesionAbierta
                    ? 'Caja Abierta · Turno Activo'
                    : 'Caja Cerrada · Requiere Apertura'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[#1C1311] tracking-tight mt-3 leading-tight">
                Control de Caja y Arqueo Ciego
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-xs bg-[#FAF7F4] px-3.5 py-2.5 rounded-xl border border-[#E5DDD3]">
            <div className="flex items-center gap-1.5 font-bold text-[#1C1311]">
              <User className="w-4 h-4 text-[#661521]" />
              <span>Cajero: {sesionAbierta ? sesionAbierta.vendedor : vendedorNombre}</span>
            </div>
            <span className="text-stone-300">|</span>
            <div className="flex items-center gap-1.5 font-semibold text-stone-700">
              <MapPin className="w-4 h-4 text-[#D19650]" />
              <span>{sedeActiva}</span>
            </div>
            <span className="text-stone-300">|</span>
            <div className="flex items-center gap-1.5 font-mono text-stone-600">
              <Clock className="w-4 h-4 text-[#059669]" />
              <span>
                {sesionAbierta
                  ? `Apertura: ${formatBogotaDateTime(sesionAbierta.aperturaIso)} (America/Bogota)`
                  : `Hora Bogotá: ${horaActualBogota}`}
              </span>
            </div>
          </div>
        </div>

        {/* PESTAÑAS DE LAS 4 SUBCATEGORÍAS (CUANDO LA CAJA ESTÁ ABIERTA) */}
        {sesionAbierta && (
          <div
            className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-4 pt-4 border-t border-[#EFEAE4]"
            role="tablist"
            aria-label="Subcategorías de Turno y Caja"
          >
            {(
              [
                { id: 'RESUMEN', label: '1. Resumen de Gaveta', icon: Vault },
                { id: 'MOVIMIENTOS', label: '2. Movimientos de Efectivo', icon: ArrowUpRight },
                { id: 'ARQUEO', label: '3. Cierre y Arqueo de Turno', icon: Calculator },
                { id: 'HISTORIAL', label: '4. Historial de Turnos', icon: History },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const activa = subcategoriaActiva === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activa}
                  onClick={() => setSubcategoriaActiva(tab.id)}
                  className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 border cursor-pointer ${
                    activa
                      ? 'bg-[#661521] text-white border-[#661521] shadow-sm'
                      : 'bg-[#FAF7F4] text-stone-700 border-[#D8CFC6] hover:bg-stone-200/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${activa ? 'text-[#D19650]' : 'text-stone-500'}`} />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Banner de Error de Validación */}
      {errorValidacion && (
        <div className="mb-5 p-4 rounded-xl bg-red-50 border-2 border-[#661521] text-[#661521] flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span className="text-xs sm:text-sm font-bold">{errorValidacion}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorValidacion(null)}
            className="px-2.5 py-1 rounded bg-[#661521] text-white text-xs font-bold"
          >
            Entendido
          </button>
        </div>
      )}

      {/* =========================================================================
          ESTADO A: CAJA CERRADA (!sesionAbierta) — VISTA EJECUTIVA DE APERTURA
      ========================================================================= */}
      {!sesionAbierta ? (
        <div className="space-y-6">
          {/* Si se acaba de cerrar un turno, mostrar el Ticket / Factura de Cierre de Turno con WhatsApp e Impresión */}
          {turnoRecienCerrado && (
            <section className="bg-white rounded-2xl border-2 border-[#059669] p-5 shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EFEAE4]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#059669] flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="px-2 py-0.5 rounded bg-[#059669] text-white font-mono text-[10px] font-black uppercase">
                      Turno #{turnoRecienCerrado.turnoNumero} Sellado
                    </span>
                    <h2 className="text-base sm:text-lg font-black text-[#1C1311]">
                      Resultado del Cuadre de Caja · Factura de Cierre de Turno
                    </h2>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="min-h-[42px] px-4 rounded-xl bg-[#1C1311] text-white font-bold text-xs flex items-center gap-2 hover:bg-stone-800 cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-[#D19650]" />
                    <span>Imprimir Ticket de Cierre</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-[#FAF7F4] border border-[#D8CFC6]">
                  <span className="text-stone-500 font-bold block uppercase text-[10px]">
                    Efectivo Esperado en Gaveta
                  </span>
                  <p className="text-lg font-black font-mono text-[#1C1311] mt-0.5">
                    {formatCOP(turnoRecienCerrado.efectivoEsperadoCop ?? 0)} COP
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FAF7F4] border border-[#D8CFC6]">
                  <span className="text-stone-500 font-bold block uppercase text-[10px]">
                    Efectivo Físico Contado
                  </span>
                  <p className="text-lg font-black font-mono text-[#1C1311] mt-0.5">
                    {formatCOP(turnoRecienCerrado.efectivoContadoCop ?? 0)} COP
                  </p>
                </div>

                <div
                  className={`p-3.5 rounded-xl border-2 ${
                    (turnoRecienCerrado.diferenciaCop ?? 0) === 0
                      ? 'bg-emerald-50 border-[#059669] text-[#059669]'
                      : (turnoRecienCerrado.diferenciaCop ?? 0) > 0
                      ? 'bg-amber-50 border-[#D19650] text-amber-900'
                      : 'bg-red-50 border-[#661521] text-[#661521]'
                  }`}
                >
                  <span className="font-extrabold block uppercase text-[10px]">
                    Diferencia de Cuadre
                  </span>
                  <p className="text-lg font-black font-mono mt-0.5">
                    {(turnoRecienCerrado.diferenciaCop ?? 0) === 0
                      ? '$0 COP — Cuadre Exacto'
                      : (turnoRecienCerrado.diferenciaCop ?? 0) > 0
                      ? `+${formatCOP(turnoRecienCerrado.diferenciaCop ?? 0)} (Sobrante)`
                      : `${formatCOP(turnoRecienCerrado.diferenciaCop ?? 0)} (Faltante)`}
                  </p>
                </div>
              </div>

              {/* Envío del Ticket de Cierre por WhatsApp */}
              <div className="p-3.5 rounded-xl bg-[#FAF7F4] border border-[#D8CFC6] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <label className="block text-[11px] font-bold uppercase text-stone-600 mb-1">
                    Enviar Comprobante de Cierre por WhatsApp (+57):
                  </label>
                  <input
                    type="tel"
                    value={telefonoWhatsApp}
                    onChange={(e) => setTelefonoWhatsApp(e.target.value)}
                    placeholder="3124508899"
                    className="w-full sm:max-w-xs px-3 py-2 rounded-xl bg-white border border-[#D8CFC6] font-mono text-xs font-bold text-[#1C1311]"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => enviarPorWhatsApp(turnoRecienCerrado, 'CIERRE')}
                  className="min-h-[44px] px-5 rounded-xl bg-[#25D366] hover:bg-[#1ebe57] text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Enviar Ticket de Cierre por WhatsApp</span>
                </button>
              </div>
            </section>
          )}

          {/* TARJETA CENTRAL EJECUTIVA: APERTURA DE TURNO DE CAJA */}
          <section className="max-w-2xl mx-auto bg-white rounded-2xl border-2 border-[#D19650] shadow-md overflow-hidden">
            <div className="bg-[#1C1311] p-5 text-white border-b border-[#D19650]/30 flex items-center justify-between gap-3">
              <div>
                <span className="px-2.5 py-0.5 rounded bg-[#661521] text-[#D19650] font-mono text-xs font-black uppercase">
                  Apertura Obligatoria de Caja
                </span>
                <h2 className="text-lg sm:text-xl font-black mt-1">
                  Apertura de Turno de Caja
                </h2>
                <p className="text-xs text-[#E7DED2]/80 mt-0.5">
                  Registra la base inicial en efectivo con la que recibes la gaveta. Sin restricción horaria; se registra la hora exacta de Colombia.
                </p>
              </div>
              <Lock className="w-8 h-8 text-[#D19650] shrink-0" />
            </div>

            <form onSubmit={handleAbrirTurnoCaja} className="p-5 sm:p-6 space-y-4">
              {/* Metadatos en vivo de Apertura */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#FAF7F4] border border-[#E5DDD3]">
                  <span className="text-[10px] font-bold uppercase text-stone-500 block">
                    Sede Activa
                  </span>
                  <span className="font-black text-[#1C1311] mt-0.5 block">{sedeActiva}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#FAF7F4] border border-[#E5DDD3]">
                  <span className="text-[10px] font-bold uppercase text-stone-500 block">
                    Vendedor Responsable
                  </span>
                  <span className="font-black text-[#1C1311] mt-0.5 block">{vendedorNombre}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#FAF7F4] border border-[#E5DDD3]">
                  <span className="text-[10px] font-bold uppercase text-stone-500 block">
                    Hora Exacta (America/Bogota)
                  </span>
                  <span className="font-mono font-bold text-[#059669] mt-0.5 block">
                    {horaActualBogota}
                  </span>
                </div>
              </div>

              {/* Input numérico limpio de Base Inicial en COP (SIN botones predeterminados — QA-POS-017) */}
              <div>
                <label
                  htmlFor="base-inicial-apertura-input"
                  className="block text-xs font-bold uppercase text-[#1C1311] mb-1.5"
                >
                  Base Inicial de Caja en Efectivo (COP Entero):
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-lg font-black text-stone-500">
                    $
                  </span>
                  <input
                    id="base-inicial-apertura-input"
                    type="number"
                    min={0}
                    step={1000}
                    value={baseAperturaInput === 0 ? '' : baseAperturaInput}
                    onKeyDown={handleNumberKeyDown}
                    onChange={(e) => setBaseAperturaInput(sanitizePositiveInt(e.target.value))}
                    placeholder="Digita el monto contado en gaveta"
                    className="w-full min-h-[52px] pl-9 pr-4 rounded-xl border-2 border-[#D8CFC6] bg-[#FAF7F4] font-mono text-xl font-black text-[#1C1311] focus:outline-none focus:border-[#661521]"
                  />
                </div>
                <span className="text-[11px] text-stone-500 mt-1 block">
                  Monto declarado: <strong className="font-mono text-[#1C1311]">{formatCOP(baseAperturaInput)} COP</strong>
                </span>
              </div>

              {/* Observación de apertura */}
              <div>
                <label
                  htmlFor="obs-apertura-input"
                  className="block text-xs font-bold uppercase text-[#1C1311] mb-1.5"
                >
                  Observación de Apertura:
                </label>
                <input
                  id="obs-apertura-input"
                  type="text"
                  value={observacionAperturaInput}
                  onChange={(e) => setObservacionAperturaInput(e.target.value)}
                  placeholder="Ej. Base verificada en sencillo para vueltas..."
                  className="w-full min-h-[46px] px-3.5 rounded-xl border-2 border-[#D8CFC6] bg-[#FAF7F4] text-xs font-medium text-[#1C1311] focus:outline-none focus:border-[#661521]"
                />
              </div>

              <button
                type="submit"
                className="w-full min-h-[54px] px-5 rounded-xl bg-[#059669] hover:bg-emerald-700 text-white font-black text-sm sm:text-base shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Unlock className="w-5 h-5" />
                <span>Abrir Turno de Caja</span>
              </button>
            </form>
          </section>

          {/* HISTORIAL DE TURNOS ANTERIORES DE LA SEDE (VISIBLE DEBAJO CUANDO LA CAJA ESTÁ CERRADA) */}
          <section className="bg-white rounded-2xl border-2 border-[#E2D9CE] shadow-sm p-4 sm:p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFEAE4] mb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-[#661521]" />
                <h3 className="text-base font-black text-[#1C1311]">
                  Historial de Turnos Anteriores — {sedeActiva} ({sesionesSede.length})
                </h3>
              </div>
            </div>

            {sesionesSede.length === 0 ? (
              <p className="text-xs text-stone-500 py-6 text-center font-medium">
                Aún no se han registrado turnos de caja en {sedeActiva}.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#FAF7F4] border-b border-[#E5DDD3] text-stone-600 font-extrabold uppercase text-[11px]">
                      <th className="py-2.5 px-3">Turno</th>
                      <th className="py-2.5 px-3">Vendedor</th>
                      <th className="py-2.5 px-3">Apertura (Bogotá)</th>
                      <th className="py-2.5 px-3">Cierre (Bogotá)</th>
                      <th className="py-2.5 px-3 text-right">Base Inicial</th>
                      <th className="py-2.5 px-3 text-right">Esperado</th>
                      <th className="py-2.5 px-3 text-right">Contado</th>
                      <th className="py-2.5 px-3 text-right">Diferencia</th>
                      <th className="py-2.5 px-3 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFEAE4]">
                    {sesionesSede.map((s) => (
                      <tr
                        key={s.id}
                        onClick={() => setSesionSeleccionadaDrawer(s)}
                        className="hover:bg-[#FAF7F4] cursor-pointer"
                      >
                        <td className="py-2.5 px-3 font-mono font-black text-[#1C1311]">
                          Turno #{s.turnoNumero}
                        </td>
                        <td className="py-2.5 px-3 font-semibold">{s.vendedor}</td>
                        <td className="py-2.5 px-3 font-mono">{formatBogotaDateTime(s.aperturaIso)}</td>
                        <td className="py-2.5 px-3 font-mono">{formatBogotaDateTime(s.cierreIso)}</td>
                        <td className="py-2.5 px-3 text-right font-mono">{formatCOP(s.baseInicialCop)}</td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          {formatCOP(s.efectivoEsperadoCop ?? resumenSesion(s).efectivoEsperadoCop)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          {s.efectivoContadoCop !== undefined ? formatCOP(s.efectivoContadoCop) : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">
                          {s.diferenciaCop !== undefined ? formatCOP(s.diferenciaCop) : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSesionSeleccionadaDrawer(s);
                            }}
                            className="px-2.5 py-1 rounded-lg border border-[#D8CFC6] bg-white text-[#661521] font-bold hover:bg-[#661521] hover:text-white transition-colors"
                          >
                            Ver Acta
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      ) : (
        /* =========================================================================
           ESTADO B: CAJA ABIERTA (sesionAbierta) — 4 SUBCATEGORÍAS
        ========================================================================= */
        <div className="space-y-5">
          {/* Banner de Comprobante Digital si se acaba de abrir el turno */}
          {turnoRecienAbierto && (
            <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-[#059669] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-[#059669] shrink-0" />
                <div className="text-xs">
                  <span className="font-black text-[#1C1311] block">
                    ¡Turno #{sesionAbierta.turnoNumero} abierto a las {formatBogotaDateTime(sesionAbierta.aperturaIso)}!
                  </span>
                  <span className="text-stone-600">
                    Base Inicial registrada: <strong>{formatCOP(sesionAbierta.baseInicialCop)} COP</strong>. Puedes enviar el comprobante digital por WhatsApp.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => enviarPorWhatsApp(sesionAbierta, 'APERTURA')}
                className="min-h-[40px] px-4 rounded-xl bg-[#25D366] hover:bg-[#1ebe57] text-white font-black text-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Enviar Comprobante de Apertura por WhatsApp</span>
              </button>
            </div>
          )}

          {/* =====================================================================
              SUBCATEGORÍA 1: 1. RESUMEN DE GAVETA (KPIs + DESGLOSE + WHATSAPP)
          ===================================================================== */}
          <div className={subcategoriaActiva === 'RESUMEN' ? 'block space-y-5' : 'hidden'}>
            {/* 4 KPIs Superiores */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="p-4 rounded-2xl bg-white border-2 border-[#E2D9CE] shadow-2xs">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block">
                  Base Inicial Declarada
                </span>
                <span className="sr-only">Base Inicial de Caja</span>
                <p className="text-xl font-black font-mono text-[#1C1311] mt-1">
                  {formatCOP(sesionAbierta.baseInicialCop)} COP
                </p>
                <p className="text-[11px] text-stone-500 mt-0.5 truncate">
                  {sesionAbierta.observacionApertura || 'Verificada al abrir turno'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border-2 border-[#E2D9CE] shadow-2xs">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block">
                  Ventas Efectivo Netas (En Gaveta)
                </span>
                <p className="text-xl font-black font-mono text-[#059669] mt-1">
                  {formatCOP(resumen.ventasEfectivoCop)} COP
                </p>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Transferencias QR: {formatCOP(resumen.ventasTransferenciaCop)} ({resumen.numeroVentas} ventas)
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border-2 border-[#E2D9CE] shadow-2xs">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block">
                  Ingresos / Retiros Operativos
                </span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-sm font-black font-mono text-[#059669]">
                    +{formatCOP(resumen.ingresosCop + resumen.excedentesCambiosEfectivoCop)}
                  </span>
                  <span className="text-sm font-black font-mono text-[#661521]">
                    -{formatCOP(resumen.retirosCop + resumen.reintegrosCambiosEfectivoCop)}
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Excedentes, reintegros y sangrías a caja fuerte
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#1C1311] text-white border-2 border-[#D19650] shadow-md">
                <span className="text-xs font-bold uppercase tracking-wider text-[#D19650] block">
                  Efectivo Esperado en Gaveta
                </span>
                <p className="text-xl font-black font-mono text-emerald-300 mt-1">
                  {formatCOP(resumen.efectivoEsperadoCop)} COP
                </p>
                <p className="text-[11px] text-[#E7DED2]/80 mt-0.5">
                  Saldo físico disponible en tiempo real
                </p>
              </div>
            </div>

            {/* Desglose Contable Transparente (QA-POS-022) + Tarjeta Lateral WhatsApp (QA-POS-017) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              <section className="lg:col-span-7 bg-white rounded-2xl border-2 border-[#E2D9CE] shadow-sm p-5 space-y-3">
                <div className="pb-2.5 border-b border-[#EFEAE4] flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase text-[#661521]">
                      Trazabilidad Contable de Efectivo
                    </span>
                    <h2 className="text-base font-black text-[#1C1311]">
                      Desglose Contable Transparente de Gaveta
                    </h2>
                  </div>
                  <Vault className="w-5 h-5 text-[#059669]" />
                </div>

                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex items-center justify-between py-1.5 border-b border-stone-100">
                    <span className="text-stone-600 font-medium">Efectivo Recibido de Clientes:</span>
                    <span className="font-mono font-bold text-[#1C1311]">
                      {formatCOP(resumen.efectivoRecibidoBrutoCop)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-stone-100">
                    <span className="text-stone-600 font-medium">(-) Cambio / Vueltos Entregados:</span>
                    <span className="font-mono font-bold text-rose-700">
                      -{formatCOP(resumen.vueltosEntregadosCop)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
                    <span className="font-bold text-emerald-950">
                      (=) Ingreso Neto por Ventas en Efectivo:
                    </span>
                    <span className="font-mono font-black text-[#059669]">
                      {formatCOP(resumen.ventasEfectivoCop)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-stone-100">
                    <span className="text-stone-600 font-medium">(+) Base Inicial:</span>
                    <span className="font-mono font-bold text-[#1C1311]">
                      {formatCOP(sesionAbierta.baseInicialCop)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-stone-100">
                    <span className="text-stone-600 font-medium">(+) Excedentes de Cambios / Ingresos:</span>
                    <span className="font-mono font-bold text-[#059669]">
                      {formatCOP(resumen.excedentesCambiosEfectivoCop + resumen.ingresosCop)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-stone-100">
                    <span className="text-stone-600 font-medium">
                      (-) Retiros a Caja Fuerte / Gastos / Reintegros:
                    </span>
                    <span className="font-mono font-bold text-[#661521]">
                      -{formatCOP(resumen.retirosCop + resumen.reintegrosCambiosEfectivoCop)}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#1C1311] text-white border border-[#D19650] flex items-center justify-between mt-2">
                    <span className="font-black text-xs sm:text-sm text-[#D19650] uppercase">
                      (=) SALDO EFECTIVO DISPONIBLE EN GAVETA
                    </span>
                    <span className="font-mono text-lg sm:text-xl font-black text-white">
                      {formatCOP(resumen.efectivoEsperadoCop)}
                    </span>
                  </div>
                </div>
              </section>

              {/* Tarjeta lateral: Ticket de Turno por WhatsApp (QA-POS-017) */}
              <section className="lg:col-span-5 bg-white rounded-2xl border-2 border-[#E2D9CE] shadow-sm p-5 space-y-3.5">
                <div className="pb-2.5 border-b border-[#EFEAE4] flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase text-[#059669]">
                      Comprobante Digital Instantáneo
                    </span>
                    <h2 className="text-base font-black text-[#1C1311]">
                      Ticket de Turno por WhatsApp
                    </h2>
                  </div>
                  <MessageSquare className="w-5 h-5 text-[#25D366]" />
                </div>

                <p className="text-xs text-stone-600 leading-relaxed">
                  Envía el comprobante de apertura o el estado actual de la gaveta con hora oficial de Colombia al celular del administrador o del vendedor.
                </p>

                <div>
                  <label
                    htmlFor="whatsapp-turno-input"
                    className="block text-xs font-bold uppercase text-stone-700 mb-1"
                  >
                    Número de Celular WhatsApp (+57):
                  </label>
                  <input
                    id="whatsapp-turno-input"
                    type="tel"
                    value={telefonoWhatsApp}
                    onChange={(e) => setTelefonoWhatsApp(e.target.value)}
                    placeholder="3124508899"
                    className="w-full min-h-[46px] px-3.5 rounded-xl bg-[#FAF7F4] border-2 border-[#D8CFC6] font-mono text-sm font-black text-[#1C1311] focus:outline-none focus:border-[#661521]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => enviarPorWhatsApp(sesionAbierta, 'APERTURA')}
                    className="min-h-[44px] px-3 py-2 rounded-xl bg-[#25D366] hover:bg-[#1ebe57] text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Ticket Apertura WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => enviarPorWhatsApp(sesionAbierta, 'ESTADO')}
                    className="min-h-[44px] px-3 py-2 rounded-xl bg-[#1C1311] hover:bg-stone-800 text-[#D19650] font-black text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Receipt className="w-4 h-4" />
                    <span>Estado Actual WhatsApp</span>
                  </button>
                </div>
              </section>
            </div>
          </div>

          {/* =====================================================================
              SUBCATEGORÍA 2: 2. MOVIMIENTOS DE EFECTIVO
          ===================================================================== */}
          <div className={subcategoriaActiva === 'MOVIMIENTOS' ? 'block' : 'hidden'}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Formulario de Registro de Movimientos */}
              <section className="lg:col-span-5 bg-white rounded-2xl border-2 border-[#E2D9CE] shadow-sm p-4 sm:p-5 space-y-4">
                <div className="pb-2 border-b border-[#EFEAE4] flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-[#661521]/10 text-[#661521] flex items-center justify-center">
                    <Vault className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase text-[#661521]">
                      Seguridad y Control
                    </span>
                    <h2 className="text-base font-black text-[#1C1311]">
                      Movimientos de Efectivo en Gaveta
                    </h2>
                  </div>
                </div>

                {/* Panel Informativo: Efectivo Disponible en Gaveta */}
                <div className="p-3.5 rounded-xl bg-[#FAF7F4] border-2 border-[#D8CFC6]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-600">
                      Efectivo Disponible en Gaveta
                    </span>
                    <Vault className="w-4 h-4 text-[#059669]" />
                  </div>
                  <p className="text-xl sm:text-2xl font-black font-mono text-[#059669] mt-1">
                    {formatCOP(resumen.efectivoEsperadoCop)} COP
                  </p>
                </div>

                <form onSubmit={handleRegistrarRetiro} className="space-y-3">
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setTipoRetiroInput('RETIRO_CAJA_FUERTE')}
                      className={`min-h-[44px] px-1.5 rounded-xl text-[11px] font-bold border-2 transition-all flex flex-col items-center justify-center text-center gap-0.5 ${
                        tipoRetiroInput === 'RETIRO_CAJA_FUERTE'
                          ? 'bg-[#661521] text-white border-[#661521]'
                          : 'bg-[#FAF7F4] text-stone-700 border-[#D8CFC6]'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>Caja Fuerte</span>
                      </div>
                      <span className="text-[9px] opacity-80">(Resta)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTipoRetiroInput('GASTO_MENOR')}
                      className={`min-h-[44px] px-1.5 rounded-xl text-[11px] font-bold border-2 transition-all flex flex-col items-center justify-center text-center gap-0.5 ${
                        tipoRetiroInput === 'GASTO_MENOR'
                          ? 'bg-[#1C1311] text-[#D19650] border-[#1C1311]'
                          : 'bg-[#FAF7F4] text-stone-700 border-[#D8CFC6]'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <ArrowDownRight className="w-3.5 h-3.5" />
                        <span>Gasto Menor</span>
                      </div>
                      <span className="text-[9px] opacity-80">(Resta)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTipoRetiroInput('INGRESO_REINTEGRO')}
                      className={`min-h-[44px] px-1.5 rounded-xl text-[11px] font-bold border-2 transition-all flex flex-col items-center justify-center text-center gap-0.5 ${
                        tipoRetiroInput === 'INGRESO_REINTEGRO'
                          ? 'bg-[#059669] text-white border-[#059669]'
                          : 'bg-[#FAF7F4] text-stone-700 border-[#D8CFC6]'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reintegro</span>
                      </div>
                      <span className="text-[9px] opacity-80">(Suma)</span>
                    </button>
                  </div>

                  {/* Input numérico limpio sin presets 100k/200k/300k/500k */}
                  <div>
                    <label
                      htmlFor="monto-retiro-input"
                      className="block text-xs font-bold uppercase text-stone-700 mb-1"
                    >
                      {tipoRetiroInput === 'INGRESO_REINTEGRO'
                        ? 'Monto a Reingresar a Gaveta (COP):'
                        : 'Monto a Retirar de Gaveta (COP):'}
                    </label>
                    <input
                      id="monto-retiro-input"
                      type="number"
                      step={1000}
                      min={0}
                      value={montoRetiroInput || ''}
                      onKeyDown={handleNumberKeyDown}
                      onChange={(e) => setMontoRetiroInput(sanitizePositiveInt(e.target.value))}
                      placeholder="Digita el monto en COP..."
                      className={`w-full min-h-[48px] px-3.5 rounded-xl bg-[#FAF7F4] border-2 font-mono text-lg font-black text-[#1C1311] focus:outline-none ${
                        excedeEfectivoDisponible
                          ? 'border-rose-500 bg-rose-50/50 text-rose-800 focus:border-rose-600'
                          : 'border-[#D8CFC6] focus:border-[#661521]'
                      }`}
                    />
                  </div>

                  {/* Alerta estricta si el monto a retirar supera el disponible */}
                  {excedeEfectivoDisponible && (
                    <div className="p-3 rounded-xl bg-red-50 border-2 border-red-500 text-red-700 text-xs font-bold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                      <span>
                        El monto a retirar ({formatCOP(montoRetiroInput)}) no puede superar el efectivo disponible en caja ({formatCOP(resumen.efectivoEsperadoCop)})
                      </span>
                    </div>
                  )}

                  {/* Motivo */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-stone-700 mb-1">
                      {tipoRetiroInput === 'INGRESO_REINTEGRO'
                        ? 'Concepto / Motivo del Reintegro o Ingreso:'
                        : 'Concepto / Motivo del Retiro:'}
                    </label>
                    <input
                      type="text"
                      value={motivoRetiroInput}
                      onChange={(e) => setMotivoRetiroInput(e.target.value)}
                      placeholder={
                        tipoRetiroInput === 'INGRESO_REINTEGRO'
                          ? 'Ej. Reintegro por error en retiro previo / Devolución de cambio...'
                          : 'Ej. Traslado a caja fuerte por seguridad...'
                      }
                      className="w-full min-h-[46px] px-3 rounded-xl bg-[#FAF7F4] border-2 border-[#D8CFC6] text-xs font-medium text-[#1C1311] focus:outline-none focus:border-[#661521]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={montoRetiroInput <= 0 || excedeEfectivoDisponible}
                    className={`w-full min-h-[50px] px-4 rounded-xl text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                      tipoRetiroInput === 'INGRESO_REINTEGRO'
                        ? 'bg-[#059669] hover:bg-emerald-700'
                        : 'bg-[#661521] hover:bg-[#52101a]'
                    }`}
                  >
                    {tipoRetiroInput === 'INGRESO_REINTEGRO' ? (
                      <>
                        <RotateCcw className="w-4 h-4 text-emerald-200" />
                        <span>Registrar Reintegro / Ingreso ({formatCOP(montoRetiroInput)})</span>
                      </>
                    ) : (
                      <>
                        <Vault className="w-4 h-4 text-[#D19650]" />
                        <span>Registrar Retiro ({formatCOP(montoRetiroInput)})</span>
                      </>
                    )}
                  </button>
                </form>

                {mensajeRetiroExito && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-[#059669] text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{mensajeRetiroExito}</span>
                  </div>
                )}
              </section>

              {/* Tabla / Bitácora de Movimientos del Turno */}
              <section className="lg:col-span-7 bg-white rounded-2xl border-2 border-[#E2D9CE] shadow-sm p-4 sm:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#EFEAE4]">
                  <div>
                    <span className="text-[11px] font-bold uppercase text-stone-500">
                      Auditoría de Gaveta
                    </span>
                    <h3 className="text-base font-black text-[#1C1311]">
                      Bitácora de Movimientos del Turno ({sesionAbierta.movimientos.length})
                    </h3>
                  </div>
                  <div className="w-full sm:w-64">
                    <input
                      type="text"
                      value={motivoAnulacionInput}
                      onChange={(e) => setMotivoAnulacionInput(e.target.value)}
                      placeholder="Motivo para anulaciones..."
                      className="w-full px-3 py-1.5 rounded-lg bg-[#FAF7F4] border border-[#D8CFC6] text-[11px] text-[#1C1311]"
                    />
                  </div>
                </div>

                {sesionAbierta.movimientos.length === 0 ? (
                  <p className="text-xs text-stone-500 py-8 text-center font-medium">
                    No se han registrado retiros, gastos ni reintegros en este turno.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                    {sesionAbierta.movimientos.map((r) => {
                      const esIngreso = r.tipo === 'INGRESO_REINTEGRO';
                      return (
                        <div
                          key={r.id}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all ${
                            r.anulado
                              ? 'bg-stone-100 border-stone-300 opacity-60'
                              : esIngreso
                              ? 'bg-emerald-50/70 border-emerald-200'
                              : 'bg-[#FAF7F4] border-[#E5DDD3]'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold ${
                                  esIngreso
                                    ? 'bg-[#059669] text-white'
                                    : 'bg-[#1C1311] text-[#D19650]'
                                }`}
                              >
                                {r.comprobanteRef}
                              </span>
                              <span className="text-stone-500 font-mono text-[11px]">
                                {formatBogotaTime(r.fechaIso)}
                              </span>
                              {r.anulado ? (
                                <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-black uppercase">
                                  Anulado · Fondos Devueltos
                                </span>
                              ) : esIngreso ? (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                  Reintegro a Gaveta
                                </span>
                              ) : null}
                            </div>
                            <p
                              className={`font-bold mt-0.5 truncate ${
                                r.anulado ? 'line-through text-stone-400' : 'text-[#1C1311]'
                              }`}
                            >
                              {r.motivo}
                            </p>
                            <span className="text-stone-500 text-[10px] block">
                              {esIngreso
                                ? 'Reintegro de Efectivo'
                                : r.tipo === 'RETIRO_CAJA_FUERTE'
                                ? 'Caja Fuerte'
                                : 'Gasto Menor'}{' '}
                              · Por: {r.usuario}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`font-mono text-sm font-black ${
                                r.anulado
                                  ? 'line-through text-stone-400'
                                  : esIngreso
                                  ? 'text-[#059669]'
                                  : 'text-[#661521]'
                              }`}
                            >
                              {esIngreso ? `+${formatCOP(r.montoCop)}` : `-${formatCOP(r.montoCop)}`}
                            </span>

                            <button
                              type="button"
                              onClick={() => setMovimientoSeleccionado(r)}
                              title="Ver detalle del movimiento"
                              className="p-1.5 rounded-lg border border-[#D8CFC6] bg-white hover:bg-stone-100 text-stone-700 text-[10px] font-bold"
                            >
                              <Eye className="w-3.5 h-3.5 text-stone-600" />
                            </button>

                            {!r.anulado && (
                              <button
                                type="button"
                                onClick={() => handleAnularMovimiento(r)}
                                className="px-2 py-1 rounded-lg border border-[#D8CFC6] bg-white hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700 text-stone-700 text-[10px] font-bold flex items-center gap-1 transition-all shadow-xs"
                              >
                                <RotateCcw className="w-3 h-3 text-[#661521]" />
                                <span>Anular</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          </div>

          {/* =====================================================================
              SUBCATEGORÍA 3: 3. CIERRE Y ARQUEO DE TURNO
          ===================================================================== */}
          <div className={subcategoriaActiva === 'ARQUEO' ? 'block' : 'hidden'}>
            <section className="bg-white rounded-2xl border-2 border-[#E2D9CE] shadow-sm p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#EFEAE4]">
                <div>
                  <span className="text-xs font-bold uppercase text-stone-500">Cierre de Turno</span>
                  <h2 className="text-base sm:text-lg font-black text-[#1C1311]">
                    Arqueo Ciego por Denominaciones
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSimularConteoExacto}
                    className="min-h-[38px] px-3 rounded-xl bg-[#FAF7F4] hover:bg-[#EFEAE4] border border-[#D8CFC6] text-xs font-bold text-[#1C1311] flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Cargar conteo exacto"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#D19650]" />
                    <span>Conteo Exacto</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePonerEnCero}
                    className="min-h-[38px] px-3 rounded-xl bg-[#FAF7F4] hover:bg-red-50 border border-[#D8CFC6] text-xs font-bold text-[#661521] flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>En Cero</span>
                  </button>
                </div>
              </div>

              {/* Opción de Digitación Directa del Efectivo Contado */}
              <div className="p-3.5 rounded-xl bg-[#FAF7F4] border border-[#D8CFC6] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <label
                    htmlFor="efectivo-contado-directo-input"
                    className="block text-xs font-bold uppercase text-[#1C1311]"
                  >
                    Digitación Directa del Efectivo Físico Contado (COP):
                  </label>
                  <span className="text-[11px] text-stone-500">
                    Puedes digitar el total directamente o usar el conteo de billetes inferior.
                  </span>
                </div>
                <input
                  id="efectivo-contado-directo-input"
                  type="number"
                  min={0}
                  step={1000}
                  value={modoConteoDirecto ? efectivoContadoDirecto || '' : efectivoPorDenominacionesCop || ''}
                  onKeyDown={handleNumberKeyDown}
                  onChange={(e) => {
                    setModoConteoDirecto(true);
                    setEfectivoContadoDirecto(sanitizePositiveInt(e.target.value));
                  }}
                  placeholder="0"
                  className="w-full sm:w-56 min-h-[44px] px-3.5 rounded-xl bg-white border-2 border-[#1C1311] font-mono text-base font-black text-right text-[#1C1311]"
                />
              </div>

              {/* Grilla de Denominaciones de Billetes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {DENOMINACIONES_COP.map((den) => {
                  const cantidad = conteoBilletes[den.valor] || 0;
                  const subtotal = den.valor * cantidad;

                  return (
                    <div
                      key={den.valor}
                      className="p-3 rounded-xl bg-[#FAF7F4] border-2 border-[#E5DDD3] flex flex-col justify-between gap-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded font-mono text-xs font-black ${den.colorBadge}`}>
                          {formatCOP(den.valor)}
                        </span>
                        <span className="font-mono text-xs font-bold text-stone-600">
                          Total: <strong className="text-[#1C1311]">{formatCOP(subtotal)}</strong>
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-1">
                        <span className="text-xs font-bold text-[#1C1311]">{den.etiqueta}</span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={cantidad <= 0}
                            onClick={() => handleCambiarCantidadBillete(den.valor, -1)}
                            className="w-9 h-9 rounded-xl bg-white border border-[#D8CFC6] hover:border-[#661521] flex items-center justify-center text-[#1C1311] font-black disabled:opacity-40"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          <input
                            type="number"
                            min={0}
                            value={cantidad}
                            onKeyDown={handleNumberKeyDown}
                            onChange={(e) => handleSetCantidadDirecta(den.valor, e.target.value)}
                            className="w-14 h-9 text-center rounded-xl bg-white border-2 border-[#1C1311] font-mono text-sm font-black text-[#1C1311]"
                          />

                          <button
                            type="button"
                            onClick={() => handleCambiarCantidadBillete(den.valor, 1)}
                            className="w-9 h-9 rounded-xl bg-[#1C1311] text-[#D19650] flex items-center justify-center font-black hover:bg-stone-800"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Monedas */}
              <div className="p-3 rounded-xl bg-[#FAF7F4] border-2 border-[#E5DDD3] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-[#1C1311] block">Total en Monedas Metálicas</span>
                  <span className="text-stone-500 text-[11px]">
                    Valor acumulado en monedas contadas ($1.000, $500, $200, $100, $50)
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <input
                    type="number"
                    step={50}
                    min={0}
                    value={monedasCopTotal}
                    onKeyDown={handleNumberKeyDown}
                    onChange={(e) => {
                      setModoConteoDirecto(false);
                      setMonedasCopTotal(sanitizePositiveInt(e.target.value));
                    }}
                    className="w-32 h-10 px-2 text-right rounded-xl bg-white border-2 border-[#1C1311] font-mono text-sm font-black text-[#1C1311]"
                  />
                </div>
              </div>

              {/* CUADRE AUTOMÁTICO: EFECTIVO ESPERADO VS EFECTIVO CONTADO = DIFERENCIA */}
              <div className="p-4 rounded-2xl bg-[#FAF7F4] border-2 border-[#1C1311] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#D8CFC6]">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-[#661521]" />
                    <h3 className="text-base font-black text-[#1C1311]">
                      Resultado del Cuadre de Caja
                    </h3>
                  </div>
                  <span className="font-mono text-xs font-bold text-stone-600">
                    Turno #{sesionAbierta.turnoNumero}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white border border-[#D8CFC6]">
                    <span className="text-stone-500 font-bold block uppercase text-[10px]">
                      Efectivo Esperado
                    </span>
                    <p className="text-base font-black font-mono text-[#1C1311] mt-0.5">
                      {formatCOP(resumen.efectivoEsperadoCop)}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-[#D8CFC6]">
                    <span className="text-stone-500 font-bold block uppercase text-[10px]">
                      Efectivo Contado
                    </span>
                    <p className="text-base font-black font-mono text-[#1C1311] mt-0.5">
                      {formatCOP(efectivoFisicoDeclaradoCop)}
                    </p>
                  </div>

                  <div
                    className={`p-3 rounded-xl border-2 ${
                      diferenciaArqueoCop === 0
                        ? 'bg-emerald-50 border-[#059669] text-[#059669]'
                        : diferenciaArqueoCop > 0
                        ? 'bg-amber-50 border-[#D19650] text-amber-900'
                        : 'bg-red-50 border-[#661521] text-[#661521]'
                    }`}
                  >
                    <span className="font-extrabold block uppercase text-[10px]">
                      Diferencia de Cuadre
                    </span>
                    <p className="text-base font-black font-mono mt-0.5">
                      {diferenciaArqueoCop === 0
                        ? '$0 COP — Cuadre Exacto'
                        : diferenciaArqueoCop > 0
                        ? `+${formatCOP(diferenciaArqueoCop)} (Sobrante)`
                        : `${formatCOP(diferenciaArqueoCop)} (Faltante)`}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-stone-700 mb-1">
                    Observación de Cierre / Justificación:
                  </label>
                  <input
                    type="text"
                    value={observacionCierreInput}
                    onChange={(e) => setObservacionCierreInput(e.target.value)}
                    placeholder="Notas del cierre de turno o justificación de diferencias..."
                    className="w-full min-h-[42px] px-3 rounded-xl bg-white border border-[#D8CFC6] text-xs font-medium text-[#1C1311]"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setCuadreRevelado(true)}
                    className="min-h-[50px] px-4 rounded-xl bg-[#FAF7F4] hover:bg-[#EFEAE4] border border-[#D8CFC6] text-[#1C1311] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <FileCheck2 className="w-4 h-4 text-[#059669]" />
                    <span>Confirmar y Enviar Arqueo Ciego (Revelar Cuadre)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmarArqueoYCerrar}
                    className="flex-1 min-h-[52px] px-6 rounded-xl bg-[#661521] hover:bg-[#52101a] text-white font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Lock className="w-4 h-4 text-[#D19650]" />
                    <span>Confirmar Arqueo y Cerrar Turno</span>
                  </button>
                </div>

                {cuadreRevelado && (
                  <p className="text-[11px] font-bold text-[#059669]">
                    ✓ Cuadre verificado. Pulsa "Confirmar Arqueo y Cerrar Turno" para sellar el acta y generar el ticket de WhatsApp.
                  </p>
                )}
              </div>
            </section>
          </div>

          {/* =====================================================================
              SUBCATEGORÍA 4: 4. HISTORIAL DE TURNOS
          ===================================================================== */}
          <div className={subcategoriaActiva === 'HISTORIAL' ? 'block' : 'hidden'}>
            <section className="bg-white rounded-2xl border-2 border-[#E2D9CE] shadow-sm p-4 sm:p-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#EFEAE4] mb-3">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-[#661521]" />
                  <h2 className="text-base font-black text-[#1C1311]">
                    Historial de Turnos en {sedeActiva} ({sesionesSede.length})
                  </h2>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#FAF7F4] border-b border-[#E5DDD3] text-stone-600 font-extrabold uppercase text-[11px]">
                      <th className="py-2.5 px-3">Turno</th>
                      <th className="py-2.5 px-3">Estado</th>
                      <th className="py-2.5 px-3">Vendedor</th>
                      <th className="py-2.5 px-3">Apertura (Bogotá)</th>
                      <th className="py-2.5 px-3">Cierre (Bogotá)</th>
                      <th className="py-2.5 px-3 text-right">Base Inicial</th>
                      <th className="py-2.5 px-3 text-right">Esperado</th>
                      <th className="py-2.5 px-3 text-right">Contado</th>
                      <th className="py-2.5 px-3 text-right">Diferencia</th>
                      <th className="py-2.5 px-3 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFEAE4]">
                    {sesionesSede.map((s) => {
                      const r = resumenSesion(s);
                      return (
                        <tr
                          key={s.id}
                          onClick={() => setSesionSeleccionadaDrawer(s)}
                          className="hover:bg-[#FAF7F4] cursor-pointer"
                        >
                          <td className="py-2.5 px-3 font-mono font-black text-[#1C1311]">
                            Turno #{s.turnoNumero}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                s.estado === 'ABIERTA'
                                  ? 'bg-emerald-100 text-[#059669]'
                                  : 'bg-stone-200 text-stone-700'
                              }`}
                            >
                              {s.estado}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-semibold">{s.vendedor}</td>
                          <td className="py-2.5 px-3 font-mono">{formatBogotaDateTime(s.aperturaIso)}</td>
                          <td className="py-2.5 px-3 font-mono">{formatBogotaDateTime(s.cierreIso)}</td>
                          <td className="py-2.5 px-3 text-right font-mono">{formatCOP(s.baseInicialCop)}</td>
                          <td className="py-2.5 px-3 text-right font-mono">
                            {formatCOP(s.efectivoEsperadoCop ?? r.efectivoEsperadoCop)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">
                            {s.efectivoContadoCop !== undefined ? formatCOP(s.efectivoContadoCop) : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold">
                            {s.diferenciaCop !== undefined ? formatCOP(s.diferenciaCop) : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSesionSeleccionadaDrawer(s);
                              }}
                              className="px-2.5 py-1 rounded-lg border border-[#D8CFC6] bg-white text-[#661521] font-bold hover:bg-[#661521] hover:text-white transition-colors"
                            >
                              Ver Detalle
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* =========================================================================
          DRAWER LATERAL DE DETALLE DE MOVIMIENTO DE CAJA
      ========================================================================= */}
      {movimientoSeleccionado && (
        <DetailDrawer
          isOpen={Boolean(movimientoSeleccionado)}
          onClose={() => setMovimientoSeleccionado(null)}
          title={`Movimiento ${movimientoSeleccionado.comprobanteRef}`}
          subtitle={`${movimientoSeleccionado.motivo} · ${formatBogotaDateTime(movimientoSeleccionado.fechaIso)}`}
          badge={{
            label: movimientoSeleccionado.anulado
              ? 'Anulado'
              : movimientoSeleccionado.tipo === 'INGRESO_REINTEGRO'
              ? 'Reintegro'
              : 'Retiro',
            variant: movimientoSeleccionado.anulado
              ? 'danger'
              : movimientoSeleccionado.tipo === 'INGRESO_REINTEGRO'
              ? 'success'
              : 'warning',
          }}
          activeTab={drawerTab}
          onTabChange={setDrawerTab}
          activityItems={[
            {
              id: 'act-caj-1',
              timestamp: formatBogotaDateTime(movimientoSeleccionado.fechaIso),
              title: `${
                movimientoSeleccionado.tipo === 'INGRESO_REINTEGRO' ? 'Reintegro / Ingreso' : 'Retiro'
              } registrado por ${formatCOP(movimientoSeleccionado.montoCop)}`,
              description: `Concepto: ${movimientoSeleccionado.motivo}.`,
              user: movimientoSeleccionado.usuario,
              type: movimientoSeleccionado.tipo === 'INGRESO_REINTEGRO' ? 'success' : 'warning',
            },
            ...(movimientoSeleccionado.anulado
              ? [
                  {
                    id: 'act-caj-2',
                    timestamp: formatBogotaDateTime(movimientoSeleccionado.fechaAnulacionIso),
                    title: 'Movimiento anulado · Fondos restaurados',
                    description:
                      movimientoSeleccionado.motivoAnulacion ||
                      'Anulación registrada en bitácora.',
                    user: movimientoSeleccionado.usuario,
                    type: 'warning' as const,
                  },
                ]
              : []),
          ]}
          footerActions={
            <div className="flex flex-col sm:flex-row gap-2">
              {!movimientoSeleccionado.anulado && sesionAbierta && (
                <button
                  type="button"
                  onClick={() => {
                    handleAnularMovimiento(movimientoSeleccionado);
                    setMovimientoSeleccionado(null);
                  }}
                  className="flex-1 min-h-[46px] px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Anular Movimiento y Restaurar Fondos</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setMovimientoSeleccionado(null)}
                className="min-h-[46px] px-4 rounded-xl bg-white border border-[#D8CFC6] text-stone-800 font-bold text-xs hover:bg-stone-50 cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-[#FAF7F4] border border-[#D8CFC6] flex items-center justify-between">
              <div>
                <span className="font-bold text-[#1C1311] block">Comprobante de Caja</span>
                <span className="text-[11px] text-stone-500 font-mono">
                  {movimientoSeleccionado.comprobanteRef} • {formatBogotaDateTime(movimientoSeleccionado.fechaIso)}
                </span>
              </div>
              <span
                className={`font-mono font-bold text-sm ${
                  movimientoSeleccionado.tipo === 'INGRESO_REINTEGRO'
                    ? 'text-[#059669]'
                    : 'text-[#661521]'
                }`}
              >
                {movimientoSeleccionado.tipo === 'INGRESO_REINTEGRO' ? '+' : '-'}
                {formatCOP(movimientoSeleccionado.montoCop)} COP
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-[#E5DDD3] space-y-2">
              <div>
                <span className="text-[10px] font-bold uppercase text-stone-500 block">Concepto o Motivo</span>
                <p className="text-xs text-stone-800 mt-0.5 font-medium">
                  {movimientoSeleccionado.motivo}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-stone-500 block">Ejecutado por</span>
                <p className="text-xs text-stone-800 mt-0.5 font-semibold">
                  {movimientoSeleccionado.usuario}
                </p>
              </div>
            </div>
          </div>
        </DetailDrawer>
      )}

      {/* =========================================================================
          DRAWER LATERAL DE DETALLE DE TURNO HISTÓRICO
      ========================================================================= */}
      {sesionSeleccionadaDrawer && (
        <DetailDrawer
          isOpen={Boolean(sesionSeleccionadaDrawer)}
          onClose={() => setSesionSeleccionadaDrawer(null)}
          title={`Turno de Caja #${sesionSeleccionadaDrawer.turnoNumero}`}
          subtitle={`${sesionSeleccionadaDrawer.sede} · ${sesionSeleccionadaDrawer.vendedor}`}
          badge={{
            label: sesionSeleccionadaDrawer.estado,
            variant: sesionSeleccionadaDrawer.estado === 'ABIERTA' ? 'success' : 'info',
          }}
          activeTab={drawerTab}
          onTabChange={setDrawerTab}
          activityItems={[
            {
              id: 'act-ses-open',
              timestamp: formatBogotaDateTime(sesionSeleccionadaDrawer.aperturaIso),
              title: `Apertura de Turno #${sesionSeleccionadaDrawer.turnoNumero}`,
              description: `Base inicial declarada: ${formatCOP(sesionSeleccionadaDrawer.baseInicialCop)} COP.`,
              user: sesionSeleccionadaDrawer.vendedor,
              type: 'success',
            },
            ...(sesionSeleccionadaDrawer.cierreIso
              ? [
                  {
                    id: 'act-ses-close',
                    timestamp: formatBogotaDateTime(sesionSeleccionadaDrawer.cierreIso),
                    title: `Cierre y Arqueo de Turno #${sesionSeleccionadaDrawer.turnoNumero}`,
                    description: `Contado: ${formatCOP(sesionSeleccionadaDrawer.efectivoContadoCop ?? 0)} vs Esperado: ${formatCOP(sesionSeleccionadaDrawer.efectivoEsperadoCop ?? 0)}.`,
                    user: sesionSeleccionadaDrawer.vendedor,
                    type: 'info' as const,
                  },
                ]
              : []),
          ]}
          footerActions={
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() =>
                  enviarPorWhatsApp(
                    sesionSeleccionadaDrawer,
                    sesionSeleccionadaDrawer.estado === 'CERRADA' ? 'CIERRE' : 'ESTADO'
                  )
                }
                className="flex-1 min-h-[44px] px-4 rounded-xl bg-[#25D366] hover:bg-[#1ebe57] text-white font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Enviar Acta por WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={() => setSesionSeleccionadaDrawer(null)}
                className="min-h-[44px] px-4 rounded-xl bg-white border border-[#D8CFC6] text-stone-800 font-bold text-xs hover:bg-stone-50 cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          }
        >
          {(() => {
            const r = resumenSesion(sesionSeleccionadaDrawer);
            return (
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-[#FAF7F4] border border-[#D8CFC6] space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Apertura (Bogotá):</span>
                    <span className="font-mono font-bold">
                      {formatBogotaDateTime(sesionSeleccionadaDrawer.aperturaIso)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Cierre (Bogotá):</span>
                    <span className="font-mono font-bold">
                      {formatBogotaDateTime(sesionSeleccionadaDrawer.cierreIso)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Base Inicial:</span>
                    <span className="font-mono font-bold">
                      {formatCOP(sesionSeleccionadaDrawer.baseInicialCop)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Ventas Efectivo Netas:</span>
                    <span className="font-mono font-bold text-[#059669]">
                      {formatCOP(r.ventasEfectivoCop)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Efectivo Esperado:</span>
                    <span className="font-mono font-black">
                      {formatCOP(sesionSeleccionadaDrawer.efectivoEsperadoCop ?? r.efectivoEsperadoCop)}
                    </span>
                  </div>
                  {sesionSeleccionadaDrawer.efectivoContadoCop !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-stone-500">Efectivo Contado:</span>
                      <span className="font-mono font-black">
                        {formatCOP(sesionSeleccionadaDrawer.efectivoContadoCop)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </DetailDrawer>
      )}
    </div>
  );
};

export default PosArqueoPage;
