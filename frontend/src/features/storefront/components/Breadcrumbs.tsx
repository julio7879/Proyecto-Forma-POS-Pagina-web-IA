// frontend/src/features/storefront/components/Breadcrumbs.tsx
import React from 'react';
import { Link, useInRouterContext } from 'react-router-dom';
import { Home, ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
  isCurrent?: boolean;
}

export interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  categoria?: string;
  subcategoria?: string;
  productoNombre?: string;
  onCategoriaClick?: (categoria: string) => void;
  onSubcategoriaClick?: (subcategoria: string) => void;
  className?: string;
}

/**
 * Componente canónico de Migas de Pan (Breadcrumbs GPS de Compra)
 * Basado en ARQ-07 Ley Canónica de E-Commerce (Fig. 1 y Mandamiento 1)
 */
export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  categoria,
  subcategoria,
  productoNombre,
  onCategoriaClick,
  onSubcategoriaClick,
  className = '',
}) => {
  const inRouter = useInRouterContext();
  // Construcción automática de items si no se proveen explícitamente
  const breadcrumbItems: BreadcrumbItem[] = React.useMemo(() => {
    if (items && items.length > 0) {
      return items;
    }

    const built: BreadcrumbItem[] = [
      {
        label: 'Inicio',
        href: '/',
      },
    ];

    if (categoria && categoria !== 'Todas') {
      built.push({
        label: categoria,
        onClick: onCategoriaClick ? () => onCategoriaClick(categoria) : undefined,
        href: onCategoriaClick ? undefined : `/?categoria=${encodeURIComponent(categoria)}#catalogo-grid`,
      });
    }

    if (subcategoria && subcategoria !== 'Todas') {
      built.push({
        label: subcategoria,
        onClick: onSubcategoriaClick ? () => onSubcategoriaClick(subcategoria) : undefined,
      });
    }

    if (productoNombre) {
      built.push({
        label: productoNombre,
        isCurrent: true,
      });
    } else if (built.length > 1) {
      built[built.length - 1].isCurrent = true;
    } else {
      built[0].isCurrent = true;
    }

    return built;
  }, [items, categoria, subcategoria, productoNombre, onCategoriaClick, onSubcategoriaClick]);

  return (
    <nav
      aria-label="Migas de pan"
      className={`inline-flex items-center px-3.5 py-1.5 rounded-full bg-white/70 backdrop-blur-md border border-[#E7DED2]/80 shadow-xs text-xs text-[#50322A]/80 transition-all ${className}`}
    >
      <ol className="flex items-center flex-wrap gap-1 sm:gap-1.5 list-none m-0 p-0">
        {breadcrumbItems.map((item, index) => {
          const isFirst = index === 0;
          const isLast = index === breadcrumbItems.length - 1 || item.isCurrent;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1 sm:gap-1.5">
              {!isFirst && (
                <ChevronRight
                  className="w-3.5 h-3.5 text-[#50322A]/40 shrink-0"
                  aria-hidden="true"
                />
              )}

              {isLast ? (
                <span
                  aria-current="page"
                  className="font-bold text-[#661521] truncate max-w-[140px] sm:max-w-[260px] md:max-w-none"
                  title={item.label}
                >
                  {isFirst && <Home className="w-3.5 h-3.5 inline-block mr-1 text-[#D19650]" />}
                  {item.label}
                </span>
              ) : item.onClick ? (
                <button
                  type="button"
                  onClick={item.onClick}
                  className="hover:text-[#661521] hover:underline transition-colors flex items-center cursor-pointer font-medium"
                >
                  {isFirst && <Home className="w-3.5 h-3.5 inline-block mr-1 text-[#D19650]" />}
                  <span>{item.label}</span>
                </button>
              ) : item.href ? (
                inRouter ? (
                  <Link
                    to={item.href}
                    className="hover:text-[#661521] hover:underline transition-colors flex items-center font-medium"
                  >
                    {isFirst && <Home className="w-3.5 h-3.5 inline-block mr-1 text-[#D19650]" />}
                    <span>{item.label}</span>
                  </Link>
                ) : (
                  <a
                    href={item.href}
                    className="hover:text-[#661521] hover:underline transition-colors flex items-center font-medium"
                  >
                    {isFirst && <Home className="w-3.5 h-3.5 inline-block mr-1 text-[#D19650]" />}
                    <span>{item.label}</span>
                  </a>
                )
              ) : (
                <span className="font-medium text-[#50322A]">
                  {isFirst && <Home className="w-3.5 h-3.5 inline-block mr-1 text-[#D19650]" />}
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
