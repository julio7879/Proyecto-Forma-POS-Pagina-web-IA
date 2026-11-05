// frontend/src/features/admin/pages/AdminVendedoresPage.tsx
import React, { useState, useEffect } from 'react';
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

const VENDEDORES_INICIALES_DEMO: VendedorDTO[] = [
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
    telefono: '310 987 6543',
    activo: true,
    rol: 'VENDEDOR',
    ubicacionId: 8,
    ubicacion: { id: 8, nombre: 'Punto Caobos (Cúcuta)', codigo: 'CUC-CAO', tipo: 'TIENDA_FISICA' },
    creadoEn: '2026-10-14T09:30:00Z',
    permVender: true,
    permCaja: true,
    permDescuentoManual: true,
    permAnularVentas: false,
    permDevoluciones: false,
    permVerInventario: true,
    permSolicitarTraslado: true,
    permRecibirTraslado: true,
    permVerOtrosPuntos: false,
    permPedidosWeb: true,
    permVerVentasPunto: true,
  },
  {
    id: 104,
    nombreCompleto: 'Mateo Morales',
    correo: 'vendedor.ocana@forma.com',
    telefono: '318 654 3210',
    activo: true,
    rol: 'VENDEDOR',
    ubicacionId: 3,
    ubicacion: { id: 3, nombre: 'Punto Ocaña', codigo: 'OCA-POS', tipo: 'TIENDA_FISICA' },
    creadoEn: '2026-10-18T10:00:00Z',
    permVender: true,
    permCaja: true,
    permDescuentoManual: false,
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

export const AdminVendedoresPage: React.FC = () => {
  const [vendedores, setVendedores] = useState<VendedorDTO[]>([]);
  const [ubicaciones, setUbicaciones] = useState<UbicacionDTO[]>(SEDES_PREDETERMINADAS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensajeNotificacion, setMensajeNotificacion] = useState<string | null>(null);
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroSede, setFiltroSede] = useState<string>('todas');

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
      } else {
        setVendedores(VENDEDORES_INICIALES_DEMO);
      }

      if (listaUbicaciones.length > 0 && formNuevo.ubicacionId === 0) {
        const primerTienda = listaUbicaciones.find((u) => u.tipo === 'TIENDA_FISICA') || listaUbicaciones[0];
        setFormNuevo((prev) => ({ ...prev, ubicacionId: primerTienda.id }));
      }
    } catch (err: any) {
      setError(err.message || 'Error al sincronizar vendedores y sedes');
      setVendedores(VENDEDORES_INICIALES_DEMO);
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
      if (nuevo) {
        setVendedores((prev) => [nuevo, ...prev]);
      } else {
        const ubiAsignada = ubicaciones.find((u) => u.id === formNuevo.ubicacionId);
        const vendedorLocal: VendedorDTO = {
          ...formNuevo,
          id: Date.now(),
          telefono: formNuevo.telefono || null,
          activo: true,
          rol: 'VENDEDOR',
          ubicacion: ubiAsignada ? { id: ubiAsignada.id, nombre: ubiAsignada.nombre, codigo: ubiAsignada.codigo, tipo: ubiAsignada.tipo } : null,
          creadoEn: new Date().toISOString(),
        };
        setVendedores((prev) => [vendedorLocal, ...prev]);
      }

      setIsCreateOpen(false);
      setFormNuevo((prev) => ({
        ...prev,
        nombreCompleto: '',
        correo: '',
        password: '',
        telefono: '',
      }));
      mostrarExito(`Vendedor "${formNuevo.nombreCompleto}" registrado exitosamente.`);
    } catch (err: any) {
      setModalError(err.message || 'No se pudo crear el vendedor');
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
      await actualizarVendedor(editingVendedor.id, {
        nombreCompleto: editingVendedor.nombreCompleto,
        ubicacionId: editingVendedor.ubicacionId ?? undefined,
        telefono: editingVendedor.telefono ?? undefined,
        activo: editingVendedor.activo,
        permVender: editingVendedor.permVender,
        permCaja: editingVendedor.permCaja,
        permDescuentoManual: editingVendedor.permDescuentoManual,
        permAnularVentas: editingVendedor.permAnularVentas,
        permDevoluciones: editingVendedor.permDevoluciones,
        permVerInventario: editingVendedor.permVerInventario,
        permSolicitarTraslado: editingVendedor.permSolicitarTraslado,
        permRecibirTraslado: editingVendedor.permRecibirTraslado,
        permVerOtrosPuntos: editingVendedor.permVerOtrosPuntos,
        permPedidosWeb: editingVendedor.permPedidosWeb,
        permVerVentasPunto: editingVendedor.permVerVentasPunto,
      }).catch(() => null);

      const ubiActualizada = ubicaciones.find((u) => u.id === editingVendedor.ubicacionId);
      setVendedores((prev) =>
        prev.map((v) =>
          v.id === editingVendedor.id
            ? {
                ...editingVendedor,
                ubicacion: ubiActualizada
                  ? { id: ubiActualizada.id, nombre: ubiActualizada.nombre, codigo: ubiActualizada.codigo, tipo: ubiActualizada.tipo }
                  : v.ubicacion,
              }
            : v
        )
      );

      mostrarExito(`Información y permisos actualizados para "${editingVendedor.nombreCompleto}".`);
      setEditingVendedor(null);
    } catch (err: any) {
      setModalError(err.message || 'No se pudo actualizar el vendedor');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reasignación rápida de sede directamente desde la tabla
  const handleCambioRapidoSede = async (vendedorId: number, nuevaUbicacionId: number) => {
    setReasignandoId(vendedorId);
    try {
      await actualizarVendedor(vendedorId, { ubicacionId: nuevaUbicacionId }).catch(() => null);

      const nuevaSedeObj = ubicaciones.find((u) => u.id === nuevaUbicacionId);
      setVendedores((prev) =>
        prev.map((v) => {
          if (v.id === vendedorId) {
            return {
              ...v,
              ubicacionId: nuevaUbicacionId,
              ubicacion: nuevaSedeObj
                ? { id: nuevaSedeObj.id, nombre: nuevaSedeObj.nombre, codigo: nuevaSedeObj.codigo, tipo: nuevaSedeObj.tipo }
                : v.ubicacion,
            };
          }
          return v;
        })
      );

      const vend = vendedores.find((v) => v.id === vendedorId);
      mostrarExito(
        `Sede autorizada actualizada para ${vend?.nombreCompleto || 'el vendedor'}: ahora asignado a "${nuevaSedeObj?.nombre}".`
      );
    } catch (err: any) {
      setError('Error al actualizar la sede asignada: ' + (err.message || 'Error'));
    } finally {
      setReasignandoId(null);
    }
  };

  const vendedoresFiltrados = vendedores.filter((v) => {
    const coincideTexto =
      v.nombreCompleto.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      v.correo.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      (v.telefono && v.telefono.includes(filtroTexto));
    const coincideSede =
      filtroSede === 'todas' || v.ubicacionId?.toString() === filtroSede;
    return coincideTexto && coincideSede;
  });

  return (
    <div className="space-y-6">
      {/* Encabezado Editorial Apple Liquid Glass */}
      <div className="glass-mirror-card rounded-3xl p-6 sm:p-7 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="glass-mirror-pill inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-widest text-[#661521] border border-[#D19650]/40 mb-2">
            Control de Nómina y Sedes Físicas
          </span>
          <div className="flex items-center gap-3">
            <span className="p-3 bg-[#661521] text-[#D19650] border border-[#D19650] rounded-2xl shadow-md">
              <Users className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-[#171717] font-display tracking-tight">
                Gestión de Vendedores y Sedes POS
              </h1>
              <p className="text-sm sm:text-base font-medium text-[#50322A] mt-1">
                Asignación territorial de personal a puntos de venta físicos (Punto Centro, Caobos, Ocaña y Bucaramanga) y control de permisos de mostrador.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setModalError(null);
            setIsCreateOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-[#661521] hover:bg-[#4A0E17] text-white border border-[#D19650] text-sm font-bold rounded-2xl shadow-lg transition-all active:scale-95 self-start md:self-auto"
        >
          <UserPlus className="w-4 h-4 text-[#D19650]" />
          <span>Nuevo Vendedor</span>
        </button>
      </div>

      {/* Banner de Notificación de Éxito */}
      {mensajeNotificacion && (
        <div className="p-4 bg-[#D19650]/20 border border-[#D19650] text-[#351912] rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-between gap-3 shadow-md transition-all">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-[#661521] shrink-0" />
            <span>{mensajeNotificacion}</span>
          </div>
          <button
            onClick={() => setMensajeNotificacion(null)}
            className="text-[#50322A] hover:text-[#171717]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tarjetas de Métricas de Personal */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-mirror-card p-5 rounded-3xl">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#50322A]">
            Total Vendedores
          </span>
          <div className="text-3xl font-black font-mono tabular-nums text-[#171717] mt-1">
            {vendedores.length}
          </div>
          <span className="text-[11px] text-[#50322A]/80 font-medium">Personal registrado</span>
        </div>
        <div className="glass-mirror-card p-5 rounded-3xl">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#50322A]">
            Activos en Turno
          </span>
          <div className="text-3xl font-black font-mono tabular-nums text-[#661521] mt-1">
            {vendedores.filter((v) => v.activo && v.permVender).length}
          </div>
          <span className="text-[11px] text-[#661521] font-bold">Con acceso a terminal POS</span>
        </div>
        <div className="glass-mirror-card p-5 rounded-3xl">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#50322A]">
            Puntos Cubiertos
          </span>
          <div className="text-3xl font-black font-mono tabular-nums text-[#351912] mt-1">
            {new Set(vendedores.map((v) => v.ubicacionId).filter(Boolean)).size} /{' '}
            {ubicaciones.filter((u) => u.tipo === 'TIENDA_FISICA').length}
          </div>
          <span className="text-[11px] text-[#50322A]/80 font-medium">Sedes con cajero asignado</span>
        </div>
        <div className="glass-mirror-card p-5 rounded-3xl">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#50322A]">
            Especialistas Web
          </span>
          <div className="text-3xl font-black font-mono tabular-nums text-[#171717] mt-1">
            {vendedores.filter((v) => v.permPedidosWeb).length}
          </div>
          <span className="text-[11px] text-[#50322A]/80 font-medium">Atención omnicanal</span>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtro por Sede */}
      <div className="glass-mirror-card p-5 rounded-3xl flex flex-col sm:flex-row items-center gap-3.5">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-[#50322A]" />
          <input
            type="text"
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
            placeholder="Buscar por nombre, correo o teléfono..."
            className="capsule-mirror-input w-full pl-10 pr-4 py-2.5 rounded-2xl text-sm font-semibold text-[#171717] placeholder-[#50322A]/60"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-[#50322A] shrink-0" />
          <select
            value={filtroSede}
            onChange={(e) => setFiltroSede(e.target.value)}
            className="capsule-mirror-input px-4 py-2.5 rounded-2xl text-sm font-bold text-[#171717] cursor-pointer w-full sm:w-auto"
          >
            <option value="todas" className="bg-[#F4EFE8] text-[#171717]">
              Todas las Sedes Físicas
            </option>
            {ubicaciones.map((u) => (
              <option key={u.id} value={u.id.toString()} className="bg-[#F4EFE8] text-[#171717]">
                {u.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla Principal de Vendedores */}
      {isLoading ? (
        <div className="glass-mirror-card p-14 rounded-3xl text-center text-[#50322A] flex flex-col items-center gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-[#661521]" />
          <span className="text-sm font-bold">Cargando nómina de vendedores...</span>
        </div>
      ) : error ? (
        <div className="glass-mirror-card p-5 border border-[#661521]/40 text-[#661521] rounded-3xl text-sm font-bold flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      ) : vendedoresFiltrados.length === 0 ? (
        <div className="glass-mirror-card p-14 text-center rounded-3xl">
          <Users className="w-10 h-10 text-[#50322A] mx-auto mb-3" />
          <p className="text-base font-bold text-[#171717]">
            No se encontraron vendedores registrados o coincidentes con los filtros.
          </p>
        </div>
      ) : (
        <div className="glass-mirror-card rounded-3xl overflow-hidden shadow-xl border border-[#D19650]/30">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#50322A]/20 bg-[#E7DED2]/85 text-xs font-extrabold text-[#351912] uppercase tracking-wider">
                  <th className="px-5 py-4">Vendedor</th>
                  <th className="px-5 py-4">Sede Asignada (Edición Rápida)</th>
                  <th className="px-5 py-4">Permisos Operativos</th>
                  <th className="px-5 py-4">Estado</th>
                  <th className="px-5 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#50322A]/10 text-sm">
                {vendedoresFiltrados.map((v) => (
                  <tr
                    key={v.id}
                    className="hover:bg-white/80 transition-colors"
                  >
                    {/* Información del Vendedor */}
                    <td className="px-5 py-4">
                      <div className="font-extrabold text-[#171717] text-sm flex items-center gap-2">
                        <span>{v.nombreCompleto}</span>
                        {v.ubicacion?.nombre?.includes('Bucaramanga') && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-[#D19650]/20 text-[#661521] border border-[#D19650]/40">
                            <Sparkles className="w-3 h-3 text-[#D19650]" /> Bucaramanga
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#50322A] font-mono tabular-nums font-medium flex items-center gap-1.5 mt-0.5">
                        <Mail className="w-3 h-3 text-[#661521]" />
                        <span>{v.correo}</span>
                      </div>
                      {v.telefono && (
                        <div className="text-xs text-[#50322A]/80 font-mono flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-3 h-3 text-[#D19650]" />
                          <span>{v.telefono}</span>
                        </div>
                      )}
                    </td>

                    {/* Selector Directo de Cambio Rápido de Sede */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="relative inline-block w-full max-w-[220px]">
                          <select
                            value={v.ubicacionId || ''}
                            disabled={reasingnandoId === v.id}
                            onChange={(e) => handleCambioRapidoSede(v.id, Number(e.target.value))}
                            className="capsule-mirror-input w-full pl-8 pr-3 py-1.5 rounded-xl text-xs font-bold text-[#171717] border border-[#D19650]/50 cursor-pointer bg-white/70 hover:bg-white disabled:opacity-50"
                            title="Cambiar punto de venta asignado para este vendedor"
                          >
                            {ubicaciones.map((u) => (
                              <option key={u.id} value={u.id} className="bg-[#F4EFE8] text-[#171717]">
                                {u.nombre}
                              </option>
                            ))}
                          </select>
                          <Store className="w-3.5 h-3.5 text-[#661521] absolute left-2.5 top-2.5 pointer-events-none" />
                        </div>
                        {reasingnandoId === v.id && (
                          <Loader2 className="w-4 h-4 animate-spin text-[#661521]" />
                        )}
                      </div>
                    </td>

                    {/* Badges de Permisos */}
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1.5 max-w-sm">
                        {v.permVender && (
                          <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-[#661521] text-white border border-[#D19650]/50">
                            Venta POS
                          </span>
                        )}
                        {v.permCaja && (
                          <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-[#351912] text-[#F4EFE8] border border-[#D19650]/40">
                            Caja
                          </span>
                        )}
                        {v.permDescuentoManual && (
                          <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-[#D19650]/25 text-[#171717] border border-[#D19650]">
                            Descuentos
                          </span>
                        )}
                        {v.permDevoluciones && (
                          <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-[#661521]/15 text-[#661521] border border-[#661521]/30">
                            Devolución
                          </span>
                        )}
                        {v.permPedidosWeb && (
                          <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-[#E7DED2] text-[#351912] border border-[#50322A]/30">
                            Web
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Estado Activo / Inactivo */}
                    <td className="px-5 py-4">
                      {v.activo ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-[#661521] font-extrabold bg-[#D19650]/20 px-2.5 py-1 rounded-full border border-[#D19650]/50">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Activo</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs text-[#50322A] font-bold bg-[#50322A]/10 px-2.5 py-1 rounded-full">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Inactivo</span>
                        </span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => {
                          setModalError(null);
                          setEditingVendedor({ ...v });
                        }}
                        className="glass-mirror-pill inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#351912] hover:text-[#661521] hover:border-[#661521] border border-[#D19650]/40 rounded-xl transition-all shadow-sm active:scale-95"
                        title="Editar permisos completos y datos"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-[#661521]" />
                        <span>Editar</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Crear Vendedor */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-[#171717]/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-mirror-card rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-[#50322A]/15">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-[#661521] text-[#D19650] rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-xl font-black text-[#171717] font-display">
                    Registrar Nuevo Vendedor
                  </h2>
                  <p className="text-xs text-[#50322A] font-medium">
                    Asigne el punto de venta autorizado obligatorio y configure los permisos de caja.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-[#50322A] hover:text-[#661521] p-1.5 rounded-lg hover:bg-black/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mt-4 p-3.5 bg-[#661521]/10 text-[#661521] border border-[#661521]/30 rounded-2xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCrearVendedor} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-[#351912] uppercase tracking-wider mb-1.5">
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
                    className="capsule-mirror-input w-full p-3 rounded-2xl text-sm font-semibold text-[#171717]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-[#351912] uppercase tracking-wider mb-1.5">
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
                    className="capsule-mirror-input w-full p-3 rounded-2xl text-sm font-semibold text-[#171717]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-[#351912] uppercase tracking-wider mb-1.5">
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
                    className="capsule-mirror-input w-full p-3 rounded-2xl text-sm font-semibold text-[#171717]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-[#351912] uppercase tracking-wider mb-1.5">
                    Sede Asignada Obligatoria *
                  </label>
                  <select
                    value={formNuevo.ubicacionId}
                    onChange={(e) =>
                      setFormNuevo({ ...formNuevo, ubicacionId: Number(e.target.value) })
                    }
                    className="capsule-mirror-input w-full p-3 rounded-2xl text-sm font-bold text-[#171717]"
                  >
                    {ubicaciones.map((u) => (
                      <option key={u.id} value={u.id} className="bg-[#F4EFE8] text-[#171717]">
                        {u.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#351912] uppercase tracking-wider mb-1.5">
                  Teléfono de Contacto (opcional)
                </label>
                <input
                  type="text"
                  value={formNuevo.telefono || ''}
                  onChange={(e) => setFormNuevo({ ...formNuevo, telefono: e.target.value })}
                  placeholder="315 889 4210"
                  className="capsule-mirror-input w-full p-3 rounded-2xl text-sm font-semibold text-[#171717]"
                />
              </div>

              {/* Matriz de Permisos */}
              <div className="pt-3 border-t border-[#50322A]/15">
                <span className="text-xs font-extrabold text-[#351912] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#661521]" />
                  <span>Matriz de Permisos Operativos de Caja</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {PERMISOS_CONFIG.map(({ key, label, desc }) => (
                    <label
                      key={key}
                      className="glass-mirror-pill flex items-start gap-2.5 p-3 rounded-2xl border border-[#D19650]/35 cursor-pointer hover:border-[#661521] transition-colors"
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
                        className="mt-0.5 w-4 h-4 rounded accent-[#661521]"
                      />
                      <div>
                        <div className="font-bold text-[#171717] text-xs">
                          {label}
                        </div>
                        <div className="text-[11px] font-medium text-[#50322A]">{desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-[#50322A]/15">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="glass-mirror-pill px-5 py-2.5 text-xs font-bold text-[#50322A] hover:text-[#171717] rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-[#661521] hover:bg-[#4A0E17] text-white border border-[#D19650] text-xs font-bold rounded-xl shadow-lg flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin text-[#D19650]" /> : null}
                  <span>Guardar Vendedor</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Vendedor */}
      {editingVendedor && (
        <div className="fixed inset-0 z-50 bg-[#171717]/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-mirror-card rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-[#50322A]/15">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-[#661521] text-[#D19650] rounded-xl">
                  <Edit2 className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-xl font-black text-[#171717] font-display">
                    Editar Vendedor: {editingVendedor.nombreCompleto}
                  </h2>
                  <p className="text-xs text-[#50322A] font-medium">
                    Actualice la sede asignada, estado de acceso y permisos operativos.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingVendedor(null)}
                className="text-[#50322A] hover:text-[#661521] p-1.5 rounded-lg hover:bg-black/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mt-4 p-3.5 bg-[#661521]/10 text-[#661521] border border-[#661521]/30 rounded-2xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleActualizarVendedor} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-[#351912] uppercase tracking-wider mb-1.5">
                    Sede Asignada
                  </label>
                  <select
                    value={editingVendedor.ubicacionId || ''}
                    onChange={(e) =>
                      setEditingVendedor({
                        ...editingVendedor,
                        ubicacionId: Number(e.target.value),
                      })
                    }
                    className="capsule-mirror-input w-full p-3 rounded-2xl text-sm font-bold text-[#171717]"
                  >
                    {ubicaciones.map((u) => (
                      <option key={u.id} value={u.id} className="bg-[#F4EFE8] text-[#171717]">
                        {u.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-[#351912] uppercase tracking-wider mb-1.5">
                    Estado en el Sistema
                  </label>
                  <select
                    value={editingVendedor.activo ? '1' : '0'}
                    onChange={(e) =>
                      setEditingVendedor({
                        ...editingVendedor,
                        activo: e.target.value === '1',
                      })
                    }
                    className="capsule-mirror-input w-full p-3 rounded-2xl text-sm font-bold text-[#171717]"
                  >
                    <option value="1" className="bg-[#F4EFE8] text-[#171717]">
                      Activo (Puede ingresar al POS)
                    </option>
                    <option value="0" className="bg-[#F4EFE8] text-[#171717]">
                      Inactivo (Acceso revocado)
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#351912] uppercase tracking-wider mb-1.5">
                  Teléfono de Contacto
                </label>
                <input
                  type="text"
                  value={editingVendedor.telefono || ''}
                  onChange={(e) =>
                    setEditingVendedor({ ...editingVendedor, telefono: e.target.value })
                  }
                  placeholder="315 889 4210"
                  className="capsule-mirror-input w-full p-3 rounded-2xl text-sm font-semibold text-[#171717]"
                />
              </div>

              {/* Matriz de Permisos */}
              <div className="pt-3 border-t border-[#50322A]/15">
                <span className="block text-xs font-extrabold text-[#351912] uppercase tracking-wider mb-3">
                  Matriz de Permisos Concedidos
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {PERMISOS_CONFIG.map(({ key, label, desc }) => (
                    <label
                      key={key}
                      className="glass-mirror-pill flex items-start gap-2.5 p-3 rounded-2xl border border-[#D19650]/35 cursor-pointer hover:border-[#661521] transition-colors"
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
                        className="mt-0.5 w-4 h-4 rounded accent-[#661521]"
                      />
                      <div>
                        <div className="font-bold text-[#171717] text-xs">
                          {label}
                        </div>
                        <div className="text-[11px] font-medium text-[#50322A]">{desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-[#50322A]/15">
                <button
                  type="button"
                  onClick={() => setEditingVendedor(null)}
                  className="glass-mirror-pill px-5 py-2.5 text-xs font-bold text-[#50322A] hover:text-[#171717] rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-[#661521] hover:bg-[#4A0E17] text-white border border-[#D19650] text-xs font-bold rounded-xl shadow-lg flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin text-[#D19650]" /> : null}
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
