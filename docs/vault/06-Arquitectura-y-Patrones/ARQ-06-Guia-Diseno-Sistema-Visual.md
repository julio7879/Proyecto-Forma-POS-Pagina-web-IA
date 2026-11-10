---
id: ARQ-06
tags: [diseno, ui-ux, liquid-glass, apple-style, storefront, pos, admin]
---
# Guía Canónica de Diseño y Sistema Visual (v2.1)

> **Precedencia (F4):** Storefront = ARQ-07 + ARQ-06 §A; POS = §B; Admin = ARQ-08. Esta guía es referencia general, no ley de portal. Ver [[DISENO-SSOT]].

Relacionado con: [[00-Indice-Mapa-Mental-MOC]] | [[ARQ-05-Estructura-Carpetas-y-Tres-Portales]]

## 1. Filosofía de los Tres Portales Visuales
Aunque comparten el mismo backend y base de datos, cada portal responde a una necesidad psicológica y operativa distinta:

| Portal | Público Objetivo | Paradigma Visual | Referencia Estética |
| :--- | :--- | :--- | :--- |
| **1. Tienda Web (`StorefrontLayout`)** | Clientes compradores | **Marketing Inmersivo & Liquid Glass UI** | Apple Store, VisionOS, Bento Grids |
| **2. Terminal POS (`PosLayout`)** | Cajeros y vendedores | **Ergonomía Táctil de Alta Eficiencia ($\ge 1024$px)** | Square POS, Toast, Shopify POS |
| **3. Panel Admin (`AdminLayout`)** | Administradores y gerencia | **SaaS Analítico de Alta Densidad** | Linear, Stripe Dashboard, Vercel |

## 2. Paleta de Colores y Tokens Oficiales

### A. Tienda Web (Estilo Apple / Liquid Glass)
- **Fondo Primario:** `bg-slate-950` (Dark Mode Premium) / `bg-[#F5F5F7]` (Light Mode Apple Gray).
- **Tarjetas Liquid Glass:** `bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl`.
- **Acentos y CTAs:** `bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25`.
- **Efecto Hover 3D:** `transition-all duration-300 hover:-translate-y-1 hover:shadow-cyan-500/10`.

### B. Terminal POS (Caja Rápida de Mostrador)
- **Fondo:** `bg-slate-100` con gaveta en contraste `bg-white`.
- **Acción Principal (Cobro):** `bg-emerald-600 hover:bg-emerald-500 text-white font-bold`.
- **Botones de Denominación:** Billetes de $100k, $50k, $20k con bordes de 2px y texto numérico $\ge 20$px.
- **Área de Venta:** Pantalla completa sin scroll vertical (`CA-53`).

### C. Panel Admin (Datos y Control)
> **Vigente:** para el Portal Admin manda **ARQ-08**. La paleta slate/índigo de esta sección es histórica y no aplica al dashboard.
- **Sidebar:** `bg-slate-900 text-slate-300 border-r border-slate-800`.
- **Tablas:** Tipografía tabular monoespaciada para cifras en COP (`font-mono`).

## 3. Tipografía Oficial
- **Principal (UI & Títulos):** `Plus Jakarta Sans` o `Inter` (`font-sans`).
- **Números, Precios y Consecutivos COP:** `JetBrains Mono` (`font-mono`) para alineación perfecta de cifras enteras.

## 4. Patrón Bento Grid para Productos Web
Disposición modular con tarjetas flotantes asimétricas:
- *Hero Card (2x2):* Imagen de alta resolución de la prenda estrella con reflejo de luz.
- *Feature Card (1x1):* Indicador en vivo de disponibilidad (Semáforo: Verde / Naranja / Rojo).
- *Action Card (2x1):* Botón flotante «Añadir al Carrito» con acabado de vidrio líquido y micro-animación.
