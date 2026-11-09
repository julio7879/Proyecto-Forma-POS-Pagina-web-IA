import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Tag,
  Plus,
  Trash2,
  Power,
  Sparkles,
  Layers,
  AlertCircle,
  Percent,
  DollarSign,
  X,
} from 'lucide-react';
import {
  PageHeader,
  KPIStatCard,
  ConfirmDialog,
  EmptyState,
  formatCOP,
} from '../components';
import {
  getPromociones,
  guardarPromocion,
  togglePromocion,
  eliminarPromocion,
  PromocionWeb,
  PROMOCIONES_EVENT,
} from '../../storefront/services/promocionesStore';

const CATEGORIAS_VALIDAS = [
  'Todas',
  'Ropa',
  'Calzado',
  'Accesorios',
  'Cosméticos',
  'Artesanías',
];

export const AdminPromocionesPage: React.FC = () => {
  const [promociones, setPromociones] = useState<PromocionWeb[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todas');
  const [estadoFiltro, setEstadoFiltro] = useState<'TODAS' | 'ACTIVAS' | 'PAUSADAS'>('TODAS');

  // Estados del modal de creación
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formNombre, setFormNombre] = useState('');
  const [formTipo, setFormTipo] = useState<'PORCENTAJE' | 'VALOR_FIJO'>('PORCENTAJE');
  const [formValor, setFormValor] = useState<string>('15');
  const [formCategoria, setFormCategoria] = useState('Todas');
  const [formSkus, setFormSkus] = useState('');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Estado del diálogo de confirmación de eliminación
  const [promocionAEliminar, setPromocionAEliminar] = useState<PromocionWeb | null>(null);

  const cargarPromociones = useCallback(() => {
    setPromociones(getPromociones());
  }, []);

  useEffect(() => {
    cargarPromociones();
    window.addEventListener(PROMOCIONES_EVENT, cargarPromociones);
    window.addEventListener('storage', cargarPromociones);
    return () => {
      window.removeEventListener(PROMOCIONES_EVENT, cargarPromociones);
      window.removeEventListener('storage', cargarPromociones);
    };
  }, [cargarPromociones]);

  // KPIs
  const totalPromociones = promociones.length;
  const activasCount = promociones.filter((p) => p.activa).length;
  const maxDescuentoActivo = useMemo(() => {
    const activas = promociones.filter((p) => p.activa && p.tipo === 'PORCENTAJE');
    if (activas.length === 0) return '0%';
    const maxVal = Math.max(...activas.map((p) => p.valor));
    return `${maxVal}% OFF`;
  }, [promociones]);

  const categoriasConOferta = useMemo(() => {
    const cats = new Set(
      promociones.filter((p) => p.activa).map((p) => p.categoria)
    );
    return cats.has('Todas') ? 'Todas las líneas' : `${cats.size} líneas cubiertas`;
  }, [promociones]);

  // Filtrado de promociones
  const promocionesFiltradas = useMemo(() => {
    return promociones.filter((p) => {
      const matchSearch =
        searchQuery === '' ||
        p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCategoria =
        categoriaFiltro === 'Todas' || p.categoria === categoriaFiltro || p.categoria === 'Todas';

      const matchEstado =
        estadoFiltro === 'TODAS' ||
        (estadoFiltro === 'ACTIVAS' && p.activa) ||
        (estadoFiltro === 'PAUSADAS' && !p.activa);

      return matchSearch && matchCategoria && matchEstado;
    });
  }, [promociones, searchQuery, categoriaFiltro, estadoFiltro]);

  const handleToggle = (id: string) => {
    togglePromocion(id);
    cargarPromociones();
  };

  const handleConfirmarEliminar = () => {
    if (!promocionAEliminar) return;
    eliminarPromocion(promocionAEliminar.id);
    setPromocionAEliminar(null);
    cargarPromociones();
  };

  const handleAbrirModalCreacion = () => {
    setFormNombre('');
    setFormTipo('PORCENTAJE');
    setFormValor('15');
    setFormCategoria('Todas');
    setFormSkus('');
    setFormDescripcion('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleGuardarPromocion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre.trim()) {
      setFormError('El nombre de la promoción es obligatorio.');
      return;
    }

    const valorNum = parseInt(formValor.replace(/\D/g, ''), 10);
    if (isNaN(valorNum) || valorNum <= 0) {
      setFormError('El valor del beneficio debe ser mayor a cero.');
      return;
    }

    if (formTipo === 'PORCENTAJE' && valorNum > 90) {
      setFormError('El porcentaje de descuento no puede superar el 90%.');
      return;
    }

    const skusParsed = formSkus
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    guardarPromocion({
      nombre: formNombre.trim(),
      tipo: formTipo,
      valor: valorNum,
      categoria: formCategoria,
      skusElegibles: skusParsed.length > 0 ? skusParsed : undefined,
      activa: true,
      descripcion: formDescripcion.trim() || undefined,
    });

    setIsModalOpen(false);
    cargarPromociones();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Encabezado Principal */}
      <PageHeader
        title="Promociones y Ofertas de Temporada"
        subtitle="Administre campañas comerciales, porcentajes de descuento y rebajas exclusivas sincronizadas en vivo con el Storefront y el POS."
        badge="Motor de Descuentos"
      >
        <button
          type="button"
          onClick={handleAbrirModalCreacion}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#661521] hover:bg-[#50101a] text-white font-bold text-sm tracking-wide shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Promoción</span>
        </button>
      </PageHeader>

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIStatCard
          title="Campañas Activas"
          value={`${activasCount} de ${totalPromociones}`}
          subtitle="En ejecución en tienda web"
          icon={Tag}
          badge="En Vivo"
        />
        <KPIStatCard
          title="Descuento Máximo"
          value={maxDescuentoActivo}
          subtitle="Mayor beneficio vigente"
          icon={Percent}
          badge="Activo"
        />
        <KPIStatCard
          title="Cobertura Comercial"
          value={categoriasConOferta}
          subtitle="Líneas con precio especial"
          icon={Layers}
        />
        <KPIStatCard
          title="Sincronización Inmediata"
          value="100% Reactivo"
          subtitle="Sin requerir recargar página"
          icon={Sparkles}
          badge="Storefront + POS"
        />
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white rounded-2xl border border-[#E7E0D8] p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre o descripción..."
              className="w-full px-3.5 py-2 rounded-xl bg-[#F5F3EF] border border-[#E7E0D8] text-sm text-[#292827] focus:outline-none focus:ring-2 focus:ring-[#741C2B]/30"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#77736E] uppercase tracking-wider mr-1">
              Estado:
            </span>
            {(['TODAS', 'ACTIVAS', 'PAUSADAS'] as const).map((est) => (
              <button
                key={est}
                type="button"
                onClick={() => setEstadoFiltro(est)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  estadoFiltro === est
                    ? 'bg-[#741C2B] text-white'
                    : 'bg-[#F5F3EF] text-[#77736E] hover:text-[#292827]'
                }`}
              >
                {est === 'TODAS' ? 'Todas' : est === 'ACTIVAS' ? 'Activas' : 'Pausadas'}
              </button>
            ))}
          </div>
        </div>

        {/* Píldoras de Categoría */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar border-t border-[#F5F3EF]">
          <span className="text-xs font-bold text-[#77736E] uppercase tracking-wider mr-2 shrink-0">
            Categoría:
          </span>
          {CATEGORIAS_VALIDAS.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoriaFiltro(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                categoriaFiltro === cat
                  ? 'bg-[#50322A] text-white shadow-sm'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Promociones */}
      {promocionesFiltradas.length === 0 ? (
        <EmptyState
          title="No se encontraron promociones"
          description={
            searchQuery || categoriaFiltro !== 'Todas' || estadoFiltro !== 'TODAS'
              ? 'Intente cambiando los términos de búsqueda o filtros seleccionados.'
              : 'Aún no ha creado campañas u ofertas de descuento. Cree su primera promoción para mostrarla en el carrusel de la tienda web.'
          }
          actionLabel="Crear Nueva Promoción"
          onAction={handleAbrirModalCreacion}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-[#E7E0D8] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#292827]">
              <thead className="bg-[#FAF8F5] border-b border-[#E7E0D8] text-xs font-black uppercase tracking-wider text-[#77736E]">
                <tr>
                  <th className="px-5 py-3.5">Campaña & Descripción</th>
                  <th className="px-5 py-3.5">Beneficio / Tipo</th>
                  <th className="px-5 py-3.5">Línea o SKUs</th>
                  <th className="px-5 py-3.5 text-center">Estado</th>
                  <th className="px-5 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E0D8]">
                {promocionesFiltradas.map((promo) => (
                  <tr
                    key={promo.id}
                    className="hover:bg-[#FAF8F5]/80 transition-colors"
                  >
                    <td className="px-5 py-4 max-w-sm">
                      <div className="font-bold text-sm text-[#1C1311] flex items-center gap-2">
                        <span>{promo.nombre}</span>
                        {promo.id.startsWith('PROM-') && (
                          <span className="text-[10px] font-mono text-[#77736E] bg-stone-100 px-1.5 py-0.5 rounded">
                            #{promo.id}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#77736E] line-clamp-2 mt-0.5">
                        {promo.descripcion || 'Sin descripción detallada.'}
                      </p>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      {promo.tipo === 'PORCENTAJE' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-black text-xs border border-emerald-200">
                          <Percent className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{promo.valor}% DE DESCUENTO</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 font-black text-xs border border-amber-200">
                          <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                          <span>{formatCOP(promo.valor)} DE DESCUENTO</span>
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-stone-100 text-stone-800 text-xs font-semibold">
                        {promo.categoria === 'Todas'
                          ? 'Todas las Colecciones'
                          : promo.categoria}
                      </span>
                      {promo.skusElegibles && promo.skusElegibles.length > 0 && (
                        <span className="block text-[11px] font-mono text-[#77736E] mt-1">
                          {promo.skusElegibles.length} SKU(s) específicos
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap text-center">
                      <button
                        type="button"
                        onClick={() => handleToggle(promo.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          promo.activa
                            ? 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200 border border-emerald-300'
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200 border border-stone-300'
                        }`}
                        title={promo.activa ? 'Haga clic para pausar' : 'Haga clic para activar'}
                      >
                        <Power className={`w-3 h-3 ${promo.activa ? 'text-emerald-700' : 'text-stone-400'}`} />
                        <span>{promo.activa ? 'Activa' : 'Pausada'}</span>
                      </button>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setPromocionAEliminar(promo)}
                          className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-800 transition-colors cursor-pointer"
                          title="Eliminar promoción"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal para Crear Nueva Promoción */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-[#E7E0D8] shadow-2xl overflow-hidden animate-scale-up">
            <div className="px-6 py-5 bg-[#FAF8F5] border-b border-[#E7E0D8] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#741C2B]" />
                <h3 className="font-bold text-lg text-[#292827]">
                  Nueva Promoción de Temporada
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-stone-200 text-stone-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarPromocion} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#77736E] uppercase tracking-wider mb-1">
                  Nombre de la Campaña / Oferta *
                </label>
                <input
                  type="text"
                  required
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  placeholder="Ej: Rebajas de Mitad de Temporada"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E0D8] text-sm focus:outline-none focus:ring-2 focus:ring-[#741C2B]/30"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#77736E] uppercase tracking-wider mb-1">
                    Tipo de Beneficio
                  </label>
                  <select
                    value={formTipo}
                    onChange={(e) =>
                      setFormTipo(e.target.value as 'PORCENTAJE' | 'VALOR_FIJO')
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E0D8] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#741C2B]/30"
                  >
                    <option value="PORCENTAJE">Porcentaje (% OFF)</option>
                    <option value="VALOR_FIJO">Valor Fijo ($ COP)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#77736E] uppercase tracking-wider mb-1">
                    {formTipo === 'PORCENTAJE' ? 'Porcentaje (%) *' : 'Valor ($ COP) *'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={formTipo === 'PORCENTAJE' ? 90 : 10000000}
                    required
                    value={formValor}
                    onChange={(e) => setFormValor(e.target.value)}
                    placeholder={formTipo === 'PORCENTAJE' ? 'Ej: 20' : 'Ej: 30000'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E0D8] text-sm focus:outline-none focus:ring-2 focus:ring-[#741C2B]/30 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#77736E] uppercase tracking-wider mb-1">
                  Categoría Aplicable
                </label>
                <select
                  value={formCategoria}
                  onChange={(e) => setFormCategoria(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E0D8] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#741C2B]/30"
                >
                  {CATEGORIAS_VALIDAS.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat === 'Todas' ? 'Todas las Categorías' : cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#77736E] uppercase tracking-wider mb-1">
                  SKUs Específicos (Opcional, separados por coma)
                </label>
                <input
                  type="text"
                  value={formSkus}
                  onChange={(e) => setFormSkus(e.target.value)}
                  placeholder="Ej: ROP-BLZ-010-M, ROP-DNM-001-L"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E0D8] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#741C2B]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#77736E] uppercase tracking-wider mb-1">
                  Descripción Comercial (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={formDescripcion}
                  onChange={(e) => setFormDescripcion(e.target.value)}
                  placeholder="Mensaje promocional visible para clientes en la tienda..."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E7E0D8] text-sm focus:outline-none focus:ring-2 focus:ring-[#741C2B]/30"
                />
              </div>

              <div className="pt-3 border-t border-[#E7E0D8] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#E7E0D8] text-stone-600 hover:bg-stone-50 font-bold text-xs uppercase tracking-wider transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#661521] hover:bg-[#50101a] text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all active:scale-95"
                >
                  Guardar y Activar Promoción
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Diálogo de Confirmación de Eliminación */}
      <ConfirmDialog
        isOpen={Boolean(promocionAEliminar)}
        title="¿Eliminar esta promoción?"
        description={`Está a punto de eliminar la promoción "${promocionAEliminar?.nombre}". Los productos volverán a su precio de lista estándar de forma inmediata.`}
        confirmLabel="Sí, Eliminar Promoción"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={handleConfirmarEliminar}
        onCancel={() => setPromocionAEliminar(null)}
      />
    </div>
  );
};

export default AdminPromocionesPage;
