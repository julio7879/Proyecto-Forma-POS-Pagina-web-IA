---
name: ui-ux-pro-max
description: Inteligencia de diseño, arquitectura de información y sistema de calidad visual para React + Tailwind CSS (inspirada en nextlevelbuilder/ui-ux-pro-max-skill). Activar siempre que @Vitral-UI diseñe, audite o refactorice layouts, componentes, modales, grillas o flujos interactivos en cualquiera de los 3 portales.
---

# Inteligencia de Diseño y Arquitectura de Información (`ui-ux-pro-max`)

Esta skill adapta el motor de razonamiento visual y la lista de verificación profesional (`pro-rules.md` y perfiles de razonamiento UI) de `nextlevelbuilder/ui-ux-pro-max-skill` para el ecosistema React + Tailwind CSS del Sistema POS y Tienda Web Multisede.

---

## Cuándo Activar Esta Skill
- Al estructurar el layout espacial de cualquier vista nueva o refactorización en `/frontend`.
- Al auditar problemas de alineación, desbordamiento de contenedores, modales rotos o espaciado inconsistente.
- Antes de entregar cualquier componente visual para asegurar cumplimiento del **Pre-Delivery UI Checklist**.

---

## 1. Reglas de Distribución Espacial: CSS Grid vs. Flexbox

| Caso de Uso | Herramienta Obligatoria | Implementación en Tailwind CSS |
| :--- | :--- | :--- |
| **Estructura Macro (2 Dimensiones)**: Layouts de página con sidebar fijo + contenido, grillas de productos, tableros de KPIs o modales de múltiples columnas. | **CSS Grid (`grid`)** | `grid grid-cols-1 lg:grid-cols-12 gap-8` o `grid-cols-[280px_1fr]` para anchos fijos de navegación lateral. |
| **Alineación Micro (1 Dimensión)**: Barras de navegación (`Navbar`), grupos de botones, píldoras de filtro, cabeceras de tarjetas o filas de precios. | **Flexbox (`flex`)** | `flex items-center justify-between gap-3`. Usar `shrink-0` en íconos y precios para evitar compresión de texto. |

### Proporción Áurea y Contenedores
- **Ancho Máximo de Lectura y Catálogo:** `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` para el Storefront; `max-w-[1600px]` para paneles densos de administración.
- **Relación Maestro-Detalle (Proporción Áurea $\approx 1 : 1.618$):**
  - En vistas con Sidebar + Catálogo: Sidebar de `260px–280px` (`lg:col-span-3`) vs. Grilla Principal (`lg:col-span-9`).
  - En Vistas de Detalle de Producto (PDP 3 columnas): Columna narrativa (`3fr`), Escenario central protagonista (`5fr`), Panel de compra y variantes (`4fr`).
- **Tarjetas de Producto Uniformes:** Forzar siempre `aspect-[4/5]` o `aspect-square` en contenedores de imagen con `overflow-hidden`, y usar `flex flex-col flex-1 justify-between` en el cuerpo de la tarjeta para que los botones o precios inferiores queden alineados horizontalmente sin importar si el título ocupa 1 o 2 líneas (`line-clamp-2`).

---

## 2. Jerarquía Visual, Tipografía y Escala de Espaciado

1. **Escala Tipográfica Consciente:**
   - **Display / Hero:** `text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08]`
   - **Títulos de Sección (H2):** `text-2xl sm:text-3xl font-bold tracking-tight text-slate-900`
   - **Títulos de Tarjeta (H3):** `text-base font-semibold text-slate-900 leading-snug`
   - **Cuerpo / Narrativa:** `text-sm sm:text-base text-slate-600 leading-relaxed max-w-prose`
   - **Metadatos / SKUs / Badges:** `text-xs font-semibold uppercase tracking-wider text-slate-400`
   - **Importes Monetarios (`COP`):** `font-extrabold tabular-nums tracking-tight` (siempre `tabular-nums` para alinear cifras verticalmente en tablas, tickets y carritos).
2. **Ritmo Vertical y Espaciado:**
   - Separación entre grandes secciones de página: `py-12 lg:py-16` (nunca amontonar secciones sin respiro ni dejar huecos muertos mayores a `96px`).
   - Separación interna de tarjetas: `p-5` o `p-6` con `gap-4`.
3. **Capas y Elevación (`z-index` Canónico):**
   - Contenido base: `z-0` / `z-10`
   - Elementos `sticky` (Sidebar de categorías, sub-barras): `z-20`
   - `Navbar` superior fija: `z-40`
   - Slide-over Drawers (Bolsa de Compras) y Modales PDP: `z-50`
   - Toasts / Alertas críticas: `z-[60]`

---

## 3. Anti-Patrones Prohibidos de UI Generada por IA ("AI Visual Slop")

Queda **terminantemente prohibido** incurrir en los siguientes defectos visuales:

1. **PROHIBIDO Elementos Flotantes en Flujo Estático que Empujen el Layout:**
   - Nunca insertar paneles desplegables, alertas, selectores o tarjetas informativas en el flujo estático del DOM si al abrirse empujan hacia abajo toda la grilla de productos o desalinean columnas vecinas.
   - Si un elemento es emergente (buscador predictivo, carrito, filtro móvil, vista rápida), debe usar posicionamiento absoluto/fijo (`fixed` o `absolute` con `z-index` controlado) o un contenedor con transición de altura prevista sin romper el layout padre.
2. **PROHIBIDO Modales con Doble Scroll Vertical Roto:**
   - Un modal (`Dialog` / Vista 3D de Producto) jamás debe tener un `overflow-y-auto` en el overlay externo que compita con otro `overflow-y-auto` interno cortando sombras o botones.
   - En pantallas `lg+`, los modales de detalle de producto deben diseñarse con **Cero Scroll Vertical** (`max-h-[88vh] overflow-hidden`), distribuyendo la información en columnas balanceadas donde el botón de acción principal ("Agregar a la Bolsa") sea **100% visible desde el primer instante**. En móvil (`< lg`), un único contenedor scrollable con footer `sticky bottom-0` para el CTA.
3. **PROHIBIDO Márgenes Muertos sin Propósito:**
   - No dejar columnas vacías, contenedores con `min-h-[600px]` cuando solo tienen 3 líneas de texto, ni espacios en blanco asimétricos al final de una fila por mala configuración de alturas (`h-full` mal aplicado).
4. **PROHIBIDO Emojis como Íconos Estructurales:**
   - Usar exclusivamente íconos vectoriales SVG (`lucide-react`) con grosor de trazo consistente (`strokeWidth={1.75}` o `2`) y tamaño explícito (`w-4 h-4`, `w-5 h-5`).
5. **PROHIBIDO Gradientes Genéricos "AI Slop":**
   - Evitar gradientes neón púrpura/rosa sin relación con la identidad artesanal y comercial de la marca. Usar paletas editoriales sobrias (piedra, carbón, terracota/esmeralda de acento, blanco cálido y efecto *Apple Liquid Glass* con `backdrop-blur-md bg-white/80`).

---

## 4. Los 4 Estados Obligatorios de Todo Componente

Ninguna vista se considera terminada si solo implementa el "camino feliz" (*Happy Path*):
1. **Estado de Carga (`Skeleton` Estructural):** Esqueletos que respetan exactamente las dimensiones finales (`aspect-[4/5]`, alturas de texto) con `animate-pulse` para evitar *Cumulative Layout Shift (CLS)*.
2. **Estado Vacío (`Empty State` Accionable):** Ilustración o ícono limpio, explicación clara de por qué no hay datos (ej. *"No encontramos productos con los filtros seleccionados"*) y un botón de acción directa (*"Limpiar filtros"* o *"Explorar todo el catálogo"*).
3. **Estado de Error (`Error Boundary / Inline Retry`):** Mensaje claro en lenguaje humano (nunca volcar stacktraces ni JSON crudo) acompañado de botón de reintento (`refetch()`).
4. **Estado Interactivo / Mutación en Curso:** Feedback táctil inmediato (`active:scale-[0.99]`), `focus-visible:ring-2` accesible por teclado y bloqueo preventivo de botones (`disabled={isPending}`) durante peticiones de red.

---

## 5. Pre-Delivery Checklist (`@Vitral-UI`)
Antes de dar por completada cualquier tarea de frontend, verificar:
- [ ] ¿Se respeta `RN-GEN-01` (cero cálculos matemáticos de subtotales, impuestos o descuentos en el navegador)?
- [ ] ¿Todos los precios están formateados como enteros `COP` con `tabular-nums`?
- [ ] ¿Los modales se ven completos en desktop sin scrollbars internos rotos y con el botón de compra visible de inmediato?
- [ ] ¿No existen elementos que al aparecer empujen o deformen abruptamente el layout circundante?
- [ ] ¿El contraste de textos y badges cumple WCAG AA ($\ge 4.5:1$)?
