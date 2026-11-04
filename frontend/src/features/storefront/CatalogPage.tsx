import React, { useState, useMemo } from 'react';
import { PackageOpen, AlertCircle, RefreshCw, ShoppingBag } from 'lucide-react';
import { BentoGridHero } from './components/BentoGridHero.js';
import { ProductCard } from './components/ProductCard.js';
import { CatalogFilters } from './components/CatalogFilters.js';
import { CartDrawer } from './components/CartDrawer.js';
import { ProductSkeleton } from './components/ProductSkeleton.js';
import { PRODUCTOS_CATALOGO, SEDES_DISPONIBLES } from './catalogData.js';
import { CategoriaSlug, SedeId, CartItem } from './types.js';

export const CatalogPage: React.FC = () => {
  // Estado de Sede y Filtros
  const [sedeActivaId, setSedeActivaId] = useState<SedeId>('MEDELLIN');
  const [categoriaActiva, setCategoriaActiva] = useState<CategoriaSlug | 'todas'>('todas');
  const [busqueda, setBusqueda] = useState('');
  const [tallaFiltro, setTallaFiltro] = useState('Todas');
  const [soloDisponibles, setSoloDisponibles] = useState(false);

  // Estados de Ciclo de Vida de UI (Loading, Error, Success)
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Estado del Carrito Flotante
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Sede activa objeto
  const sedeActiva = useMemo(
    () => SEDES_DISPONIBLES.find((s) => s.id === sedeActivaId) ?? SEDES_DISPONIBLES[0],
    [sedeActivaId]
  );

  // Filtrado reactivo en memoria
  const productosFiltrados = useMemo(() => {
    return PRODUCTOS_CATALOGO.filter((prod) => {
      // Filtro por categoría
      if (categoriaActiva !== 'todas' && prod.categoria !== categoriaActiva) {
        return false;
      }

      // Filtro por búsqueda textual (nombre o SKU)
      if (busqueda.trim() !== '') {
        const query = busqueda.toLowerCase().trim();
        const coincideNombre = prod.nombre.toLowerCase().includes(query);
        const coincideSku = prod.variantes.some((v) =>
          v.sku.toLowerCase().includes(query)
        );
        if (!coincideNombre && !coincideSku) return false;
      }

      // Filtro por talla
      if (tallaFiltro !== 'Todas') {
        const tieneTalla = prod.variantes.some((v) => v.talla === tallaFiltro);
        if (!tieneTalla) return false;
      }

      // Filtro por disponibilidad en sede o central
      if (soloDisponibles) {
        const tieneStock = prod.variantes.some(
          (v) =>
            (v.stockPorSede[sedeActivaId] ?? 0) > 0 ||
            (v.stockPorSede['CUCUTA_CENTRAL'] ?? 0) > 0
        );
        if (!tieneStock) return false;
      }

      return true;
    });
  }, [categoriaActiva, busqueda, tallaFiltro, soloDisponibles, sedeActivaId]);

  // Manejadores del Carrito
  const handleAddToCart = (item: CartItem) => {
    setCartItems((prev) => {
      const index = prev.findIndex((i) => i.id === item.id);
      if (index >= 0) {
        const copia = [...prev];
        copia[index].cantidad += item.cantidad;
        return copia;
      }
      return [...prev, item];
    });
    setIsCartOpen(true);
  };

  const handleUpdateCantidad = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const nuevaCantidad = item.cantidad + delta;
            return nuevaCantidad > 0 ? { ...item, cantidad: nuevaCantidad } : null;
          }
          return item;
        })
        .filter((i): i is CartItem => i !== null)
    );
  };

  const handleRemoveItem = (id: string) => {
    setCartItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleLimpiarFiltros = () => {
    setCategoriaActiva('todas');
    setBusqueda('');
    setTallaFiltro('Todas');
    setSoloDisponibles(false);
  };

  const handleSimularRecarga = () => {
    setIsLoading(true);
    setHasError(false);
    setTimeout(() => {
      setIsLoading(false);
    }, 600);
  };

  const handleCheckoutSimulado = () => {
    alert(
      `Procediendo al Checkout Seguro.\nTotal Ítems: ${cartItems.reduce(
        (a, b) => a + b.cantidad,
        0
      )}\nSede de Despacho: ${sedeActiva.nombre}`
    );
  };

  const totalUnidadesCarrito = cartItems.reduce((acc, it) => acc + it.cantidad, 0);

  return (
    <div className="relative pb-16">
      {/* Botón Flotante Rápido de Carrito en Móvil */}
      {cartItems.length > 0 && (
        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 right-6 z-40 sm:hidden flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 text-white font-bold shadow-2xl active:scale-95 transition-all"
          aria-label={`Ver carrito con ${totalUnidadesCarrito} productos`}
        >
          <ShoppingBag className="w-5 h-5" />
          <span>{totalUnidadesCarrito}</span>
        </button>
      )}

      {/* Hero Bento Grid */}
      <BentoGridHero
        sedeActiva={sedeActiva}
        categoriaActiva={categoriaActiva}
        onSeleccionarCategoria={(cat) => setCategoriaActiva(cat)}
        onExplorarProducto={(_id) => {
          setBusqueda('');
          setCategoriaActiva('ropa');
        }}
      />

      {/* Barra de Filtros y Búsqueda */}
      <CatalogFilters
        busqueda={busqueda}
        onBusquedaChange={setBusqueda}
        categoriaActiva={categoriaActiva}
        onCategoriaChange={setCategoriaActiva}
        sedeActiva={sedeActivaId}
        sedes={SEDES_DISPONIBLES}
        onSedeChange={setSedeActivaId}
        tallaFiltro={tallaFiltro}
        onTallaFiltroChange={setTallaFiltro}
        soloDisponibles={soloDisponibles}
        onSoloDisponiblesChange={setSoloDisponibles}
        totalResultados={productosFiltrados.length}
        onLimpiarFiltros={handleLimpiarFiltros}
      />

      {/* Estado 1: Loading (Skeletons) */}
      {isLoading && (
        <section aria-label="Cargando productos" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, idx) => (
            <ProductSkeleton key={idx} />
          ))}
        </section>
      )}

      {/* Estado 2: Error (Alerta con botón de reintento) */}
      {!isLoading && hasError && (
        <section
          role="alert"
          aria-live="polite"
          className="glass-panel rounded-3xl p-8 border border-rose-500/30 bg-rose-500/10 text-center my-8 max-w-xl mx-auto"
        >
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            No se pudo sincronizar el inventario
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
            Ocurrió una interrupción al consultar los saldos de stock multisede. Por favor intenta nuevamente.
          </p>
          <button
            type="button"
            onClick={handleSimularRecarga}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reintentar Conexión</span>
          </button>
        </section>
      )}

      {/* Estado 3: Empty (Vacío sin resultados) */}
      {!isLoading && !hasError && productosFiltrados.length === 0 && (
        <section
          aria-label="Sin resultados de búsqueda"
          className="glass-card rounded-3xl p-12 text-center my-6 max-w-lg mx-auto border border-slate-200/60 dark:border-slate-800/60 shadow-glass"
        >
          <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-4">
            <PackageOpen className="w-8 h-8" aria-hidden="true" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
            No hay productos que coincidan con tu búsqueda
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
            Intenta cambiar los términos de búsqueda, seleccionar otra categoría o ampliar la disponibilidad a Bodega Central.
          </p>
          <button
            type="button"
            onClick={handleLimpiarFiltros}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-glow-indigo transition-all"
          >
            Restablecer Todos los Filtros
          </button>
        </section>
      )}

      {/* Estado 4: Success / Interactivo (Grilla de Productos) */}
      {!isLoading && !hasError && productosFiltrados.length > 0 && (
        <section
          aria-label="Catálogo de productos disponibles"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {productosFiltrados.map((producto) => (
            <ProductCard
              key={producto.id}
              producto={producto}
              sedeActiva={sedeActivaId}
              onAddToCart={handleAddToCart}
            />
          ))}
        </section>
      )}

      {/* Drawer Flotante de Carrito Liquid Glass */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateCantidad={handleUpdateCantidad}
        onRemoveItem={handleRemoveItem}
        onCheckout={handleCheckoutSimulado}
      />
    </div>
  );
};

export default CatalogPage;
