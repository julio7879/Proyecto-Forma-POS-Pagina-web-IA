# SISTEMA DE DISEÑO Y TOKENS VISUALES (design.md)

> **Tokens del Storefront.** La UX la manda ARQ-07; el Admin se rige por ARQ-08. Ver `docs/vault/00-GOBERNANZA/DISENO-SSOT.md`.
*Tokens Oficiales, Guía de Estilos y Especificaciones Apple Liquid Glass para Sistema POS & Tienda Web v2.1*
*Basado en Stitch CLI, Obsidian Vault (ARQ-06), hechos.md y brief.md*

---

## 1. Fundamentos y Tokens de Color

### A. Paleta Semántica Núcleo (Apple Liquid Glass)
| Token | Valor Hex / Tailwind | Uso Semántico | Contraste WCAG 2.1 |
| :--- | :--- | :--- | :--- |
| `color-primary` | `#4F46E5` (`indigo-600`) | Acciones principales, botones primarios, focus rings | $\ge 4.6:1$ sobre blanco |
| `color-primary-hover` | `#4338CA` (`indigo-700`) | Estado hover de botones primarios | $\ge 5.8:1$ sobre blanco |
| `color-primary-subtle` | `rgba(79, 70, 229, 0.12)` (`indigo-500/10`) | Fondos de badges activos, halos de foco | N/A (decorativo) |
| `color-bg-light` | `#F5F5F7` (Apple Light Gray) | Fondo de canvas en modo claro | Base neutral |
| `color-bg-dark` | `#020617` (`slate-950`) | Fondo de canvas en modo oscuro | Base oscura profunda |
| `color-surface-glass-light` | `rgba(255, 255, 255, 0.75)` | Paneles y tarjetas Liquid Glass (Light) | Con `backdrop-blur-xl` |
| `color-surface-glass-dark` | `rgba(15, 23, 42, 0.65)` | Paneles y tarjetas Liquid Glass (Dark) | Con `backdrop-blur-xl` |
| `color-border-glass-light` | `rgba(255, 255, 255, 0.5)` | Borde superior de tarjeta para reflejo de luz | Sutil translúcido |
| `color-border-subtle` | `rgba(226, 232, 240, 0.8)` (`slate-200/80`) | Separadores y bordes de contorno | $\ge 3:1$ vs fondo |

### B. Tokens Semánticos de Inventario (Semáforo de Sede)
| Token | Valor Hex / Tailwind | Significado en Negocio |
| :--- | :--- | :--- |
| `stock-available` | `#059669` (`emerald-600`) | Stock disponible en la sede seleccionada ($\ge 5$ un.) |
| `stock-warning` | `#D97706` (`amber-600`) | Últimas unidades disponibles ($1 \le \text{stock} \le 4$) |
| `stock-depleted` | `#E11D48` (`rose-600`) | Agotado en sede actual |
| `stock-central` | `#0284C7` (`sky-600`) | Disponible para despacho desde Bodega Central Cúcuta |

---

## 2. Tipografía Canónica
- **Familia Primaria (UI, Headings, Copys):**
  - `'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif`
  - Pesos: `400 (Regular)`, `500 (Medium)`, `600 (Semi-Bold)`, `700 (Bold)`
- **Familia Tabular Numérica (Precios COP, SKUs, Consecutivos):**
  - `'JetBrains Mono', 'SF Mono', monospace`
  - Uso: Todo precio en COP (`$189.000 COP`), SKUs de variantes (`ROP-DNM-001`), códigos de barras.

---

## 3. Elevación, Sombras Volumétricas y Radios de Borde

### A. Radios de Borde (Border Radius)
- Botones de acción y selectors: `rounded-xl` (`12px`)
- Tarjetas Bento Grid y paneles: `rounded-2xl` (`16px`)
- Modales, Drawers y Hero Cards: `rounded-3xl` (`24px`)
- Badges e indicadores de stock: `rounded-full` (`9999px`)

### B. Sombras Volumétricas Liquid Glass
- `shadow-glass`: `0 8px 32px 0 rgba(0, 0, 0, 0.08), 0 1px 2px 0 rgba(255, 255, 255, 0.3) inset`
- `shadow-glass-hover`: `0 20px 40px -15px rgba(79, 70, 229, 0.15), 0 0 1px 1px rgba(255, 255, 255, 0.5) inset`
- `shadow-primary-glow`: `0 10px 25px -5px rgba(79, 70, 229, 0.35)`

---

## 4. Transiciones y Micro-Interacciones
- **Duración estándar:** `duration-200` a `duration-300`
- **Curva de aceleración:** `cubic-bezier(0.16, 1, 0.3, 1)` (Apple ease-out)
- **Efecto Hover de Tarjeta:** `transform hover:-translate-y-1 hover:shadow-2xl transition-all duration-300`
- **Accesibilidad de Movimiento:**
  - Respeto a `@media (prefers-reduced-motion: reduce)`: las animaciones se desactivan o sustituyen por transiciones de opacidad directas.

---

## 5. Especificación de los 4 Estados Obligatorios de UI
1. **Loading State:** Esqueletos con gradiente translúcido `animate-pulse bg-slate-200/80 dark:bg-slate-800/60 rounded-2xl`. Prohibidos spinners solos en blanco.
2. **Empty State:** Panel con cristal esmerilado, icono `PackageOpen` de 48px, texto de orientación y botón primario de restablecimiento de filtros.
3. **Error State:** Banner con borde `rose-500/30`, fondo `rose-500/10`, texto legible en `rose-700 dark:rose-300`, icono `AlertCircle` y botón `refetch` con feedback.
4. **Success / Interactivo:** Actualización inmediata sin recarga de página, toasts de feedback sutiles (`bg-slate-900/90 text-white rounded-xl backdrop-blur-md`).
