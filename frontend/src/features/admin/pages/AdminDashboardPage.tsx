// frontend/src/features/admin/pages/AdminDashboardPage.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Package,
  ShoppingBag,
  Vault,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Truck,
  CheckCircle2,
  Store,
  RefreshCw,
} from 'lucide-react';
import { SedeAdminFiltro, SEDES_ADMIN_OPTIONS, SEDES_LABELS } from '../../../layouts/AdminLayout';

interface AlertaInventarioItem {
  sku: string;
  nombre: string;
  disponible: number;
  umbral: number;
  estado: 'critico' | 'bajo';
}

interface TrasladoRecienteItem {
  id: string;
  origen: string;
  destino: string;
  unidades: number;
  estado: string;
  fecha: string;
}

export interface KpiSedeData {
  sedeKey: SedeAdminFiltro;
  nombreSede: string;
  ciudad: string;
  badge: string;
  ventasNetasTexto: string;
  ventasBrutasTexto: string;
  devolucionesTexto: string;
  descuentosTexto: string;
  variacionTexto: string;
  porcentajeParticipacion: number;
  unidadesInventarioTexto: string;
  valorizadoInventarioTexto: string;
  productosResumen: string;
  pedidosActivosTexto: string;
  pedidosEmpaque: number;
  pedidosDespacho: number;
  cajaEstado: string;
  cajaDetalle: string;
  cajaAbierta: boolean;
  alertasInventario: AlertaInventarioItem[];
  trasladosRecientes: TrasladoRecienteItem[];
}

/**
 * Datos agregados por sede para visualización instantánea y reactiva
 */
const SEDES_DASHBOARD_DATA: Record<SedeAdminFiltro, KpiSedeData> = {
  'Todas las Sedes (Consolidado)': {
    sedeKey: 'Todas las Sedes (Consolidado)',
    nombreSede: 'Consolidado Nacional',
    ciudad: '5 Ubicaciones Operativas',
    badge: 'Consolidado Global',
    ventasNetasTexto: '$48.920.000 COP',
    ventasBrutasTexto: '$54.120.000 COP',
    devolucionesTexto: '-$1.850.000 COP',
    descuentosTexto: '-$3.350.000 COP',
    variacionTexto: '+14.8% vs mes anterior',
    porcentajeParticipacion: 100,
    unidadesInventarioTexto: '3.140 Unidades',
    valorizadoInventarioTexto: '$612.450.000 COP',
    productosResumen: '133 Productos • 628 Variantes activas',
    pedidosActivosTexto: '18 Pedidos Activos',
    pedidosEmpaque: 11,
    pedidosDespacho: 7,
    cajaEstado: '4/4 Sedes Abiertas',
    cajaDetalle: 'Base $200.000 COP c/u • Cuadre 100%',
    cajaAbierta: true,
    alertasInventario: [
      {
        sku: 'CHA-DEN-M',
        nombre: 'Chaqueta Denim Artesanal',
        disponible: 3,
        umbral: 5,
        estado: 'bajo',
      },
      {
        sku: 'BOT-SAN-38',
        nombre: 'Botín Chelsea Cuero Guane',
        disponible: 1,
        umbral: 4,
        estado: 'critico',
      },
      {
        sku: 'VES-SED-S',
        nombre: 'Vestido Seda Ancestral Champaña',
        disponible: 2,
        umbral: 5,
        estado: 'critico',
      },
    ],
    trasladosRecientes: [
      {
        id: 'TRL-0084',
        origen: 'Bodega Central',
        destino: 'Punto Bucaramanga',
        unidades: 12,
        estado: 'En Tránsito',
        fecha: 'Hoy 10:25 AM',
      },
      {
        id: 'TRL-0083',
        origen: 'Punto Centro',
        destino: 'Punto Caobos',
        unidades: 6,
        estado: 'Recibido',
        fecha: 'Hoy 09:40 AM',
      },
      {
        id: 'TRL-0082',
        origen: 'Bodega Central',
        destino: 'Punto Ocaña',
        unidades: 8,
        estado: 'En Preparación',
        fecha: 'Ayer 05:15 PM',
      },
    ],
  },
  'Punto Centro': {
    sedeKey: 'Punto Centro',
    nombreSede: 'Punto Centro (Cúcuta)',
    ciudad: 'Cúcuta Centro',
    badge: 'Sede Líder',
    ventasNetasTexto: '$16.450.000 COP',
    ventasBrutasTexto: '$18.200.000 COP',
    devolucionesTexto: '-$600.000 COP',
    descuentosTexto: '-$1.150.000 COP',
    variacionTexto: '+18.2% vs mes anterior',
    porcentajeParticipacion: 34,
    unidadesInventarioTexto: '740 Unidades',
    valorizadoInventarioTexto: '$148.900.000 COP',
    productosResumen: '133 Productos • 162 Variantes',
    pedidosActivosTexto: '6 Pedidos Asignados',
    pedidosEmpaque: 4,
    pedidosDespacho: 2,
    cajaEstado: 'Caja Abierta (CAJ-401)',
    cajaDetalle: 'Base $200.000 COP • Valentina Ríos',
    cajaAbierta: true,
    alertasInventario: [
      {
        sku: 'CHA-DEN-M',
        nombre: 'Chaqueta Denim Artesanal',
        disponible: 1,
        umbral: 3,
        estado: 'critico',
      },
      {
        sku: 'CAM-LIN-L',
        nombre: 'Camisa Lino Orgánico Barichara',
        disponible: 2,
        umbral: 4,
        estado: 'bajo',
      },
    ],
    trasladosRecientes: [
      {
        id: 'TRL-0083',
        origen: 'Punto Centro',
        destino: 'Punto Caobos',
        unidades: 6,
        estado: 'Despachado',
        fecha: 'Hoy 09:40 AM',
      },
      {
        id: 'TRL-0079',
        origen: 'Bodega Central',
        destino: 'Punto Centro',
        unidades: 15,
        estado: 'Recibido',
        fecha: 'Ayer 04:30 PM',
      },
    ],
  },
  'Punto Caobos': {
    sedeKey: 'Punto Caobos',
    nombreSede: 'Punto Caobos (Cúcuta)',
    ciudad: 'Cúcuta Caobos',
    badge: 'Boutique VIP',
    ventasNetasTexto: '$14.180.000 COP',
    ventasBrutasTexto: '$15.680.000 COP',
    devolucionesTexto: '-$520.000 COP',
    descuentosTexto: '-$980.000 COP',
    variacionTexto: '+15.4% vs mes anterior',
    porcentajeParticipacion: 29,
    unidadesInventarioTexto: '685 Unidades',
    valorizadoInventarioTexto: '$136.200.000 COP',
    productosResumen: '133 Productos • 158 Variantes',
    pedidosActivosTexto: '5 Pedidos Asignados',
    pedidosEmpaque: 3,
    pedidosDespacho: 2,
    cajaEstado: 'Caja Abierta (CAJ-402)',
    cajaDetalle: 'Base $200.000 COP • Mateo Peñaranda',
    cajaAbierta: true,
    alertasInventario: [
      {
        sku: 'VES-SED-S',
        nombre: 'Vestido Seda Ancestral Champaña',
        disponible: 1,
        umbral: 3,
        estado: 'critico',
      },
      {
        sku: 'BOL-CUE-02',
        nombre: 'Bolso Tote Sastrería Vinotinto',
        disponible: 2,
        umbral: 4,
        estado: 'bajo',
      },
    ],
    trasladosRecientes: [
      {
        id: 'TRL-0083',
        origen: 'Punto Centro',
        destino: 'Punto Caobos',
        unidades: 6,
        estado: 'Recibido',
        fecha: 'Hoy 09:40 AM',
      },
    ],
  },
  'Punto Bucaramanga': {
    sedeKey: 'Punto Bucaramanga',
    nombreSede: 'Punto Bucaramanga',
    ciudad: 'Bucaramanga Cabecera',
    badge: 'Santander',
    ventasNetasTexto: '$11.240.000 COP',
    ventasBrutasTexto: '$12.400.000 COP',
    devolucionesTexto: '-$420.000 COP',
    descuentosTexto: '-$740.000 COP',
    variacionTexto: '+12.1% vs mes anterior',
    porcentajeParticipacion: 23,
    unidadesInventarioTexto: '590 Unidades',
    valorizadoInventarioTexto: '$118.450.000 COP',
    productosResumen: '133 Productos • 154 Variantes',
    pedidosActivosTexto: '4 Pedidos Asignados',
    pedidosEmpaque: 2,
    pedidosDespacho: 2,
    cajaEstado: 'Caja Abierta (CAJ-403)',
    cajaDetalle: 'Base $200.000 COP • Camila Mantilla',
    cajaAbierta: true,
    alertasInventario: [
      {
        sku: 'BOT-SAN-38',
        nombre: 'Botín Chelsea Cuero Guane',
        disponible: 1,
        umbral: 3,
        estado: 'critico',
      },
    ],
    trasladosRecientes: [
      {
        id: 'TRL-0084',
        origen: 'Bodega Central',
        destino: 'Punto Bucaramanga',
        unidades: 12,
        estado: 'En Tránsito',
        fecha: 'Hoy 10:25 AM',
      },
    ],
  },
  'Punto Ocaña': {
    sedeKey: 'Punto Ocaña',
    nombreSede: 'Punto Ocaña',
    ciudad: 'Ocaña Centro Histórico',
    badge: 'Provincia',
    ventasNetasTexto: '$7.050.000 COP',
    ventasBrutasTexto: '$7.840.000 COP',
    devolucionesTexto: '-$310.000 COP',
    descuentosTexto: '-$480.000 COP',
    variacionTexto: '+9.7% vs mes anterior',
    porcentajeParticipacion: 14,
    unidadesInventarioTexto: '445 Unidades',
    valorizadoInventarioTexto: '$88.100.000 COP',
    productosResumen: '133 Productos • 154 Variantes',
    pedidosActivosTexto: '2 Pedidos Asignados',
    pedidosEmpaque: 1,
    pedidosDespacho: 1,
    cajaEstado: 'Caja Abierta (CAJ-404)',
    cajaDetalle: 'Base $200.000 COP • Andrés Pacheco',
    cajaAbierta: true,
    alertasInventario: [
      {
        sku: 'ART-WAY-04',
        nombre: 'Mochila Wayuu Hilo Dorado',
        disponible: 2,
        umbral: 3,
        estado: 'bajo',
      },
    ],
    trasladosRecientes: [
      {
        id: 'TRL-0082',
        origen: 'Bodega Central',
        destino: 'Punto Ocaña',
        unidades: 8,
        estado: 'En Preparación',
        fecha: 'Ayer 05:15 PM',
      },
    ],
  },
  'Bodega Central': {
    sedeKey: 'Bodega Central',
    nombreSede: 'Bodega Central',
    ciudad: 'Cúcuta Zona Franca',
    badge: 'Custodia & Despacho',
    ventasNetasTexto: '$0 COP',
    ventasBrutasTexto: '$0 COP',
    devolucionesTexto: '$0 COP',
    descuentosTexto: '$0 COP',
    variacionTexto: 'Centro Logístico Pulmón',
    porcentajeParticipacion: 0,
    unidadesInventarioTexto: '680 Unidades',
    valorizadoInventarioTexto: '$120.800.000 COP',
    productosResumen: '133 Productos • Stock de Reserva',
    pedidosActivosTexto: '1 Pedido en Custodia',
    pedidosEmpaque: 0,
    pedidosDespacho: 1,
    cajaEstado: 'Sin Caja Mostrador',
    cajaDetalle: 'Exclusivo para abastecimiento e inventario',
    cajaAbierta: false,
    alertasInventario: [
      {
        sku: 'BOT-SAN-38',
        nombre: 'Botín Chelsea Cuero Guane',
        disponible: 4,
        umbral: 10,
        estado: 'bajo',
      },
    ],
    trasladosRecientes: [
      {
        id: 'TRL-0084',
        origen: 'Bodega Central',
        destino: 'Punto Bucaramanga',
        unidades: 12,
        estado: 'En Tránsito',
        fecha: 'Hoy 10:25 AM',
      },
      {
        id: 'TRL-0082',
        origen: 'Bodega Central',
        destino: 'Punto Ocaña',
        unidades: 8,
        estado: 'En Preparación',
        fecha: 'Ayer 05:15 PM',
      },
    ],
  },
};

/**
 * 4 Sedes Comerciales Físicas para tarjetas interactivas de rendimiento
 */
const SEDES_COMERCIALES: SedeAdminFiltro[] = [
  'Punto Centro',
  'Punto Caobos',
  'Punto Bucaramanga',
  'Punto Ocaña',
];

export const AdminDashboardPage: React.FC = () => {
  // Sincronización reactiva del selector de sede
  const [sedeActiva, setSedeActiva] = useState<SedeAdminFiltro>(() => {
    const saved = localStorage.getItem('forma_admin_sede') as SedeAdminFiltro | null;
    return saved && SEDES_ADMIN_OPTIONS.includes(saved)
      ? saved
      : 'Todas las Sedes (Consolidado)';
  });

  useEffect(() => {
    const syncFromGlobal = () => {
      const saved = localStorage.getItem('forma_admin_sede') as SedeAdminFiltro | null;
      if (saved && SEDES_ADMIN_OPTIONS.includes(saved)) {
        setSedeActiva(saved);
      }
    };
    window.addEventListener('forma-admin-sede-change', syncFromGlobal);
    window.addEventListener('storage', syncFromGlobal);
    return () => {
      window.removeEventListener('forma-admin-sede-change', syncFromGlobal);
      window.removeEventListener('storage', syncFromGlobal);
    };
  }, []);

  const seleccionarSede = (nuevaSede: SedeAdminFiltro) => {
    setSedeActiva(nuevaSede);
    localStorage.setItem('forma_admin_sede', nuevaSede);
    window.dispatchEvent(new Event('forma-admin-sede-change'));
  };

  const kpi = SEDES_DASHBOARD_DATA[sedeActiva] || SEDES_DASHBOARD_DATA['Todas las Sedes (Consolidado)'];

  return (
    <div className="space-y-6 pb-8">
      {/* =========================================================================
          ENCABEZADO EJECUTIVO Y SELECTOR REACTIVO POR SEDE (PÍLDORAS)
          ========================================================================= */}
      <section className="glass-mirror-card rounded-3xl p-5 sm:p-6 bg-white/75 backdrop-blur-xl border border-white/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#661521]">
              Panel Ejecutivo Central
            </span>
            <span className="text-[10px] text-[#50322A]/60 font-semibold">•</span>
            <span className="text-[10px] font-bold text-[#50322A]">
              {kpi.nombreSede}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-[#351912]">
            Resumen General de Rendimiento
          </h2>
          <p className="text-xs text-[#50322A]/80 font-medium">
            Visualización en tiempo real de facturación neta, inventario, pedidos web y arqueo de caja.
          </p>
        </div>

        {/* Botón rápido para volver a consolidado si hay un filtro aplicado */}
        {sedeActiva !== 'Todas las Sedes (Consolidado)' && (
          <button
            type="button"
            onClick={() => seleccionarSede('Todas las Sedes (Consolidado)')}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#661521] hover:bg-[#4A0E17] text-white text-xs font-bold transition-all shadow-sm shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#D19650]" />
            <span>Ver Todas las Sedes</span>
          </button>
        )}
      </section>

      {/* SELECTOR DE PÍLDORAS POR SEDE (INTERACTIVO Y AL INSTANTE) */}
      <section aria-label="Filtro rápido por sede" className="flex items-center gap-2 overflow-x-auto pb-1">
        {SEDES_ADMIN_OPTIONS.map((sede) => {
          const isSelected = sedeActiva === sede;
          return (
            <button
              key={sede}
              type="button"
              data-testid={`pildora-sede-${sede}`}
              onClick={() => seleccionarSede(sede)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                isSelected
                  ? 'bg-[#661521] text-white shadow-md shadow-[#661521]/20 border border-[#D19650]/40'
                  : 'glass-mirror-pill bg-white/70 text-[#351912] hover:bg-white hover:text-[#661521] hover:border-[#D19650]/40'
              }`}
            >
              {SEDES_LABELS[sede]}
            </button>
          );
        })}
      </section>

      {/* =========================================================================
          4 TARJETAS KPI EJECUTIVAS CLARAS
          ========================================================================= */}
      <section
        aria-label="Indicadores Clave de Desempeño"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5"
      >
        {/* KPI 1: Ventas Netas del Periodo */}
        <article className="glass-mirror-card rounded-3xl p-5 bg-white/80 backdrop-blur-xl border border-white/90 shadow-sm flex flex-col justify-between hover:border-[#D19650]/60 transition-all">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#50322A]">
                Ventas Netas
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#661521]/10 text-[#661521] flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-mono-tabular font-extrabold text-[#171717]">
              {kpi.ventasNetasTexto}
            </div>
            <div className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full mt-1.5 border border-emerald-200">
              <ArrowUpRight className="w-3 h-3" />
              <span>{kpi.variacionTexto}</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#50322A]/10 text-[11px] font-mono-tabular text-[#50322A] space-y-1">
            <div className="flex justify-between">
              <span className="text-[#50322A]/70">Ventas Brutas:</span>
              <span className="font-bold text-[#171717]">{kpi.ventasBrutasTexto}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#50322A]/70">Devoluciones:</span>
              <span className="font-bold text-[#661521]">{kpi.devolucionesTexto}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#50322A]/70">Descuentos:</span>
              <span className="font-bold text-amber-900">{kpi.descuentosTexto}</span>
            </div>
          </div>
        </article>

        {/* KPI 2: Inventario Físico */}
        <article className="glass-mirror-card rounded-3xl p-5 bg-white/80 backdrop-blur-xl border border-white/90 shadow-sm flex flex-col justify-between hover:border-[#D19650]/60 transition-all">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#50322A]">
                Inventario Físico
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#D19650]/20 text-[#50322A] flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-mono-tabular font-extrabold text-[#171717]">
              {kpi.unidadesInventarioTexto}
            </div>
            <div className="text-xs font-bold text-[#661521] mt-1 font-mono-tabular">
              Valorizado: {kpi.valorizadoInventarioTexto}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#50322A]/10 flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#50322A]">
              {kpi.productosResumen}
            </span>
            <Link
              to="/admin/inventario"
              className="text-[11px] font-extrabold text-[#661521] hover:underline flex items-center gap-0.5"
            >
              <span>Ver</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </article>

        {/* KPI 3: Pedidos Web Activos */}
        <article className="glass-mirror-card rounded-3xl p-5 bg-white/80 backdrop-blur-xl border border-white/90 shadow-sm flex flex-col justify-between hover:border-[#D19650]/60 transition-all">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#50322A]">
                Pedidos Web Activos
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#661521]/10 text-[#661521] flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-mono-tabular font-extrabold text-[#171717]">
              {kpi.pedidosActivosTexto}
            </div>
            <div className="text-xs font-medium text-[#50322A] mt-1">
              {kpi.pedidosEmpaque} en empaque • {kpi.pedidosDespacho} en despacho
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#50322A]/10 flex items-center justify-between text-[11px]">
            <span className="font-bold text-[#50322A]">Gestión de Alistamiento</span>
            <span className="text-emerald-800 font-extrabold">Al día</span>
          </div>
        </article>

        {/* KPI 4: Estado de Caja */}
        <article className="glass-mirror-card rounded-3xl p-5 bg-white/80 backdrop-blur-xl border border-white/90 shadow-sm flex flex-col justify-between hover:border-[#D19650]/60 transition-all">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#50322A]">
                Estado de Caja
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Vault className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-display font-bold text-[#171717]">
              {kpi.cajaEstado}
            </div>
            <div className="text-xs font-medium text-[#50322A] mt-1">
              {kpi.cajaDetalle}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#50322A]/10 flex items-center justify-between text-[11px]">
            <span className="inline-flex items-center gap-1 font-bold text-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Arqueo Verificado</span>
            </span>
            <span className="font-mono-tabular font-bold text-[#50322A]">Base OK</span>
          </div>
        </article>
      </section>

      {/* =========================================================================
          TARJETAS DE RENDIMIENTO POR SEDE (INTERACTIVAS CON CLIC PARA FILTRAR)
          ========================================================================= */}
      <section aria-label="Rendimiento por sede física" className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-display font-bold text-[#351912]">
            Rendimiento Comercial por Sede
          </h3>
          <span className="text-xs text-[#50322A]/70 font-medium">
            Haga clic en una sede para filtrar todo el panel
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SEDES_COMERCIALES.map((sedeKey) => {
            const dataSede = SEDES_DASHBOARD_DATA[sedeKey];
            const isSelected = sedeActiva === sedeKey;

            return (
              <div
                key={sedeKey}
                data-testid={`tarjeta-sede-${sedeKey}`}
                onClick={() => seleccionarSede(sedeKey)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    seleccionarSede(sedeKey);
                  }
                }}
                className={`cursor-pointer rounded-2xl p-4 transition-all duration-200 border text-left ${
                  isSelected
                    ? 'bg-white border-[#661521] shadow-md ring-2 ring-[#661521]/15 -translate-y-0.5'
                    : 'glass-mirror-card bg-white/70 border-white/90 hover:bg-white hover:border-[#D19650]/60'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-[#661521] text-[#D19650]'
                          : 'bg-[#50322A]/10 text-[#50322A]'
                      }`}
                    >
                      <Store className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-extrabold text-[#171717] truncate">
                        {dataSede.nombreSede}
                      </h4>
                      <span className="text-[10px] text-[#50322A]/70 block truncate">
                        {dataSede.ciudad}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-[#661521] text-white shrink-0">
                      Filtrada ✓
                    </span>
                  )}
                </div>

                <div className="mt-3">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#50322A]/70 block">
                    Venta Neta
                  </span>
                  <div className="text-lg font-mono-tabular font-extrabold text-[#661521]">
                    {dataSede.ventasNetasTexto}
                  </div>
                </div>

                {/* Barra de Participación de Ventas */}
                <div className="mt-2.5 space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-[#50322A]">
                    <span>Participación</span>
                    <span className="font-mono-tabular">{dataSede.porcentajeParticipacion}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#50322A]/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#661521] to-[#D19650]"
                      style={{ width: `${dataSede.porcentajeParticipacion * 2.5}%` }}
                    />
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#50322A]/10 flex items-center justify-between text-[10px] text-[#50322A]">
                  <span>{dataSede.unidadesInventarioTexto}</span>
                  <span className="font-bold">{dataSede.pedidosActivosTexto}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          MONITOR DE ALERTAS EJECUTIVAS: STOCK BAJO & TRASLADOS
          ========================================================================= */}
      <section
        aria-label="Alertas y traslados ejecutivos"
        className="grid grid-cols-1 lg:grid-cols-2 gap-5"
      >
        {/* Panel 1: Alertas de Inventario Bajo */}
        <div className="glass-mirror-card rounded-3xl p-5 bg-white/75 backdrop-blur-xl border border-white/90 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-[#50322A]/10 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-900 flex items-center justify-center">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#351912]">
                  Alertas de Inventario Bajo
                </h3>
                <span className="text-[10px] text-[#50322A]/70 font-medium">
                  {kpi.nombreSede}
                </span>
              </div>
            </div>
            <Link
              to="/admin/inventario"
              className="text-xs font-bold text-[#661521] hover:underline flex items-center gap-1"
            >
              <span>Gestionar en Kardex</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2">
            {kpi.alertasInventario.map((item) => (
              <div
                key={item.sku}
                className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white/70 border border-white hover:border-[#D19650]/40 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono-tabular text-xs font-bold text-[#661521]">
                      {item.sku}
                    </span>
                    <span
                      className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
                        item.estado === 'critico'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.estado === 'critico' ? 'Crítico' : 'Reorden'}
                    </span>
                  </div>
                  <div className="text-xs font-extrabold text-[#171717] truncate mt-0.5">
                    {item.nombre}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-mono-tabular font-extrabold text-[#171717] block">
                    {item.disponible} unds
                  </span>
                  <span className="text-[10px] text-[#50322A]/70 block">
                    Mínimo: {item.umbral}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel 2: Estado de Traslados Entrantes y Salientes */}
        <div className="glass-mirror-card rounded-3xl p-5 bg-white/75 backdrop-blur-xl border border-white/90 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-[#50322A]/10 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-[#661521]/10 text-[#661521] flex items-center justify-center">
                <Truck className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#351912]">
                  Traslados y Despachos
                </h3>
                <span className="text-[10px] text-[#50322A]/70 font-medium">
                  Movimientos entre sedes
                </span>
              </div>
            </div>
            <Link
              to="/admin/traslados"
              className="text-xs font-bold text-[#661521] hover:underline flex items-center gap-1"
            >
              <span>Ver Todos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2">
            {kpi.trasladosRecientes.map((traslado) => (
              <div
                key={traslado.id}
                className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white/70 border border-white hover:border-[#D19650]/40 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono-tabular text-xs font-bold text-[#351912]">
                      #{traslado.id}
                    </span>
                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                      {traslado.estado}
                    </span>
                  </div>
                  <div className="text-xs font-medium text-[#50322A] truncate mt-0.5">
                    {traslado.origen} ➔ {traslado.destino}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-mono-tabular font-extrabold text-[#171717] block">
                    {traslado.unidades} prendas
                  </span>
                  <span className="text-[10px] text-[#50322A]/70 block font-mono-tabular">
                    {traslado.fecha}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboardPage;
