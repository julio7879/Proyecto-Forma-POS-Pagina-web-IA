# GUÍA MAESTRA DE DISEÑO Y SISTEMA VISUAL: REAL LIQUID GLASS ESPEJO (v2.1)
*Sistema POS Multisede & Tienda Web E-Commerce Forma*
*Dirección de Arte y Motion: Skill Frontend-Design (Claude / Anthropic)*

---

## 1. Filosofía Estética: El Vidrio Líquido como Lente de Espejo

El efecto **Real Liquid Glass** no es una caja semitransparente con desenfoque estático. Para que el vidrio parezca **vidrio y espejo real**, requiere tres condiciones físicas fundamentales:

1. **Un Entorno Vivo en el Fondo (Ambient Motion Canvas):**
   El vidrio solo refracta si hay elementos orgánicos moviéndose detrás de él. El sistema incorpora un lienzo con orbes líquidos fluidos (tonos suaves no invasivos: melocotón pastel, cian cielo, lavanda y champán) y burbujas de cristal translúcido que ascienden suavemente con trayectoria orgánica.
2. **Reflejo Especular Superficial (Mirror Sheen):**
   Una capa diagonal de luz cenital con gradiente radial (`rgba(255, 255, 255, 0.45) \to 0%`) que simula la curvatura de un cristal pulido como el de un reloj o una pantalla Apple.
3. **Bisel y Refracción Fresnel:**
   Borde superior de 1.5px blanco brillante (`rgba(255, 255, 255, 0.95)`), bisel interior reflectivo (`inset 0 1.5px 2px`) y desenfoque volumétrico profundo (`backdrop-filter: blur(48px) saturate(210%) contrast(108%)`).

---

## 2. Identidad Tipográfica Oficial: Boutique Clásica Alta Costura

Seleccionada y ratificada para definir la elegancia artesanal y moda contemporánea de la marca Forma:

| Función | Familia Tipográfica | Pesos | Uso Específico |
| :--- | :--- | :--- | :--- |
| **Titulares & Logomarca** | `Playfair Display` (Serif de alto contraste) | `600 SemiBold`, `800 Bold`, `Italic` | H1, H2, títulos de colecciones y marcas editoriales |
| **Cuerpo & UI** | `Plus Jakarta Sans` (Neo-grotesque geométrica) | `400 Regular`, `500 Medium`, `600 SemiBold` | Botones, formularios, inputs de autenticación, descripciones |
| **Moneda & SKUs** | `JetBrains Mono` (Monoespaciada limpia) | `400 Regular`, `700 Bold` | Precios en COP (`$189.000 COP`), SKUs inmutables (`RN-CAT-03`), consecutivo POS |

---

## 3. Paleta de Colores y las 3 Personalidades Cromáticas

Erradicamos por completo el azul eléctrico agresivo (`#4F46E5`) y los neones estridentes. La paleta adopta tres personalidades de cristal diferenciadas según el contexto de uso:

### 3.1. Las Tres Personalidades de Cristal Líquido:
1. **Acceso & Autenticación — *Perla Especular (Ethereal Pearl Mirror)*:**
   - Cristal translúcido puro con reflejo especular blanco (`rgba(255,255,255,0.95)`), fondo etéreo con refracción óptica y botón primario en *Midnight Obsidian Navy* (`#1A2138` a `#0D1322`).
2. **Storefront E-Commerce — *Champán Seda (Champagne Silk Mirror)*:**
   - Cristal satinado cálido con reflejos dorados tenues (`rgba(254,243,199,0.16)`), microinteracciones de card, semáforo cualitativo de stock (`RN-WEB-02`) y badge para cosméticos (`CA-31`).
3. **Terminal POS Mostrador — *Obsidiana Ahumada Oscura (Smoked Obsidian Dark Mirror)*:**
   - Cristal oscuro de alta densidad (`rgba(15, 23, 42, 0.88)` con acentos cian glaciar), diseñado específicamente para la pantalla de mostrador de 1024×768 sin scroll vertical (`CA-53`), keypad táctil y tickets térmicos.

| Token Semántico | Valor Hex / Gradiente | Uso en el Sistema | Carácter Visual |
| :--- | :--- | :--- | :--- |
| **Canvas Abisal** | `#0B0E17` a `#07090E` | Fondo ambiental profundo nocturno | Calma óptica, profundidad infinita |
| **Orbe Melocotón** | `#FBCFE8` a `#F472B6` | Luz ambiental cálida en el fondo | Suavidad humana, acogedor |
| **Orbe Cian Cielo** | `#BAE6FD` a `#38BDF8` | Luz ambiental etérea en el fondo | Frescura y tecnología sutil |
| **Orbe Lavanda** | `#DDD6FE` a `#818CF8` | Luz ambiental lateral | Distinción editorial |
| **Orbe Champán** | `#FEF3C7` a `#FBBF24` | Luz ambiental inferior | Calidez de orfebrería y artesanía |
| **Obsidian Navy** | `#1A2138` $\to$ `#0D1322` | Botones de compra y CTAs principales | Lujo discreto, cero invasivo |
| **Esmeralda Stock** | `#059669` / `#10B981` | Insignia cualitativa de stock disponible | Confianza y claridad |

---

## 4. Fórmula Física CSS de Real Liquid Glass Espejo

```css
/* =========================================================================
   FÍSICA REAL LIQUID GLASS ESPEJO
   ========================================================================= */

.mirror-liquid-glass {
  position: relative;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.32) 0%,
    rgba(255, 255, 255, 0.08) 45%,
    rgba(255, 255, 255, 0.16) 100%
  );
  backdrop-filter: blur(48px) saturate(210%) contrast(108%);
  -webkit-backdrop-filter: blur(48px) saturate(210%) contrast(108%);
  border-radius: 28px;
  border: 1px solid rgba(255, 255, 255, 0.42);
  box-shadow: 
    /* Bisel Superior Especular (Luz de Espejo) */
    inset 0 1.5px 2px 0 rgba(255, 255, 255, 0.95),
    /* Bisel Inferior */
    inset 0 -1.5px 2px 0 rgba(255, 255, 255, 0.20),
    /* Brillo Interno Volumétrico */
    inset 0 0 25px 0 rgba(255, 255, 255, 0.12),
    /* Sombras Físicas Proyectadas */
    0 10px 25px -5px rgba(0, 0, 0, 0.25),
    0 25px 50px -12px rgba(0, 0, 0, 0.40);
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Capa de Reflejo Especular Diagonal (Efecto Espejo Curvo) */
.mirror-liquid-glass::before {
  content: '';
  position: absolute;
  top: -60%;
  left: -60%;
  width: 220%;
  height: 220%;
  background: radial-gradient(
    circle at 35% 25%,
    rgba(255, 255, 255, 0.45) 0%,
    rgba(255, 255, 255, 0.12) 30%,
    rgba(255, 255, 255, 0) 55%
  );
  pointer-events: none;
  transform: rotate(-15deg);
  transition: transform 0.6s ease-out;
}

.mirror-liquid-glass:hover::before {
  transform: rotate(-12deg) translate(20px, 20px);
}

/* Cápsula de Entrada Translúcida */
.capsule-input {
  background: rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.45);
  border-radius: 9999px;
  box-shadow: 
    inset 0 1px 2px rgba(255, 255, 255, 0.6),
    0 4px 12px rgba(0, 0, 0, 0.08);
}
```

---

## 5. Animaciones y Dinámica Ambiental (Sin Saltos Raros)

- **Orbes Fluidos en Movimiento:** Animación continua de 18 a 26 segundos con deformación sutil (`scale(1) \to scale(1.12)` y traslaciones suaves de 40 a 60px) en bucle alterno.
- **Burbujas Ascendentes:** Esferas translúcidas con punto de luz interno que emergen desde el fondo y suben a diferentes velocidades (14s a 22s), desapareciendo suavemente al llegar a la cima.
- **Micro-reacciones al Cursor:** El reflejo especular reacciona suavemente al puntero del mouse sin distorsionar el contenido.

---

## 6. Aplicación a los Componentes Aprobados del Sprint 1

1. **Vistas de Autenticación (Login / Registro):**
   - Tarjeta centrada `mirror-liquid-glass` sobre el lienzo de orbes líquidos.
   - Botón de envío en Obsidian Navy y botón Google OAuth en cápsula esmerilada.
2. **Storefront Bento Grid Hero:**
   - Panel asimétrico con la fotografía editorial de la *Chaqueta Denim Artesanal* reflejando la luz del cristal.
   - Píldoras de categoría (*Ropa, Accesorios, Cosméticos, Artesanías*) con bisel de espejo.
   - Badge de inventario en vivo multisede.
3. **Terminal POS Mostrador (CA-53):**
   - Paneles táctiles de cristal espejo a resolución 1024×768 sin scroll vertical.
   - Botones numéricos y de billetes rápidos con bisel reflectivo de alta precisión táctil.
