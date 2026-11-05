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
} from 'lucide-react';
import { getPosShiftFinancialDeltas } from '../utils/posLedgerSync';

interface RetiroOperativo {
  id: string;
  horaBogota: string;
  tipo: 'RETIRO_CAJA_FUERTE' | 'GASTO_MENOR' | 'INGRESO_REINTEGRO';
  montoCop: number;
  motivo: string;
  ejecutadoPor: string;
  comprobanteRef: string;
  esAnulado?: boolean;
  horaAnulacion?: string;
  motivoAnulacion?: string;
}

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

const getBogotaTimeStr = (): string => {
  try {
    return new Intl.DateTimeFormat('es-CO', {
      timeZone: 'America/Bogota',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(new Date());
  } catch {
    return '10:30:00 a. m.';
  }
};

const handleNumberKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  // Rechazar signos negativos '-', exponente 'e', 'E', y signo '+'
  if (['-', '+', 'e', 'E'].includes(e.key)) {
    e.preventDefault();
  }
};

const sanitizePositiveInt = (val: string): number => {
  const cleaned = val.replace(/[^0-9]/g, '');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : Math.max(0, parsed);
};

export const PosArqueoPage: React.FC = () => {
  // Estado de la sesión de caja
  const [estadoSesion, setEstadoSesion] = useState<'ABIERTA' | 'ARQUEO_ENVIADO' | 'CERRADA'>('ABIERTA');
  const [turnoNumero, setTurnoNumero] = useState<number>(104);
  const [horaApertura, setHoraApertura] = useState<string>('08:00 a. m. (America/Bogota)');
  const [horaCierre, setHoraCierre] = useState<string | null>(null);

  // Base inicial y ventas acumuladas en COP sincronizadas con las ventas cobradas en el POS
  const [baseInicialCop, setBaseInicialCop] = useState<number>(200000);
  const [observacionApertura, setObservacionApertura] = useState<string>(
    'Base estándar contada y verificada al iniciar jornada.'
  );
  const [shiftDeltas, setShiftDeltas] = useState(() => getPosShiftFinancialDeltas());

  useEffect(() => {
    const handleUpdate = () => {
      setShiftDeltas(getPosShiftFinancialDeltas());
    };
    window.addEventListener('forma-pos-ledger-update', handleUpdate);
    return () => window.removeEventListener('forma-pos-ledger-update', handleUpdate);
  }, []);

  const ventasEfectivoAcumuladasCop = 1480000 + shiftDeltas.efectivoExtraCop;
  const ventasTransferenciaCop = 645000 + shiftDeltas.transferenciaExtraCop;

  // Bitácora de Retiros a Caja Fuerte / Gastos Menores
  const [retirosBitacora, setRetirosBitacora] = useState<RetiroOperativo[]>([
    {
      id: 'RET-01',
      horaBogota: '11:30 a. m.',
      tipo: 'RETIRO_CAJA_FUERTE',
      montoCop: 300000,
      motivo: 'Traslado preventivo a caja fuerte por tope de mediodía',
      ejecutadoPor: 'Carlos Mendoza',
      comprobanteRef: 'BOV-0081',
    },
    {
      id: 'RET-02',
      horaBogota: '02:15 p. m.',
      tipo: 'RETIRO_CAJA_FUERTE',
      montoCop: 200000,
      motivo: 'Custodia en caja fuerte — Exceso de billetes de alta denominación',
      ejecutadoPor: 'Carlos Mendoza',
      comprobanteRef: 'BOV-0082',
    },
  ]);

  // Formulario de nuevo retiro
  const [montoRetiroInput, setMontoRetiroInput] = useState<number>(200000);
  const [motivoRetiroInput, setMotivoRetiroInput] = useState<string>(
    'Traslado a caja fuerte por seguridad de gaveta'
  );
  const [tipoRetiroInput, setTipoRetiroInput] = useState<
    'RETIRO_CAJA_FUERTE' | 'GASTO_MENOR' | 'INGRESO_REINTEGRO'
  >('RETIRO_CAJA_FUERTE');
  const [mensajeRetiroExito, setMensajeRetiroExito] = useState<string | null>(null);

  // Conteo de billetes para el arqueo ciego
  const [conteoBilletes, setConteoBilletes] = useState<Record<number, number>>({
    100000: 7, // 700.000
    50000: 6,  // 300.000
    20000: 5,  // 100.000
    10000: 5,  // 50.000
    5000: 4,   // 20.000
    2000: 5,   // 10.000
  });
  const [monedasCopTotal, setMonedasCopTotal] = useState<number>(0);

  // Justificación en caso de descuadre
  const [justificacionDiferencia, setJustificacionDiferencia] = useState<string>('');
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  // Apertura de nuevo turno
  const [nuevaBaseInput, setNuevaBaseInput] = useState<number>(200000);
  const [nuevaObsApertura, setNuevaObsApertura] = useState<string>('');

  // Retiros totales activos (excluyendo ingresos y movimientos anulados)
  const totalRetirosCop = useMemo(() => {
    return retirosBitacora
      .filter((r) => r.tipo !== 'INGRESO_REINTEGRO' && !r.esAnulado)
      .reduce((acc, r) => acc + r.montoCop, 0);
  }, [retirosBitacora]);

  // Ingresos / Reintegros totales activos a gaveta
  const totalIngresosCop = useMemo(() => {
    return retirosBitacora
      .filter((r) => r.tipo === 'INGRESO_REINTEGRO' && !r.esAnulado)
      .reduce((acc, r) => acc + r.montoCop, 0);
  }, [retirosBitacora]);

  // Saldo de efectivo disponible en gaveta (Base inicial + Ventas en efectivo + Ingresos/Reintegros - Retiros activos)
  const saldoEfectivoDisponibleEnCaja = useMemo(() => {
    return baseInicialCop + ventasEfectivoAcumuladasCop + totalIngresosCop - totalRetirosCop;
  }, [baseInicialCop, ventasEfectivoAcumuladasCop, totalIngresosCop, totalRetirosCop]);

  // Efectivo esperado en el sistema (Oculto en estado ABIERTA para arqueo ciego)
  const efectivoEsperadoSistemaCop = saldoEfectivoDisponibleEnCaja;

  // Validación estricta: monto a retirar no puede superar el disponible en caja
  const excedeEfectivoDisponible =
    tipoRetiroInput !== 'INGRESO_REINTEGRO' && montoRetiroInput > saldoEfectivoDisponibleEnCaja;

  // Efectivo físico declarado por el cajero
  const efectivoFisicoDeclaradoCop = useMemo(() => {
    const totalBilletes = DENOMINACIONES_COP.reduce((acc, den) => {
      const cantidad = conteoBilletes[den.valor] || 0;
      return acc + den.valor * cantidad;
    }, 0);
    return totalBilletes + (Math.max(0, Math.trunc(monedasCopTotal)) || 0);
  }, [conteoBilletes, monedasCopTotal]);

  // Diferencia
  const diferenciaArqueoCop = efectivoFisicoDeclaradoCop - efectivoEsperadoSistemaCop;

  // Registrar retiro a caja fuerte / sangría / gastos menores o reintegro a caja
  const handleRegistrarRetiro = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorValidacion(null);

    if (estadoSesion !== 'ABIERTA') {
      setErrorValidacion('No se pueden registrar movimientos de efectivo con el turno cerrado.');
      return;
    }

    const monto = Math.max(0, Math.trunc(montoRetiroInput));
    if (monto <= 0) {
      setErrorValidacion('El monto debe ser un número entero mayor a cero.');
      return;
    }

    const esIngreso = tipoRetiroInput === 'INGRESO_REINTEGRO';

    // Regla estricta para retiros: montoRetiro <= saldoEfectivoDisponibleEnCaja
    if (!esIngreso && monto > saldoEfectivoDisponibleEnCaja) {
      setErrorValidacion(
        `El monto a retirar (${formatCOP(monto)}) no puede superar el efectivo disponible en caja (${formatCOP(saldoEfectivoDisponibleEnCaja)})`
      );
      return;
    }

    if (!motivoRetiroInput.trim()) {
      setErrorValidacion(
        esIngreso
          ? 'Debes ingresar el motivo o concepto del reintegro/ingreso.'
          : 'Debes ingresar el motivo o concepto del retiro.'
      );
      return;
    }

    const prefijo = esIngreso ? 'ING' : 'BOV';
    const nuevo: RetiroOperativo = {
      id: `${esIngreso ? 'ING' : 'RET'}-${Date.now().toString().slice(-4)}`,
      horaBogota: getBogotaTimeStr(),
      tipo: tipoRetiroInput,
      montoCop: monto,
      motivo: motivoRetiroInput.trim(),
      ejecutadoPor: 'Carlos Mendoza',
      comprobanteRef: `${prefijo}-00${retirosBitacora.length + 83}`,
    };

    setRetirosBitacora((prev) => [nuevo, ...prev]);
    setMensajeRetiroExito(
      esIngreso
        ? `Reintegro / Ingreso ${nuevo.comprobanteRef} por ${formatCOP(monto)} registrado en gaveta correctamente.`
        : `Retiro ${nuevo.comprobanteRef} por ${formatCOP(monto)} registrado correctamente.`
    );
    setTimeout(() => setMensajeRetiroExito(null), 4000);
  };

  // Anular movimiento (devolver fondos a gaveta si fue retiro por error o cancelar ingreso)
  const handleAnularMovimiento = (id: string) => {
    if (estadoSesion !== 'ABIERTA') {
      setErrorValidacion('No se pueden anular movimientos con el turno cerrado.');
      return;
    }
    const mov = retirosBitacora.find((r) => r.id === id);
    if (!mov) return;

    setRetirosBitacora((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              esAnulado: true,
              horaAnulacion: getBogotaTimeStr(),
              motivoAnulacion: 'Anulado por el cajero — Dinero devuelto a la gaveta',
            }
          : r
      )
    );

    const esRetiro = mov.tipo !== 'INGRESO_REINTEGRO';
    setMensajeRetiroExito(
      esRetiro
        ? `Retiro ${mov.comprobanteRef} por ${formatCOP(mov.montoCop)} fue ANULADO y los fondos han vuelto a la gaveta.`
        : `Ingreso ${mov.comprobanteRef} por ${formatCOP(mov.montoCop)} fue ANULADO.`
    );
    setTimeout(() => setMensajeRetiroExito(null), 5000);
  };

  // Stepper de denominaciones
  const handleCambiarCantidadBillete = (valor: number, delta: number) => {
    if (estadoSesion !== 'ABIERTA') return;
    setConteoBilletes((prev) => ({
      ...prev,
      [valor]: Math.max(0, (prev[valor] || 0) + delta),
    }));
  };

  const handleSetCantidadDirecta = (valor: number, strVal: string) => {
    if (estadoSesion !== 'ABIERTA') return;
    const parsed = sanitizePositiveInt(strVal);
    setConteoBilletes((prev) => ({ ...prev, [valor]: parsed }));
  };

  // Simular conteo exacto para agilidad
  const handleSimularConteoExacto = () => {
    if (estadoSesion !== 'ABIERTA') return;
    let resto = Math.max(0, efectivoEsperadoSistemaCop);
    const mapa: Record<number, number> = {};
    for (const d of DENOMINACIONES_COP) {
      const cant = Math.floor(resto / d.valor);
      mapa[d.valor] = cant;
      resto -= cant * d.valor;
    }
    setConteoBilletes(mapa);
    setMonedasCopTotal(resto);
  };

  const handlePonerEnCero = () => {
    if (estadoSesion !== 'ABIERTA') return;
    setConteoBilletes({
      100000: 0,
      50000: 0,
      20000: 0,
      10000: 0,
      5000: 0,
      2000: 0,
    });
    setMonedasCopTotal(0);
  };

  // Enviar arqueo ciego y revelar resultado
  const handleConfirmarArqueoCiego = () => {
    setErrorValidacion(null);
    setHoraCierre(getBogotaTimeStr());
    setEstadoSesion('ARQUEO_ENVIADO');
  };

  // Sellar y cerrar turno
  const handleCerrarTurnoDefinitivo = () => {
    if (diferenciaArqueoCop !== 0 && !justificacionDiferencia.trim()) {
      setErrorValidacion(
        'Existe una diferencia en el cuadre de caja. Por favor escribe una justificación antes de sellar el acta.'
      );
      return;
    }
    setErrorValidacion(null);
    setEstadoSesion('CERRADA');
  };

  // Abrir nuevo turno
  const handleAbrirNuevoTurno = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorValidacion(null);

    setTurnoNumero((prev) => prev + 1);
    setBaseInicialCop(Math.max(0, Math.trunc(nuevaBaseInput)));
    setObservacionApertura(nuevaObsApertura.trim() || 'Apertura con base inicial verificada.');
    setHoraApertura(`${getBogotaTimeStr()} (America/Bogota)`);
    setHoraCierre(null);
    setJustificacionDiferencia('');
    setEstadoSesion('ABIERTA');
  };

  return (
    <div className="h-full w-full overflow-y-auto bg-[#F4EFEA] text-[#1C1311] rounded-2xl border border-[#D8CFC6] shadow-inner p-3 sm:p-5 select-none font-sans">
      {/* =========================================================================
          CABECERA DE TURNO DE CAJA Y ARQUEO
      ========================================================================= */}
      <header className="bg-white rounded-2xl border-2 border-[#E2D9CE] shadow-sm p-4 sm:p-5 mb-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#EFEAE4]">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#661521] text-white flex items-center justify-center shrink-0 shadow-md">
              {estadoSesion === 'ABIERTA' ? (
                <Lock className="w-6 h-6 text-[#D19650]" />
              ) : (
                <Unlock className="w-6 h-6 text-emerald-300" />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-[#1C1311] text-[#D19650] font-mono text-xs font-black uppercase tracking-wider">
                  Turno #{turnoNumero}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-extrabold uppercase ${
                    estadoSesion === 'ABIERTA'
                      ? 'bg-emerald-100 text-[#059669] border border-emerald-300'
                      : estadoSesion === 'ARQUEO_ENVIADO'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-stone-200 text-stone-700 border border-stone-400'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      estadoSesion === 'ABIERTA' ? 'bg-[#059669] animate-pulse' : 'bg-amber-600'
                    }`}
                  />
                  {estadoSesion === 'ABIERTA'
                    ? 'Caja Abierta · Turno Activo'
                    : estadoSesion === 'ARQUEO_ENVIADO'
                    ? 'Conteo Realizado · Resultado Revelado'
                    : 'Caja Cerrada · Turno Sellado'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[#1C1311] tracking-tight mt-1">
                Control de Caja y Arqueo Ciego
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-xs bg-[#FAF7F4] px-3.5 py-2.5 rounded-xl border border-[#E5DDD3]">
            <div className="flex items-center gap-1.5 font-bold text-[#1C1311]">
              <User className="w-4 h-4 text-[#661521]" />
              <span>Cajero: Carlos Mendoza</span>
            </div>
            <span className="text-stone-300">|</span>
            <div className="flex items-center gap-1.5 font-semibold text-stone-700">
              <MapPin className="w-4 h-4 text-[#D19650]" />
              <span>Punto Centro (Cúcuta)</span>
            </div>
            <span className="text-stone-300">|</span>
            <div className="flex items-center gap-1.5 font-mono text-stone-600">
              <Clock className="w-4 h-4 text-[#059669]" />
              <span>Apertura: {horaApertura}</span>
            </div>
          </div>
        </div>

        {/* Resumen del Turno */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-4">
          {/* Base Inicial */}
          <div className="p-3.5 rounded-xl bg-[#FAF7F4] border border-[#E5DDD3]">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block">
              Base Inicial de Caja
            </span>
            <p className="text-xl font-black font-mono text-[#1C1311] mt-1">
              {formatCOP(baseInicialCop)} COP
            </p>
            <p className="text-[11px] text-stone-500 mt-0.5 truncate">{observacionApertura}</p>
          </div>

          {/* Ventas en Efectivo y Retiros */}
          <div className="p-3.5 rounded-xl bg-[#FAF7F4] border border-[#E5DDD3]">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block">
              Movimientos en Efectivo
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-sm font-black font-mono text-[#059669]">
                +{formatCOP(ventasEfectivoAcumuladasCop)}
              </span>
              <span className="text-xs font-black font-mono text-[#661521]">
                -{formatCOP(totalRetirosCop)}
              </span>
            </div>
            <p className="text-[11px] text-stone-500 mt-0.5">
              Ventas en efectivo y retiros a caja fuerte
            </p>
          </div>

          {/* Transferencias */}
          <div className="p-3.5 rounded-xl bg-[#FAF7F4] border border-[#E5DDD3]">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block">
              Ventas por Transferencia
            </span>
            <p className="text-xl font-black font-mono text-indigo-900 mt-1">
              {formatCOP(ventasTransferenciaCop)} COP
            </p>
            <p className="text-[11px] text-stone-500 mt-0.5">Directo en banco (No suma a gaveta)</p>
          </div>

          {/* Saldo Esperado en Gaveta (Oculto en estado ABIERTA para arqueo ciego) */}
          <div
            className={`p-3.5 rounded-xl border-2 flex flex-col justify-between ${
              estadoSesion === 'ABIERTA'
                ? 'bg-[#1C1311] border-[#661521] text-white'
                : 'bg-emerald-950 border-[#059669] text-white'
            }`}
          >
            <span className="text-xs font-bold uppercase tracking-wider text-[#D19650]">
              Efectivo Esperado en Gaveta
            </span>

            {estadoSesion === 'ABIERTA' ? (
              <div className="mt-1">
                <span className="font-mono text-xs font-black text-amber-200 block">
                  🔒 OCULTO DURANTE EL TURNO
                </span>
                <p className="text-[11px] text-stone-300 mt-0.5">
                  Se revelará al enviar el conteo físico de billetes y monedas.
                </p>
              </div>
            ) : (
              <div className="mt-1">
                <p className="text-xl font-black font-mono text-emerald-300">
                  {formatCOP(efectivoEsperadoSistemaCop)} COP
                </p>
                <p className="text-[11px] text-emerald-200 mt-0.5">
                  Calculado según base y movimientos de venta
                </p>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Banner de Error si ocurre */}
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
          SI LA CAJA ESTÁ CERRADA: FORMULARIO SENCILLO DE APERTURA DE NUEVO TURNO
      ========================================================================= */}
      {estadoSesion === 'CERRADA' && (
        <section className="mb-6 bg-white rounded-2xl border-2 border-[#D19650] p-5 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EFEAE4]">
            <div>
              <span className="px-2.5 py-0.5 rounded bg-[#661521] text-white font-mono text-xs font-bold uppercase">
                Turno #{turnoNumero} Finalizado
              </span>
              <h2 className="text-lg font-black text-[#1C1311] mt-1">
                Apertura de Nuevo Turno de Caja
              </h2>
              <p className="text-xs text-stone-600">
                El turno anterior fue cerrado a las {horaCierre}. Para iniciar un nuevo turno en el mostrador, declara la base inicial con la que comienzas.
              </p>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="min-h-[44px] px-4 rounded-xl bg-[#1C1311] text-white font-bold text-xs flex items-center gap-2 hover:bg-stone-800 shrink-0"
            >
              <Printer className="w-4 h-4 text-[#D19650]" />
              <span>Imprimir Acta de Cierre #{turnoNumero}</span>
            </button>
          </div>

          <form onSubmit={handleAbrirNuevoTurno} className="grid grid-cols-1 md:grid-cols-12 gap-3.5 mt-4 items-end">
            <div className="md:col-span-4">
              <label htmlFor="nueva-base-input" className="block text-xs font-bold uppercase text-[#1C1311] mb-1">
                Base Inicial Contada (COP):
              </label>
              <input
                id="nueva-base-input"
                type="number"
                step={1000}
                min={0}
                value={nuevaBaseInput || ''}
                onKeyDown={handleNumberKeyDown}
                onChange={(e) => setNuevaBaseInput(sanitizePositiveInt(e.target.value))}
                className="w-full min-h-[50px] px-3.5 rounded-xl border-2 border-[#D8CFC6] bg-[#FAF7F4] font-mono text-lg font-black text-[#1C1311] focus:outline-none focus:border-[#661521]"
              />
              <span className="text-[11px] text-stone-500 mt-0.5 block">
                Base sugerida de tienda: $200.000 COP
              </span>
            </div>

            <div className="md:col-span-5">
              <label className="block text-xs font-bold uppercase text-[#1C1311] mb-1">
                Observación de Apertura:
              </label>
              <input
                type="text"
                value={nuevaObsApertura}
                onChange={(e) => setNuevaObsApertura(e.target.value)}
                placeholder="Ej. Se inicia con $200.000 en billetes de baja denominación..."
                className="w-full min-h-[50px] px-3.5 rounded-xl border-2 border-[#D8CFC6] bg-[#FAF7F4] text-xs font-medium text-[#1C1311] focus:outline-none focus:border-[#661521]"
              />
            </div>

            <div className="md:col-span-3">
              <button
                type="submit"
                className="w-full min-h-[50px] px-4 rounded-xl bg-[#059669] hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all"
              >
                <Unlock className="w-4 h-4" />
                <span>Abrir Turno #{turnoNumero + 1}</span>
              </button>
            </div>
          </form>
        </section>
      )}

      {/* =========================================================================
          CUERPO DE 2 COLUMNAS:
          COLUMNA IZQUIERDA (5 COL): RETIROS DE SEGURIDAD A CAJA FUERTE
          COLUMNA DERECHA (7 COL): ARQUEO CIEGO POR DENOMINACIONES
      ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* PANEL IZQUIERDO: MOVIMIENTOS Y RETIROS DE EFECTIVO */}
        <section className="lg:col-span-5 bg-white rounded-2xl border-2 border-[#E2D9CE] shadow-sm p-4 sm:p-5 space-y-4">
          <div className="pb-2 border-b border-[#EFEAE4] flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#661521]/10 text-[#661521] flex items-center justify-center">
              <Vault className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase text-[#661521]">Seguridad y Control</span>
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
              {formatCOP(saldoEfectivoDisponibleEnCaja)} COP
            </p>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-stone-500 mt-1 font-mono">
              <span>Base: {formatCOP(baseInicialCop)}</span>
              <span>+</span>
              <span>Ventas: {formatCOP(ventasEfectivoAcumuladasCop)}</span>
              {totalIngresosCop > 0 && (
                <>
                  <span>+</span>
                  <span className="text-[#059669] font-bold">Reintegros: {formatCOP(totalIngresosCop)}</span>
                </>
              )}
              <span>-</span>
              <span>Retiros: {formatCOP(totalRetirosCop)}</span>
            </div>
          </div>

          <form onSubmit={handleRegistrarRetiro} className="space-y-3">
            {/* Tipo de Movimiento: Retiro Caja Fuerte, Gasto Menor, Reintegro a Gaveta */}
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                disabled={estadoSesion !== 'ABIERTA'}
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
                disabled={estadoSesion !== 'ABIERTA'}
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
                disabled={estadoSesion !== 'ABIERTA'}
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

            {/* Monto y Botones Rápidos */}
            <div>
              <label htmlFor="monto-retiro-input" className="block text-xs font-bold uppercase text-stone-700 mb-1">
                {tipoRetiroInput === 'INGRESO_REINTEGRO'
                  ? 'Monto a Reingresar a Gaveta (COP):'
                  : 'Monto a Retirar de Gaveta (COP):'}
              </label>
              <input
                id="monto-retiro-input"
                type="number"
                step={1000}
                min={0}
                disabled={estadoSesion !== 'ABIERTA'}
                value={montoRetiroInput || ''}
                onKeyDown={handleNumberKeyDown}
                onChange={(e) => setMontoRetiroInput(sanitizePositiveInt(e.target.value))}
                className={`w-full min-h-[48px] px-3.5 rounded-xl bg-[#FAF7F4] border-2 font-mono text-lg font-black text-[#1C1311] focus:outline-none disabled:opacity-60 ${
                  excedeEfectivoDisponible
                    ? 'border-rose-500 bg-rose-50/50 text-rose-800 focus:border-rose-600'
                    : 'border-[#D8CFC6] focus:border-[#661521]'
                }`}
              />

              <div className="grid grid-cols-4 gap-1.5 mt-2">
                {[100000, 200000, 300000, 500000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    disabled={estadoSesion !== 'ABIERTA'}
                    onClick={() => setMontoRetiroInput(preset)}
                    className={`min-h-[38px] rounded-lg font-mono text-xs font-bold border transition-all ${
                      montoRetiroInput === preset
                        ? 'bg-[#D19650] text-[#1C1311] border-[#1C1311] font-black'
                        : 'bg-[#FAF7F4] text-stone-700 border-[#D8CFC6] hover:bg-stone-200'
                    }`}
                  >
                    {formatCOP(preset)}
                  </button>
                ))}
              </div>
            </div>

            {/* Alerta estricta si el monto a retirar supera el disponible */}
            {excedeEfectivoDisponible && (
              <div className="p-3 rounded-xl bg-red-50 border-2 border-red-500 text-red-700 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                <span>
                  El monto a retirar ({formatCOP(montoRetiroInput)}) no puede superar el efectivo disponible en caja ({formatCOP(saldoEfectivoDisponibleEnCaja)})
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
                disabled={estadoSesion !== 'ABIERTA'}
                value={motivoRetiroInput}
                onChange={(e) => setMotivoRetiroInput(e.target.value)}
                placeholder={
                  tipoRetiroInput === 'INGRESO_REINTEGRO'
                    ? 'Ej. Reintegro por error en retiro previo / Devolución de cambio...'
                    : 'Ej. Traslado a caja fuerte por seguridad...'
                }
                className="w-full min-h-[46px] px-3 rounded-xl bg-[#FAF7F4] border-2 border-[#D8CFC6] text-xs font-medium text-[#1C1311] focus:outline-none focus:border-[#661521] disabled:opacity-60"
              />
            </div>

            <button
              type="submit"
              disabled={
                estadoSesion !== 'ABIERTA' ||
                montoRetiroInput <= 0 ||
                excedeEfectivoDisponible
              }
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

          {/* Bitácora de Movimientos (Retiros e Ingresos) */}
          <div className="pt-3 border-t border-[#EFEAE4]">
            <div className="flex justify-between items-center mb-2 text-xs">
              <span className="font-extrabold uppercase text-[#1C1311]">
                Bitácora de Retiros ({retirosBitacora.length})
              </span>
              <span className="font-mono font-black text-[#661521]">
                Neto: -{formatCOP(totalRetirosCop - totalIngresosCop)}
              </span>
            </div>

            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
              {retirosBitacora.map((r) => {
                const esIngreso = r.tipo === 'INGRESO_REINTEGRO';
                return (
                  <div
                    key={r.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all ${
                      r.esAnulado
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
                        <span className="text-stone-500 font-mono text-[11px]">{r.horaBogota}</span>
                        {r.esAnulado ? (
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
                          r.esAnulado ? 'line-through text-stone-400' : 'text-[#1C1311]'
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
                        · Por: {r.ejecutadoPor}
                        {r.horaAnulacion && ` · Anulado: ${r.horaAnulacion}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`font-mono text-sm font-black ${
                          r.esAnulado
                            ? 'line-through text-stone-400'
                            : esIngreso
                            ? 'text-[#059669]'
                            : 'text-[#661521]'
                        }`}
                      >
                        {esIngreso ? `+${formatCOP(r.montoCop)}` : `-${formatCOP(r.montoCop)}`}
                      </span>

                      {!r.esAnulado && estadoSesion === 'ABIERTA' && (
                        <button
                          type="button"
                          onClick={() => handleAnularMovimiento(r.id)}
                          title="Anular movimiento y restaurar dinero a la gaveta de caja"
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
          </div>
        </section>

        {/* PANEL DERECHO: ARQUEO CIEGO POR DENOMINACIONES */}
        <section className="lg:col-span-7 bg-white rounded-2xl border-2 border-[#E2D9CE] shadow-sm p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#EFEAE4]">
            <div>
              <span className="text-xs font-bold uppercase text-stone-500">Cierre de Turno</span>
              <h2 className="text-base sm:text-lg font-black text-[#1C1311]">
                Arqueo Ciego por Denominaciones
              </h2>
            </div>

            {estadoSesion === 'ABIERTA' && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSimularConteoExacto}
                  className="min-h-[38px] px-3 rounded-xl bg-[#FAF7F4] hover:bg-[#EFEAE4] border border-[#D8CFC6] text-xs font-bold text-[#1C1311] flex items-center gap-1.5 transition-all"
                  title="Simular conteo exacto"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#D19650]" />
                  <span>Conteo Exacto</span>
                </button>
                <button
                  type="button"
                  onClick={handlePonerEnCero}
                  className="min-h-[38px] px-3 rounded-xl bg-[#FAF7F4] hover:bg-red-50 border border-[#D8CFC6] text-xs font-bold text-[#661521] flex items-center gap-1.5 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>En Cero</span>
                </button>
              </div>
            )}
          </div>

          <p className="text-xs text-stone-600">
            Cuenta físicamente los billetes y monedas que hay en la gaveta e ingresa la cantidad por denominación:
          </p>

          {/* Grilla de Denominaciones de Billetes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
                        disabled={estadoSesion !== 'ABIERTA' || cantidad <= 0}
                        onClick={() => handleCambiarCantidadBillete(den.valor, -1)}
                        className="w-10 h-10 rounded-xl bg-white border border-[#D8CFC6] hover:border-[#661521] flex items-center justify-center text-[#1C1311] font-black disabled:opacity-40"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <input
                        type="number"
                        min={0}
                        disabled={estadoSesion !== 'ABIERTA'}
                        value={cantidad}
                        onKeyDown={handleNumberKeyDown}
                        onChange={(e) => handleSetCantidadDirecta(den.valor, e.target.value)}
                        className="w-14 h-10 text-center rounded-xl bg-white border-2 border-[#1C1311] font-mono text-sm font-black text-[#1C1311]"
                      />

                      <button
                        type="button"
                        disabled={estadoSesion !== 'ABIERTA'}
                        onClick={() => handleCambiarCantidadBillete(den.valor, 1)}
                        className="w-10 h-10 rounded-xl bg-[#1C1311] text-[#D19650] flex items-center justify-center font-black hover:bg-stone-800 disabled:opacity-40"
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
              <button
                type="button"
                disabled={estadoSesion !== 'ABIERTA' || monedasCopTotal < 1000}
                onClick={() => setMonedasCopTotal((prev) => Math.max(0, prev - 1000))}
                className="px-2.5 h-10 rounded-xl bg-white border border-[#D8CFC6] font-mono text-xs font-bold disabled:opacity-40"
              >
                -$1.000
              </button>
              <input
                type="number"
                step={50}
                min={0}
                disabled={estadoSesion !== 'ABIERTA'}
                value={monedasCopTotal}
                onKeyDown={handleNumberKeyDown}
                onChange={(e) => setMonedasCopTotal(sanitizePositiveInt(e.target.value))}
                className="w-28 h-10 px-2 text-right rounded-xl bg-white border-2 border-[#1C1311] font-mono text-sm font-black text-[#1C1311]"
              />
              <button
                type="button"
                disabled={estadoSesion !== 'ABIERTA'}
                onClick={() => setMonedasCopTotal((prev) => prev + 1000)}
                className="px-2.5 h-10 rounded-xl bg-[#1C1311] text-[#D19650] font-mono text-xs font-bold hover:bg-stone-800 disabled:opacity-40"
              >
                +$1.000
              </button>
            </div>
          </div>

          {/* Total Físico Declarado */}
          <div className="p-4 rounded-2xl bg-[#1C1311] text-white border-2 border-[#D19650] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div>
              <span className="text-xs font-mono font-bold uppercase text-[#D19650] block">
                Total Conteo de Gaveta
              </span>
              <h3 className="text-base font-black text-white">Efectivo Físico Contado</h3>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-[#D19650]">
                {formatCOP(efectivoFisicoDeclaradoCop)}
              </span>
              <span className="block text-xs font-mono text-stone-300">COP</span>
            </div>
          </div>

          {/* Botón Enviar Arqueo Ciego */}
          {estadoSesion === 'ABIERTA' && (
            <button
              type="button"
              onClick={handleConfirmarArqueoCiego}
              className="w-full min-h-[58px] px-6 rounded-2xl bg-[#059669] hover:bg-emerald-700 active:scale-[0.99] text-white font-black text-sm sm:text-base shadow-lg flex items-center justify-center gap-2.5 transition-all"
            >
              <FileCheck2 className="w-5 h-5" />
              <span>Confirmar y Enviar Arqueo Ciego (Revelar Cuadre)</span>
            </button>
          )}

          {/* =====================================================================
              REVELACIÓN DEL CUADRE DE CAJA
          ===================================================================== */}
          {estadoSesion !== 'ABIERTA' && (
            <div className="p-4 rounded-2xl bg-[#FAF7F4] border-2 border-[#1C1311] shadow-md space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-[#D8CFC6]">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-[#661521]" />
                  <h3 className="text-base font-black text-[#1C1311]">
                    Resultado del Cuadre de Caja
                  </h3>
                </div>
                <span className="px-2.5 py-0.5 rounded bg-[#1C1311] text-[#D19650] font-mono text-xs font-bold">
                  Hora: {horaCierre}
                </span>
              </div>

              {/* 3 Tarjetas Comparativas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white border border-[#D8CFC6]">
                  <span className="text-stone-500 font-bold block uppercase text-[10px]">
                    Efectivo Esperado
                  </span>
                  <p className="text-base font-black font-mono text-[#1C1311] mt-0.5">
                    {formatCOP(efectivoEsperadoSistemaCop)}
                  </p>
                  <span className="text-[10px] text-stone-500 block mt-0.5">
                    Base + Ventas - Retiros
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#D8CFC6]">
                  <span className="text-stone-500 font-bold block uppercase text-[10px]">
                    Efectivo Contado
                  </span>
                  <p className="text-base font-black font-mono text-[#1C1311] mt-0.5">
                    {formatCOP(efectivoFisicoDeclaradoCop)}
                  </p>
                  <span className="text-[10px] text-stone-500 block mt-0.5">Declarado en conteo</span>
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
                  <span className="text-[10px] font-bold block mt-0.5">
                    {diferenciaArqueoCop === 0 ? 'Gaveta cuadrada al 100%' : 'Diferencia registrada'}
                  </span>
                </div>
              </div>

              {/* Justificación obligatoria si hay descuadre */}
              {diferenciaArqueoCop !== 0 && (
                <div className="p-3 bg-white rounded-xl border-2 border-[#661521]">
                  <label className="block text-xs font-bold uppercase text-[#661521] mb-1">
                    Justificación de la Diferencia ({diferenciaArqueoCop > 0 ? 'Sobrante' : 'Faltante'}):
                  </label>
                  <textarea
                    rows={2}
                    disabled={estadoSesion === 'CERRADA'}
                    value={justificacionDiferencia}
                    onChange={(e) => setJustificacionDiferencia(e.target.value)}
                    placeholder="Explica la causa de la diferencia (ej. Error en vueltas de sencillo o billete pendiente)..."
                    className="w-full p-2.5 rounded-lg bg-[#FAF7F4] border border-[#D8CFC6] text-xs font-medium text-[#1C1311] focus:outline-none focus:border-[#661521]"
                  />
                </div>
              )}

              {/* Botones de Cierre */}
              {estadoSesion === 'ARQUEO_ENVIADO' && (
                <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={handleCerrarTurnoDefinitivo}
                    className="flex-1 min-h-[52px] px-5 rounded-xl bg-[#661521] hover:bg-[#52101a] text-white font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all"
                  >
                    <Lock className="w-4 h-4 text-[#D19650]" />
                    <span>Sellar Acta y Cerrar Turno #{turnoNumero}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEstadoSesion('ABIERTA')}
                    className="min-h-[52px] px-4 rounded-xl bg-white border border-[#D8CFC6] text-xs font-bold text-stone-700 hover:bg-stone-100"
                  >
                    Modificar Conteo
                  </button>
                </div>
              )}

              {estadoSesion === 'CERRADA' && (
                <div className="p-3 rounded-xl bg-emerald-100 border border-[#059669] text-[#059669] text-xs font-bold flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Acta de cierre del Turno #{turnoNumero} sellada correctamente.</span>
                  </div>
                  <span className="font-mono uppercase text-[10px]">CERRADO</span>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default PosArqueoPage;
