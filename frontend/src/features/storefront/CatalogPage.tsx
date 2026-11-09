// frontend/src/features/storefront/CatalogPage.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useInRouterContext } from 'react-router-dom';
import { Breadcrumbs } from './components/Breadcrumbs';
import {
  ProductoDTO,
  VarianteDTO,
  getProductosCatalogo,
  PRODUCTOS_SEMILLA,
  formatMoneyCOP,
} from './services/catalogService';
import { CategoryFilters, CategoryFilterType } from './components/CategoryFilters';
import { ProductCard } from './components/ProductCard';
import { CatalogToolbar, ViewMode, SortOption } from './components/CatalogToolbar';
import { ProductDetailModal } from './components/ProductDetailModal';
import { ProductGridSkeleton } from './components/ProductGridSkeleton';
import { BentoGridHero } from './components/BentoGridHero';
import { OffersCarousel } from './components/OffersCarousel';
import { PROMOCIONES_EVENT } from './services/promocionesStore';
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
    subcategorias: ['Todas', 'Camisas', 'Pantalones', 'Vestidos', 'Chaquetas'],
    icono: '👔',
  },
  {
    id: 'Calzado',
    label: 'Calzado Artesanal',
    tagline: 'Cuero genuino & horma confort',
    descripcion:
      'Botines, mocasines, sandalias y calzado elaborado a mano en cuero genuino por maestros zapateros de la región.',
    subcategorias: ['Todas', 'Botines', 'Sandalias', 'Mocasines'],
    icono: '👞',
  },
  {
    id: 'Accesorios',
    label: 'Accesorios & Marroquinería',
    tagline: 'Bolsos, cinturones & joyería',
    descripcion:
      'Marroquinería fina en cuero vacuno, bolsos estructurados, cinturones, gorras urbanas y joyería de autor.',
    subcategorias: ['Todas', 'Bolsos', 'Cinturones', 'Gorras', 'Joyería'],
    icono: '👜',
  },
  {
    id: 'Cosméticos',
    label: 'Cosméticos Botánicos',
    tagline: 'Extractos andinos & dermo',
    descripcion:
      'Fórmulas botánicas dermo-cosméticas con extractos andinos para el cuidado facial y corporal. Por higiene y seguridad son de uso personal sin cambio.',
    subcategorias: ['Todas', 'Sérums', 'Cremas', 'Aceites', 'Tónicos'],
    icono: '🌿',
  },
  {
    id: 'Artesanías',
    label: 'Artesanías de Origen',
    tagline: 'Wayuu, Boyacá & tejeduría',
    descripcion:
      'Mochilas Wayuu tradicionales, ruanas de lana virgen y sombreros aguadeños finos elaborados por maestros artesanos.',
    subcategorias: ['Todas', 'Wayuu', 'Sombreros', 'Ruanas'],
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
  if (target.endsWith('es') && !target.endsWith('tes') && !target.endsWith('ces') && !target.endsWith('les')) {
    stem = target.slice(0, -2);
  } else if (target.endsWith('s')) {
    stem = target.slice(0, -1);
  }

  const haystack = normalizarTexto(`${prod.nombre} ${prod.descripcion} ${prod.slug} ${prod.categoriaNombre}`);

  // Compatibilidad si la subcategoría es una categoría principal
  if (target === 'ropa' || stem === 'ropa') return prod.categoriaNombre === 'Ropa';
  if (target === 'calzado' || stem === 'calzado') return prod.categoriaNombre === 'Calzado';
  if (target === 'accesorios' || target === 'accesorio' || stem === 'accesori') return prod.categoriaNombre === 'Accesorios';
  if (target === 'cosmeticos' || target === 'cosmetico' || stem === 'cosmetic') return prod.categoriaNombre === 'Cosméticos';
  if (target === 'artesanias' || target === 'artesania' || stem === 'artesani') return prod.categoriaNombre === 'Artesanías';

  // Ropa
  if (stem === 'camisa' || target === 'camisas' || target === 'camisa') {
    return (
      haystack.includes('camisa') ||
      haystack.includes('camiseta') ||
      haystack.includes('blusa') ||
      haystack.includes('polo') ||
      haystack.includes('top')
    );
  }
  if (stem === 'pantalon' || target === 'pantalones' || target === 'pantalon') {
    return (
      haystack.includes('pantalon') ||
      haystack.includes('pantalón') ||
      haystack.includes('jean') ||
      haystack.includes('wide leg') ||
      haystack.includes('jogger') ||
      haystack.includes('bermuda') ||
      haystack.includes('falda')
    );
  }
  if (stem === 'vestido' || target === 'vestidos' || target === 'vestido') {
    return haystack.includes('vestido') || haystack.includes('enterizo');
  }
  if (stem === 'chaqueta' || target === 'chaquetas' || target === 'chaqueta') {
    return (
      haystack.includes('chaqueta') ||
      haystack.includes('blazer') ||
      haystack.includes('cardigan') ||
      haystack.includes('chaleco') ||
      haystack.includes('gabardina') ||
      haystack.includes('biker') ||
      haystack.includes('puffer') ||
      haystack.includes('buzo')
    );
  }

  // Calzado
  if (stem === 'botin' || target === 'botines' || target === 'botin') {
    return (
      haystack.includes('botin') ||
      haystack.includes('botines') ||
      haystack.includes('bota') ||
      haystack.includes('chelsea')
    );
  }
  if (stem === 'sandalia' || target === 'sandalias' || target === 'sandalia') {
    return haystack.includes('sandalia') || haystack.includes('sandalias');
  }
  if (stem === 'mocasin' || target === 'mocasines' || target === 'mocasin') {
    return (
      haystack.includes('mocasin') ||
      haystack.includes('mocasines') ||
      haystack.includes('oxford') ||
      haystack.includes('penny') ||
      haystack.includes('zapato')
    );
  }

  // Accesorios
  if (stem === 'bolso' || target === 'bolsos' || target === 'bolso') {
    return (
      haystack.includes('bolso') ||
      haystack.includes('mochila') ||
      haystack.includes('tote') ||
      haystack.includes('crossbody') ||
      haystack.includes('billetera') ||
      haystack.includes('bandolera') ||
      haystack.includes('cartera') ||
      haystack.includes('marroquineria')
    );
  }
  if (stem === 'cinturon' || target === 'cinturones' || target === 'cinturon') {
    return haystack.includes('cinturon') || haystack.includes('cinturón');
  }
  if (stem === 'gorra' || target === 'gorras' || target === 'gorra') {
    return (
      haystack.includes('gorra') ||
      haystack.includes('snapback') ||
      haystack.includes('sombrero') ||
      haystack.includes('fedora') ||
      haystack.includes('visera')
    );
  }
  if (stem === 'joyeria' || stem === 'joya' || target === 'joyeria' || target === 'joyas') {
    return (
      haystack.includes('collar') ||
      haystack.includes('arete') ||
      haystack.includes('argolla') ||
      haystack.includes('reloj') ||
      haystack.includes('cadena') ||
      haystack.includes('oro') ||
      haystack.includes('plata') ||
      haystack.includes('joya')
    );
  }
  if (stem === 'gafa' || target === 'gafas' || target === 'gafa') {
    return haystack.includes('gafa') || haystack.includes('lente') || haystack.includes('polarizada');
  }

  // Cosméticos
  if (stem === 'serum' || target === 'serums' || target === 'serum') {
    return haystack.includes('serum') || haystack.includes('sérum') || haystack.includes('suero');
  }
  if (stem === 'crema' || target === 'cremas' || target === 'crema') {
    return (
      haystack.includes('crema') ||
      haystack.includes('mascarilla') ||
      haystack.includes('balsamo') ||
      haystack.includes('bálsamo') ||
      haystack.includes('limpiador') ||
      haystack.includes('hidratante')
    );
  }
  if (target === 'aceites' || target === 'aceite' || stem === 'aceite' || stem === 'aceit') {
    return (
      haystack.includes('aceite') ||
      haystack.includes('oil') ||
      haystack.includes('labial') ||
      haystack.includes('sacha inchi')
    );
  }
  if (stem === 'tonico' || target === 'tonicos' || target === 'tonico') {
    return (
      haystack.includes('tonico') ||
      haystack.includes('tónico') ||
      haystack.includes('exfoliante') ||
      haystack.includes('bruma') ||
      haystack.includes('agua micelar') ||
      haystack.includes('fijador') ||
      haystack.includes('hidrolato')
    );
  }

  // Artesanías
  if (stem === 'wayuu' || target === 'wayuu') {
    return haystack.includes('wayuu') || haystack.includes('mochila');
  }
  if (stem === 'sombrero' || target === 'sombreros' || target === 'sombrero') {
    return haystack.includes('sombrero') || haystack.includes('aguadeño') || haystack.includes('aguadeno');
  }
  if (stem === 'ruana' || target === 'ruanas' || target === 'ruana') {
    return haystack.includes('ruana') || haystack.includes('lana') || haystack.includes('poncho');
  }

  return haystack.includes(target) || haystack.includes(stem);
};

export interface CatalogPageCoreProps {
  searchParams?: URLSearchParams;
  onUpdateSearchParams?: (updater: (prev: URLSearchParams) => URLSearchParams) => void;
}

export const CatalogPageCore: React.FC<CatalogPageCoreProps> = ({
  searchParams: propSearchParams,
  onUpdateSearchParams,
}) => {
  const { addItem, sedeActiva } = useStorefrontCart();

  const [productos, setProductos] = useState<ProductoDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de navegación por categoría y subcategoría
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilterType>('Todas');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('Todas');

  // Estados de visualización y ordenamiento (Fig. 11 y Fig. 12 ARQ-07)
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('popular');

  // Estados de filtros interactivos
  const [searchQuery, setSearchQuery] = useState('');
  const [soloConStock, setSoloConStock] = useState(false);
  const [precioMaximo, setPrecioMaximo] = useState<number | null>(null);
  const [selectedTalla, setSelectedTalla] = useState<string | undefined>(undefined);
  const [selectedColor, setSelectedColor] = useState<string | undefined>(undefined);
  const [showFilterPanel, setShowFilterPanel] = useState<boolean>(false);

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
    window.addEventListener(PROMOCIONES_EVENT, cargarProductos);
    window.addEventListener('storage', cargarProductos);
    return () => {
      window.removeEventListener(PROMOCIONES_EVENT, cargarProductos);
      window.removeEventListener('storage', cargarProductos);
    };
  }, []);

  // Sincronizar parámetros de búsqueda o categoría desde la URL (Fig. 1 ARQ-07)
  useEffect(() => {
    const currentParams =
      propSearchParams ||
      new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');

    const qParam = currentParams.get('q');
    const catParam = currentParams.get('categoria');
    const subcatParam = currentParams.get('subcategoria');
    const prodParam = currentParams.get('producto');

    if (qParam !== null && qParam !== undefined) {
      setSearchQuery(qParam);
      setCurrentPage(1);
    }

    if (catParam) {
      const matchCat = (
        ['Todas', 'Ropa', 'Calzado', 'Accesorios', 'Cosméticos', 'Artesanías'] as CategoryFilterType[]
      ).find((c) => normalizarTexto(c) === normalizarTexto(catParam));

      if (matchCat) {
        setSelectedCategory(matchCat);

        if (subcatParam) {
          const catBranch = ARBOL_CATEGORIAS.find((c) => c.id === matchCat);
          const matchSub = catBranch?.subcategorias.find(
            (s) => normalizarTexto(s) === normalizarTexto(subcatParam)
          );
          setSelectedSubcategory(matchSub || subcatParam);
        } else {
          setSelectedSubcategory('Todas');
        }
        setCurrentPage(1);
      }
    } else {
      setSelectedCategory('Todas');
      setSelectedSubcategory('Todas');
    }

    if (prodParam) {
      const prods = productos.length > 0 ? productos : PRODUCTOS_SEMILLA;
      const prodEncontrado = prods.find(
        (p) => String(p.id) === prodParam || p.slug === prodParam
      );
      if (prodEncontrado) {
        setSelectedProduct(prodEncontrado);
        setIsModalOpen(true);
      }
    }
  }, [propSearchParams, productos]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  }, []);

  const handleOpenDetail = useCallback((producto: ProductoDTO) => {
    setSelectedProduct(producto);
    setIsModalOpen(true);
  }, []);

  const handleSelectCategory = useCallback(
    (cat: CategoryFilterType) => {
      setSelectedCategory(cat);
      setSelectedSubcategory('Todas');
      setSelectedTalla(undefined);
      setSelectedColor(undefined);
      setCurrentPage(1);

      if (onUpdateSearchParams) {
        onUpdateSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          if (cat === 'Todas') {
            next.delete('categoria');
            next.delete('subcategoria');
          } else {
            next.set('categoria', cat);
            next.delete('subcategoria');
          }
          return next;
        });
      }
    },
    [onUpdateSearchParams]
  );

  const handleSelectSubcategory = useCallback(
    (sub: string) => {
      // Si estamos en "Todas" y se pulsa una de las categorías principales:
      const esCatPrincipal = (
        ['Ropa', 'Calzado', 'Accesorios', 'Cosméticos', 'Artesanías'] as CategoryFilterType[]
      ).find((c) => normalizarTexto(c) === normalizarTexto(sub));

      if (selectedCategory === 'Todas' && esCatPrincipal) {
        handleSelectCategory(esCatPrincipal);
        return;
      }

      setSelectedSubcategory(sub);
      setCurrentPage(1);

      if (onUpdateSearchParams) {
        onUpdateSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          if (sub === 'Todas') {
            next.delete('subcategoria');
          } else {
            next.set('subcategoria', sub);
          }
          return next;
        });
      }
    },
    [selectedCategory, handleSelectCategory, onUpdateSearchParams]
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

  // Lista dinámica de tallas disponibles en los productos del catálogo
  const tallasDisponibles = useMemo(() => {
    const prods = productos.length > 0 ? productos : PRODUCTOS_SEMILLA;
    const set = new Set<string>();
    prods.forEach((p) => {
      p.variantes.forEach((v) => {
        if (v.talla && v.talla !== 'UNI') set.add(v.talla);
      });
    });
    const ordenTallas = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '35', '36', '37', '38', '39', '40', '41', '42'];
    return Array.from(set).sort((a, b) => {
      const idxA = ordenTallas.indexOf(a);
      const idxB = ordenTallas.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [productos]);

  // Lista dinámica de colores disponibles en los productos del catálogo
  const coloresDisponibles = useMemo(() => {
    const prods = productos.length > 0 ? productos : PRODUCTOS_SEMILLA;
    const set = new Set<string>();
    prods.forEach((p) => {
      p.variantes.forEach((v) => {
        if (v.color) set.add(v.color.trim());
      });
    });
    return Array.from(set).sort();
  }, [productos]);

  // Filtrado reactivo en cliente (Categoría + Subcategoría + Texto + Stock + Rango Precio + Talla + Color) + Ordenamiento
  const productosFiltrados = useMemo(() => {
    const prods = productos.length > 0 ? productos : PRODUCTOS_SEMILLA;
    const filtrados = prods.filter((prod) => {
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

      // 6. Filtro por Talla (si está seleccionada)
      const coincideTalla =
        !selectedTalla ||
        prod.variantes.some(
          (v) => v.talla === selectedTalla && (!soloConStock || v.stockDisponible > 0)
        );

      // 7. Filtro por Color (si está seleccionado)
      const coincideColor =
        !selectedColor ||
        prod.variantes.some(
          (v) =>
            v.color &&
            normalizarTexto(v.color) === normalizarTexto(selectedColor) &&
            (!soloConStock || v.stockDisponible > 0)
        );

      return (
        coincideCategoria &&
        coincideSubcat &&
        coincideBusqueda &&
        coincideStock &&
        coincidePrecio &&
        coincideTalla &&
        coincideColor
      );
    });

    // Ordenamiento interactivo por sortBy (Fig. 11 ARQ-07)
    const ordenados = [...filtrados];
    switch (sortBy) {
      case 'price-asc':
        ordenados.sort((a, b) => {
          const pA = Math.min(...a.variantes.map((v) => v.precioVentaCop));
          const pB = Math.min(...b.variantes.map((v) => v.precioVentaCop));
          return pA - pB;
        });
        break;
      case 'price-desc':
        ordenados.sort((a, b) => {
          const pA = Math.max(...a.variantes.map((v) => v.precioVentaCop));
          const pB = Math.max(...b.variantes.map((v) => v.precioVentaCop));
          return pB - pA;
        });
        break;
      case 'recent':
        ordenados.sort((a, b) => Number(b.id) - Number(a.id));
        break;
      case 'rating':
        ordenados.sort((a, b) => b.variantes.length - a.variantes.length);
        break;
      case 'popular':
      default:
        // Mantener orden canónico de catálogo
        break;
    }

    return ordenados;
  }, [
    productos,
    selectedCategory,
    selectedSubcategory,
    searchQuery,
    soloConStock,
    precioMaximo,
    selectedTalla,
    selectedColor,
    sortBy,
  ]);

  // Cálculo de Paginación Limpia
  const totalPages = Math.max(1, Math.ceil(productosFiltrados.length / ITEMS_PER_PAGE));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedProductos = useMemo(() => {
    const start = (validCurrentPage - 1) * ITEMS_PER_PAGE;
    return productosFiltrados.slice(start, start + ITEMS_PER_PAGE);
  }, [productosFiltrados, validCurrentPage]);

  return (
    <div className="w-full space-y-5 sm:space-y-6">
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
          SECCIÓN 2: CARRUSEL INTERACTIVO DE OFERTAS & PRECIOS DE ATELIER
          ===================================================================== */}
      <OffersCarousel
        productos={productos}
        categoriaActiva={selectedCategory}
        onExplorarProducto={(productoId) => {
          const prod = (productos.length > 0 ? productos : PRODUCTOS_SEMILLA).find(
            (p) => p.id === productoId
          );
          if (prod) {
            handleOpenDetail(prod);
          }
        }}
      />

      {/* =====================================================================
          SECCIÓN 3: EXPLORADOR PRINCIPAL CON BARRA DE HERRAMIENTAS Y GRID/LIST TOGGLE
          ===================================================================== */}
      <section id="catalogo-grid" className="pt-2 scroll-mt-24 sm:scroll-mt-28 relative">
        <span id="catalogo-oficial" className="sr-only" />

        {/* Migas de Pan (Breadcrumbs GPS de Compra - Fig. 1 ARQ-07) */}
        <div className="mb-3">
          <Breadcrumbs
            categoria={selectedCategory !== 'Todas' ? selectedCategory : undefined}
            subcategoria={selectedSubcategory !== 'Todas' ? selectedSubcategory : undefined}
            onCategoriaClick={(cat) => handleSelectCategory(cat as CategoryFilterType)}
            onSubcategoriaClick={(sub) => handleSelectSubcategory(sub)}
          />
        </div>

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

        {/* Contenedor de ancho completo */}
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
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold text-[#661521] bg-[#661521]/10 hover:bg-[#661521] hover:text-white transition-colors cursor-pointer"
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
                      className={`px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
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
                  className="self-start sm:self-auto px-4 py-2 rounded-full text-xs font-bold bg-white hover:bg-[#661521] hover:text-white text-[#50322A] border border-[#50322A]/20 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
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
                          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
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

          {/* BARRA DE HERRAMIENTAS: Sort By, Toggle Grid/List y Píldoras Activas (Fig. 11 y Fig. 12 ARQ-07) */}
          <CatalogToolbar
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            totalResults={productosFiltrados.length}
            selectedCategory={selectedCategory}
            selectedSubcategory={selectedSubcategory}
            selectedTalla={selectedTalla}
            selectedColor={selectedColor}
            precioMaximo={precioMaximo}
            soloConStock={soloConStock}
            onClearTalla={() => {
              setSelectedTalla(undefined);
              setCurrentPage(1);
            }}
            onClearColor={() => {
              setSelectedColor(undefined);
              setCurrentPage(1);
            }}
            onClearPrecio={() => {
              setPrecioMaximo(null);
              setCurrentPage(1);
            }}
            onClearSubcategoria={() => {
              handleSelectSubcategory('Todas');
            }}
            onClearStock={() => {
              setSoloConStock(false);
              setCurrentPage(1);
            }}
            onClearAll={() => {
              handleSelectCategory('Todas');
              setSelectedTalla(undefined);
              setSelectedColor(undefined);
              setPrecioMaximo(null);
              setSoloConStock(false);
              setSearchQuery('');
              setCurrentPage(1);
            }}
            showFilterPanel={showFilterPanel}
            onToggleFilterPanel={() => setShowFilterPanel((prev) => !prev)}
          />

          {/* PANEL EXPANDIBLE DE FILTROS AVANZADOS (Tallas y Colores) */}
          {showFilterPanel && (
            <div className="glass-mirror-card rounded-2xl p-4 sm:p-5 border border-[#50322A]/15 bg-white/95 backdrop-blur-2xl space-y-4 animate-in fade-in duration-300 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-[#50322A]/10">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#661521]" />
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#50322A]">
                    Filtros Avanzados por Talla y Color
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFilterPanel(false)}
                  className="p-1 rounded-lg text-[#50322A] hover:bg-[#FAF6EF] transition-colors cursor-pointer"
                  title="Cerrar panel de filtros"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Selector de Tallas */}
              {tallasDisponibles.length > 0 && (
                <div className="space-y-2">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-[#50322A]/70">
                    Filtrar por Talla:
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {tallasDisponibles.map((talla) => {
                      const isSelected = selectedTalla === talla;
                      return (
                        <button
                          key={talla}
                          type="button"
                          onClick={() => {
                            setSelectedTalla(isSelected ? undefined : talla);
                            setCurrentPage(1);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer font-mono ${
                            isSelected
                              ? 'bg-[#661521] text-white shadow-xs ring-2 ring-[#D19650]'
                              : 'bg-white hover:bg-[#FAF6EF] text-[#50322A] border border-[#50322A]/15'
                          }`}
                        >
                          {talla}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Selector de Colores */}
              {coloresDisponibles.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-[#50322A]/70">
                    Filtrar por Color:
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {coloresDisponibles.map((color) => {
                      const isSelected = selectedColor === color;
                      const cLower = color.toLowerCase();
                      const swatchBg =
                        cLower.includes('blanco') ? '#FFFFFF' :
                        cLower.includes('negro') ? '#1C1311' :
                        cLower.includes('azul') || cLower.includes('índigo') ? '#1E3A8A' :
                        cLower.includes('beige') || cLower.includes('crema') || cLower.includes('hueso') ? '#E7DED2' :
                        cLower.includes('café') || cLower.includes('cafe') || cLower.includes('marrón') ? '#50322A' :
                        cLower.includes('vino') || cLower.includes('rojo') ? '#741C2B' :
                        cLower.includes('dorado') || cLower.includes('oro') ? '#C49A68' :
                        cLower.includes('verde') || cLower.includes('oliva') ? '#15803D' :
                        cLower.includes('gris') ? '#94A3B8' : '#A8A29E';
                      return (
                        <button
                          key={color}
                          type="button"
                          onClick={() => {
                            setSelectedColor(isSelected ? undefined : color);
                            setCurrentPage(1);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-[#661521] text-white shadow-xs ring-2 ring-[#D19650]'
                              : 'bg-white hover:bg-[#FAF6EF] text-[#50322A] border border-[#50322A]/15'
                          }`}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-black/25 shrink-0"
                            style={{ backgroundColor: swatchBg }}
                            aria-hidden="true"
                          />
                          <span>{color}</span>
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
                className="px-3.5 py-1.5 bg-[#661521] text-white rounded-full font-bold flex items-center gap-1.5 hover:bg-[#50322A] transition-colors cursor-pointer"
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
                No hay productos que coincidan con la categoría «{selectedCategory}», la subcategoría «{selectedSubcategory}» o los filtros seleccionados.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('Todas');
                  setSelectedSubcategory('Todas');
                  setSelectedTalla(undefined);
                  setSelectedColor(undefined);
                  setSearchQuery('');
                  setSoloConStock(false);
                  setPrecioMaximo(null);
                  setCurrentPage(1);
                }}
                className="px-5 py-2.5 bg-[#661521] text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-[#50322A] transition-all shadow-md cursor-pointer"
              >
                Restablecer filtros
              </button>
            </div>
          )}

          {/* ESTADO 4: Success (Grilla o Lista de Productos Paginada a 12 items por página) */}
          {!isLoading && productosFiltrados.length > 0 && (
            <div className="space-y-8">
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-2 w-full max-w-full overflow-hidden">
                  {paginatedProductos.map((prod) => (
                    <ProductCard
                      key={prod.id}
                      producto={prod}
                      viewMode="grid"
                      onOpenDetail={handleOpenDetail}
                      onQuickAdd={handleQuickAdd}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-4 pt-2 w-full max-w-full">
                  {paginatedProductos.map((prod) => (
                    <ProductCard
                      key={prod.id}
                      producto={prod}
                      viewMode="list"
                      onOpenDetail={handleOpenDetail}
                      onQuickAdd={handleQuickAdd}
                    />
                  ))}
                </div>
              )}

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
                      }}
                      disabled={validCurrentPage === 1}
                      aria-label="Página anterior"
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-[#50322A] hover:bg-[#661521] hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-all border border-[#50322A]/15 shadow-2xs flex items-center gap-1 cursor-pointer"
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
                            }}
                            aria-label={`Ir a página ${num}`}
                            aria-current={isCurrent ? 'page' : undefined}
                            className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
                      }}
                      disabled={validCurrentPage === totalPages}
                      aria-label="Página siguiente"
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-[#50322A] hover:bg-[#661521] hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-all border border-[#50322A]/15 shadow-2xs flex items-center gap-1 cursor-pointer"
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
          SECCIÓN 4: SELLO DE ORIGEN CERTIFICADO & CONFIANZA OMNICANAL
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

const CatalogPageRouterInner: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  return (
    <CatalogPageCore
      searchParams={searchParams}
      onUpdateSearchParams={(updater) => setSearchParams(updater, { replace: false })}
    />
  );
};

export const CatalogPage: React.FC<CatalogPageCoreProps> = (props) => {
  const inRouter = useInRouterContext();
  if (inRouter && !props.searchParams) {
    return <CatalogPageRouterInner />;
  }
  return <CatalogPageCore {...props} />;
};

export default CatalogPage;
