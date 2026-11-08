// frontend/src/features/storefront/CatalogPage.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ProductoDTO,
  VarianteDTO,
  getProductosCatalogo,
  PRODUCTOS_SEMILLA,
  formatMoneyCOP,
} from './services/catalogService';
import { CategoryFilters, CategoryFilterType } from './components/CategoryFilters';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { ProductGridSkeleton } from './components/ProductGridSkeleton';
import { BentoGridHero } from './components/BentoGridHero';
import { useStorefrontCart } from './context/StorefrontCartContext';
import { CategoriaSlug } from './types';
import {
  RefreshCw,
  PackageX,
  Sparkles,
  ShieldCheck,
  Truck,
  Award,
  ChevronRight,
  CheckCircle2,
  SlidersHorizontal,
  X,
  ChevronLeft,
} from 'lucide-react';

const normalizeText = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const SLUG_TO_CATEGORY: Record<CategoriaSlug | 'todas', CategoryFilterType> = {
  todas: 'Todas',
  ropa: 'Ropa',
  accesorios: 'Accesorios',
  cosmeticos: 'Cosméticos',
  artesanias: 'Artesanías',
};

const CATEGORY_TO_SLUG: Record<CategoryFilterType, CategoriaSlug | 'todas'> = {
  Todas: 'todas',
  Ropa: 'ropa',
  Calzado: 'ropa',
  Accesorios: 'accesorios',
  Cosméticos: 'cosmeticos',
  Artesanías: 'artesanias',
};

interface RamificacionCategoria {
  id: CategoryFilterType;
  label: string;
  tagline: string;
  descripcion: string;
  subcategorias: string[];
  icono: string;
}

const ARBOL_CATEGORIAS: RamificacionCategoria[] = [
  {
    id: 'Todas',
    label: 'Todas las Colecciones',
    tagline: 'Catálogo completo multisede',
    descripcion:
      'Curaduría editorial multisede con piezas de diseño de autor, marroquinería y artesanías colombianas con despacho a todo el país.',
    subcategorias: ['Ropa', 'Calzado', 'Accesorios', 'Cosméticos', 'Artesanías'],
    icono: '✨',
  },
  {
    id: 'Ropa',
    label: 'Ropa de Autor',
    tagline: 'Sastrería, lino & tejidos',
    descripcion:
      'Sastrería contemporánea, camisas en algodón peinado, linos nobles y prendas de confección artesanal con identidad colombiana.',
    subcategorias: ['Todas', 'Chaquetas', 'Cardigans', 'Camisas', 'Vestidos', 'Pantalones'],
    icono: '👔',
  },
  {
    id: 'Calzado',
    label: 'Calzado Artesanal',
    tagline: 'Cuero genuino & horma confort',
    descripcion:
      'Botines, mocasines, sandalias y calzado elaborado a mano en cuero genuino por maestros zapateros de la región.',
    subcategorias: ['Todas', 'Botines', 'Sandalias', 'Mocasines', 'Sneakers'],
    icono: '👞',
  },
  {
    id: 'Accesorios',
    label: 'Accesorios & Marroquinería',
    tagline: 'Bolsos, gafas & sombreros',
    descripcion:
      'Marroquinería fina en cuero vacuno, bolsos estructurados, gorras urbanas y gafas con protección UV.',
    subcategorias: ['Todas', 'Bolsos', 'Gorras', 'Gafas', 'Cinturones', 'Joyería'],
    icono: '👜',
  },
  {
    id: 'Cosméticos',
    label: 'Cosméticos Botánicos',
    tagline: 'Extractos andinos & dermo',
    descripcion:
      'Fórmulas botánicas dermo-cosméticas con extractos andinos para el cuidado facial y corporal. Por higiene y seguridad son de uso personal sin cambio.',
    subcategorias: ['Todas', 'Sérums', 'Labiales', 'Cremas', 'Aceites', 'Tónicos'],
    icono: '🌿',
  },
  {
    id: 'Artesanías',
    label: 'Artesanías de Origen',
    tagline: 'Wayuu, Mompox & tejeduría',
    descripcion:
      'Mochilas Wayuu tradicionales, filigrana momposina y piezas ancestrales elaboradas por comunidades maestras del país.',
    subcategorias: ['Todas', 'Wayuu', 'Filigrana', 'Sombreros', 'Ruanas', 'Cestería'],
    icono: '🏺',
  },
];

const RANGOS_PRECIO: { label: string; max: number | null }[] = [
  { label: 'Todos los precios', max: null },
  { label: 'Hasta $50.000', max: 50000 },
  { label: 'Hasta $100.000', max: 100000 },
  { label: 'Hasta $250.000', max: 250000 },
  { label: 'Hasta $500.000', max: 500000 },
];

const ITEMS_PER_PAGE = 12;

const normalizarTexto = (str: string): string =>
  str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

export const matchesSubcategory = (prod: ProductoDTO, subcat: string): boolean => {
  if (!subcat || subcat === 'Todas') return true;

  const target = normalizarTexto(subcat);
  let stem = target;
  if (target.endsWith('es')) {
    stem = target.slice(0, -2);
  } else if (target.endsWith('s')) {
    stem = target.slice(0, -1);
  }

  const haystack = normalizarTexto(`${prod.nombre} ${prod.descripcion} ${prod.slug}`);

  if (stem === 'camisa') {
    return haystack.includes('camisa') || haystack.includes('camiseta') || haystack.includes('blusa');
  }
  if (stem === 'bolso') {
    return (
      haystack.includes('bolso') ||
      haystack.includes('mochila') ||
      haystack.includes('cartera') ||
      haystack.includes('marroquineria')
    );
  }
  if (stem === 'gorra') {
    return (
      haystack.includes('gorra') ||
      haystack.includes('snapback') ||
      haystack.includes('sombrero') ||
      haystack.includes('visera')
    );
  }
  if (stem === 'gafa') {
    return haystack.includes('gafa') || haystack.includes('lente') || haystack.includes('polarizada');
  }
  if (stem === 'serum') {
    return haystack.includes('serum');
  }
  if (stem === 'labial') {
    return haystack.includes('labial');
  }
  if (stem === 'crema') {
    return haystack.includes('crema');
  }
  if (stem === 'aceite') {
    return haystack.includes('aceite');
  }
  if (stem === 'tonico') {
    return haystack.includes('tonico');
  }
  if (stem === 'wayuu') {
    return haystack.includes('wayuu');
  }
  if (stem === 'filigrana') {
    return haystack.includes('filigrana');
  }
  if (stem === 'sombrero') {
    return haystack.includes('sombrero');
  }
  if (stem === 'ruana') {
    return haystack.includes('ruana');
  }
  if (stem === 'cesteria') {
    return haystack.includes('cesteria');
  }
  if (stem === 'botin') {
    return haystack.includes('botin') || haystack.includes('bota');
  }
  if (stem === 'sandalia') {
    return haystack.includes('sandalia');
  }
  if (stem === 'mocasin') {
    return haystack.includes('mocasin');
  }
  if (stem === 'sneaker') {
    return haystack.includes('sneaker') || haystack.includes('tenis') || haystack.includes('zapatilla');
  }

  return haystack.includes(target) || haystack.includes(stem);
};

export const CatalogPage: React.FC = () => {
  const { addItem, sedeActiva } = useStorefrontCart();

  const [productos, setProductos] = useState<ProductoDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de navegación por categoría y subcategoría
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilterType>('Todas');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('Todas');

  // Estados de filtros interactivos
  const [searchQuery, setSearchQuery] = useState('');
  const [soloConStock, setSoloConStock] = useState(false);
  const [precioMaximo, setPrecioMaximo] = useState<number | null>(null);

  // Paginación limpia (12 productos por página para evitar scroll infinito)
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Estado del modal de detalle 3D
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

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  }, []);

  const handleOpenDetail = useCallback((producto: ProductoDTO) => {
    setSelectedProduct(producto);
    setIsModalOpen(true);
  }, []);

  const scrollToCatalogGridIfNeeded = useCallback(() => {
    const el = document.getElementById('catalogo-grid');
    if (el && typeof el.scrollIntoView === 'function') {
      const rect = el.getBoundingClientRect();
      if (rect.top < 60 || rect.top > window.innerHeight - 120) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, []);

  const handleSelectCategory = useCallback(
    (cat: CategoryFilterType) => {
      setSelectedCategory(cat);
      setSelectedSubcategory('Todas');
      setCurrentPage(1);
    },
    []
  );

  const handleSelectSubcategory = useCallback(
    (sub: string) => {
      setSelectedSubcategory(sub);
      setCurrentPage(1);
    },
    []
  );

  const handleQuickAdd = useCallback(
    (producto: ProductoDTO, variante: VarianteDTO) => {
      addItem({
        id: String(variante.id),
        productoId: String(producto.id),
        sku: variante.sku,
        nombre: producto.nombre,
        precioUnitarioCOP: variante.precioVentaCop,
        cantidad: 1,
        talla: variante.talla,
        color: variante.color,
        imagenUrl:
          producto.imagenesUrls[0] ||
          'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80',
      });
    },
    [addItem]
  );

  const handleAddFromModal = useCallback(
    (variante: VarianteDTO, cantidad: number) => {
      if (!selectedProduct) return;
      addItem({
        id: String(variante.id),
        productoId: String(selectedProduct.id),
        sku: variante.sku,
        nombre: selectedProduct.nombre,
        precioUnitarioCOP: variante.precioVentaCop,
        cantidad,
        talla: variante.talla,
        color: variante.color,
        imagenUrl:
          selectedProduct.imagenesUrls[0] ||
          'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80',
      });
    },
    [addItem, selectedProduct]
  );

  // Información de la categoría seleccionada
  const categoriaActualInfo = useMemo(() => {
    return (
      ARBOL_CATEGORIAS.find((c) => c.id === selectedCategory) ||
      ARBOL_CATEGORIAS[0]
    );
  }, [selectedCategory]);

  // Filtrado reactivo en cliente (Categoría + Subcategoría + Texto + Stock + Rango Precio)
  const productosFiltrados = useMemo(() => {
    return productos.filter((prod) => {
      // 1. Filtro por categoría principal
      const coincideCategoria =
        selectedCategory === 'Todas' || prod.categoriaNombre === selectedCategory;

      // 2. Filtro por subcategoría interactiva
      const coincideSubcat = matchesSubcategory(prod, selectedSubcategory);

      // 3. Buscador de texto libre normalizado (sin tildes F-WEB-01)
      const q = normalizeText(searchQuery.trim());
      const coincideBusqueda =
        !q ||
        normalizeText(prod.nombre).includes(q) ||
        normalizeText(prod.descripcion).includes(q) ||
        prod.variantes.some((v) => normalizeText(v.sku).includes(q));

      // 4. Stock disponible
      const stockTotal = prod.variantes.reduce((acc, v) => acc + v.stockDisponible, 0);
      const coincideStock = !soloConStock || stockTotal > 0;

      // 5. Filtro de Precio Máximo en COP (RN-GEN-04)
      const precioMinimoProducto =
        prod.variantes.length > 0
          ? Math.min(...prod.variantes.map((v) => v.precioVentaCop))
          : 0;
      const coincidePrecio =
        precioMaximo === null || precioMinimoProducto <= precioMaximo;

      return (
        coincideCategoria &&
        coincideSubcat &&
        coincideBusqueda &&
        coincideStock &&
        coincidePrecio
      );
    });
  }, [
    productos,
    selectedCategory,
    selectedSubcategory,
    searchQuery,
    soloConStock,
    precioMaximo,
  ]);

  // Cálculo de Paginación Limpia
  const totalPages = Math.max(1, Math.ceil(productosFiltrados.length / ITEMS_PER_PAGE));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedProductos = useMemo(() => {
    const start = (validCurrentPage - 1) * ITEMS_PER_PAGE;
    return productosFiltrados.slice(start, start + ITEMS_PER_PAGE);
  }, [productosFiltrados, validCurrentPage]);

  return (
    <div className="w-full space-y-10">
      {/* =====================================================================
          SECCIÓN 1: HERO EDITORIAL & PROPUESTA DE VALOR MULTISEDE
          ===================================================================== */}
      <BentoGridHero
        sedeActiva={sedeActiva}
        categoriaActiva={CATEGORY_TO_SLUG[selectedCategory]}
        onSeleccionarCategoria={(slug) => {
          handleSelectCategory(SLUG_TO_CATEGORY[slug]);
        }}
        onExplorarProducto={() => {
          if (productos.length > 0) {
            handleOpenDetail(productos[0]);
          }
        }}
      />

      {/* =====================================================================
          SECCIÓN 2: EXPLORADOR PRINCIPAL CON MENÚ LATERAL IZQUIERDO Y VISTA DEDICADA
          ===================================================================== */}
      <section id="catalogo-grid" className="pt-2 relative">
        <span id="catalogo-oficial" className="sr-only" />

        {/* Encabezado accesible para tests y usuarios */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#661521] mb-1">
              <Sparkles className="w-3.5 h-3.5 text-[#D19650]" />
              Curaduría Editorial · Selección Exclusiva
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#50322A] tracking-tight">
              Catálogo Oficial Forma
            </h1>
            <p className="text-xs sm:text-sm text-[#171717]/75 mt-1">
              Explora nuestras líneas de Ropa, Calzado, Accesorios, Cosméticos y Artesanías, o selecciona cualquier pieza para conocer sus variantes.
            </p>
          </div>

          <div className="glass-mirror-pill px-4 py-2 rounded-full text-xs font-bold text-[#50322A] self-start sm:self-auto">
            Mostrando <strong className="text-[#661521] font-mono-tabular">{productosFiltrados.length}</strong>{' '}
            referencias encontradas
          </div>
        </div>

        {/* Contenedor de ancho completo (sin menú duplicado de Departamentos) */}
        <div className="w-full space-y-5">
          {/* Barra única de Categorías y Búsqueda (Preserva role="tab" y accesibilidad) */}
          <CategoryFilters
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
            searchQuery={searchQuery}
            onSearchChange={(q) => {
              setSearchQuery(q);
              setCurrentPage(1);
            }}
          />

          {/* BARRA COMPACTA DE FILTRO DE PRECIOS Y DISPONIBILIDAD (COP) */}
          <div className="glass-mirror-card rounded-2xl p-4 sm:p-5 border border-[#50322A]/15 bg-white/80 backdrop-blur-2xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#661521]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#50322A]">
                  Filtro de Precios (COP)
                </span>
                {precioMaximo !== null ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#661521] text-white text-[10px] font-extrabold font-mono-tabular shadow-2xs">
                    Hasta {formatMoneyCOP(precioMaximo)}
                  </span>
                ) : (
                  <span className="text-[11px] text-[#50322A]/60 font-medium">
                    Todos los rangos
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-[#50322A] bg-white/80 px-3 py-1 rounded-full border border-[#50322A]/15">
                  <input
                    type="checkbox"
                    checked={soloConStock}
                    onChange={(e) => {
                      setSoloConStock(e.target.checked);
                      setCurrentPage(1);
                    }}
                    className="w-3.5 h-3.5 accent-[#661521] rounded cursor-pointer"
                  />
                  <span>Solo con stock inmediato</span>
                </label>

                {precioMaximo !== null && (
                  <button
                    type="button"
                    onClick={() => {
                      setPrecioMaximo(null);
                      setCurrentPage(1);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold text-[#661521] bg-[#661521]/10 hover:bg-[#661521] hover:text-white transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Restablecer precio</span>
                  </button>
                )}
              </div>
            </div>

            {/* Fila de Botones Rápidos + Slider de Precisión */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1 w-full max-w-full">
              {/* Botones de selección rápida */}
              <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
                {RANGOS_PRECIO.map((rango) => {
                  const isActivo =
                    (rango.max === null && precioMaximo === null) ||
                    (rango.max !== null && precioMaximo === rango.max);
                  return (
                    <button
                      key={rango.label}
                      type="button"
                      onClick={() => {
                        setPrecioMaximo(rango.max);
                        setCurrentPage(1);
                      }}
                      className={`px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold transition-all ${
                        isActivo
                          ? 'bg-[#661521] text-white shadow-xs'
                          : 'bg-white hover:bg-[#E7DED2] text-[#50322A] border border-[#50322A]/15'
                      }`}
                    >
                      {rango.label}
                    </button>
                  );
                })}
              </div>

              {/* Slider interactivo */}
              <div className="w-full md:w-64 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-[#50322A]">
                  <span>$20.000</span>
                  <span className="text-[#661521] font-mono-tabular">
                    {precioMaximo === null ? 'Máx: $1.000.000+' : formatMoneyCOP(precioMaximo)}
                  </span>
                </div>
                <input
                  type="range"
                  min={20000}
                  max={1000000}
                  step={10000}
                  value={precioMaximo ?? 1000000}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setPrecioMaximo(val >= 1000000 ? null : val);
                    setCurrentPage(1);
                  }}
                  aria-label="Ajustar precio máximo en COP"
                  className="w-full accent-[#661521] cursor-pointer h-1.5 bg-[#E7DED2] rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* VISTA DEDICADA DE CATEGORÍA CON SU ENCABEZADO Y SUBCATEGORÍAS INTERACTIVAS */}
          {selectedCategory !== 'Todas' && (
            <div className="glass-mirror-card rounded-3xl p-5 sm:p-6 border border-[#50322A]/15 bg-gradient-to-br from-white/95 via-white/85 to-[#E7DED2]/50 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#50322A]/10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#661521] text-white text-[10px] font-bold uppercase tracking-wider">
                      Categoría
                    </span>
                    <span className="text-xs font-bold text-[#D19650]">
                      {categoriaActualInfo.tagline}
                    </span>
                  </div>
                  <h2 className="font-display text-2xl font-bold text-[#50322A]">
                    {categoriaActualInfo.label}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#171717]/75 mt-1 max-w-xl">
                    {categoriaActualInfo.descripcion}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectCategory('Todas')}
                  className="self-start sm:self-auto px-4 py-2 rounded-full text-xs font-bold bg-white hover:bg-[#661521] hover:text-white text-[#50322A] border border-[#50322A]/20 transition-all flex items-center gap-1.5 shadow-2xs"
                >
                  <span>← Ver todas las colecciones</span>
                </button>
              </div>

              {/* Subcategorías Interactivas de esta Categoría */}
              {categoriaActualInfo.subcategorias.length > 0 && (
                <div className="pt-1">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-[#50322A]/70 mb-2">
                    Subcategorías disponibles:
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {categoriaActualInfo.subcategorias.map((sub) => {
                      const isSubActive =
                        selectedSubcategory.toLowerCase() === sub.toLowerCase();
                      return (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => handleSelectSubcategory(sub)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                            isSubActive
                              ? 'bg-[#661521] text-white shadow-sm ring-2 ring-[#D19650]'
                              : 'bg-white hover:bg-[#661521]/10 text-[#50322A] border border-[#50322A]/15 shadow-2xs'
                          }`}
                        >
                          {sub === 'Todas' ? '✦ Todas' : sub}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

            {/* ESTADO 1: Loading */}
            {isLoading && <ProductGridSkeleton />}

            {/* ESTADO 2: Error */}
            {error && !isLoading && (
              <div className="p-4 rounded-2xl bg-[#D19650]/15 border border-[#D19650]/45 flex items-center justify-between text-xs text-[#50322A]">
                <span>{error}</span>
                <button
                  onClick={cargarProductos}
                  className="px-3.5 py-1.5 bg-[#661521] text-white rounded-full font-bold flex items-center gap-1.5 hover:bg-[#50322A] transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Reintentar
                </button>
              </div>
            )}

            {/* ESTADO 3: Empty (Sin coincidencias) */}
            {!isLoading && productosFiltrados.length === 0 && (
              <div className="text-center py-14 px-4 rounded-[2rem] glass-mirror-card">
                <PackageX className="w-12 h-12 text-[#661521] mx-auto mb-3" />
                <h3 className="font-display text-lg font-bold text-[#50322A]">
                  No se encontraron productos
                </h3>
                <p className="text-xs text-[#171717]/70 max-w-sm mx-auto mt-1 mb-5">
                  No hay productos que coincidan con la categoría «{selectedCategory}», la subcategoría «{selectedSubcategory}» o el término «{searchQuery}».
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory('Todas');
                    setSelectedSubcategory('Todas');
                    setSearchQuery('');
                    setSoloConStock(false);
                    setPrecioMaximo(null);
                    setCurrentPage(1);
                  }}
                  className="px-5 py-2.5 bg-[#661521] text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-[#50322A] transition-all shadow-md"
                >
                  Restablecer filtros
                </button>
              </div>
            )}

            {/* ESTADO 4: Success (Grilla de Productos Paginada a 12 items por página - Ancho Completo 4 cols) */}
            {!isLoading && productosFiltrados.length > 0 && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-2 w-full max-w-full overflow-hidden">
                  {paginatedProductos.map((prod) => (
                    <ProductCard
                      key={prod.id}
                      producto={prod}
                      onOpenDetail={handleOpenDetail}
                      onQuickAdd={handleQuickAdd}
                    />
                  ))}
                </div>

                {/* CONTROLES DE PAGINACIÓN LIMPIA (Evita scroll infinito y listas pesadas) */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[#50322A]/15">
                    <span className="text-xs text-[#50322A] font-bold">
                      Mostrando{' '}
                      <strong className="text-[#661521] font-mono-tabular">
                        {(validCurrentPage - 1) * ITEMS_PER_PAGE + 1}
                      </strong>{' '}
                      -{' '}
                      <strong className="text-[#661521] font-mono-tabular">
                        {Math.min(validCurrentPage * ITEMS_PER_PAGE, productosFiltrados.length)}
                      </strong>{' '}
                      de{' '}
                      <strong className="text-[#661521] font-mono-tabular">
                        {productosFiltrados.length}
                      </strong>{' '}
                      piezas
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentPage((prev) => Math.max(1, prev - 1));
                          scrollToCatalogGridIfNeeded();
                        }}
                        disabled={validCurrentPage === 1}
                        aria-label="Página anterior"
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-[#50322A] hover:bg-[#661521] hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-all border border-[#50322A]/15 shadow-2xs flex items-center gap-1"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Anterior</span>
                      </button>

                      <div className="flex items-center gap-1 px-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => {
                          const isCurrent = num === validCurrentPage;
                          return (
                            <button
                              key={num}
                              type="button"
                              onClick={() => {
                                setCurrentPage(num);
                                scrollToCatalogGridIfNeeded();
                              }}
                              aria-label={`Ir a página ${num}`}
                              aria-current={isCurrent ? 'page' : undefined}
                              className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                                isCurrent
                                  ? 'bg-[#661521] text-white shadow-sm ring-1 ring-[#D19650]'
                                  : 'bg-white text-[#50322A] hover:bg-[#E7DED2] border border-[#50322A]/10'
                              }`}
                            >
                              {num}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setCurrentPage((prev) => Math.min(totalPages, prev + 1));
                          scrollToCatalogGridIfNeeded();
                        }}
                        disabled={validCurrentPage === totalPages}
                        aria-label="Página siguiente"
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-[#50322A] hover:bg-[#661521] hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-all border border-[#50322A]/15 shadow-2xs flex items-center gap-1"
                      >
                        <span>Siguiente</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
        </div>
      </section>

      {/* =====================================================================
          SECCIÓN 3: SELLO DE ORIGEN CERTIFICADO & CONFIANZA OMNICANAL
          ===================================================================== */}
      <section
        id="sello-origen"
        aria-label="Sello de Origen Certificado y Garantía Oficial"
        className="rounded-[2.25rem] bg-[#50322A] text-[#E7DED2] p-6 sm:p-10 lg:p-12 shadow-2xl relative overflow-hidden"
      >
        <div
          className="absolute -right-12 -bottom-12 w-72 h-72 rounded-full bg-[#D19650]/15 blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div className="relative z-10 space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/15 pb-6">
            <div className="space-y-2 max-w-2xl">
              <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#661521] text-white text-[10px] font-bold uppercase tracking-[0.2em]">
                <Award className="w-3.5 h-3.5 text-[#D19650]" />
                Sello de Origen Certificado
              </span>
              <h2 className="font-display text-2xl sm:text-4xl font-bold text-white leading-tight">
                Cada pieza cuenta con certificación de origen, artesano y control en Bodega Central.
              </h2>
              <p className="text-xs sm:text-sm text-[#E7DED2]/85 leading-relaxed">
                Trabajamos directamente con talleres de sastrería en Norte de Santander y Santander, maestros marroquineros de Vélez y comunidades tejedoras Wayuu y de Mompox.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href="/nosotros"
                className="px-5 py-3 rounded-full bg-[#D19650] hover:bg-[#b87f3d] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-lg"
              >
                Conocer Historia de FORMA →
              </a>
              <a
                href="/soporte"
                className="px-5 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/25 text-white text-xs font-bold uppercase tracking-wider transition-all"
              >
                Centro de Soporte & Envíos
              </a>
            </div>
          </div>

          {/* 4 Pilares del Sello de Origen Certificado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md space-y-1.5">
              <div className="flex items-center gap-2 text-[#D19650] font-bold text-xs uppercase tracking-wider">
                <Award className="w-4 h-4" />
                <span>01. Sello de Origen</span>
              </div>
              <h3 className="font-display text-base font-bold text-white">
                Autenticidad Verificada
              </h3>
              <p className="text-xs text-[#E7DED2]/80 leading-relaxed">
                Cada SKU registra su taller de confección, lote textil y verificación física en nuestra Bodega Central de Cúcuta.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md space-y-1.5">
              <div className="flex items-center gap-2 text-[#D19650] font-bold text-xs uppercase tracking-wider">
                <Truck className="w-4 h-4" />
                <span>02. Logística y Despacho</span>
              </div>
              <h3 className="font-display text-base font-bold text-white">
                Envío Unificado
              </h3>
              <p className="text-xs text-[#E7DED2]/80 leading-relaxed">
                Consolidamos tu pedido desde la sede con disponibilidad total para garantizar un despacho rápido y seguro en un solo paquete.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md space-y-1.5">
              <div className="flex items-center gap-2 text-[#D19650] font-bold text-xs uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" />
                <span>03. Reserva Garantizada</span>
              </div>
              <h3 className="font-display text-base font-bold text-white">
                Separación Inmediata
              </h3>
              <p className="text-xs text-[#E7DED2]/80 leading-relaxed">
                Al seleccionar transferencia bancaria, separamos tus prendas mientras confirmas tu comprobante de pago.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md space-y-1.5">
              <div className="flex items-center gap-2 text-[#D19650] font-bold text-xs uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>04. Garantía de Compra</span>
              </div>
              <h3 className="font-display text-base font-bold text-white">
                Cambios y Devoluciones
              </h3>
              <p className="text-xs text-[#E7DED2]/80 leading-relaxed">
                Garantía oficial y derecho de retracto conforme a la normativa colombiana, con atención ágil y personalizada.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Modal de Detalle 3D Espacial y Selección de Variantes */}
      <ProductDetailModal
        producto={selectedProduct}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onAddToCart={handleAddFromModal}
      />
    </div>
  );
};

export default CatalogPage;
