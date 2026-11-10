---
id: DISENO-SSOT
tags: [gobernanza, diseno, ui, ux, portales, paleta, alcance, arq-06, arq-07, arq-08]
fecha: 2026-11-10
---
# Constitución Visual de los Tres Portales

> **Problema que resuelve:** había seis documentos de diseño, tres paletas y dos leyes sin regla de precedencia. Este documento decide **qué manda en cada portal**, qué es anexo y qué está fuera del MVP.
>
> **Regla:** una ley por portal. Las guías y briefs se citan; no se reescriben.

---

## 1. Qué ley manda en cada portal

| Portal | Ley vinculante | Anexos / especificaciones | No vinculante |
| :--- | :--- | :--- | :--- |
| **Storefront** (`StorefrontLayout`) | **ARQ-07** (UX y conversión) + **ARQ-06 §A** / `design.md` (tokens) | `brief.md` como especificación derivada; 13 figuras de ARQ-07 | `GUIA-DISENO-LIQUID-GLASS-v2.md` (propuesta Navy/champagne, no ley) |
| **POS** (`PosLayout`) | **ARQ-06 §B** + **ARQ-05** | Guía de ticket 80 mm y teclado táctil | Glass, transparencias y animaciones decorativas |
| **Admin** (`AdminLayout`) | **ARQ-08** + `pos-dashboard-designer` | ARQ-06 §C solo como historia | Paleta slate/índigo de ARQ-06 §C para el dashboard |

**Precedencia:** ley específica > guía general. ARQ-07/ARQ-08 son leyes de portal; ARQ-06 es referencia general. La fecha solo desempata si este documento lo autoriza.

---

## 2. Paleta vigente

| Portal | Paleta canónica | Estado |
| :--- | :--- | :--- |
| Storefront | **Índigo `#4F46E5`** + slate + glass | Vigente y ya implementada. Provisional hasta cerrar `DV-023`. |
| POS | Fondo `bg-slate-100`, cobro `emerald-600`, botones táctiles ≥56 px | Vigente (ARQ-06 §B). |
| Admin | **`#151210`**, vino `#741C2B`, champagne `#C49A68`, cero transparencias | Vigente (ARQ-08). |

**Dirección alternativa (no vinculante):** `GUIA-DISENO-LIQUID-GLASS-v2.md` propone erradicar el índigo y usar *Obsidian Navy* `#1A2138` + champagne. **No se adopta** hasta que exista una decisión de marca (`DV-023`) y un plan de migración de tokens. Mientras tanto, no introducir Navy en código nuevo.

> **Por qué:** el código, los tests y `design.md` usan índigo. Cambiar la paleta es un refactor visual, no una corrección documental. Se decide con el usuario, no por fecha de archivo.

---

## 3. Alcance del MVP visual

| Tema | Decisión vigente | Fuente |
| :--- | :--- | :--- |
| **Guest checkout** | **Fuera del MVP.** El checkout exige registro. ARQ-07 §23.2 es fase 2. | ARQ-01 |
| **Pasarela / PCI-DSS** | **Fuera del MVP.** Solo transferencia y contraentrega. ARQ-07 §25 es fase 2. | ARQ-01 |
| **Vista 360°** | **Fase 2.** Multi-ángulo y zoom son MVP; el badge 360 no debe mostrarse hasta que exista visor real. | ARQ-07 §13.1 / Fig. 6 |
| **Reseñas** | Solo con **compra verificada**. Datos semilla deben marcarse como demo, nunca como «verificado». | ARQ-07 §18 / Fig. 8 |
| **3D / AR** | **Fase 2.** No es requisito del MVP. | ARQ-01 |
| **Checkout** | 3 pasos con progreso es válido; el 1-step es una alternativa, no una obligación. | ARQ-07 §23.1 |

---

## 4. Regla de conteo del dashboard (ARQ-08)

La regla de **«5-6 tarjetas primarias»** se refiere a **bloques primarios** (filas o paneles), no a tarjetas individuales.

El layout vigente:

1. Tira de 4 KPIs (1 bloque).
2. Gráfico de línea 65 % (1 bloque).
3. Dona de participación 35 % (1 bloque).
4. Histograma de sucursales (1 bloque).
5. Monitor de alertas (1 bloque).
6. Monitor de actividad (1 bloque).

**Total: 6 bloques.** Cumple la regla. Contar cada KPI como una tarjeta separada daría 9 y haría la regla inaplicable.

---

## 5. Los 14 mandamientos

La lista canónica vive en **ARQ-07 §0**. Ni `SKI-pos-ecommerce-ux-law` ni `AGE-09` mantienen una copia propia: la citan. Si cambia un mandamiento, se cambia en ARQ-07 y se propaga por referencia.

---

## 6. Cambios de diseño

1. Una propuesta nueva no se convierte en ley por ser más reciente.
2. Para reemplazar una ley: crear `DV-*` o ADR, declarar la derogatoria en este documento y actualizar el portal afectado.
3. No crear una segunda lista de mandamientos, una segunda paleta o un segundo sistema de tokens.
4. Los assets de diseño deben nombrarse por figura (`figNN-principio.png`), no por hash de exportación.

---

## 7. Relacionado

- [[SSOT]] — fuente única general.
- [[ARQ-06-Guia-Diseno-Sistema-Visual]] — referencia general y POS.
- [[ARQ-07-Ley-Diseno-Ecommerce-Navegacion-UIUX]] — ley del Storefront y §0 con los 14 mandamientos.
- [[ARQ-08-Guia-Maestra-Diseno-Paneles-de-Control-Dashboards]] — ley del Admin.
- [[AGE-09-Arquitecto-UX-Storefront]] | [[AGE-10-Vitral-Dashboard]] — roles de diseño.
