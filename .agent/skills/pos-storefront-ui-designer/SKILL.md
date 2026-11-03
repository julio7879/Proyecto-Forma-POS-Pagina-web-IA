---
name: pos-storefront-ui-designer
description: Sistema de diseño, maquetación Tailwind CSS e interfaces modernas para Storefront y Terminal POS (inspirada en frontend-design de anthropics/skills y tailwind-design-system). Activar al diseñar o maquetar componentes en frontend (React, Tailwind, React Router, TanStack Query), garantizando estética Apple Liquid Glass, accesibilidad WCAG y cero cálculo financiero en cliente.
---

# Diseñador de Interfaces y Sistema Visual (`@Vitral-UI`)

Esta skill traslada los estándares de diseño de `anthropics/skills/frontend-design` y los tokens semánticos de `tailwind-design-system` al Frontend de nuestro sistema multi-portal (Storefront Público, Terminal POS de Mostrador y Panel Administrativo).

---

## Cuándo Activar Esta Skill
- Al construir o refactorizar vistas de React (`StorefrontLayout`, `PosLayout`, `AdminLayout`).
- Al diseñar componentes de catálogo, carrito de compras, login/registro, terminal de cobro POS o tablas administrativas.
- Al asegurar que la UI sea accesible (WCAG 2.2 AA), responsiva y visualmente pulida (efecto Apple Liquid Glass, tipografía moderna, paletas contrastadas).

---

## Principios y Guardrails de Diseño

### 1. Invariante `RN-GEN-01`: Cero Lógica de Precios en el Navegador
- **El frontend solo muestra; el backend calcula y valida.**
- Prohibido calcular subtotales, aplicar fórmulas de IVA o prorratear descuentos en JavaScript del cliente.
- El carrito envía variantes y cantidades a `/api/pedidos/cotizar` o `/api/ventas/cotizar`, y renderiza únicamente los valores enteros `COP` devueltos por el servidor.
- Durante mutaciones (`useMutation`), deshabilitar botones (`disabled={isPending}`) y mostrar estados de carga para prevenir dobles envíos.

### 2. Estética "Apple Liquid Glass" (Diseño Sofisticado)
- **Fondos y Paneles:** Uso de fondos difuminados (`backdrop-blur-md bg-white/70 dark:bg-slate-900/70`), bordes sutiles (`border border-slate-200/50 dark:border-slate-800/50`) y sombras suaves (`shadow-sm`, `shadow-xl` para modales).
- **Tipografía Intencional:** Jerarquía clara con `font-sans` (Inter o Geist), pesos consistentes (`font-semibold` para títulos, `text-sm text-slate-500` para metadatos).
- **Espaciado y Respiración:** Densidad cómoda en el Storefront (`gap-6`, `p-6`), y densidad táctil optimizada en la Terminal POS para pantallas táctiles de mostrador (botones de mínimo $48 \times 48\text{px}$).

### 3. Estados Completos de Interfaz
Todo componente o pantalla debe cubrir obligatoriamente los 4 estados:
1. **Loading (Esqueleto):** Skeletons animados (`animate-pulse bg-slate-200 rounded`) en lugar de spinners flotantes sin estructura.
2. **Empty (Vacío):** Mensajes amigables con ilustración o ícono (`No hay productos en esta categoría`, `Carrito vacío`).
3. **Error:** Alertas legibles con mensaje de backend y botón de reintento (`refetch`).
4. **Success / Interactivo:** Micro-interacciones sutiles en hover, focus visible (`focus-visible:ring-2 focus-visible:ring-primary`) y transiciones suaves (`transition-all duration-200`).

### 4. Accesibilidad y Formularios Confiables
- Todo campo de entrada (`input`, `select`) debe tener su etiqueta vinculada (`label htmlFor` o `aria-label`).
- En formularios de registro (ej. Ley 1581 de protección de datos personales), el checkbox debe ser explícito, no pre-marcado, con link modal a la política de tratamiento de datos.
- Manejo estricto de errores de validación Zod mapeados a los campos respectivos (`error.detalles`).
