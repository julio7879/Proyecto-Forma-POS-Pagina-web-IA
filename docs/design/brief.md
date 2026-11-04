# BRIEF CREATIVO DE DISEÑO UI/UX: STOREFRONT CATÁLOGO BENTO GRID (v2.1)
*Especificación de Experiencia, Arquitectura de Información y Copywriting Canónico*

---

## 1. Metadatos del Proyecto y Enfoque
- **Portal:** Tienda Web E-Commerce (`StorefrontLayout`).
- **Vista Principal:** Catálogo de Productos Bento Grid, Filtros Facetados y Carrito Flotante Rápido.
- **Atmósfera Estética:** **Apple Liquid Glass** (vidrio translúcido, difuminado volumétrico `backdrop-blur-xl`, sombras multicapa elegantes, sin clichés de IA).
- **Paleta Semántica Semilla:**
  - *Fondo Primario:* Slate 950 (`#020617`) en Dark Mode / Apple Off-White (`#F5F5F7`) en Light Mode.
  - *Vidrio Translúcido:* `bg-white/70 dark:bg-slate-900/60` con bordes sutiles `border-white/20 dark:border-slate-800/60`.
  - *Acento Primario (CTAs):* Índigo Eléctrico (`#4F46E5`, hover `#4338CA`) con halo de brillo sutil `shadow-indigo-500/25`.
  - *Semáforo de Inventario:* Esmeralda Disponible (`#059669`), Ámbar Últimas Unidades (`#D97706`), Rosa Agotado (`#E11D48`).
- **Objetivo de Rendimiento UX:** El cliente debe poder filtrar por categoría o talla, seleccionar una variante de producto y visualizar su resumen en el carrito flotante en **menos de 10 segundos**, sin recargas de página.

---

## 2. Estructura de la Vista Sección por Sección

### Sección 1: Barra de Navegación Superior (`Navbar` Storefront)
- **Logotipo:** Tipografía *Plus Jakarta Sans* / *Inter* en peso bold, con insignia sutil «POS & Web».
- **Selector de Sede de Despacho Preferente:**
  - Selector desplegable: *Sede Principal (Medellín)*, *Sede Norte (Bogotá)*, *Bodega Central (Cúcuta)*.
  - Leyenda informativa: *"Mostrando disponibilidad y tiempos de entrega para Medellín"*.
- **Barra de Búsqueda Instantánea:**
  - Input con icono de lupa (`Search`), placeholder: *"Buscar por prenda, categoría o SKU..."*.
  - Atajo visual sutil: `⌘K` o `Ctrl+K`.
- **Acciones Rápidas:**
  - Enlace / Botón de Cuenta con estado de sesión.
  - Botón de Carrito con vidrio líquido, icono `ShoppingBag` y contador dinámico (badge numérico `bg-indigo-600 text-white`).

---

### Sección 2: Hero Bento Grid Inmersivo
Cuadrícula asimétrica de 4 módulos con estética de paneles flotantes translúcidos:
1. **Hero Card Principal (2x2):**
   - Fotografía de alta resolución de la colección destacada (ej. *Chaqueta Denim Artesanal*).
   - Badge flotante de vidrio: *"Nueva Temporada 2026"*.
   - Tipografía principal clara, precio en COP: `$189.000 COP` *(IVA 19% incluido)*.
   - Botón directo de acción: «Ver Detalles».
2. **Category Switcher (1x1):**
   - Selector rápido con 4 micro-tarjetas: *Ropa*, *Accesorios*, *Cosméticos*, *Artesanías*.
3. **Live Inventory Pulse (1x1):**
   - Indicador en vivo de existencias multisede.
   - Copy: *"Stock sincronizado en tiempo real entre Cúcuta, Medellín y Bogotá"*.
4. **Beneficio y Garantía Legal Card (2x1):**
   - Icono `ShieldCheck` + `Truck`.
   - Copy exacto: *"5 días hábiles para devoluciones web | 30 días de garantía directa"*.

---

### Sección 3: Catálogo Facetado con Tarjetas Liquid Glass
- **Panel de Filtros (Sidebar o Drawer en Móvil):**
  - *Categorías:* Ropa, Accesorios, Cosméticos, Artesanías.
  - *Tallas:* `S`, `M`, `L`, `XL`.
  - *Colores:* Negro Azabache, Blanco Hueso, Azul Índigo, Verde Oliva, Terracota Natural.
  - *Disponibilidad por Sede:* Checkbox por cada sede física.
  - *Rango de Precio:* Filtro numérico entero COP (`$30.000 COP` a `$350.000 COP`).
- **Grilla de Tarjetas de Producto (Responsive 1 col móvil -> 2 cols tablet -> 3-4 cols desktop):**
  - *Contenedor:* `bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl`.
  - *Imagen del Producto:* Relación de aspecto 4:5, esquinas redondeadas `rounded-xl`, zoom suave en hover.
  - *Badges Semánticos:*
    - Si stock $\ge 5$: Badge verde «Disponible en Medellín».
    - Si stock entre 1 y 4: Badge ámbar «¡Últimas 3 unidades!».
    - Si stock local 0 pero hay en Cúcuta: Badge azul «Disponible desde Bodega Central».
  - *Información del Producto:*
    - Categoría en mayúscula sutil (`text-xs font-semibold text-indigo-600 dark:text-indigo-400 tracking-wider`).
    - Nombre del Producto (`text-base font-medium text-slate-900 dark:text-white`).
    - SKU tipográfico en `JetBrains Mono` (`text-xs text-slate-500`).
  - *Precio Formateado:*
    - Cifra entera en tipografía mono: `$89.900 COP` (`text-lg font-bold font-mono text-slate-900 dark:text-white`).
    - Desglose sutil: `text-xs text-slate-500` con *"IVA incluido (19%)"*.
  - *Selector Rápido de Talla:* Botones circulares compactos con estado seleccionado visible.
  - *Botón de Compra Rápida:*
    - Botón `bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-2.5 px-4 font-medium flex items-center justify-center gap-2 transition-all`.
    - Icono `ShoppingBag` de 18px.
    - Texto: «Añadir al Carrito».

---

### Sección 4: Drawer Flotante de Carrito Rápido (Side Panel Liquid Glass)
- **Activación:** Se desliza suavemente desde la derecha al añadir un producto o pulsar el icono del carrito.
- **Fondo:** `backdrop-blur-2xl bg-white/90 dark:bg-slate-950/90 border-l border-slate-200/50 dark:border-slate-800/50`.
- **Encabezado:** «Tu Carrito de Compras» con contador de unidades y botón `X` de cierre rápido con `Esc`.
- **Lista de Líneas de Pedido:**
  - Miniatura del producto, nombre, SKU y variante elegida (ej. *Talla: M | Color: Índigo*).
  - Control de cantidad (+ / -) con actualización instantánea.
  - Precio unitario y precio de línea en COP entero.
- **Resumen Financiero (Sin cálculos en cliente - valores emitidos por backend):**
  - Subtotal: `$189.000 COP`
  - IVA Estimado (19% discriminado): `$30.176 COP`
  - Costo de Envío: Calculado según zona DANE del municipio seleccionado.
  - **Total:** `$189.000 COP`
- **Garantías y Legal:**
  - Leyenda: *"Devolución garantizada dentro de los primeros 5 días hábiles posteriores a la entrega"*.
- **Botón de Checkout:**
  - «Continuar al Pago Seguro» con icono `ArrowRight`.

---

## 3. Cobertura de los 4 Estados Obligatorios de UI
1. **Loading (Esqueleto):** Skeletons con pulsación suave (`animate-pulse bg-slate-200 dark:bg-slate-800/70 rounded-2xl`) preservando el tamaño exacto de las tarjetas y el Bento Grid.
2. **Empty (Vacío):** Ilustración/Icono `PackageOpen` en panel translúcido con copy: *"No encontramos productos con los filtros seleccionados. Intenta ampliar tu búsqueda o cambiar de sede"*. Botón «Limpiar Filtros».
3. **Error:** Panel con borde rosa suave `border-rose-500/30 bg-rose-500/10`, icono `AlertCircle`, mensaje claro y botón de reintento «Recargar Catálogo».
4. **Success / Interactivo:** Transición ágil de 200ms, badges reactivos, focus rings accesibles `focus-visible:ring-2 focus-visible:ring-indigo-500`.

---

## 4. Copywriting Oficial y Cero Relleno
- Todos los títulos, descripciones y precios corresponden estrictamente a las prendas y categorías de `hechos.md` y `RF-CAT-01`:
  - *Chaqueta Denim Artesanal* (Ropa - SKU `ROP-DNM-001`) - `$189.000 COP`
  - *Camiseta Básica Algodón Pima* (Ropa - SKU `ROP-CAM-002`) - `$59.900 COP`
  - *Bolso Cuero Graso Unisex* (Accesorios - SKU `ACC-BOL-003`) - `$249.000 COP`
  - *Crema Hidratante Botánica 100ml* (Cosméticos - SKU `COS-CRM-004`) - `$45.000 COP`
  - *Mochila Tejeduría Ancestral* (Artesanías - SKU `ART-MOC-005`) - `$135.000 COP`
