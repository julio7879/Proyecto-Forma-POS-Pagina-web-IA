---
name: pos-ecommerce-ux-law
description: Ley Canónica de Navegación Intuitiva, Jerarquía Visual, Páginas de Producto, Vistas de Catálogo (Grid/List), Carrito, Checkout, Rendimiento y Personalización para el Storefront FORMA (fundamentada en docs/vault/06-Arquitectura-y-Patrones/ARQ-07-Ley-Diseno-Ecommerce-Navegacion-UIUX.md). Activar obligatoriamente al maquetar, estructurar o rediseñar la Navbar, Breadcrumbs, Buscador con sugerencias, Hero Banner, Carrusel de Ofertas, Categorías y Subcategorías multinivel, Selector Grid/List, Detalle de Producto (PDP), Carrito, Checkout, Lazy Loading y Personalización.
---

# Skill: Ley Canónica de Diseño E-Commerce, Navegación y Jerarquía Visual (`pos-ecommerce-ux-law`)

Esta skill codifica y hace cumplir de forma vinculante los principios de diseño e-commerce, arquitectura de información, rendimiento técnico y ergonomía de conversión consagrados en el documento canónico `docs/vault/06-Arquitectura-y-Patrones/ARQ-07-Ley-Diseno-Ecommerce-Navegacion-UIUX.md` y sus **13 evidencias visuales normativas**.

---

## Cuándo Activar Esta Skill

- Al diseñar, maquetar o auditar la navegación del Storefront (`StorefrontLayout`, `Navbar.tsx`, `CategoryFilters.tsx`, `CatalogPage.tsx`).
- Al diseñar componentes de cabecera, migas de pan (`Breadcrumbs`), buscadores con autocompletado y menús desplegables por niveles.
- Al alternar modos de visualización de catálogo (Vista de Cuadrícula vs. Vista de Lista / Grid vs. List View).
- Al estructurar la página de inicio (`BentoGridHero.tsx`, `OffersCarousel.tsx`, indicadores de confianza, secciones de destacados/bestsellers).
- Al maquetar vistas de detalle de producto (`ProductDetailModal.tsx` o PDP), evaluando fotografía multi-ángulo, zoom, vistas 360°, descripciones persuasivas con viñetas y SEO, reseñas y testimonios.
- Al diseñar precios y promociones (formato legible, listones de "OFFER", ofertas basadas en tiempo "Only today").
- Al maquetar la cesta de compra (`CartDrawer.tsx`, `BolsaPage.tsx`) y el checkout (`CheckoutPage.tsx`), evaluando transparencia en fletes y totales, opciones de 1 paso vs. varios pasos con barras de progreso y seguridad PCI.
- Al optimizar la velocidad y rendimiento: Lazy Loading, compresión WebP/AVIF e imágenes responsivas.
- Al implementar ergonomía móvil (Click to Call, Apple Pay / Google Pay / Bre-B) y personalización predictiva de estilismo.

---

## Los 14 Mandamientos Canónicos de Diseño E-Commerce

### Mandamiento 1: Navegación Intuitiva, GPS y Búsqueda Potente (Fig. 1 y Fig. 5)
1. **Etiquetas claras y concisas:** No abrumar al comprador con opciones infinitas. Etiquetas descriptivas que comuniquen directamente el contenido.
2. **Migas de Pan (Breadcrumbs):** Son el GPS del usuario (`Inicio / Categoría / Subcategoría / Prenda`). Deben ser visibles, jerárquicas y clickeables para permitir volver en cualquier momento sin perderse.
3. **Búsqueda Potente con Búsqueda Predictiva (Autocompletar):** El buscador interno debe ser prominente, con acceso rápido, autocompletado y sugerencias de búsquedas relacionadas en tiempo real.
4. **Menús por Etiquetas y Subcategorías en Cascada:** Categorías superiores clickeables y subcategorías multinivel (ej. Tops, Bottoms $\rightarrow$ Pants, Shorts, Skirts, Leggings) que revelen la variedad sin saturar el viewport.

### Mandamiento 2: Diseño Centrado en el Usuario y Adaptación Continua
1. **El cliente es el rey:** La arquitectura debe responder a las necesidades reales de compra (ej. filtros por ocasión, tipo de prenda, tallas, disponibilidad inmediata en sede).
2. **Diseño iterativo:** Medir puntos de fricción, recoger feedback y realizar mejoras continuas en la experiencia.

### Mandamiento 3: Diseño Responsivo Estratégico (Fig. 2)
1. **Adaptabilidad automática y fluida:** El diseño debe transformarse armónicamente entre pantallas desktop (1440px), laptops (1280-1366px), tablets (768-1024px) y smartphones (360-430px).
2. **Recompensado por motores de búsqueda (SEO):** Mantener HTML semántico, velocidad de carga superior y meta-etiquetas amigables.
3. **Aumento de conversión y UX placentera:** En móvil, priorizar navegación táctil (drawer lateral, grilla de 2 columnas de productos, botones $\ge 48\text{px}$, checkout sin fricciones).

### Mandamiento 4: Jerarquía Visual y Dirección de la Mirada (Fig. 3)
1. **El tamaño enfatiza la importancia:** Los elementos más grandes captan la atención primero (imagen principal del producto $\rightarrow$ nombre y precio $\rightarrow$ selectores $\rightarrow$ reseñas/relacionados).
2. **Colores contrastantes:** Usar contrastes intencionales para dirigir la mirada hacia los elementos primarios (botones de compra, badges de oferta) vs. secundarios.
3. **Colocación estratégica:** Lo que se ubica en la parte superior izquierda se lee primero. Aprovechar este patrón natural de lectura en Z o F.

### Mandamiento 5: Coherencia de Marca y Confianza
1. **Paleta de color controlada:** Paleta uniforme basada en los tokens oficiales de FORMA (Vino `#741C2B`, Champagne `#C49A68`, Café `#50322A`, Marfil `#F5F3EF`, Blanco `#FFFFFF`).
2. **Tipografía consistente:** Jerarquía clara entre `font-serif-editorial` (títulos y marcas de lujo) y `font-sans` (Inter/Geist para lectura ágil y precios).
3. **Conjunto de UI Kit exclusivo:** Íconos coherentes, botones con bordes y sombras uniformes, micro-interacciones suaves.
4. **Tono de voz claro y conciso:** Mensajería transparente sin tecnicismos innecesarios.

### Mandamiento 6: Homepage de Alta Conversión y Primera Impresión (Fig. 4)
1. **La primera impresión importa:** El escaparate principal debe cautivar inmediatamente.
2. **Sección de Héroe clara, contundente y no invasiva:** Imagen visualmente impactante, titular conciso que transmita la propuesta de valor y un CTA destacado («Explorar Colección» / «Comprar Ahora»).
3. **Visibilidad inmediata de Ofertas (*Above the fold*):** El Hero no debe devorar el 100% de la altura vertical de la pantalla; debe permitir que la cabecera y tarjetas del carrusel de ofertas asomen de primera vista.
4. **Carrusel giratorio de destacados y bestsellers:** Secciones dinámicas con botones deslizantes y etiquetas/insignias visuales («Bestseller», «Elección del Editor», «-25% OFF»).
5. **Indicadores de confianza:** Reseñas de clientes, certificaciones de origen y logotipos de respaldo institucional para eliminar dudas antes del pago.

### Mandamiento 7: Exposición Visual de Producto y Copy Persuasivo (Fig. 6)
1. **Fotografía Multi-Ángulo y Zoom de Alta Calidad:** Miniaturas de soporte, zoom expansivo y vistas interactivas (360° o vídeos de producto en acción).
2. **Descripciones que emulan al mejor vendedor:** Destacar beneficios sobre características simples, usar verbos de acción fuertes, narrar historias envolventes, estructurar con viñetas legibles y optimizar con palabras clave SEO.

### Mandamiento 8: Precios Claros, Ofertas de Urgencia y Opiniones Sociales (Fig. 7 y Fig. 8)
1. **Precios visibles y formato coherente:** Precios finales en COP entero, precio tachado en promociones y listones de oferta ("OFFER").
2. **Ofertas basadas en tiempo:** Módulos de urgencia legítima ("Only today", cuenta regresiva) o paquetes coordinados (bundles) con descuento.
3. **Opiniones y Calificaciones de Clientes:** Prueba social visible (avatares, 1-5 estrellas, testimonios honestos) que aumentan la conversión y el SEO.
4. **Upselling y Venta Cruzada:** Secciones "Completa tu Look" o "Prendas Similares" recomendadas de forma inteligente.

### Mandamiento 9: Carrito de Compras Transparente y Sin Fricciones (Fig. 9)
1. **Minimizar distracciones y abandono:** Diseño despejado, enfocado en el objetivo de completar la compra.
2. **Transparencia total por adelantado:** Costos de envío calculados oportunamente, desglose claro de subtotal, IVA y flete. Cero cobros sorpresivos de última hora.
3. **Ergonomía mobile:** Steppers generosos y listas apiladas sin desbordamiento horizontal.

### Mandamiento 10: Checkout Optimizado (1-Paso vs. Varios Pasos) y Seguridad PCI (Fig. 10)
1. **Arquitectura de Checkout:** Elección deliberada entre Checkout en 1 Paso (ventanilla única, 2 columnas) y Checkout en Varios Pasos (wizard con barra de progreso numerada y etiquetas descriptivas).
2. **Pago para invitados (Guest Checkout):** Compra inmediata sin forzar registro previo.
3. **Seguridad y Cumplimiento PCI:** Pasarelas seguras (tarjetas, transferencias bancarias, monederos y contraentrega), tokenización estricta y cifrado de datos.

### Mandamiento 11: Filtros de Precisión y Opciones de Clasificación (Fig. 11)
1. **Filtros Multi-Criterio:** Talla (`Size`), Color, Material/Fibra textil, Rango de Precio COP y Disponibilidad por Sede.
2. **Menú Desplegable "Sort by":** Opciones indispensables: *Best sellers* (Más populares), *The best rated* (Mejor valorados), *From cheapest to most expensive* (Menor a mayor precio), *From most expensive to cheapest* (Mayor a menor precio), y *Más recientes*.

### Mandamiento 12: Flexibilidad de Catálogo: Cuadrícula vs. Lista (Fig. 12)
1. **Vista de Cuadrícula (Grid View):** Festín visual enfocado en fotografías, proporciones y comparación rápida de estilos.
2. **Vista de Lista (List View):** Vista informativa tipo menú detallado, destacando descripciones, composición textil y stock por boutique.

### Mandamiento 13: Velocidad, Carga Diferida y Optimización de Medios (Fig. 13)
1. **Cero penalización de retraso:** Cada segundo cuenta; optimizar para First Contentful Paint < 1.2s.
2. **Herramientas obligatorias de rendimiento:** Lazy loading en catálogo fuera de pantalla, compresión de imágenes sin pérdida y fuentes responsivas acordes a la resolución del cliente.

### Mandamiento 14: Optimización Móvil y Personalización "Estilista Personal"
1. **Funciones específicas móviles:** Tocar para Llamar (Click to Call) para soporte inmediato y Pago Rápido (Apple Pay, Google Pay, Bre-B).
2. **Personalización predictiva:** Recomendaciones automáticas basadas en historial y navegación, sugiriendo prendas complementarias con trato VIP.

---

## Checklist de Calidad para el Agente `@Arquitecto-UX-Storefront`

Antes de aprobar cualquier diseño o maquetación:
- [ ] ¿Las etiquetas de navegación son claras, concisas y sin duplicidades?
- [ ] ¿Existen migas de pan funcionales (GPS) que orienten la ubicación del comprador?
- [ ] ¿El buscador ofrece sugerencias predictivas y autocompletado ágil?
- [ ] ¿El Hero banner deja ver las ofertas de primera vista en laptops y tablets?
- [ ] ¿Los productos en oferta tienen insignias destacadas y precios transparentes?
- [ ] ¿La página de producto incluye galería multi-ángulo, zoom y descripciones estructuradas en viñetas con beneficios?
- [ ] ¿El catálogo ofrece filtros por talla, color, material y selector Sort By?
- [ ] ¿Existe la alternativa entre Vista en Cuadrícula y Vista en Lista?
- [ ] ¿El carrito muestra el costo total y envío por adelantado sin costos ocultos?
- [ ] ¿El checkout cuenta con opción de invitado y barra de progreso clara?
- [ ] ¿Los medios cuentan con Lazy Loading y compresión de alto rendimiento?
- [ ] ¿El layout se adapta con fluidez táctil en pantallas móviles con Tocar para Llamar y Pago Rápido?
