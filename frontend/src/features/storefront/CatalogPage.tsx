// frontend/src/features/storefront/CatalogPage.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ProductoDTO,
  getProductosCatalogo,
  PRODUCTOS_SEMILLA,
} from './services/catalogService';
import { CategoryFilters, CategoryFilterType } from './components/CategoryFilters';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { ProductGridSkeleton } from './components/ProductGridSkeleton';
import { RefreshCw, PackageX } from 'lucide-react';

export const CatalogPage: React.FC = () => {
  const [productos, setProductos] = useState<ProductoDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de filtros interactivos
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilterType>('Todas');
  const [searchQuery, setSearchQuery] = useState('');

  // Estado del modal de detalle
  const [selectedProduct, setSelectedProduct] = useState<ProductoDTO | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const cargarProductos = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getProductosCatalogo();
      setProductos(data);
    } catch {
      setError('No se pudo conectar con el catálogo en línea. Mostrando catálogo local.');
      setProductos(PRODUCTOS_SEMILLA);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  // Fix Should-Fix 2: useCallback para evitar re-renderizados y re-suscripciones del listener Escape
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  }, []);

  const handleOpenDetail = useCallback((producto: ProductoDTO) => {
    setSelectedProduct(producto);
    setIsModalOpen(true);
  }, []);

  // Filtrado reactivo en cliente (Categoría + Texto)
  const productosFiltrados = useMemo(() => {
    return productos.filter((prod) => {
      const coincideCategoria =
        selectedCategory === 'Todas' || prod.categoriaNombre === selectedCategory;

      const q = searchQuery.toLowerCase().trim();
      const coincideBusqueda =
        !q ||
        prod.nombre.toLowerCase().includes(q) ||
        prod.descripcion.toLowerCase().includes(q) ||
        prod.variantes.some((v) => v.sku.toLowerCase().includes(q));

      return coincideCategoria && coincideBusqueda;
    });
  }, [productos, selectedCategory, searchQuery]);

  return (
    <div className="w-full">
      {/* Encabezado Hero sutil */}
      <div className="mb-6">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Catálogo Oficial Forma
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Ropa, accesorios deportivos, cosméticos y artesanías terminadas con envío nacional.
        </p>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <CategoryFilters
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* ESTADO 1: Loading */}
      {isLoading && <ProductGridSkeleton />}

      {/* ESTADO 2: Error */}
      {error && !isLoading && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 flex items-center justify-between text-xs text-amber-800 dark:text-amber-200">
          <span>{error}</span>
          <button
            onClick={cargarProductos}
            className="px-3 py-1.5 bg-amber-200 dark:bg-amber-800 rounded-lg font-bold flex items-center gap-1.5 hover:bg-amber-300 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reintentar
          </button>
        </div>
      )}

      {/* ESTADO 3: Empty (Sin coincidencias) */}
      {!isLoading && productosFiltrados.length === 0 && (
        <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md">
          <PackageX className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No se encontraron productos
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            No hay productos que coincidan con la categoría «{selectedCategory}» o el término «{searchQuery}».
          </p>
          <button
            onClick={() => {
              setSelectedCategory('Todas');
              setSearchQuery('');
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-500 transition-all shadow-md shadow-indigo-500/20"
          >
            Restablecer filtros
          </button>
        </div>
      )}

      {/* ESTADO 4: Success (Grilla de Productos) */}
      {!isLoading && productosFiltrados.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {productosFiltrados.map((prod) => (
            <ProductCard
              key={prod.id}
              producto={prod}
              onOpenDetail={handleOpenDetail}
            />
          ))}
        </div>
      )}

      {/* Modal de Detalle y Selección de Variantes */}
      <ProductDetailModal
        producto={selectedProduct}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default CatalogPage;