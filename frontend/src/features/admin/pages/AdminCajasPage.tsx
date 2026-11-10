// frontend/src/features/admin/pages/AdminCajasPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Wallet,
  Store,
  DollarSign,
  AlertTriangle,
  Eye,
} from 'lucide-react';
import {
  PageHeader,
  KPIStatCard,
  FilterBar,
  DataTable,
  DetailDrawer,
  StatusBadge,
  EmptyState,
  formatCOP,
  type ColumnDef,
  type ActivityTimelineItem,
} from '../components';
import {
  getSesionesCaja,
  SesionCaja,
  CAJA_EVENT,
  resumenSesion,
} from '../../pos/utils/cajaStore';
import { mismaSede } from '../../pos/utils/webOrdersStore';

const formatFechaHora = (iso?: string): string => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('es-CO', {
      timeZone: 'America/Bogota',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return iso;
  }
};

const SEDES_FISICAS = [
  'Punto Centro (Cúcuta)',
  'Punto Caobos (Cúcuta)',
  'Punto Ocaña',
  'Punto Bucaramanga',
] as const;

export const AdminCajasPage: React.FC = () => {
  const [sesiones, setSesiones] = useState<SesionCaja[]>(() => getSesionesCaja());
  const [filtroSede, setFiltroSede] = useState<string>('todas');
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | 'ABIERTA' | 'CERRADA'>('TODOS');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSesion, setSelectedSesion] = useState<SesionCaja | null>(null);
  const [drawerTab, setDrawerTab] = useState<'detalle' | 'productos' | 'actividad' | 'comprobantes'>('detalle');

  const cargarSesiones = () => {
    const reales = getSesionesCaja();
    setSesiones(reales);
    setSelectedSesion((prev) => {
      if (!prev) return null;
      return reales.find((r) => r.id === prev.id) || null;
    });
  };

  useEffect(() => {
    cargarSesiones();
    window.addEventListener(CAJA_EVENT, cargarSesiones);
    window.addEventListener('forma-pos-ledger-update', cargarSesiones);
    window.addEventListener('storage', cargarSesiones);
    return () => {
      window.removeEventListener(CAJA_EVENT, cargarSesiones);
      window.removeEventListener('forma-pos-ledger-update', cargarSesiones);
      window.removeEventListener('storage', cargarSesiones);
    };
  }, []);

  const metricas = useMemo(() => {
    let totalEfectivoGavetas = 0;
    let totalCajasAbiertas = 0;
    let totalVentasEfectivo = 0;
    let totalDiferencias = 0;

    sesiones.forEach((s) => {
      const res = resumenSesion(s);
      totalVentasEfectivo += res.ventasEfectivoCop;
      if (s.estado === 'ABIERTA') {
        totalCajasAbiertas++;
        totalEfectivoGavetas += res.efectivoEsperadoCop;
      } else if (s.estado === 'CERRADA' && s.diferenciaCop) {
        totalDiferencias += Math.abs(s.diferenciaCop);
      }
    });

    return {
      totalEfectivoGavetas,
      totalCajasAbiertas,
      totalVentasEfectivo,
      totalDiferencias,
    };
  }, [sesiones]);

  const sesionesFiltradas = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return sesiones.filter((s) => {
      if (filtroSede !== 'todas' && !mismaSede(s.sede, filtroSede)) return false;
      if (filtroEstado !== 'TODOS' && s.estado !== filtroEstado) return false;
      if (!q) return true;
      const matchCajero = s.vendedor.toLowerCase().includes(q);
      const matchSede = s.sede.toLowerCase().includes(q);
      const matchTurno = `turno #${s.turnoNumero}`.includes(q);
      return matchCajero || matchSede || matchTurno;
    });
  }, [sesiones, filtroSede, filtroEstado, searchQuery]);

  const estadoPorSede = useMemo(() => {
    return SEDES_FISICAS.map((sedeNombre) => {
      const abierta = sesiones.find((s) => mismaSede(s.sede, sedeNombre) && s.estado === 'ABIERTA');
      return {
        sedeNombre,
        sesion: abierta || null,
        estaAbierta: Boolean(abierta),
        resumen: abierta ? resumenSesion(abierta) : null,
      };
    });
  }, [sesiones]);

  const selectedResumen = useMemo(() => {
    if (!selectedSesion) return null;
    return resumenSesion(selectedSesion);
  }, [selectedSesion]);

  const timelineActividad = useMemo<ActivityTimelineItem[]>(() => {
    if (!selectedSesion) return [];
    const items: ActivityTimelineItem[] = [
      {
        id: `act-open-${selectedSesion.id}`,
        timestamp: formatFechaHora(selectedSesion.aperturaIso),
        title: `Apertura de Turno #${selectedSesion.turnoNumero}`,
        description: `Base inicial declarada: ${formatCOP(selectedSesion.baseInicialCop)}. ${selectedSesion.observacionApertura || ''}`,
        user: selectedSesion.vendedor,
        type: 'info',
        badge: 'Apertura',
      },
    ];

    selectedSesion.movimientos.forEach((m) => {
      items.push({
        id: `act-mov-${m.id}`,
        timestamp: formatFechaHora(m.fechaIso),
        title: `${m.tipo === 'INGRESO_REINTEGRO' ? 'Reintegro de Efectivo' : 'Retiro / Sangría'} (${m.comprobanteRef})`,
        description: `${m.anulado ? '[ANULADO] ' : ''}Monto: ${formatCOP(m.montoCop)} — ${m.motivo || 'Movimiento de gaveta'}`,
        user: selectedSesion.vendedor,
        type: m.anulado ? 'neutral' : m.tipo === 'INGRESO_REINTEGRO' ? 'success' : 'warning',
        badge: m.comprobanteRef,
      });
    });

    if (selectedSesion.estado === 'CERRADA' && selectedSesion.cierreIso) {
      items.push({
        id: `act-close-${selectedSesion.id}`,
        timestamp: formatFechaHora(selectedSesion.cierreIso),
        title: `Cierre y Arqueo Ciego Sellado`,
        description: `Efectivo contado: ${formatCOP(selectedSesion.efectivoContadoCop || 0)} | Esperado: ${formatCOP(selectedSesion.efectivoEsperadoCop || 0)} | Diferencia: ${formatCOP(selectedSesion.diferenciaCop || 0)}`,
        user: selectedSesion.vendedor,
        type: selectedSesion.diferenciaCop === 0 ? 'success' : 'error',
        badge: selectedSesion.diferenciaCop === 0 ? 'Cuadre Exacto' : 'Con Diferencia',
      });
    }

    return items;
  }, [selectedSesion]);

  const columns: ColumnDef<SesionCaja>[] = [
    {
      key: 'turno',
      header: 'Turno',
      render: (s) => (
        <div>
          <span className="font-mono font-bold text-xs text-[#E5BE90] block">
            Turno #{s.turnoNumero}
          </span>
          <span className="font-mono text-[10px] text-white/50">{s.id}</span>
        </div>
      ),
    },
    {
      key: 'sede',
      header: 'Sede',
      render: (s) => <span className="font-bold text-xs text-white">{s.sede}</span>,
    },
    {
      key: 'vendedor',
      header: 'Cajero en Turno',
      render: (s) => <span className="text-xs font-medium text-white/90">{s.vendedor}</span>,
    },
    {
      key: 'horarios',
      header: 'Apertura / Cierre',
      render: (s) => (
        <div className="text-[11px] space-y-0.5">
          <div className="text-[#0F172A] flex items-center gap-1 font-mono font-medium">
            <span className="text-emerald-700 font-bold">Inicia:</span> {formatFechaHora(s.aperturaIso)}
          </div>
          {s.cierreIso && (
            <div className="text-[#475569] flex items-center gap-1 font-mono font-medium">
              <span className="text-rose-700 font-bold">Cierra:</span> {formatFechaHora(s.cierreIso)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'diferencia',
      header: 'Diferencia Arqueo',
      align: 'right',
      render: (s) => {
        if (s.estado === 'ABIERTA') {
          return <span className="text-xs text-[#64748B] italic font-medium">Turno en curso</span>;
        }
        const dif = s.diferenciaCop || 0;
        return (
          <span
            className={`font-mono text-xs font-black ${
              dif === 0 ? 'text-emerald-700' : dif > 0 ? 'text-amber-800' : 'text-rose-700'
            }`}
          >
            {dif === 0 ? 'Cuadre Exacto' : formatCOP(dif)}
          </span>
        );
      },
    },
    {
      key: 'estado',
      header: 'Estado',
      align: 'right',
      render: (s) => (
        <div className="flex items-center justify-end gap-2">
          <StatusBadge
            label={s.estado === 'ABIERTA' ? 'Abierta' : 'Cerrada'}
            variant={s.estado === 'ABIERTA' ? 'success' : 'neutral'}
            dot
            size="sm"
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedSesion(s);
              setDrawerTab('detalle');
            }}
            className="p-1.5 rounded-xl border border-[#E7E0D8] bg-white text-[#741C2B] hover:bg-[#F5F3EF] transition-colors cursor-pointer shadow-2xs"
            title="Inspeccionar Turno"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Monitor de Cajas Físicas y Arqueos"
        subtitle="Supervisión en tiempo real de apertura, movimientos de efectivo y arqueos ciegos por punto de venta."
        badge="Tesorería POS"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPIStatCard
          title="Efectivo en Gavetas"
          value={formatCOP(metricas.totalEfectivoGavetas)}
          subtitle="Saldo consolidado disponible"
          icon={Wallet}
        />
        <KPIStatCard
          title="Cajas en Operación"
          value={`${metricas.totalCajasAbiertas} de ${SEDES_FISICAS.length}`}
          subtitle="Puntos con turno abierto"
          icon={Store}
        />
        <KPIStatCard
          title="Ventas Efectivo Hoy"
          value={formatCOP(metricas.totalVentasEfectivo)}
          subtitle="Cobros directos en mostrador"
          icon={DollarSign}
        />
        <KPIStatCard
          title="Diferencias Arqueo"
          value={formatCOP(metricas.totalDiferencias)}
          subtitle="Descuadres auditados al cierre"
          icon={AlertTriangle}
        />
      </div>

      {/* Estado Actual por Punto de Venta */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-[#475569]">
          Estado Operativo por Punto de Venta
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {estadoPorSede.map(({ sedeNombre, sesion, estaAbierta, resumen }) => (
            <div
              key={sedeNombre}
              onClick={() => sesion && setSelectedSesion(sesion)}
              className={`p-4 rounded-2xl border transition-all ${
                estaAbierta
                  ? 'bg-emerald-50/80 border-emerald-300 shadow-sm ring-1 ring-emerald-200 hover:border-emerald-500'
                  : 'bg-white border-slate-200/90 shadow-2xs hover:border-slate-300'
              } ${sesion ? 'cursor-pointer hover:shadow-md' : ''}`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-bold text-xs text-[#0F172A] truncate">{sedeNombre}</span>
                <StatusBadge
                  label={estaAbierta ? 'Caja Abierta' : 'Caja Cerrada'}
                  variant={estaAbierta ? 'success' : 'neutral'}
                  dot
                  size="sm"
                />
              </div>

              {estaAbierta && sesion && resumen ? (
                <div className="space-y-1 text-xs">
                  <div className="text-[11px] text-[#475569] font-medium">
                    Cajero: <strong className="text-[#0F172A] font-bold">{sesion.vendedor}</strong> · Turno #{sesion.turnoNumero}
                  </div>
                  <div className="flex justify-between text-[#475569] pt-1 border-t border-emerald-200/80">
                    <span className="font-medium">En gaveta:</span>
                    <span className="font-mono font-black text-emerald-800">
                      {formatCOP(resumen.efectivoEsperadoCop)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-1 text-xs text-[#64748B]">
                  <div className="font-medium">Sin turno activo</div>
                  <div className="font-mono text-[11px] pt-1 text-[#94A3B8] font-bold">$0 COP en gaveta</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Buscar por cajero, sede o número de turno..."
      >
        <select
          value={filtroSede}
          onChange={(e) => setFiltroSede(e.target.value)}
          aria-label="Filtrar por sede física"
          className="px-3 py-2 bg-[#F5F3EF] border border-[#E7E0D8] rounded-xl text-xs font-bold text-[#292827] cursor-pointer focus:outline-none focus:border-[#741C2B]"
        >
          <option value="todas">Todas las Sedes Físicas</option>
          {SEDES_FISICAS.map((nombre) => (
            <option key={nombre} value={nombre}>
              {nombre}
            </option>
          ))}
        </select>

        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value as any)}
          aria-label="Filtrar por estado de caja"
          className="px-3 py-2 bg-[#F5F3EF] border border-[#E7E0D8] rounded-xl text-xs font-bold text-[#292827] cursor-pointer focus:outline-none focus:border-[#741C2B]"
        >
          <option value="TODOS">Todos los Estados</option>
          <option value="ABIERTA">Solo Cajas Abiertas</option>
          <option value="CERRADA">Solo Cajas Cerradas</option>
        </select>
      </FilterBar>

      {sesiones.length === 0 ? (
        <EmptyState
          title="Aún no se han registrado aperturas ni cierres de turno"
          description="Los turnos y arqueos aparecerán automáticamente a medida que los cajeros inicien operaciones en los puntos de venta."
          icon={Wallet}
        />
      ) : (
        <DataTable
          columns={columns}
          data={sesionesFiltradas}
          keyExtractor={(s) => s.id}
          onSelectRow={(s) => {
            setSelectedSesion(s);
            setDrawerTab('detalle');
          }}
          emptyTitle="No se encontraron turnos con los filtros seleccionados"
          emptySubtitle="Prueba ajustando la sede o el estado del filtro."
        />
      )}

      {selectedSesion && (
        <DetailDrawer
          isOpen={Boolean(selectedSesion)}
          onClose={() => setSelectedSesion(null)}
          title={`Turno #${selectedSesion.turnoNumero} — ${selectedSesion.sede}`}
          subtitle={`Cajero: ${selectedSesion.vendedor} · ID: ${selectedSesion.id}`}
          badge={{
            label: selectedSesion.estado === 'ABIERTA' ? 'Turno Activo' : 'Turno Sellado',
            variant: selectedSesion.estado === 'ABIERTA' ? 'success' : 'neutral',
          }}
          tabs={[
            { id: 'detalle', label: 'Información' },
            { id: 'productos', label: 'Movimientos de Gaveta' },
            { id: 'actividad', label: 'Historial' },
            { id: 'comprobantes', label: 'Comprobantes' },
          ]}
          activeTab={drawerTab}
          onTabChange={(t) => setDrawerTab(t as any)}
          activityItems={timelineActividad}
        >
          <div className="space-y-4">
            {drawerTab === 'detalle' && selectedResumen && (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-[12px] bg-[#F5F3EF] border border-[#E7E0D8] space-y-2.5">
                  <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-[#77736E]">
                    Resumen Financiero del Turno
                  </h4>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-[#77736E] block">Base Inicial:</span>
                      <strong className="font-mono text-sm text-[#292827]">
                        {formatCOP(selectedSesion.baseInicialCop)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#77736E] block">Ventas Efectivo:</span>
                      <strong className="font-mono text-sm text-[#27845C]">
                        {formatCOP(selectedResumen.ventasEfectivoCop)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#77736E] block">Transferencias QR:</span>
                      <strong className="font-mono text-sm text-[#741C2B]">
                        {formatCOP(selectedResumen.ventasTransferenciaCop)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#77736E] block">Efectivo Esperado:</span>
                      <strong className="font-mono text-sm text-[#741C2B]">
                        {formatCOP(selectedResumen.efectivoEsperadoCop)}
                      </strong>
                    </div>
                  </div>
                </div>

                {selectedSesion.estado === 'CERRADA' && (
                  <div className="p-4 rounded-[12px] bg-white border border-[#E7E0D8] space-y-2 shadow-2xs">
                    <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-[#77736E]">
                      Resultado de Arqueo Ciego
                    </h4>
                    <div className="flex justify-between items-center text-xs">
                      <span>Efectivo Contado Declarado:</span>
                      <span className="font-mono font-bold text-[#292827]">
                        {formatCOP(selectedSesion.efectivoContadoCop || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span>Diferencia al Cierre:</span>
                      <span
                        className={`font-mono font-bold ${
                          (selectedSesion.diferenciaCop || 0) === 0
                            ? 'text-[#27845C]'
                            : 'text-[#C44848]'
                        }`}
                      >
                        {(selectedSesion.diferenciaCop || 0) === 0
                          ? 'Cuadre Exacto'
                          : formatCOP(selectedSesion.diferenciaCop || 0)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {drawerTab === 'productos' && (
              <div className="space-y-3">
                <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-[#77736E]">
                  Movimientos Registrados en Gaveta ({selectedSesion.movimientos.length})
                </h4>
                {selectedSesion.movimientos.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#77736E] bg-[#F5F3EF] rounded-[12px]">
                    No se registraron sangrías, gastos menores ni reintegros en este turno.
                  </div>
                ) : (
                  <div className="border border-[#E7E0D8] rounded-[12px] divide-y divide-[#E7E0D8] overflow-hidden">
                    {selectedSesion.movimientos.map((m) => (
                      <div key={m.id} className="p-3 bg-white text-xs space-y-1">
                        <div className="flex justify-between font-mono font-bold">
                          <span className={m.anulado ? 'line-through text-[#77736E]' : 'text-[#741C2B]'}>
                            {m.comprobanteRef}
                          </span>
                          <span className={m.anulado ? 'line-through text-[#77736E]' : 'text-[#292827]'}>
                            {formatCOP(m.montoCop)}
                          </span>
                        </div>
                        <div className="text-[#77736E] text-[11px]">{m.motivo}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {drawerTab === 'comprobantes' && (
              <div className="space-y-3">
                <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-[#77736E]">
                  Soportes y Vales del Turno
                </h4>
                <div className="p-4 rounded-[12px] bg-[#F5F3EF] border border-[#E7E0D8] space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#77736E]">Acta de Cierre:</span>
                    <span className="font-mono font-bold text-[#292827]">
                      {selectedSesion.estado === 'CERRADA' ? `ACTA-${selectedSesion.id}` : 'En curso'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#77736E]">Cajero Responsable:</span>
                    <span className="font-bold text-[#292827]">{selectedSesion.vendedor}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DetailDrawer>
      )}
    </div>
  );
};

export default AdminCajasPage;
