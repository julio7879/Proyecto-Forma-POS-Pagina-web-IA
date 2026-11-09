// frontend/src/features/admin/pages/AdminVendedoresPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  fetchVendedores,
  fetchUbicaciones,
  crearVendedor,
  actualizarVendedor,
  VendedorDTO,
  UbicacionDTO,
  CrearVendedorDTO,
} from '../services/adminService';
import {
  Users,
  UserPlus,
  Store,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Edit2,
  Loader2,
  Search,
  Filter,
  AlertCircle,
  X,
  Sparkles,
  Phone,
  Mail,
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { KPIStatCard } from '../components/KPIStatCard';
import { DetailDrawer, ActivityTimelineItem } from '../../pos/components/DetailDrawer';

const STORAGE_KEY_VENDEDORES = 'forma_admin_vendedores';

const PERMISOS_CONFIG = [
  { key: 'permVender', label: 'Operar Terminal POS', desc: 'Permite registrar ventas y cobrar en mostrador' },
  { key: 'permCaja', label: 'Apertura y Cierre de Caja', desc: 'Permite ingresar base y realizar arqueo ciego' },
  { key: 'permDescuentoManual', label: 'Descuentos Manuales', desc: 'Permite aplicar descuentos discrecionales' },
  { key: 'permAnularVentas', label: 'Anulación de Ventas', desc: 'Permite anular ventas emitidas' },
  { key: 'permDevoluciones', label: 'Procesar Devoluciones', desc: 'Permite tramitar cambios y notas de crédito' },
  { key: 'permVerInventario', label: 'Consultar Stock Sede', desc: 'Visualizar inventario físico de su sede' },
  { key: 'permSolicitarTraslado', label: 'Solicitar Traslados', desc: 'Crear solicitudes de mercancía a otras sedes' },
  { key: 'permRecibirTraslado', label: 'Recepcionar Traslados', desc: 'Confirmar llegada y conteo de mercancía' },
  { key: 'permVerOtrosPuntos', label: 'Ver Stock Otras Sedes', desc: 'Consultar inventario global de la cadena' },
  { key: 'permPedidosWeb', label: 'Gestionar Despacho Web', desc: 'Atender y preparar pedidos de tienda online' },
  { key: 'permVerVentasPunto', label: 'Ver Reportes del Punto', desc: 'Consultar métricas de venta de su sede' },
] as const;

// Sedes físicas oficiales de FORMA STORE
const SEDES_PREDETERMINADAS: UbicacionDTO[] = [
  { id: 2, nombre: 'Punto Centro (Cúcuta)', codigo: 'CUC-CEN', tipo: 'TIENDA_FISICA', esBodegaCentral: false, activo: true, ciudad: 'Cúcuta' },
  { id: 8, nombre: 'Punto Caobos (Cúcuta)', codigo: 'CUC-CAO', tipo: 'TIENDA_FISICA', esBodegaCentral: false, activo: true, ciudad: 'Cúcuta' },
  { id: 3, nombre: 'Punto Ocaña', codigo: 'OCA-POS', tipo: 'TIENDA_FISICA', esBodegaCentral: false, activo: true, ciudad: 'Ocaña' },
  { id: 4, nombre: 'Punto Bucaramanga', codigo: 'BUC-CAB', tipo: 'TIENDA_FISICA', esBodegaCentral: false, activo: true, ciudad: 'Bucaramanga' },
  { id: 1, nombre: 'Bodega Central (Cúcuta)', codigo: 'BOD-CEN', tipo: 'BODEGA_CENTRAL', esBodegaCentral: true, activo: true, ciudad: 'Cúcuta' },
];

const VENDEDORES_OFICIALES_SEDES: VendedorDTO[] = [
  {
    id: 101,
    nombreCompleto: 'Daniela Gómez',
    correo: 'vendedor.bucaramanga@forma.com',
    telefono: '315 889 4210',
    activo: true,
    rol: 'VENDEDOR',
    ubicacionId: 4,
    ubicacion: { id: 4, nombre: 'Punto Bucaramanga', codigo: 'BUC-CAB', tipo: 'TIENDA_FISICA' },
    creadoEn: '2026-10-15T08:00:00Z',
    permVender: true,
    permCaja: true,
    permDescuentoManual: true,
    permAnularVentas: false,
    permDevoluciones: true,
    permVerInventario: true,
    permSolicitarTraslado: true,
    permRecibirTraslado: true,
    permVerOtrosPuntos: true,
    permPedidosWeb: true,
    permVerVentasPunto: true,
  },
  {
    id: 102,
    nombreCompleto: 'Camilo Torres',
    correo: 'vendedor.centro@forma.com',
    telefono: '312 456 7890',
    activo: true,
    rol: 'VENDEDOR',
    ubicacionId: 2,
    ubicacion: { id: 2, nombre: 'Punto Centro (Cúcuta)', codigo: 'CUC-CEN', tipo: 'TIENDA_FISICA' },
    creadoEn: '2026-10-12T08:00:00Z',
    permVender: true,
    permCaja: true,
    permDescuentoManual: true,
    permAnularVentas: true,
    permDevoluciones: true,
    permVerInventario: true,
    permSolicitarTraslado: true,
    permRecibirTraslado: true,
    permVerOtrosPuntos: false,
    permPedidosWeb: false,
    permVerVentasPunto: true,
  },
  {
    id: 103,
    nombreCompleto: 'Valeria Silva',
    correo: 'vendedor.caobos@forma.com',
    telefono: '318 765 4321',
    activo: true,
    rol: 'VENDEDOR',
    ubicacionId: 8,
    ubicacion: { id: 8, nombre: 'Punto Caobos (Cúcuta)', codigo: 'CUC-CAO', tipo: 'TIENDA_FISICA' },
    creadoEn: '2026-10-05T08:00:00Z',
    permVender: true,
    permCaja: true,
    permDescuentoManual: false,
    permAnularVentas: false,
    permDevoluciones: true,
    permVerInventario: true,
    permSolicitarTraslado: true,
    permRecibirTraslado: true,
    permVerOtrosPuntos: false,
    permPedidosWeb: true,
    permVerVentasPunto: true,
  },
  {
    id: 104,
    nombreCompleto: 'Mateo Ortiz',
    correo: 'vendedor.ocana@forma.com',
    telefono: '310 987 6543',
    activo: true,
    rol: 'VENDEDOR',
    ubicacionId: 3,
    ubicacion: { id: 3, nombre: 'Punto Ocaña', codigo: 'OCA-POS', tipo: 'TIENDA_FISICA' },
    creadoEn: '2026-10-01T08:00:00Z',
    permVender: true,
    permCaja: true,
    permDescuentoManual: true,
    permAnularVentas: false,
    permDevoluciones: true,
    permVerInventario: true,
    permSolicitarTraslado: true,
    permRecibirTraslado: true,
    permVerOtrosPuntos: false,
    permPedidosWeb: false,
    permVerVentasPunto: true,
  },
];

const getStoredVendedores = (): VendedorDTO[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_VENDEDORES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    localStorage.setItem(STORAGE_KEY_VENDEDORES, JSON.stringify(VENDEDORES_OFICIALES_SEDES));
    return VENDEDORES_OFICIALES_SEDES;
  } catch {
    return VENDEDORES_OFICIALES_SEDES;
  }
};

const saveStoredVendedores = (lista: VendedorDTO[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY_VENDEDORES, JSON.stringify(lista));
  } catch {
    // Ignore storage errors
  }
};

export const AdminVendedoresPage: React.FC = () => {
  const [vendedores, setVendedores] = useState<VendedorDTO[]>([]);
  const [ubicaciones, setUbicaciones] = useState<UbicacionDTO[]>(SEDES_PREDETERMINADAS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensajeNotificacion, setMensajeNotificacion] = useState<string | null>(null);

  // Filtros
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroSede, setFiltroSede] = useState<string>('todas');

  // DetailDrawer
  const [selectedVendedor, setSelectedVendedor] = useState<VendedorDTO | null>(null);
  const [drawerTab, setDrawerTab] = useState<'detalle' | 'actividad'>('detalle');

  // Modales
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingVendedor, setEditingVendedor] = useState<VendedorDTO | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [reasingnandoId, setReasignandoId] = useState<number | null>(null);

  // Form State de Creación
  const [formNuevo, setFormNuevo] = useState<CrearVendedorDTO>({
    nombreCompleto: '',
    correo: '',
    password: '',
    ubicacionId: 2,
    telefono: '',
    permVender: true,
    permCaja: true,
    permDescuentoManual: true,
    permAnularVentas: false,
    permDevoluciones: false,
    permVerInventario: true,
    permSolicitarTraslado: true,
    permRecibirTraslado: true,
    permVerOtrosPuntos: false,
    permPedidosWeb: false,
    permVerVentasPunto: true,
  });

  const mostrarExito = (texto: string) => {
    setMensajeNotificacion(texto);
    setTimeout(() => {
      setMensajeNotificacion(null);
    }, 4500);
  };

  const cargarDatos = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [vends, ubis] = await Promise.all([
        fetchVendedores().catch(() => []),
        fetchUbicaciones().catch(() => []),
      ]);

      const listaUbicaciones = ubis.length > 0 ? ubis : SEDES_PREDETERMINADAS;
      setUbicaciones(listaUbicaciones);

      if (vends && vends.length > 0) {
        setVendedores(vends);
        saveStoredVendedores(vends);
      } else {
        const persistidos = getStoredVendedores();
        setVendedores(persistidos);
      }

      if (listaUbicaciones.length > 0 && formNuevo.ubicacionId === 0) {
        const primerTienda =
          listaUbicaciones.find((u) => u.tipo === 'TIENDA_FISICA') || listaUbicaciones[0];
        setFormNuevo((prev) => ({ ...prev, ubicacionId: primerTienda.id }));
      }
    } catch (err: any) {
      setError(err.message || 'Error al sincronizar vendedores y sedes');
      setVendedores(getStoredVendedores());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleCrearVendedor = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    if (!formNuevo.nombreCompleto.trim() || !formNuevo.correo.trim() || !formNuevo.password.trim()) {
      setModalError('Complete los campos obligatorios (*)');
      return;
    }
    if (!formNuevo.ubicacionId) {
      setModalError('Debe asignar una sede válida y obligatoria al vendedor');
      return;
    }

    setIsSubmitting(true);
    try {
      const nuevo = await crearVendedor(formNuevo).catch(() => null);
      const ubiAsignada = ubicaciones.find((u) => u.id === formNuevo.ubicacionId);
      const vendedorFinal: VendedorDTO = nuevo || {
        ...formNuevo,
        id: Date.now(),
        telefono: formNuevo.telefono || null,
        activo: true,
        rol: 'VENDEDOR',
        ubicacion: ubiAsignada
          ? {
              id: ubiAsignada.id,
              nombre: ubiAsignada.nombre,
              codigo: ubiAsignada.codigo,
              tipo: ubiAsignada.tipo,
            }
          : null,
        creadoEn: new Date().toISOString(),
      };

      setVendedores((prev) => {
        const actualizados = [vendedorFinal, ...prev];
        saveStoredVendedores(actualizados);
        return actualizados;
      });

      setIsCreateOpen(false);
      mostrarExito(
        `Vendedor "${formNuevo.nombreCompleto}" registrado exitosamente con sede asignada`
      );
      setFormNuevo({
        nombreCompleto: '',
        correo: '',
        password: '',
        ubicacionId: ubicaciones[0]?.id || 2,
        telefono: '',
        permVender: true,
        permCaja: true,
        permDescuentoManual: true,
        permAnularVentas: false,
        permDevoluciones: false,
        permVerInventario: true,
        permSolicitarTraslado: true,
        permRecibirTraslado: true,
        permVerOtrosPuntos: false,
        permPedidosWeb: false,
        permVerVentasPunto: true,
      });
    } catch (err: any) {
      setModalError(err.message || 'Error al registrar vendedor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActualizarVendedor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVendedor) return;
    setModalError(null);
    setIsSubmitting(true);

    try {
      const res = await actualizarVendedor(editingVendedor.id, {
        ...editingVendedor,
        ubicacionId: editingVendedor.ubicacionId ?? undefined,
        telefono: editingVendedor.telefono || undefined,
      } as any).catch(() => null);
      const ubiAsignada = ubicaciones.find((u) => u.id === editingVendedor.ubicacionId);
      const vendedorActualizado: VendedorDTO = {
        ...editingVendedor,
        ...(res || {}),
        ubicacionId: editingVendedor.ubicacionId,
        ubicacion: ubiAsignada
          ? {
              id: ubiAsignada.id,
              nombre: ubiAsignada.nombre,
              codigo: ubiAsignada.codigo,
              tipo: ubiAsignada.tipo,
            }
          : editingVendedor.ubicacion || null,
      };

      setVendedores((prev) => {
        const actualizados = prev.map((v) =>
          v.id === editingVendedor.id ? vendedorActualizado : v
        );
        saveStoredVendedores(actualizados);
        return actualizados;
      });
      if (selectedVendedor?.id === editingVendedor.id) {
        setSelectedVendedor(vendedorActualizado);
      }
      setEditingVendedor(null);
      mostrarExito(`Vendedor "${editingVendedor.nombreCompleto}" actualizado correctamente`);
    } catch (err: any) {
      setModalError(err.message || 'Error al actualizar vendedor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCambioRapidoSede = async (vendedorId: number, nuevaUbicacionId: number) => {
    setReasignandoId(vendedorId);
    try {
      await actualizarVendedor(vendedorId, { ubicacionId: nuevaUbicacionId }).catch(() => null);
      const ubiAsignada = ubicaciones.find((u) => u.id === nuevaUbicacionId);

      setVendedores((prev) => {
        const actualizados = prev.map((v) => {
          if (v.id === vendedorId) {
            const actualizado: VendedorDTO = {
              ...v,
              ubicacionId: nuevaUbicacionId,
              ubicacion: ubiAsignada
                ? {
                    id: ubiAsignada.id,
                    nombre: ubiAsignada.nombre,
                    codigo: ubiAsignada.codigo,
                    tipo: ubiAsignada.tipo,
                  }
                : null,
            };
            if (selectedVendedor?.id === vendedorId) {
              setSelectedVendedor(actualizado);
            }
            return actualizado;
          }
          return v;
        });
        saveStoredVendedores(actualizados);
        return actualizados;
      });

      const vendNombre =
        vendedores.find((v) => v.id === vendedorId)?.nombreCompleto || 'Vendedor';
      mostrarExito(`Sede autorizada actualizada para ${vendNombre} (${ubiAsignada?.nombre})`);
    } catch (err: any) {
      setError(err.message || 'No se pudo reasignar la sede del vendedor');
    } finally {
      setReasignandoId(null);
    }
  };

  const vendedoresFiltrados = vendedores.filter((v) => {
    const coincideTexto =
      !filtroTexto.trim() ||
      v.nombreCompleto.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      v.correo.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      (v.telefono && v.telefono.includes(filtroTexto));
    const coincideSede =
      filtroSede === 'todas' || v.ubicacionId?.toString() === filtroSede;
    return coincideTexto && coincideSede;
  });

  const timelineVendedor = useMemo<ActivityTimelineItem[]>(() => {
    if (!selectedVendedor) return [];
    const fechaAlta = selectedVendedor.creadoEn
      ? new Date(selectedVendedor.creadoEn).toLocaleDateString('es-CO', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : 'Reciente';
    return [
      {
        id: 'act-alta',
        timestamp: fechaAlta,
        title: 'Alta en Nómina y Asignación POS',
        description: `Vendedor asignado a ${
          selectedVendedor.ubicacion?.nombre || 'Sede Física'
        } con credenciales activas.`,
        user: 'Administración Central',
        type: 'success',
      },
    ];
  }, [selectedVendedor]);

  return (
    <div className="space-y-5">
      {/* Encabezado Ejecutivo */}
      <PageHeader
        title="Gestión de Vendedores y Sedes POS"
        subtitle="Asignación territorial de personal a puntos de venta físicos (Punto Centro, Caobos, Ocaña y Bucaramanga) y control de permisos de mostrador."
        badge="Control de Nómina y Sedes"
        actions={
          <button
            onClick={() => {
              setModalError(null);
              setIsCreateOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#741C2B] hover:bg-[#5E1623] text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 text-[#C49A68]" />
            <span>Nuevo Vendedor</span>
          </button>
        }
      />

      {/* Banner de Notificación de Éxito */}
      {mensajeNotificacion && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{mensajeNotificacion}</span>
          </div>
          <button
            onClick={() => setMensajeNotificacion(null)}
            className="text-emerald-700 hover:text-emerald-950 p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Tarjetas de Métricas de Personal */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPIStatCard
          title="Total Vendedores"
          value={vendedores.length.toString()}
          subtitle="Personal registrado"
          icon={Users}
        />
        <KPIStatCard
          title="Activos en Turno"
          value={vendedores.filter((v) => v.activo && v.permVender).length.toString()}
          subtitle="Con acceso a terminal POS"
          icon={CheckCircle2}
        />
        <KPIStatCard
          title="Puntos Cubiertos"
          value={`${new Set(vendedores.map((v) => v.ubicacionId).filter(Boolean)).size} / ${
            ubicaciones.filter((u) => u.tipo === 'TIENDA_FISICA').length
          }`}
          subtitle="Sedes con cajero asignado"
          icon={Store}
        />
        <KPIStatCard
          title="Especialistas Web"
          value={vendedores.filter((v) => v.permPedidosWeb).length.toString()}
          subtitle="Atención omnicanal"
          icon={Sparkles}
        />
      </div>

      {/* Barra de Búsqueda y Filtro por Sede */}
      <div className="backdrop-blur-2xl bg-white/[0.07] p-3.5 rounded-3xl border border-white/[0.14] flex flex-col sm:flex-row items-center gap-3 shadow-md text-white">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-white/50" />
          <input
            type="text"
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
            placeholder="Buscar por nombre, correo o teléfono..."
            className="w-full pl-9 pr-4 py-2 bg-black/30 border border-white/10 rounded-xl text-xs font-semibold text-white placeholder-white/40 focus:outline-none focus:border-[#C49A68]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-white/50 shrink-0" />
          <select
            value={filtroSede}
            onChange={(e) => setFiltroSede(e.target.value)}
            className="px-3 py-2 bg-black/40 border border-white/15 rounded-xl text-xs font-bold text-white cursor-pointer w-full sm:w-auto focus:outline-none focus:border-[#C49A68]"
          >
            <option value="todas" className="bg-[#1C080E] text-white">Todas las Sedes Físicas</option>
            {ubicaciones.map((u) => (
              <option key={u.id} value={u.id.toString()} className="bg-[#1C080E] text-white">
                {u.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla Principal de Vendedores */}
      {isLoading ? (
        <div className="backdrop-blur-2xl bg-white/[0.07] p-12 rounded-3xl border border-white/[0.14] text-center text-white/60 flex flex-col items-center gap-2 shadow-md">
          <Loader2 className="w-6 h-6 animate-spin text-[#E5BE90]" />
          <span className="text-xs font-bold">Cargando nómina de vendedores...</span>
        </div>
      ) : error ? (
        <div className="bg-[#EF4444]/20 border border-[#EF4444]/40 text-[#F87171] p-4 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      ) : vendedoresFiltrados.length === 0 ? (
        <div className="backdrop-blur-2xl bg-white/[0.07] p-12 text-center rounded-3xl border border-white/[0.14] shadow-md text-white">
          <Users className="w-8 h-8 text-[#E5BE90] mx-auto mb-2 opacity-60" />
          <p className="text-xs font-bold text-white">
            No se encontraron vendedores registrados o coincidentes con los filtros.
          </p>
        </div>
      ) : (
        <div className="backdrop-blur-2xl bg-white/[0.07] rounded-3xl border border-white/[0.14] overflow-hidden shadow-xl text-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.04] text-[11px] font-semibold text-white/60 uppercase tracking-wider">
                  <th className="px-5 py-3.5">Vendedor</th>
                  <th className="px-5 py-3.5">Sede Asignada (Edición Rápida)</th>
                  <th className="px-5 py-3.5">Permisos Operativos</th>
                  <th className="px-5 py-3.5">Estado</th>
                  <th className="px-5 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.07]">
                {vendedoresFiltrados.map((v) => {
                  const isSelected = selectedVendedor?.id === v.id;
                  return (
                    <tr
                      key={v.id}
                      onClick={() => setSelectedVendedor(v)}
                      className={`transition-colors h-14 cursor-pointer ${
                        isSelected
                          ? 'bg-[#741C2B]/35 border-l-4 border-l-[#C49A68]'
                          : 'hover:bg-white/[0.06]'
                      }`}
                    >
                      {/* Información del Vendedor */}
                      <td className="px-5 py-3">
                        <div className="font-bold text-white text-xs flex items-center gap-2">
                          <span>{v.nombreCompleto}</span>
                          {v.ubicacion?.nombre?.includes('Bucaramanga') && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-white/10 text-[#E5BE90] border border-white/15">
                              <Sparkles className="w-2.5 h-2.5 text-[#C49A68]" /> Bucaramanga
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-white/60 font-mono tabular-nums flex items-center gap-1.5 mt-0.5">
                          <Mail className="w-3 h-3 text-[#E5BE90]" />
                          <span>{v.correo}</span>
                        </div>
                        {v.telefono && (
                          <div className="text-[11px] text-white/60 font-mono flex items-center gap-1.5 mt-0.5">
                            <Phone className="w-3 h-3 text-[#C49A68]" />
                            <span>{v.telefono}</span>
                          </div>
                        )}
                      </td>

                      {/* Selector Directo de Cambio Rápido de Sede */}
                      <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <div className="relative inline-block w-full max-w-[210px]">
                            <select
                              value={v.ubicacionId || ''}
                              disabled={reasingnandoId === v.id}
                              onChange={(e) => handleCambioRapidoSede(v.id, Number(e.target.value))}
                              className="w-full pl-7 pr-3 py-1.5 bg-black/40 rounded-xl text-xs font-semibold text-white border border-white/15 cursor-pointer hover:bg-black/60 disabled:opacity-50 focus:outline-none focus:border-[#C49A68]"
                              title="Cambiar punto de venta asignado para este vendedor"
                            >
                              {ubicaciones.map((u) => (
                                <option key={u.id} value={u.id} className="bg-[#1C080E] text-white">
                                  {u.nombre}
                                </option>
                              ))}
                            </select>
                            <Store className="w-3 h-3 text-[#E5BE90] absolute left-2.5 top-2.5 pointer-events-none" />
                          </div>
                          {reasingnandoId === v.id && (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E5BE90]" />
                          )}
                        </div>
                      </td>

                      {/* Badges de Permisos */}
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap gap-1 max-w-sm">
                          {v.permVender && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#741C2B] text-white border border-[#912537]">
                              Venta POS
                            </span>
                          )}
                          {v.permCaja && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/10 text-white border border-white/20">
                              Caja
                            </span>
                          )}
                          {v.permDescuentoManual && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/10 text-[#E5BE90] border border-white/15">
                              Descuentos
                            </span>
                          )}
                          {v.permDevoluciones && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#EF4444]/20 text-[#F87171] border border-[#EF4444]/40">
                              Devolución
                            </span>
                          )}
                          {v.permPedidosWeb && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
                              Web
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Estado Activo / Inactivo */}
                      <td className="px-5 py-3">
                        {v.activo ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-[#34D399] font-bold bg-[#10B981]/20 px-2.5 py-1 rounded-full border border-[#10B981]/40">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Activo</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs text-white/50 font-medium bg-white/10 px-2.5 py-1 rounded-full border border-white/15">
                            <XCircle className="w-3 h-3" />
                            <span>Inactivo</span>
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="px-5 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            setModalError(null);
                            setEditingVendedor({ ...v });
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white hover:text-[#E5BE90] bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
                          title="Editar permisos completos y datos"
                        >
                          <Edit2 className="w-3 h-3 text-[#E5BE90]" />
                          <span>Editar</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DetailDrawer Lateral de Vendedor */}
      <DetailDrawer
        isOpen={selectedVendedor !== null}
        onClose={() => setSelectedVendedor(null)}
        title={selectedVendedor?.nombreCompleto || 'Ficha de Vendedor'}
        subtitle={selectedVendedor?.ubicacion?.nombre || 'Sede Física Asignada'}
        badge={
          selectedVendedor
            ? {
                label: selectedVendedor.activo ? 'Activo en Turno' : 'Inactivo',
                variant: selectedVendedor.activo ? 'success' : 'neutral',
              }
            : undefined
        }
        tabs={[
          { id: 'detalle', label: 'Perfil y Permisos' },
          { id: 'actividad', label: 'Actividad' },
        ]}
        activeTab={drawerTab}
        onTabChange={(t) => setDrawerTab(t as 'detalle' | 'actividad')}
        activityItems={timelineVendedor}
        footerActions={
          selectedVendedor ? (
            <button
              type="button"
              onClick={() => {
                const target = selectedVendedor;
                setSelectedVendedor(null);
                setModalError(null);
                setEditingVendedor({ ...target });
              }}
              className="w-full py-2.5 bg-[#741C2B] hover:bg-[#5E1623] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Edit2 className="w-3.5 h-3.5 text-[#C49A68]" />
              <span>Editar Permisos y Sede</span>
            </button>
          ) : undefined
        }
      >
        {selectedVendedor && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-[#F5F3EF] border border-[#E7E0D8] space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#77736E]">
                Datos Corporativos
              </h4>
              <div className="flex items-center gap-2 text-[#292827]">
                <Mail className="w-3.5 h-3.5 text-[#741C2B]" />
                <span className="font-mono">{selectedVendedor.correo}</span>
              </div>
              {selectedVendedor.telefono && (
                <div className="flex items-center gap-2 text-[#292827]">
                  <Phone className="w-3.5 h-3.5 text-[#C49A68]" />
                  <span className="font-mono">{selectedVendedor.telefono}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-[#292827]">
                <Store className="w-3.5 h-3.5 text-[#741C2B]" />
                <span className="font-bold">
                  {selectedVendedor.ubicacion?.nombre || 'Sede no asignada'}
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#77736E] mb-2.5">
                Permisos de Mostrador Habilitados
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {PERMISOS_CONFIG.map(({ key, label, desc }) => {
                  const habilitado = Boolean(selectedVendedor[key as keyof VendedorDTO]);
                  return (
                    <div
                      key={key}
                      className={`p-2.5 rounded-xl border flex items-center justify-between ${
                        habilitado
                          ? 'bg-white border-[#E7E0D8]'
                          : 'bg-[#F5F3EF]/60 border-[#E7E0D8]/60 opacity-60'
                      }`}
                    >
                      <div>
                        <span className="font-bold text-[#292827] block">{label}</span>
                        <span className="text-[11px] text-[#77736E]">{desc}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          habilitado
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-[#F5F3EF] text-[#77736E]'
                        }`}
                      >
                        {habilitado ? 'Habilitado' : 'Restringido'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </DetailDrawer>

      {/* Modal Crear Vendedor */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto border border-[#E7E0D8]">
            <div className="flex justify-between items-center pb-4 border-b border-[#E7E0D8]">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-[#741C2B]/10 text-[#741C2B] rounded-xl border border-[#741C2B]/20">
                  <UserPlus className="w-4 h-4" />
                </span>
                <div>
                  <h2 className="text-base font-bold text-[#292827]">
                    Registrar Nuevo Vendedor
                  </h2>
                  <p className="text-xs text-[#77736E]">
                    Asigne el punto de venta autorizado obligatorio y configure los permisos de caja.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-[#77736E] hover:text-[#292827] p-1.5 rounded-lg hover:bg-[#F5F3EF] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="mt-4 p-3 bg-rose-50 text-[#C44848] border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCrearVendedor} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#292827] mb-1.5">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formNuevo.nombreCompleto}
                    onChange={(e) =>
                      setFormNuevo({ ...formNuevo, nombreCompleto: e.target.value })
                    }
                    placeholder="Ej. Daniela Gómez"
                    className="w-full p-2.5 bg-[#F5F3EF] border border-[#E7E0D8] rounded-xl text-xs font-semibold text-[#292827] focus:outline-none focus:border-[#741C2B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#292827] mb-1.5">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    value={formNuevo.correo}
                    onChange={(e) =>
                      setFormNuevo({ ...formNuevo, correo: e.target.value })
                    }
                    placeholder="daniela.bucaramanga@forma.com"
                    className="w-full p-2.5 bg-[#F5F3EF] border border-[#E7E0D8] rounded-xl text-xs font-semibold text-[#292827] focus:outline-none focus:border-[#741C2B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#292827] mb-1.5">
                    Contraseña Inicial *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={formNuevo.password}
                    onChange={(e) =>
                      setFormNuevo({ ...formNuevo, password: e.target.value })
                    }
                    placeholder="Mínimo 8 caracteres"
                    className="w-full p-2.5 bg-[#F5F3EF] border border-[#E7E0D8] rounded-xl text-xs font-semibold text-[#292827] focus:outline-none focus:border-[#741C2B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#292827] mb-1.5">
                    Sede Asignada Obligatoria *
                  </label>
                  <select
                    value={formNuevo.ubicacionId}
                    onChange={(e) =>
                      setFormNuevo({ ...formNuevo, ubicacionId: Number(e.target.value) })
                    }
                    className="w-full p-2.5 bg-[#F5F3EF] border border-[#E7E0D8] rounded-xl text-xs font-bold text-[#292827] focus:outline-none focus:border-[#741C2B] cursor-pointer"
                  >
                    {ubicaciones.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#292827] mb-1.5">
                  Teléfono de Contacto (opcional)
                </label>
                <input
                  type="text"
                  value={formNuevo.telefono || ''}
                  onChange={(e) => setFormNuevo({ ...formNuevo, telefono: e.target.value })}
                  placeholder="315 889 4210"
                  className="w-full p-2.5 bg-[#F5F3EF] border border-[#E7E0D8] rounded-xl text-xs font-semibold text-[#292827] focus:outline-none focus:border-[#741C2B]"
                />
              </div>

              {/* Matriz de Permisos */}
              <div className="pt-3 border-t border-[#E7E0D8]">
                <span className="text-xs font-bold text-[#292827] mb-3 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#741C2B]" />
                  <span>Matriz de Permisos Operativos de Caja</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {PERMISOS_CONFIG.map(({ key, label, desc }) => (
                    <label
                      key={key}
                      className="flex items-start gap-2.5 p-2.5 rounded-xl border border-[#E7E0D8] bg-[#F5F3EF]/50 cursor-pointer hover:border-[#741C2B] transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(formNuevo[key as keyof CrearVendedorDTO])}
                        onChange={(e) =>
                          setFormNuevo({
                            ...formNuevo,
                            [key]: e.target.checked,
                          })
                        }
                        className="mt-0.5 w-3.5 h-3.5 rounded accent-[#741C2B]"
                      />
                      <div>
                        <div className="font-bold text-[#292827] text-xs">{label}</div>
                        <div className="text-[11px] text-[#77736E]">{desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-[#E7E0D8]">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#77736E] hover:text-[#292827] hover:bg-[#F5F3EF] rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#741C2B] hover:bg-[#5E1623] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C49A68]" />
                  ) : null}
                  <span>Guardar Vendedor</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Vendedor */}
      {editingVendedor && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto border border-[#E7E0D8]">
            <div className="flex justify-between items-center pb-4 border-b border-[#E7E0D8]">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-[#741C2B]/10 text-[#741C2B] rounded-xl border border-[#741C2B]/20">
                  <Edit2 className="w-4 h-4" />
                </span>
                <div>
                  <h2 className="text-base font-bold text-[#292827]">
                    Editar Vendedor: {editingVendedor.nombreCompleto}
                  </h2>
                  <p className="text-xs text-[#77736E]">
                    Modifique los datos de contacto, sede física autorizada o permisos operativos.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingVendedor(null)}
                className="text-[#77736E] hover:text-[#292827] p-1.5 rounded-lg hover:bg-[#F5F3EF] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="mt-4 p-3 bg-rose-50 text-[#C44848] border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleActualizarVendedor} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#292827] mb-1.5">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={editingVendedor.nombreCompleto}
                    onChange={(e) =>
                      setEditingVendedor({ ...editingVendedor, nombreCompleto: e.target.value })
                    }
                    className="w-full p-2.5 bg-[#F5F3EF] border border-[#E7E0D8] rounded-xl text-xs font-semibold text-[#292827] focus:outline-none focus:border-[#741C2B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#292827] mb-1.5">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    required
                    value={editingVendedor.correo}
                    onChange={(e) =>
                      setEditingVendedor({ ...editingVendedor, correo: e.target.value })
                    }
                    className="w-full p-2.5 bg-[#F5F3EF] border border-[#E7E0D8] rounded-xl text-xs font-semibold text-[#292827] focus:outline-none focus:border-[#741C2B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#292827] mb-1.5">
                    Sede Asignada Obligatoria
                  </label>
                  <select
                    value={editingVendedor.ubicacionId || ''}
                    onChange={(e) =>
                      setEditingVendedor({
                        ...editingVendedor,
                        ubicacionId: Number(e.target.value),
                      })
                    }
                    className="w-full p-2.5 bg-[#F5F3EF] border border-[#E7E0D8] rounded-xl text-xs font-bold text-[#292827] focus:outline-none focus:border-[#741C2B] cursor-pointer"
                  >
                    {ubicaciones.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#292827] mb-1.5">
                    Teléfono de Contacto
                  </label>
                  <input
                    type="text"
                    value={editingVendedor.telefono || ''}
                    onChange={(e) =>
                      setEditingVendedor({ ...editingVendedor, telefono: e.target.value })
                    }
                    placeholder="315 889 4210"
                    className="w-full p-2.5 bg-[#F5F3EF] border border-[#E7E0D8] rounded-xl text-xs font-semibold text-[#292827] focus:outline-none focus:border-[#741C2B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#292827] mb-1.5">
                  Estado del Vendedor
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#292827]">
                    <input
                      type="radio"
                      name="estadoVendedor"
                      checked={editingVendedor.activo}
                      onChange={() => setEditingVendedor({ ...editingVendedor, activo: true })}
                      className="accent-[#741C2B]"
                    />
                    <span>Activo en Turno</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#77736E]">
                    <input
                      type="radio"
                      name="estadoVendedor"
                      checked={!editingVendedor.activo}
                      onChange={() => setEditingVendedor({ ...editingVendedor, activo: false })}
                      className="accent-[#741C2B]"
                    />
                    <span>Inactivo / Suspendido</span>
                  </label>
                </div>
              </div>

              {/* Matriz de Permisos */}
              <div className="pt-3 border-t border-[#E7E0D8]">
                <span className="text-xs font-bold text-[#292827] mb-3 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#741C2B]" />
                  <span>Matriz de Permisos Operativos de Caja</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {PERMISOS_CONFIG.map(({ key, label, desc }) => (
                    <label
                      key={key}
                      className="flex items-start gap-2.5 p-2.5 rounded-xl border border-[#E7E0D8] bg-[#F5F3EF]/50 cursor-pointer hover:border-[#741C2B] transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(editingVendedor[key as keyof VendedorDTO])}
                        onChange={(e) =>
                          setEditingVendedor({
                            ...editingVendedor,
                            [key]: e.target.checked,
                          })
                        }
                        className="mt-0.5 w-3.5 h-3.5 rounded accent-[#741C2B]"
                      />
                      <div>
                        <div className="font-bold text-[#292827] text-xs">{label}</div>
                        <div className="text-[11px] text-[#77736E]">{desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-[#E7E0D8]">
                <button
                  type="button"
                  onClick={() => setEditingVendedor(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#77736E] hover:text-[#292827] hover:bg-[#F5F3EF] rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#741C2B] hover:bg-[#5E1623] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C49A68]" />
                  ) : null}
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVendedoresPage;
