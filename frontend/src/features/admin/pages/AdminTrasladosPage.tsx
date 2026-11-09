// frontend/src/features/admin/pages/AdminTrasladosPage.tsx
import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Truck,
  RefreshCw,
  AlertCircle,
  PackageCheck,
  ArrowRight,
  ChevronRight,
  Package,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import {
  fetchTraslados,
  createSolicitudTrasladoLocal,
  EstadoTraslado,
  TrasladoDTO,
} from '../services/adminService';
import { PRODUCTOS_SEMILLA } from '../../storefront/services/catalogService';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { DetailDrawer, ActivityTimelineItem } from '../../pos/components/DetailDrawer';
import { DespachoTrasladoModal } from '../components/DespachoTrasladoModal';
import { RecepcionTrasladoModal } from '../components/RecepcionTrasladoModal';
import { ResolucionNovedadModal } from '../components/ResolucionNovedadModal';

type TabEstado = 'Todos' | 'En Tránsito' | 'En Novedad' | 'Cerrados';

const TABS: TabEstado[] = ['Todos', 'En Tránsito', 'En Novedad', 'Cerrados'];

const ESTADO_A_TAB: Record<EstadoTraslado, TabEstado> = {
  SOLICITADO: 'Todos',
  APROBADO: 'Todos',
  RECHAZADO: 'Cerrados',
  ENVIADO: 'En Tránsito',
  RETORNANDO_A_CENTRAL: 'En Tránsito',
  RECIBIDO: 'Cerrados',
  RECIBIDO_CON_NOVEDAD: 'En Novedad',
  CERRADO: 'Cerrados',
  CANCELADO: 'Cerrados',
};

const ESTADO_BADGE_MAP: Record<
  EstadoTraslado,
  { label: string; variant: 'success' | 'warning' | 'error' | 'neutral' | 'champagne' | 'vino' }
> = {
  SOLICITADO: { label: 'Solicitado', variant: 'neutral' },
  APROBADO: { label: 'Aprobado', variant: 'champagne' },
  RECHAZADO: { label: 'Rechazado', variant: 'error' },
  ENVIADO: { label: 'En Tránsito', variant: 'vino' },
  RETORNANDO_A_CENTRAL: { label: 'Retornando', variant: 'warning' },
  RECIBIDO: { label: 'Recibido', variant: 'success' },
  RECIBIDO_CON_NOVEDAD: { label: 'Con Novedad', variant: 'warning' },
  CERRADO: { label: 'Cerrado', variant: 'neutral' },
  CANCELADO: { label: 'Cancelado', variant: 'neutral' },
};

const SEDES_LOGISTICAS = [
  { id: 1, nombre: 'Bodega Central' },
  { id: 2, nombre: 'Punto Centro (Cúcuta)' },
  { id: 8, nombre: 'Punto Caobos (Cúcuta)' },
  { id: 3, nombre: 'Punto Ocaña' },
  { id: 4, nombre: 'Punto Bucaramanga' },
];

interface VarianteCatalogoOption {
  varianteId: number;
  sku: string;
  nombreProducto: string;
  detalle: string;
}

const CATALOGO_VARIANTES: VarianteCatalogoOption[] = PRODUCTOS_SEMILLA.flatMap((p) =>
  p.variantes.map((v) => ({
    varianteId: v.id,
    sku: v.sku,
    nombreProducto: `${p.nombre} (${v.talla} · ${v.color})`,
    detalle: `${v.sku} — ${p.nombre} (${v.talla} / ${v.color})`,
  }))
);

export const AdminTrasladosPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabEstado>('Todos');

  // Registro seleccionado para el DetailDrawer
  const [selectedTraslado, setSelectedTraslado] = useState<TrasladoDTO | null>(null);
  const [drawerTab, setDrawerTab] = useState<'detalle' | 'actividad'>('detalle');

  // Modales operativos
  const [trasladoDespacho, setTrasladoDespacho] = useState<TrasladoDTO | null>(null);
  const [trasladoRecepcion, setTrasladoRecepcion] = useState<TrasladoDTO | null>(null);
  const [trasladoResolucion, setTrasladoResolucion] = useState<TrasladoDTO | null>(null);

  // Modal de creación de nuevo traslado real
  const [isCrearOpen, setIsCrearOpen] = useState(false);
  const [isCreando, setIsCreando] = useState(false);
  const [origenId, setOrigenId] = useState<number>(1);
  const [destinoId, setDestinoId] = useState<number>(4);
  const [despacharInmediatamente, setDespacharInmediatamente] = useState<boolean>(false);
  const [observacionesNuevo, setObservacionesNuevo] = useState<string>('');
  const [errorCrear, setErrorCrear] = useState<string | null>(null);
  const [lineasNuevas, setLineasNuevas] = useState<
    Array<{ sku: string; cantidad: number }>
  >([{ sku: CATALOGO_VARIANTES[0]?.sku || 'ROP-CAM-NEG-S', cantidad: 6 }]);

  // Query de traslados
  const {
    data: traslados = [],
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['admin-traslados'],
    queryFn: () => fetchTraslados(),
    staleTime: 10_000,
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-traslados'] });
  };

  // Filtrado por tab activo
  const trasladosFiltrados = useMemo(() => {
    if (activeTab === 'Todos') return traslados;
    return traslados.filter((t) => ESTADO_A_TAB[t.estado] === activeTab);
  }, [traslados, activeTab]);

  // Contadores por tab
  const counts = useMemo(() => {
    const result: Record<TabEstado, number> = {
      Todos: traslados.length,
      'En Tránsito': 0,
      'En Novedad': 0,
      Cerrados: 0,
    };
    traslados.forEach((t) => {
      const tab = ESTADO_A_TAB[t.estado];
      if (tab !== 'Todos') result[tab]++;
    });
    return result;
  }, [traslados]);

  const formatFecha = (iso?: string) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('es-CO', {
      timeZone: 'America/Bogota',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleAgregarLineaForm = () => {
    const defaultSku = CATALOGO_VARIANTES[0]?.sku || 'ROP-CAM-NEG-S';
    setLineasNuevas((prev) => [...prev, { sku: defaultSku, cantidad: 4 }]);
  };

  const handleEliminarLineaForm = (idx: number) => {
    setLineasNuevas((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCrearTrasladoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorCrear(null);

    if (origenId === destinoId) {
      setErrorCrear('La sede de origen y la sede de destino deben ser diferentes.');
      return;
    }

    const lineasValidas = lineasNuevas
      .map((ln) => {
        const ref = CATALOGO_VARIANTES.find((c) => c.sku === ln.sku);
        return {
          varianteId: ref?.varianteId || 101,
          sku: ln.sku,
          nombreProducto: ref?.nombreProducto || ln.sku,
          cantidadSolicitada: Math.max(1, Math.trunc(ln.cantidad || 1)),
        };
      })
      .filter((ln) => ln.cantidadSolicitada > 0);

    if (lineasValidas.length === 0) {
      setErrorCrear('Agregue al menos una prenda con cantidad mayor a cero.');
      return;
    }

    const origenObj = SEDES_LOGISTICAS.find((s) => s.id === origenId) || SEDES_LOGISTICAS[0];
    const destinoObj = SEDES_LOGISTICAS.find((s) => s.id === destinoId) || SEDES_LOGISTICAS[1];

    try {
      setIsCreando(true);
      await createSolicitudTrasladoLocal({
        origenId: origenObj.id,
        origenNombre: origenObj.nombre,
        destinoId: destinoObj.id,
        destinoNombre: destinoObj.nombre,
        observaciones: observacionesNuevo.trim() || undefined,
        despacharInmediatamente,
        lineas: lineasValidas,
      });

      setIsCrearOpen(false);
      setObservacionesNuevo('');
      setDespacharInmediatamente(false);
      setLineasNuevas([{ sku: CATALOGO_VARIANTES[0]?.sku || 'ROP-CAM-NEG-S', cantidad: 6 }]);
      handleRefresh();
    } catch (err: any) {
      setErrorCrear(err?.message || 'Error al registrar el traslado en el servidor');
    } finally {
      setIsCreando(false);
    }
  };

  // Actividad estimada para el drawer
  const timelineActividad = useMemo<ActivityTimelineItem[]>(() => {
    if (!selectedTraslado) return [];
    const items: ActivityTimelineItem[] = [];

    if (selectedTraslado.fechaSolicitud) {
      items.push({
        id: 'act-solicitud',
        timestamp: formatFecha(selectedTraslado.fechaSolicitud),
        title: 'Traslado Solicitado y Aprobado',
        description: `Solicitud originada para mover ${selectedTraslado.lineas.length} línea(s) de ${selectedTraslado.origenNombre} hacia ${selectedTraslado.destinoNombre}.`,
        type: 'info',
      });
    }

    const trasladoAny = selectedTraslado as any;

    if (selectedTraslado.fechaEnvio) {
      items.push({
        id: 'act-envio',
        timestamp: formatFecha(selectedTraslado.fechaEnvio),
        title: 'Mercancía Despachada',
        description: `Despachada con guía ${
          trasladoAny.guiaTransporte || 'Directa'
        } vía ${trasladoAny.transportadora || 'Logística Interna'}. En tránsito.`,
        type: 'warning',
      });
    }

    if (selectedTraslado.fechaRecepcion) {
      items.push({
        id: 'act-recepcion',
        timestamp: formatFecha(selectedTraslado.fechaRecepcion),
        title:
          selectedTraslado.estado === 'RECIBIDO_CON_NOVEDAD'
            ? 'Recepción con Novedad'
            : 'Mercancía Recibida',
        description:
          selectedTraslado.observaciones || 'Ingreso confirmado en la sede de destino.',
        type: selectedTraslado.estado === 'RECIBIDO_CON_NOVEDAD' ? 'warning' : 'success',
      });
    }

    return items;
  }, [selectedTraslado]);

  return (
    <div className="w-full space-y-5">
      {/* Encabezado Ejecutivo */}
      <PageHeader
        title="Traslados entre Sedes"
        subtitle="Control logístico de mercancía en tránsito, recepciones de stock y resolución de novedades multisede."
        badge="Logística Multisede"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setErrorCrear(null);
                setIsCrearOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#741C2B] hover:bg-[#5E1623] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#C49A68]" />
              <span>Nuevo Despacho / Traslado entre Sedes</span>
            </button>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isFetching}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-xs font-semibold text-white hover:bg-white/20 transition-all shadow-xs disabled:opacity-60 cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-[#E5BE90] ${isFetching ? 'animate-spin' : ''}`}
              />
              <span>Actualizar</span>
            </button>
          </div>
        }
      />

      {/* Tabs de Filtro por Estado */}
      <div
        role="tablist"
        aria-label="Filtrar traslados por estado"
        className="backdrop-blur-2xl bg-slate-100/90 dark:bg-white/[0.07] p-1.5 rounded-2xl border border-slate-200 dark:border-white/[0.14] flex items-center gap-1.5 overflow-x-auto shadow-sm"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-[#741C2B] to-[#912537] text-white shadow-md border border-[#741C2B]/40'
                  : 'text-[#475569] dark:text-white/70 hover:text-[#0F172A] dark:hover:text-white hover:bg-white dark:hover:bg-white/[0.08]'
              }`}
            >
              <span>{tab}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono tabular-nums font-black ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 dark:bg-white/10 text-[#475569] dark:text-white/70'
                }`}
              >
                {counts[tab]}
              </span>
            </button>
          );
        })}
      </div>

      {/* ESTADO 1: Loading */}
      {isLoading && (
        <div
          data-testid="traslados-skeleton"
          aria-label="Cargando traslados"
          aria-busy="true"
          className="bg-white dark:bg-white/[0.05] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-xs"
        >
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-14 border-b border-slate-200 dark:border-white/10 animate-pulse bg-slate-100/50 dark:bg-white/[0.02]"
            />
          ))}
        </div>
      )}

      {/* ESTADO 2: Error */}
      {isError && !isLoading && (
        <div className="bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 p-4 rounded-2xl flex items-center justify-between text-xs font-bold text-rose-800 dark:text-rose-300 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>No se pudieron cargar los traslados desde el servidor.</span>
          </div>
          <button
            onClick={() => refetch()}
            className="px-3.5 py-1.5 bg-[#741C2B] text-white rounded-lg font-bold flex items-center gap-1.5 hover:bg-[#5E1623] transition-all cursor-pointer text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Reintentar
          </button>
        </div>
      )}

      {/* ESTADO 3: Empty */}
      {!isLoading && !isError && trasladosFiltrados.length === 0 && (
        <div className="backdrop-blur-2xl bg-white/90 dark:bg-white/[0.07] border border-slate-200 dark:border-white/[0.14] text-center py-16 px-6 rounded-3xl shadow-lg space-y-3 text-[#0F172A] dark:text-white">
          <Truck className="w-10 h-10 text-[#741C2B] dark:text-[#E5BE90] mx-auto opacity-70" />
          <div className="space-y-1">
            <h3 className="text-base font-black text-[#0F172A] dark:text-white">
              No hay traslados en esta categoría
            </h3>
            <p className="text-xs text-[#475569] dark:text-white/70 max-w-md mx-auto font-medium">
              {activeTab === 'Todos'
                ? 'Aún no se han registrado traslados entre sedes. Usa el botón "Nuevo Despacho / Traslado entre Sedes" para registrar un movimiento real.'
                : `No se encontraron registros con estado "${activeTab}".`}
            </p>
          </div>
          {activeTab === 'Todos' && (
            <button
              type="button"
              onClick={() => setIsCrearOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#741C2B] to-[#912537] hover:from-[#912537] hover:to-[#A32E43] text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer border border-[#741C2B]/40"
            >
              <Plus className="w-3.5 h-3.5 text-white" />
              <span>Crear Primer Traslado</span>
            </button>
          )}
        </div>
      )}

      {/* ESTADO 4: Tabla de Traslados (Master-Detail) */}
      {!isLoading && !isError && trasladosFiltrados.length > 0 && (
        <div className="backdrop-blur-2xl bg-white/90 dark:bg-white/[0.07] border border-slate-200 dark:border-white/[0.14] rounded-3xl overflow-hidden shadow-lg text-[#0F172A] dark:text-white">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-white/[0.04] border-b border-slate-200 dark:border-white/10 text-[#475569] dark:text-white/60">
                <tr className="text-left font-bold uppercase tracking-wider text-[11px]">
                  <th className="px-5 py-3.5">Código</th>
                  <th className="px-5 py-3.5">Ruta Logística</th>
                  <th className="px-5 py-3.5">Estado</th>
                  <th className="px-5 py-3.5">Solicitud</th>
                  <th className="px-5 py-3.5">Envío</th>
                  <th className="px-5 py-3.5 text-center">Líneas</th>
                  <th className="px-5 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/[0.07]">
                {trasladosFiltrados.map((t) => {
                  const badgeConfig = ESTADO_BADGE_MAP[t.estado] || {
                    label: t.estado,
                    variant: 'neutral',
                  };
                  const puedeDespachar = t.estado === 'APROBADO';
                  const puedeRecibir = t.estado === 'ENVIADO';
                  const puedeResolver = t.estado === 'RECIBIDO_CON_NOVEDAD';
                  const isSelected = selectedTraslado?.id === t.id;

                  return (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedTraslado(t)}
                      className={`h-14 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#741C2B]/10 dark:bg-[#741C2B]/35 border-l-4 border-l-[#741C2B] dark:border-l-[#C49A68]'
                          : 'hover:bg-slate-50 dark:hover:bg-white/[0.06]'
                      }`}
                    >
                      <td className="px-5 py-3.5 font-mono font-black text-[#741C2B] dark:text-[#E5BE90]">
                        {t.codigo}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#0F172A] dark:text-white">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/15 font-bold text-[11px] text-[#0F172A] dark:text-white">
                            {t.origenNombre}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-[#741C2B] dark:text-[#E5BE90] shrink-0" />
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/15 font-bold text-[11px] text-[#0F172A] dark:text-white">
                            {t.destinoNombre}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge
                          label={badgeConfig.label}
                          variant={badgeConfig.variant}
                        />
                      </td>
                      <td className="px-5 py-3.5 font-mono tabular-nums text-[11px] text-[#475569] dark:text-slate-300 font-medium">
                        {formatFecha(t.fechaSolicitud)}
                      </td>
                      <td className="px-5 py-3.5 font-mono tabular-nums text-[11px] text-[#475569] dark:text-slate-300 font-medium">
                        {formatFecha(t.fechaEnvio)}
                      </td>
                      <td className="px-5 py-3.5 text-center font-mono tabular-nums font-bold">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-[11px] border border-slate-200 dark:border-white/15 text-[#0F172A] dark:text-white font-bold">
                          {t.lineas.length} {t.lineas.length === 1 ? 'prenda' : 'prendas'}
                        </span>
                      </td>
                      <td
                        className="px-5 py-3.5 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          {puedeDespachar && (
                            <button
                              onClick={() => setTrasladoDespacho(t)}
                              aria-label={`Despachar traslado ${t.codigo}`}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#741C2B] text-white hover:bg-[#5E1623] active:scale-95 transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                            >
                              <Truck className="w-3 h-3 text-white" />
                              Despachar
                            </button>
                          )}
                          {puedeRecibir && (
                            <button
                              onClick={() => setTrasladoRecepcion(t)}
                              aria-label={`Recibir traslado ${t.codigo}`}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#0F172A] text-white hover:bg-[#1E293B] border border-slate-700 active:scale-95 transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                            >
                              <PackageCheck className="w-3 h-3 text-white" />
                              Recibir
                            </button>
                          )}
                          {puedeResolver && (
                            <button
                              onClick={() => setTrasladoResolucion(t)}
                              aria-label={`Resolver novedad de ${t.codigo}`}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#B77925] text-white hover:bg-[#9E651E] active:scale-95 transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                            >
                              <AlertCircle className="w-3 h-3 text-white" />
                              Resolver
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedTraslado(t)}
                            className="p-1.5 rounded-lg text-[#475569] dark:text-slate-300 hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all cursor-pointer"
                            title="Ver detalles"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal para Crear Nuevo Traslado entre Sedes */}
      {isCrearOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Nuevo Despacho o Traslado entre Sedes"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl border border-[#E7E0D8] shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E0D8]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#741C2B]/10 text-[#741C2B] flex items-center justify-center border border-[#741C2B]/20">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#292827]">
                    Nuevo Despacho / Traslado entre Sedes
                  </h2>
                  <p className="text-xs text-[#77736E]">
                    Registre una orden de traslado logístico desde Bodega Central o entre puntos de
                    venta.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCrearOpen(false)}
                className="p-1.5 rounded-lg text-[#77736E] hover:text-[#292827] hover:bg-[#F5F3EF] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorCrear && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-[#C44848] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorCrear}</span>
              </div>
            )}

            <form onSubmit={handleCrearTrasladoSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#292827] mb-1.5">
                    Sede de Origen (Salida) *
                  </label>
                  <select
                    value={origenId}
                    onChange={(e) => setOrigenId(Number(e.target.value))}
                    className="w-full p-2.5 bg-[#F5F3EF] border border-[#E7E0D8] rounded-xl font-bold text-[#292827] focus:outline-none focus:border-[#741C2B] cursor-pointer"
                  >
                    {SEDES_LOGISTICAS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#292827] mb-1.5">
                    Sede de Destino (Recepción) *
                  </label>
                  <select
                    value={destinoId}
                    onChange={(e) => setDestinoId(Number(e.target.value))}
                    className="w-full p-2.5 bg-[#F5F3EF] border border-[#E7E0D8] rounded-xl font-bold text-[#292827] focus:outline-none focus:border-[#741C2B] cursor-pointer"
                  >
                    {SEDES_LOGISTICAS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Líneas de productos */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#292827]">
                    Prendas / Referencias a Trasladar *
                  </span>
                  <button
                    type="button"
                    onClick={handleAgregarLineaForm}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F5F3EF] hover:bg-[#E7E0D8] text-[#741C2B] font-bold transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Línea</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {lineasNuevas.map((ln, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 rounded-xl bg-[#F5F3EF] border border-[#E7E0D8]"
                    >
                      <select
                        value={ln.sku}
                        onChange={(e) => {
                          const val = e.target.value;
                          setLineasNuevas((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, sku: val } : item))
                          );
                        }}
                        className="flex-1 p-2 bg-white border border-[#E7E0D8] rounded-lg font-medium text-[#292827] focus:outline-none focus:border-[#741C2B]"
                      >
                        {CATALOGO_VARIANTES.map((v) => (
                          <option key={v.sku} value={v.sku}>
                            {v.detalle}
                          </option>
                        ))}
                      </select>

                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          max={500}
                          value={ln.cantidad}
                          onChange={(e) => {
                            const cant = Math.max(1, parseInt(e.target.value) || 1);
                            setLineasNuevas((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, cantidad: cant } : item
                              )
                            );
                          }}
                          className="w-24 p-2 bg-white border border-[#E7E0D8] rounded-lg text-right font-mono font-bold text-[#292827] focus:outline-none focus:border-[#741C2B]"
                        />
                        <span className="text-[11px] text-[#77736E] font-semibold">uds</span>
                        {lineasNuevas.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleEliminarLineaForm(idx)}
                            className="p-1.5 text-[#C44848] hover:bg-rose-50 rounded-lg cursor-pointer"
                            title="Eliminar línea"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#292827] mb-1.5">
                  Observaciones Logísticas (opcional)
                </label>
                <input
                  type="text"
                  value={observacionesNuevo}
                  onChange={(e) => setObservacionesNuevo(e.target.value)}
                  placeholder="Ej. Reposición de curva de tallas para fin de semana..."
                  className="w-full p-2.5 bg-[#F5F3EF] border border-[#E7E0D8] rounded-xl font-medium text-[#292827] focus:outline-none focus:border-[#741C2B]"
                />
              </div>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#F5F3EF] border border-[#E7E0D8] cursor-pointer">
                <input
                  type="checkbox"
                  checked={despacharInmediatamente}
                  onChange={(e) => setDespacharInmediatamente(e.target.checked)}
                  className="w-4 h-4 accent-[#741C2B] rounded"
                />
                <div>
                  <span className="font-bold text-[#292827] block">
                    Marcar como despachado inmediatamente (En Tránsito)
                  </span>
                  <span className="text-[11px] text-[#77736E]">
                    Si no se marca, quedará en estado Aprobado para despachar luego.
                  </span>
                </div>
              </label>

              <div className="pt-3 border-t border-[#E7E0D8] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCrearOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#F5F3EF] hover:bg-[#E7E0D8] text-[#292827] font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreando}
                  className="px-4 py-2 rounded-xl bg-[#741C2B] hover:bg-[#5E1623] text-white font-bold shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isCreando ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-[#C49A68]" />
                      <span>Registrando...</span>
                    </>
                  ) : (
                    <span>Registrar Traslado</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DetailDrawer Lateral de Master-Detail */}
      <DetailDrawer
        isOpen={selectedTraslado !== null}
        onClose={() => setSelectedTraslado(null)}
        title={selectedTraslado?.codigo || 'Detalle de Traslado'}
        subtitle={
          selectedTraslado
            ? `${selectedTraslado.origenNombre} ➔ ${selectedTraslado.destinoNombre}`
            : undefined
        }
        badge={
          selectedTraslado
            ? {
                label:
                  ESTADO_BADGE_MAP[selectedTraslado.estado]?.label || selectedTraslado.estado,
                variant:
                  selectedTraslado.estado === 'RECIBIDO'
                    ? 'success'
                    : selectedTraslado.estado === 'ENVIADO'
                    ? 'info'
                    : 'warning',
              }
            : undefined
        }
        tabs={[
          { id: 'detalle', label: 'Prendas y Logística' },
          { id: 'actividad', label: 'Trazabilidad' },
        ]}
        activeTab={drawerTab}
        onTabChange={(t) => setDrawerTab(t as 'detalle' | 'actividad')}
        activityItems={timelineActividad}
      >
        {selectedTraslado && (
          <div className="space-y-6">
            {/* Resumen Logístico */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-[#F5F3EF] border border-[#E7E0D8]">
              <div>
                <span className="text-[11px] font-bold text-[#77736E] uppercase block">
                  Origen
                </span>
                <span className="text-xs font-bold text-[#292827] block mt-0.5">
                  {selectedTraslado.origenNombre}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-[#77736E] uppercase block">
                  Destino
                </span>
                <span className="text-xs font-bold text-[#292827] block mt-0.5">
                  {selectedTraslado.destinoNombre}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-[#77736E] uppercase block">
                  Fecha Solicitud
                </span>
                <span className="text-xs font-mono text-[#292827] block mt-0.5">
                  {formatFecha(selectedTraslado.fechaSolicitud)}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-[#77736E] uppercase block">
                  Fecha Envío
                </span>
                <span className="text-xs font-mono text-[#292827] block mt-0.5">
                  {formatFecha(selectedTraslado.fechaEnvio)}
                </span>
              </div>
              {selectedTraslado.observaciones && (
                <div className="col-span-2 pt-2 border-t border-[#E7E0D8]">
                  <span className="text-[11px] font-bold text-[#77736E] uppercase block">
                    Observaciones
                  </span>
                  <span className="text-xs font-medium text-[#292827] block mt-0.5">
                    {selectedTraslado.observaciones}
                  </span>
                </div>
              )}
            </div>

            {/* Lista de Prendas / Líneas */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#77736E] flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-[#741C2B]" />
                  Prendas en Traslado ({selectedTraslado.lineas.length})
                </h4>
              </div>

              <div className="border border-[#E7E0D8] rounded-xl overflow-hidden divide-y divide-[#E7E0D8]">
                {selectedTraslado.lineas.map((linea) => (
                  <div
                    key={linea.id}
                    className="p-3.5 bg-white flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono text-[11px] text-[#741C2B] font-bold block">
                        {linea.sku}
                      </span>
                      <span className="font-bold text-[#292827] block mt-0.5">
                        {linea.nombreProducto}
                      </span>
                      <span className="text-[11px] text-[#77736E]">
                        Solicitado: {linea.cantidadSolicitada} · Aprobado:{' '}
                        {linea.cantidadAprobada}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="block text-xs font-bold text-[#292827]">
                        {linea.cantidadEnviada || linea.cantidadSolicitada} uds
                      </span>
                      <span className="block text-[10px] text-[#77736E]">
                        Solicitado: {linea.cantidadSolicitada}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Acciones Rápidas en Drawer */}
            <div className="pt-2 flex flex-col gap-2">
              {selectedTraslado.estado === 'APROBADO' && (
                <button
                  onClick={() => {
                    const t = selectedTraslado;
                    setSelectedTraslado(null);
                    setTrasladoDespacho(t);
                  }}
                  className="w-full py-2.5 bg-[#741C2B] text-white font-bold text-xs rounded-xl hover:bg-[#5E1623] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Truck className="w-4 h-4 text-[#C49A68]" />
                  Despachar este Traslado
                </button>
              )}
              {selectedTraslado.estado === 'ENVIADO' && (
                <button
                  onClick={() => {
                    const t = selectedTraslado;
                    setSelectedTraslado(null);
                    setTrasladoRecepcion(t);
                  }}
                  className="w-full py-2.5 bg-[#292827] text-white font-bold text-xs rounded-xl hover:bg-[#1F1E1D] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <PackageCheck className="w-4 h-4 text-[#C49A68]" />
                  Recibir Mercancía en Destino
                </button>
              )}
              {selectedTraslado.estado === 'RECIBIDO_CON_NOVEDAD' && (
                <button
                  onClick={() => {
                    const t = selectedTraslado;
                    setSelectedTraslado(null);
                    setTrasladoResolucion(t);
                  }}
                  className="w-full py-2.5 bg-[#B77925] text-white font-bold text-xs rounded-xl hover:bg-[#9E651E] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <AlertCircle className="w-4 h-4 text-white" />
                  Resolver Novedad de Recepción
                </button>
              )}
            </div>
          </div>
        )}
      </DetailDrawer>

      {/* Modales de Despacho, Recepción y Novedad */}
      <DespachoTrasladoModal
        traslado={trasladoDespacho}
        isOpen={trasladoDespacho !== null}
        onClose={() => setTrasladoDespacho(null)}
        onSuccess={handleRefresh}
      />

      <RecepcionTrasladoModal
        traslado={trasladoRecepcion}
        isOpen={trasladoRecepcion !== null}
        onClose={() => setTrasladoRecepcion(null)}
        onSuccess={handleRefresh}
      />

      <ResolucionNovedadModal
        traslado={trasladoResolucion}
        isOpen={trasladoResolucion !== null}
        onClose={() => setTrasladoResolucion(null)}
        onSuccess={handleRefresh}
      />
    </div>
  );
};

export default AdminTrasladosPage;
