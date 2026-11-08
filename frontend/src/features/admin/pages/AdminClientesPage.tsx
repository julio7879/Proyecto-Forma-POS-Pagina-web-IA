// frontend/src/features/admin/pages/AdminClientesPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserCheck,
  ShoppingBag,
  Crown,
  FileText,
  Mail,
  Phone,
  MapPin,
  Eye,
} from 'lucide-react';
import { getWebOrders } from '../../pos/utils/webOrdersStore';
import { getPosRegisteredSales } from '../../pos/utils/posLedgerSync';
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

interface CompraCliente {
  consecutivo: string;
  fecha: string;
  sede: string;
  totalCop: number;
  tipo: 'WEB' | 'POS';
  prendas: string;
}

interface ClienteDirectorio {
  id: string;
  nombreCompleto: string;
  documento: string;
  correo: string;
  telefono: string;
  ciudad: string;
  direccion: string;
  sedeFrecuente: string;
  fechaRegistro: string;
  totalComprasCop: number;
  cantidadCompras: number;
  ultimaCompraFecha: string;
  compras: CompraCliente[];
}

export const AdminClientesPage: React.FC = () => {
  const [clientes, setClientes] = useState<ClienteDirectorio[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCliente, setSelectedCliente] = useState<ClienteDirectorio | null>(null);
  const [drawerTab, setDrawerTab] = useState<'detalle' | 'productos' | 'actividad' | 'comprobantes'>('detalle');

  const sincronizarClientes = () => {
    const pedidos = getWebOrders();
    const ventas = getPosRegisteredSales();

    const mapa = new Map<string, ClienteDirectorio>();

    pedidos.forEach((p) => {
      const email = p.emailCliente || p.cliente.toLowerCase().replace(/\s+/g, '.') + '@correo.com';
      const key = email.toLowerCase();
      const resumenPrendas = p.productos
        .map((pr) => `${pr.nombre} (${pr.talla}) × ${pr.cantidad}`)
        .join(', ');

      const compra: CompraCliente = {
        consecutivo: `#${p.codigo}`,
        fecha: new Date(p.fechaCreacionIso).toLocaleDateString('es-CO', {
          timeZone: 'America/Bogota',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        sede: p.sedeAsignada,
        totalCop: p.totalCOP,
        tipo: 'WEB',
        prendas: resumenPrendas,
      };

      if (!mapa.has(key)) {
        mapa.set(key, {
          id: `cli-${p.codigo}`,
          nombreCompleto: p.cliente,
          documento: p.documento || 'CC No Registrada',
          correo: email,
          telefono: p.telefono || 'Sin teléfono',
          ciudad: p.ciudadDestino || 'Cúcuta',
          direccion: p.direccionEntrega || 'Entrega en punto físico',
          sedeFrecuente: p.sedeAsignada,
          fechaRegistro: new Date(p.fechaCreacionIso).toLocaleDateString('es-CO', {
            timeZone: 'America/Bogota',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }),
          totalComprasCop: p.totalCOP,
          cantidadCompras: 1,
          ultimaCompraFecha: compra.fecha,
          compras: [compra],
        });
      } else {
        const existente = mapa.get(key)!;
        existente.totalComprasCop += p.totalCOP;
        existente.cantidadCompras += 1;
        existente.compras.push(compra);
      }
    });

    ventas.forEach((v) => {
      if (v.cliente && v.cliente !== 'Consumidor Final') {
        const key = (v.documentoCliente || v.cliente).toLowerCase();
        const resumen = (v.prendas || v.items || [])
          .map((pr) => `${pr.nombre} (${pr.talla || 'U'}) × ${pr.cantidad || 1}`)
          .join(', ');

        const sedeSegura = v.sede || 'Punto Centro';
        const compra: CompraCliente = {
          consecutivo: v.consecutivo,
          fecha: v.fechaHora || 'Hoy',
          sede: sedeSegura,
          totalCop: v.totalCop,
          tipo: 'POS',
          prendas: resumen || 'Prenda en mostrador',
        };

        if (!mapa.has(key)) {
          mapa.set(key, {
            id: `cli-${v.consecutivo}`,
            nombreCompleto: v.cliente,
            documento: v.documentoCliente || 'CC Mostrador',
            correo: 'cliente.mostrador@forma.com',
            telefono: 'Atención en Tienda',
            ciudad: sedeSegura.includes('Cúcuta') ? 'Cúcuta' : sedeSegura.split(' ')[1] || 'Cúcuta',
            direccion: `Compra presencial en ${sedeSegura}`,
            sedeFrecuente: sedeSegura,
            fechaRegistro: v.fechaHora || 'Hoy',
            totalComprasCop: v.totalCop,
            cantidadCompras: 1,
            ultimaCompraFecha: v.fechaHora || 'Hoy',
            compras: [compra],
          });
        } else {
          const ex = mapa.get(key)!;
          ex.totalComprasCop += v.totalCop;
          ex.cantidadCompras += 1;
          ex.compras.push(compra);
        }
      }
    });

    setClientes(Array.from(mapa.values()));
  };

  useEffect(() => {
    sincronizarClientes();
    window.addEventListener('forma-pos-ledger-update', sincronizarClientes);
    window.addEventListener('storage', sincronizarClientes);
    return () => {
      window.removeEventListener('forma-pos-ledger-update', sincronizarClientes);
      window.removeEventListener('storage', sincronizarClientes);
    };
  }, []);

  const metricas = useMemo(() => {
    const totalClientes = clientes.length;
    const frecuentes = clientes.filter((c) => c.cantidadCompras > 1).length;
    const totalFacturado = clientes.reduce((acc, c) => acc + c.totalComprasCop, 0);
    const totalCompras = clientes.reduce((acc, c) => acc + c.cantidadCompras, 0);
    const ticketPromedio = totalCompras > 0 ? Math.round(totalFacturado / totalCompras) : 0;
    const webUsers = clientes.filter((c) => c.compras.some((x) => x.tipo === 'WEB')).length;

    return {
      totalClientes,
      frecuentes,
      ticketPromedio,
      webUsers,
    };
  }, [clientes]);

  const clientesFiltrados = useMemo(() => {
    if (!searchQuery.trim()) return clientes;
    const q = searchQuery.toLowerCase();
    return clientes.filter(
      (c) =>
        c.nombreCompleto.toLowerCase().includes(q) ||
        c.documento.toLowerCase().includes(q) ||
        c.correo.toLowerCase().includes(q) ||
        c.telefono.toLowerCase().includes(q) ||
        c.ciudad.toLowerCase().includes(q)
    );
  }, [clientes, searchQuery]);

  const timelineActividad = useMemo<ActivityTimelineItem[]>(() => {
    if (!selectedCliente) return [];
    return selectedCliente.compras.map((c, i) => ({
      id: `act-${c.consecutivo}-${i}`,
      timestamp: c.fecha,
      title: `${c.tipo === 'WEB' ? 'Pedido Tienda Online' : 'Venta Mostrador POS'} · ${c.consecutivo}`,
      description: `${c.prendas} — Total: ${formatCOP(c.totalCop)} en ${c.sede}`,
      user: selectedCliente.nombreCompleto,
      type: c.tipo === 'WEB' ? 'info' : 'success',
      badge: c.tipo === 'WEB' ? 'Online' : 'POS',
    }));
  }, [selectedCliente]);

  const columns: ColumnDef<ClienteDirectorio>[] = [
    {
      key: 'nombreCompleto',
      header: 'Cliente',
      render: (c) => (
        <div>
          <div className="font-bold text-[#292827] text-[13px]">{c.nombreCompleto}</div>
          <div className="text-[11px] text-[#77736E]">Registrado: {c.fechaRegistro}</div>
        </div>
      ),
    },
    {
      key: 'documento',
      header: 'Documento',
      render: (c) => (
        <span className="font-mono font-bold text-[#741C2B] text-xs">{c.documento}</span>
      ),
    },
    {
      key: 'contacto',
      header: 'Contacto',
      render: (c) => (
        <div className="text-xs space-y-0.5">
          <div className="text-[#292827] font-medium truncate max-w-[200px]">{c.correo}</div>
          <div className="text-[#77736E] text-[11px] font-mono">{c.telefono}</div>
        </div>
      ),
    },
    {
      key: 'ciudadSede',
      header: 'Ciudad / Sede',
      render: (c) => (
        <div className="text-xs">
          <span className="font-bold text-[#292827]">{c.ciudad}</span>
          <span className="text-[#77736E] text-[11px] block">{c.sedeFrecuente}</span>
        </div>
      ),
    },
    {
      key: 'cantidadCompras',
      header: 'Compras',
      align: 'center',
      render: (c) => (
        <StatusBadge
          label={`${c.cantidadCompras} ${c.cantidadCompras === 1 ? 'orden' : 'órdenes'}`}
          variant={c.cantidadCompras > 2 ? 'success' : 'neutral'}
          size="sm"
        />
      ),
    },
    {
      key: 'totalComprasCop',
      header: 'Total Acumulado',
      align: 'right',
      render: (c) => (
        <div className="font-mono font-bold text-xs text-[#292827]">
          {formatCOP(c.totalComprasCop)}
        </div>
      ),
    },
    {
      key: 'acciones',
      header: 'Acción',
      align: 'right',
      render: (c) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedCliente(c);
            setDrawerTab('detalle');
          }}
          className="p-1.5 rounded-xl border border-[#E7E0D8] bg-white text-[#741C2B] hover:bg-[#F5F3EF] transition-colors cursor-pointer shadow-2xs"
          title="Ver Ficha de Cliente"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Directorio Omnicanal de Clientes"
        subtitle="Unificación en tiempo real de compradores de la tienda web y clientes registrados en mostrador POS."
        badge="Clientes & Fidelidad"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPIStatCard
          title="Total Clientes"
          value={metricas.totalClientes.toString()}
          subtitle="Registrados en la base"
          icon={UserCheck}
        />
        <KPIStatCard
          title="Clientes Frecuentes"
          value={metricas.frecuentes.toString()}
          subtitle="Más de 1 compra acumulada"
          icon={Crown}
        />
        <KPIStatCard
          title="Ticket Promedio"
          value={formatCOP(metricas.ticketPromedio)}
          subtitle="Gasto promedio por orden"
          icon={ShoppingBag}
        />
        <KPIStatCard
          title="Clientes Web"
          value={metricas.webUsers.toString()}
          subtitle="Han comprado en tienda online"
          icon={FileText}
        />
      </div>

      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Buscar por cédula, nombre, correo, teléfono o ciudad..."
      />

      {clientes.length === 0 ? (
        <EmptyState
          title="Aún no hay clientes ni pedidos registrados"
          description="Los clientes aparecerán automáticamente aquí a medida que se registren o realicen pedidos en la tienda web o compras identificadas en las terminales POS."
          icon={Users}
        />
      ) : (
        <DataTable
          columns={columns}
          data={clientesFiltrados}
          keyExtractor={(c) => c.id}
          onSelectRow={(c) => {
            setSelectedCliente(c);
            setDrawerTab('detalle');
          }}
          emptyTitle="No se encontraron clientes coincidentes"
          emptySubtitle="Prueba ajustando los términos de búsqueda o documento."
        />
      )}

      {selectedCliente && (
        <DetailDrawer
          isOpen={Boolean(selectedCliente)}
          onClose={() => setSelectedCliente(null)}
          title={selectedCliente.nombreCompleto}
          subtitle={`C.C. ${selectedCliente.documento} · ${selectedCliente.ciudad}`}
          badge={{
            label: selectedCliente.cantidadCompras > 2 ? 'Cliente Frecuente' : 'Cliente Regular',
            variant: selectedCliente.cantidadCompras > 2 ? 'success' : 'neutral',
          }}
          tabs={[
            { id: 'detalle', label: 'Información' },
            { id: 'productos', label: 'Productos Adquiridos' },
            { id: 'actividad', label: 'Historial' },
            { id: 'comprobantes', label: 'Comprobantes' },
          ]}
          activeTab={drawerTab}
          onTabChange={(t) => setDrawerTab(t as any)}
          activityItems={timelineActividad}
        >
          <div className="space-y-4">
            {drawerTab === 'detalle' && (
              <div className="space-y-4">
                <div className="p-4 rounded-[12px] bg-[#F5F3EF] border border-[#E7E0D8] space-y-3">
                  <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-[#77736E]">
                    Datos de Contacto y Ubicación
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-[#292827]">
                      <Mail className="w-4 h-4 text-[#741C2B]" />
                      <span className="font-medium">{selectedCliente.correo}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#292827]">
                      <Phone className="w-4 h-4 text-[#C49A68]" />
                      <span className="font-mono">{selectedCliente.telefono}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#292827]">
                      <MapPin className="w-4 h-4 text-[#741C2B]" />
                      <span>
                        {selectedCliente.direccion}, {selectedCliente.ciudad}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 bg-white rounded-[12px] border border-[#E7E0D8] text-center shadow-2xs">
                    <span className="text-[10px] text-[#77736E] uppercase font-extrabold block">
                      Total Facturado
                    </span>
                    <span className="text-base font-black font-mono text-[#741C2B] mt-0.5 block">
                      {formatCOP(selectedCliente.totalComprasCop)}
                    </span>
                  </div>
                  <div className="p-3.5 bg-white rounded-[12px] border border-[#E7E0D8] text-center shadow-2xs">
                    <span className="text-[10px] text-[#77736E] uppercase font-extrabold block">
                      Órdenes Realizadas
                    </span>
                    <span className="text-base font-black font-mono text-[#292827] mt-0.5 block">
                      {selectedCliente.cantidadCompras} compras
                    </span>
                  </div>
                </div>
              </div>
            )}

            {drawerTab === 'productos' && (
              <div className="space-y-3">
                <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-[#77736E]">
                  Prendas y Artículos Adquiridos
                </h4>
                <div className="space-y-2">
                  {selectedCliente.compras.map((compra, idx) => (
                    <div
                      key={`compra-prod-${idx}`}
                      className="p-3.5 rounded-[12px] bg-[#F5F3EF] border border-[#E7E0D8] space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-[#741C2B]">
                          {compra.consecutivo}
                        </span>
                        <span className="text-[#77736E] text-[11px]">{compra.fecha}</span>
                      </div>
                      <div className="font-bold text-[#292827] text-xs">
                        {compra.prendas}
                      </div>
                      <div className="text-[11px] text-[#77736E]">
                        Sede: {compra.sede} · Total: {formatCOP(compra.totalCop)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {drawerTab === 'comprobantes' && (
              <div className="space-y-3">
                <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-[#77736E]">
                  Soportes y Facturas Registradas
                </h4>
                <div className="border border-[#E7E0D8] rounded-[12px] overflow-hidden divide-y divide-[#E7E0D8]">
                  {selectedCliente.compras.map((compra) => (
                    <div key={compra.consecutivo} className="p-3.5 bg-white text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-[#741C2B]">
                          {compra.consecutivo}
                        </span>
                        <StatusBadge
                          label={compra.tipo === 'WEB' ? 'Tienda Online' : 'Punto Físico'}
                          variant={compra.tipo === 'WEB' ? 'info' : 'neutral'}
                          size="sm"
                        />
                      </div>
                      <div className="font-semibold text-[#292827]">{compra.prendas}</div>
                      <div className="flex items-center justify-between text-[11px] text-[#77736E] pt-1">
                        <span>
                          {compra.sede} · {compra.fecha}
                        </span>
                        <span className="font-mono font-bold text-[#292827]">
                          {formatCOP(compra.totalCop)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DetailDrawer>
      )}
    </div>
  );
};

export default AdminClientesPage;
