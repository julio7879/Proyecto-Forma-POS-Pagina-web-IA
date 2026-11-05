---
name: react-shadcn-admin
description: Arquitectura y sistema de diseño para el Portal 3 (Dashboard Administrativo) en React + Tailwind CSS (inspirada en fusengine/agents react-shadcn y admin-panel con calidad visual estilo Linear/Vercel). Activar al construir o auditar AdminLayout, reportes gerenciales, tablas densas de inventario/kardex/auditoría, exportación Excel multi-hoja y modales administrativos.
---

# Arquitectura de Panel Administrativo Ejecutivo (`react-shadcn-admin`)

Esta skill adapta los patrones de ingeniería de componentes de `fusengine/agents` (`react-shadcn` y `admin-panel`) con estética ejecutiva tipo **Linear / Vercel / Stripe Dashboard** para el **Portal 3 (Panel Administrativo)** del Sistema POS y Tienda Web Multisede.

---

## Cuándo Activar Esta Skill
- Al construir o refactorizar `AdminLayout` y sus vistas internas (Dashboard de KPIs, Gestión de Catálogo, Kardex y Traslados Multisede, Auditoría de Sesiones de Caja, Gestión de Pedidos Web y Usuarios/Roles).
- Al diseñar tablas de datos de alta densidad, barras de herramientas de filtrado, exportadores de reportes en Excel (`.xlsx`) o diálogos de confirmación de acciones sensibles.

---

## 1. Layout Administrativo y Navegación (`AdminLayout`)

1. **Sidebar Colapsable de Alta Precisión:**
   - En escritorio (`lg+`), barra lateral izquierda fija con transición suave entre modo expandido (`w-64`) y modo compacto de solo íconos con tooltips (`w-16`), permitiendo maximizar el área horizontal cuando el administrador inspecciona tablas anchas de Kardex o ventas.
   - Agrupación semántica de módulos:
     - **Analítica:** Resumen Ejecutivo, Ventas Netas y Arqueos.
     - **Operaciones:** Pedidos Web, Sesiones de Caja, Traslados entre Sedes.
     - **Catálogo e Inventario:** Productos y Variantes, Saldos de Stock y Kardex.
     - **Seguridad y Configuración:** Usuarios/Roles (`RN-ROL-*`), Sedes y Auditoría.
2. **Topbar Contextual (`h-16`):**
   - Breadcrumbs dinámicos (`Administración / Inventario / Kardex Inmutable`), selector global de **Sede activa** (o vista consolidada `"Todas las Sedes"` para el Rol Administrador), indicador de hora oficial `America/Bogota` (`RN-GEN-05`) y perfil de usuario con badge de rol.

---

## 2. Tarjetas de KPIs Ejecutivos con Comparativas

Los indicadores clave en la cabecera del Dashboard (`grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4`) deben comunicar contexto financiero real sin ruido visual:

- ** Anatomía de una Tarjeta KPI estilo Linear/Stripe:**
  - **Cabecera:** Etiqueta sobria (`text-xs font-semibold uppercase tracking-wider text-slate-500`) + ícono monocromático en contenedor sutil (`p-2 rounded-lg bg-slate-100 text-slate-700`).
  - **Cifra Principal:** Valor formateado en `COP` enteros con `text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums tracking-tight` (`RN-GEN-04`).
  - **Pie Comparativo / Contexto:** Badge de variación porcentual o estado operativo (ej. `Ventas Netas = Brutas - Devoluciones`, cantidad de cajas abiertas vs. cerradas con descuadre, o pedidos web en estado `RECIBIDO` vs `EN_PREPARACION`).
- **Regla Contable Inquebrantable:** Todas las cifras financieras provienen de agregaciones enteras del backend; el frontend jamás inventa proyecciones ni redondea decimales en cliente (`RN-GEN-01`).

---

## 3. Tablas Densas de Datos (`DataTable` Patrón Shadcn / TanStack)

Las tablas administrativas (Kardex, Historial de Ventas, Saldos por Sede, Auditoría) deben priorizar la legibilidad escaneable:

1. **Barra de Herramientas Integrada (`Table Toolbar`):**
   - Búsqueda rápida por SKU / Consecutivo / Cliente con *debounce* o filtrado instantáneo.
   - Selectores facetados (por Sede, por Tipo de Movimiento de Kardex, por Estado de Sesión de Caja o Rango de Fechas en `America/Bogota`).
   - Botón *"Limpiar filtros"* visible únicamente cuando hay filtros activos.
   - Contador de registros (`Mostrando X de Y registros`).
2. **Tipografía y Alineación de Columnas:**
   - **Texto / Nombres:** Alineado a la izquierda (`text-left font-medium text-slate-900`).
   - **Códigos / SKUs / Consecutivos / Fechas:** Tipografía monoespaciada (`font-mono text-xs text-slate-600 whitespace-nowrap`).
   - **Cantidades y Valores Monetarios (`COP`):** **Siempre alineados a la derecha** (`text-right font-mono tabular-nums font-semibold`).
   - **Estados:** Píldoras semánticas con punto indicador (`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium`).
3. **Encabezados Fijos y Paginación:**
   - Cabecera `bg-slate-50/90 backdrop-blur-xs border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500`.
   - Controles de paginación inferiores claros (Página actual, total de páginas, selector de filas por página `10 / 25 / 50`).

---

## 4. Exportación Ejecutiva Excel Multi-Hoja (`.xlsx`)

Todo reporte gerencial exportable en el Panel Administrativo debe generar un libro de Excel profesional (`.xlsx`) estructurado en **múltiples hojas temáticas** en lugar de un CSV plano difícil de leer:

1. **Arquitectura Multi-Hoja Recomendada:**
   - **Hoja 1 - `Resumen Ejecutivo`:** Metadatos del reporte (Fecha y hora de generación en `America/Bogota`, usuario generador, sede filtrada), tabla de KPIs consolidados (Ventas Brutas, Descuentos, Devoluciones, Ventas Netas en `COP` enteros).
   - **Hoja 2 - `Detalle de Ventas / Transacciones`:** Filas detalladas con Consecutivo, Fecha/Hora Colombia, Sede, Cajero, Método de Pago, Subtotal, Descuento, IVA y Total `COP`.
   - **Hoja 3 - `Inventario y Saldos por Sede`:** SKU, Producto, Talla/Color, Sede, Stock Físico, Reservado Blando (`RECIBIDO`/`CONFIRMADO`), Reservado Duro (`EN_PREPARACION`) y Disponible para Venta.
   - **Hoja 4 - `Arqueos y Sesiones de Caja` (cuando aplique):** Apertura, Base Inicial, Efectivo Esperado, Efectivo Declarado (Arqueo Ciego), Diferencia (`SOBRante` / `FALTANTE` / `CUADRADO`) y Justificación.
2. **Formato de Celdas:**
   - Anchos de columna auto-ajustados (`wch`) para que ningún encabezado o cifra aparezca truncado con `###`.
   - Importes monetarios como números enteros puros para permitir fórmulas `SUM()` inmediatas en Excel.

---

## 5. Cuándo Usar `Modal (Dialog)` vs. `AlertDialog` de Confirmación

| Componente | Cuándo Usarlo | Reglas de Comportamiento |
| :--- | :--- | :--- |
| **`Modal / Dialog` Estándar** | Formularios de creación/edición (Crear Producto, Registrar Entrada de Compra, Configurar Sede, Ver Detalle de Movimiento Kardex). | Se puede cerrar con `Esc` o clic en el botón `X` (salvo que haya una mutación en curso). Máximo una sola área de scroll limpia y botones de acción fijos en el `DialogFooter`. |
| **`AlertDialog` (Confirmación Crítica)** | Acciones irreversibles o de alto impacto: **Inactivar un producto/usuario** (`RN-GEN-03`: prohibido borrado físico), **Anular/Devolver una venta**, **Cerrar sesión de caja con descuadre**, **Rechazar traslado con discrepancia**. | **No se cierra haciendo clic fuera por accidente.** Exige lectura del impacto, campo de **Motivo / Justificación obligatoria** (mínimo de caracteres validado) y botón de confirmación semántico (`bg-rose-600 hover:bg-rose-700 text-white` para acciones restrictivas/anulaciones). |
