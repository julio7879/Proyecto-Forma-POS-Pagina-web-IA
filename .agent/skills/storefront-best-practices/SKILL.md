---
name: storefront-best-practices
description: Arquitectura de conversión y mejores prácticas de e-commerce para el Portal 1 (Storefront Público) en React + Tailwind CSS (inspirada en medusajs/medusa-agent-skills storefront-best-practices). Activar al construir o mejorar la Navbar, Landing Page, Catálogo con Sidebar de categorías, Vista de Detalle de Producto (PDP / Modal 3D), Páginas Institucionales (/nosotros, /soporte), Carrito Slide-Over y Checkout.
---

# Mejores Prácticas de Storefront y Conversión E-Commerce (`storefront-best-practices`)

Esta skill adapta de manera agnóstica para React + Tailwind CSS las reglas arquitectónicas y de optimización de conversión (CRO) de `medusajs/medusa-agent-skills` (`storefront-best-practices`), alineadas con las invariantes del Sistema POS y Tienda Web Multisede (`RN-GEN-01`, `RN-GEN-04`, `RN-WEB-*`).

---

## Cuándo Activar Esta Skill
- Al diseñar o modificar el **Portal 1 (Tienda Web Pública)**: `StorefrontLayout`, `CatalogoPage`, `CheckoutPage`, `NosotrosPage`, `SoportePage` y componentes de producto.
- Al estructurar la navegación principal, filtros de catálogo, tarjetas de oferta, modal de detalle de producto o flujo de pago web.

---

## 1. Navbar & Arquitectura de Navegación Clara e Intuitiva

La barra de navegación superior (`sticky top-0 z-40 backdrop-blur-md bg-white/85 border-b border-slate-200/80`) debe guiar al comprador sin fricción:

1. **Enlaces Directos de Primer Nivel:**
   - **Inicio** (`/`): Regreso inmediato a la portada y catálogo general.
   - **Categorías**: Acceso rápido que despliega o posiciona al usuario en el árbol de categorías del catálogo.
   - **Ofertas**: Filtro o ancla directa a la sección de productos con descuento vigente (`-20%`, `-25%`).
   - **Nosotros** (`/nosotros`): Página dedicada a la historia artesanal, sedes físicas en Colombia, impacto en comunidades y autenticidad.
   - **Soporte** (`/soporte`): Centro de ayuda al cliente con seguimiento de pedidos, política de cambios/devoluciones (5 días hábiles ley de retracto / plazos en `America/Bogota`), preguntas frecuentes (FAQ) y canales de contacto por sede.
2. **Buscador Integrado y Accesible:**
   - Input de búsqueda instantánea visible en desktop y accesible a un toque en móvil, con botón para limpiar búsqueda (`X`) y sincronización limpia con los filtros activos.
3. **Bolsa de Compras (`Cart Slide-Over Trigger`):**
   - Botón destacado en el extremo derecho con ícono de bolsa, **contador numérico de unidades** con animación sutil al cambiar y **subtotal en vivo** (en `COP` enteros devueltos por el backend o acumulados de líneas cotizadas), usando `aria-live="polite"` para anunciar cambios a lectores de pantalla.

---

## 2. Landing / Inicio Estructurado por Secciones de Alta Conversión

La página principal (`/`) debe presentar una narrativa comercial ordenada en **4 bloques claramente diferenciados**:

### Sección 1: Hero Editorial con Propuesta de Valor Clara
- Titular de alto impacto, subtítulo conciso sobre diseño y artesanía colombiana con disponibilidad multisede, y llamados a la acción primarios (*"Explorar Colección"*, *"Ver Ofertas de Temporada"*).
- Indicadores rápidos de confianza (Envío nacional seguro a municipios DANE, Cambios en sedes físicas, Pago 100% protegido).

### Sección 2: Ofertas y Descuentos Destacados (`Promotions Showcase`)
- Bloque visualmente diferenciado que destaca los productos con promoción activa.
- **Transparencia de Precios en Descuento:**
  - Badge de porcentaje de ahorro claramente visible en la esquina superior (`-20%`, `-25%`, etc. en color de alto contraste como `bg-rose-600 text-white font-bold`).
  - **Precio Anterior Tachado:** `line-through text-slate-400 text-xs tabular-nums` junto al **Precio Final Vigente** en `COP` enteros (`text-lg font-extrabold text-rose-600 tabular-nums`), permitiendo al cliente percibir el ahorro real al instante.

### Sección 3: Catálogo Principal con Sidebar Lateral Izquierdo Fijo (`Sticky`) de Categorías Ramificadas
- **Layout en Desktop (`lg+`):** Grilla asimétrica (`grid-cols-12 gap-8`) donde las primeras 3 columnas (`lg:col-span-3`) alojan un **Sidebar Lateral Izquierdo `sticky top-24 self-start`** y las 9 columnas restantes (`lg:col-span-9`) alojan la barra de ordenamiento/filtros activos y la grilla de productos (`sm:grid-cols-2 xl:grid-cols-3 gap-6`).
- **Árbol de Categorías Ramificadas (Acordeón Jerárquico):**
  - El Sidebar debe mostrar las categorías principales expandibles con sus subcategorías y conteo de productos:
    - **Ropa** (Camisas y Blusas, Pantalones, Chaquetas y Ruanas, Vestidos)
    - **Calzado** (Botas y Botines, Alpargatas y Sandalias, Casual)
    - **Accesorios** (Sombreros, Mochilas y Bolsos, Joyería Artesanal, Cinturones)
    - **Cosméticos** (Cuidado Facial, Corporal y Botánicos, Aceites Esenciales)
    - **Artesanías** (Cerámica y Barro, Tejeduría y Cestería, Madera Tallada, Decoración Hogar)
  - Filtros complementarios en el mismo Sidebar: Rango o filtro de **Solo en Oferta**, **Disponibilidad en Stock** y **Sede Física**.
- **En Móvil (`< lg`):** El Sidebar se transforma en una barra horizontal de píldoras rápidas más un botón *"Filtrar y Categorías"* que abre un Drawer limpio sin empujar el contenido hacia abajo.

### Sección 4: Sello de Origen Certificado y Confianza Legal
- Cierre editorial antes del footer que respalda la autenticidad de cada pieza (Trazabilidad de origen, Garantía de calidad, Cumplimiento Ley 1581 de Habeas Data y Estatuto del Consumidor SIC).

---

## 3. Product Detail View (PDP / Modal 3D de Producto)

Cuando el usuario abre el detalle de un producto (Modal 3D / Vista de Detalle):

1. **Cero Scrollbars Internos Cortados:**
   - En pantallas de escritorio (`lg+`), el modal ocupa una proporción panorámica equilibrada (`max-w-5xl w-full rounded-3xl overflow-hidden`) distribuida en **3 columnas armónicas** sin barras de desplazamiento vertical internas que oculten información crítica.
2. **Columna Izquierda (Narrativa, Identidad y CTA Siempre Visible):**
   - Categoría y Badge de Origen / Descuento.
   - Título del producto y código `SKU` en tipografía monoespaciada (`font-mono text-xs`).
   - Descripción curada del producto (con límite limpio de líneas para no desbordar la altura).
   - **Botón Principal de Compra ("Agregar a la Bolsa")** y selector de cantidad **siempre visibles sin hacer scroll**, con feedback instantáneo ("¡Agregado a tu bolsa!").
3. **Columna Central (Escenario Protagonista 3D):**
   - Imagen de alta resolución centrada con efecto de levitación/rotación suave al movimiento del cursor, **sombra de piso realista** (`radial-gradient` elíptico debajo del objeto) y controles de zoom/cámara limpios en la base.
4. **Columna Derecha (Precio, Variantes y Disponibilidad Multisede):**
   - Bloque de precio en `COP` enteros (mostrando precio tachado y badge `% OFF` si aplica).
   - **Selector de Tallas Circular / Píldora:** Botones táctiles (`min-w-[44px] h-11 rounded-full`) con estado activo de alto contraste (`bg-slate-900 text-white`) y estado agotado deshabilitado con línea diagonal.
   - **Selector de Color:** Círculos cromáticos con anillo de selección (`ring-2 ring-offset-2 ring-slate-900`) y etiqueta del nombre del color seleccionado.
   - **Disponibilidad por Sede Física en Tiempo Real:** Lista clara de sedes (ej. Sede Norte, Sede Centro, Sede Sur, Bodega Central) con indicador semafórico (`En stock: X uds` en verde, `Últimas unidades` en ámbar, `Agotado` en gris) que se actualiza al cambiar de variante.

---

## 4. Cart Drawer (Bolsa Slide-Over) & Checkout Idempotente

1. **Cero Cálculo Financiero en Cliente (`RN-GEN-01` y `RN-GEN-04`):**
   - El frontend **nunca** multiplica `precio * cantidad` para efectos transaccionales ni calcula IVA o prorrateos en el navegador.
   - En el Checkout, toda modificación de líneas, cupón de descuento o municipio de destino dispara la cotización al backend (`POST /api/pedidos/cotizar`) y muestra fielmente los enteros `COP` retornados (`subtotal`, `descuentoTotal`, `impuestoTotal`, `costoEnvio`, `total`).
2. **Secuencia Lógica de Dependencias en Checkout:**
   - **Paso 1: Identificación y Destino DANE:** Selector de Departamento y Municipio con código DANE oficial (o selección de Retiro en Sede Física) **antes** de confirmar el costo de envío.
   - **Paso 2: Cotización Verificada por Servidor:** Resumen transparente línea por línea en `COP` enteros.
   - **Paso 3: Método de Pago y Confirmación con `Idempotency-Key`:** Generación de clave UUID v4 única por intento de compra (`Idempotency-Key`) para evitar cobros o pedidos duplicados ante doble clic o micro-cortes de red (`RN-GEN-08`).
