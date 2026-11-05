---
name: pos-sales-ui-design
description: Ergonomía táctil, velocidad operativa y arquitectura de interfaz para el Portal 2 (Terminal POS de Mostrador) en React + Tailwind CSS (inspirada en peterbamuhigire/skills-web-dev pos-sales-ui-design). Activar al construir o refactorizar PosLayout, pantalla de facturación rápida, arqueo ciego de caja, buscador por lector de código de barras y panel de ticket/cobro.
---

# Diseño Ergonómico de Terminal POS de Mostrador (`pos-sales-ui-design`)

Esta skill adapta los estándares de ingeniería ergonómica para puntos de venta multisede de `peterbamuhigire/skills-web-dev` (`pos-sales-ui-design` / `chwezi-design-engine`) al **Portal 2 (Terminal POS)** del Sistema POS y Tienda Web Multisede.

---

## Cuándo Activar Esta Skill
- Al construir o optimizar `PosLayout` y la vista operativa de caja (`PosTerminalPage`, modales de cobro, apertura de sesión de caja con base inicial y cierre con arqueo ciego).
- Al programar atajos de teclado para cajeros, captura de lector láser de códigos de barras/SKU o manejo de reservas de stock en mostrador (`RN-VTA-03`).

---

## 1. Regla de Oro Espacial: Cero Scroll General (`Viewport-Locked Application`)

Una terminal POS de mostrador **no es una página web de lectura**; es un instrumento industrial de alta velocidad:
- **Contenedor Raíz Bloqueado al Viewport:** El layout del POS debe usar obligatoriamente `h-screen w-screen overflow-hidden flex flex-col bg-slate-100 select-none`.
- **Prohibido el Scroll de Página Completa:** El cajero jamás debe hacer scroll en toda la ventana del navegador para encontrar el botón de cobrar o el buscador.
- **Scroll Aislado por Panel:** Solo dos zonas internas tienen permitido hacer scroll vertical independiente (`overflow-y-auto`):
  1. La **Grilla de Productos / Resultados** en el panel izquierdo/central (`flex-1 overflow-y-auto`).
  2. La **Lista de Líneas del Ticket** en el panel derecho (`flex-1 overflow-y-auto`).

---

## 2. Jerarquía Visual de 3 Niveles (Velocidad Cognitiva en Mostrador)

En un entorno de fila de clientes en tienda física, el ojo del cajero debe procesar la pantalla en menos de 200 milisegundos mediante **3 niveles estrictos de jerarquía visual**:

### Nivel 1 (Dominante - Foco Inmediato): Total a Pagar y Acción de Cobro
- **Total de la Venta (`COP` Entero):** Tipografía gigante (`text-3xl sm:text-4xl font-black tabular-nums tracking-tight text-slate-900` o `text-white` sobre fondo oscuro) ubicada en la base fija del panel derecho.
- **Botón Dominante de Cobro (`CTA Primario`):** Altura mínima de `64px` (`h-16`), ancho completo del ticket, color de alto contraste (`bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-extrabold text-lg shadow-lg`), mostrando explícitamente el atajo de teclado `[F9]` o `[Espacio]`.

### Nivel 2 (Operativo - Flujo de Trabajo): Buscador/Escáner, Grilla Táctil y Líneas del Ticket
- **Barra de Búsqueda y Escáner:** Siempre fija en la parte superior del área de trabajo con indicador activo de *"Listo para escanear código de barras o buscar SKU"*.
- **Tarjetas de Producto POS:** Compactas, de alto contraste, mostrando Nombre, Talla/Color, SKU, Precio `COP` y **Badge de Stock Disponible en la Sede Actual** (recordando que en POS el cajero puede vender sobre `reservadoBlando` según `RN-VTA-03`, pero nunca sobre `reservadoDuro`).
- **Líneas del Ticket:** Filas claras con controles táctiles grandes (`-` / `+` / eliminar) y subtotal de línea alineado a la derecha con `tabular-nums`.

### Nivel 3 (Contextual / Secundario): Cabecera de Sesión, Sede y Acciones de Caja
- Barra superior compacta (`h-14`) con información de contexto: Sede física activa, Consecutivo de caja, nombre del Cajero, reloj en vivo `America/Bogota` (`RN-GEN-05`) y botones secundarios para *Retiro Operativo de Efectivo*, *Devolución por Consecutivo* y *Cierre de Caja (Arqueo Ciego)*.

---

## 3. Ergonomía Táctil (`Touch Targets` Mínimos de `56px`) y Teclado Primero (`Keyboard-First`)

El POS debe operar con igual fluidez en un **monitor táctil capacitivo** que con **lector de código de barras + teclado físico**:

1. **Objetivos Táctiles Mínimos (`56px`):**
   - Los botones de categorías rápidas, tarjetas de selección de variante, métodos de pago (Efectivo, Tarjeta, Transferencia/QR, Saldo a Favor), teclado numérico en pantalla y acciones de cobro deben tener una altura o área mínima de **`56px` (`min-h-[56px]`)** con separación mínima de `8px` (`gap-2` o `gap-3`) para evitar toques accidentales en horas pico.
2. **Foco Automático en Barra de Búsqueda / Escáner (`Auto-Focus`):**
   - Al cargar la terminal POS, al cerrar cualquier modal o tras completar una venta, el foco (`inputRef.current?.focus()`) debe regresar automáticamente al input de búsqueda/escáner.
   - Si el lector láser envía un SKU exacto seguido de `Enter`, el sistema debe agregar la variante al ticket inmediatamente y limpiar el campo sin requerir clic en el ratón.
3. **Atajos de Teclado Estándar de Caja:**
   - `F2` o `/`: Enfocar barra de búsqueda / escáner.
   - `F4`: Seleccionar/cambiar cliente o aplicar descuento autorizado.
   - `F8`: Abrir modal de Cierre / Arqueo Ciego de Caja.
   - `F9` (o `Ctrl + Enter`): Abrir modal de Cobro / Confirmar Venta.
   - `Esc`: Cerrar modal secundario activo y devolver foco al escáner.

---

## 4. Guardrails de Negocio en la Interfaz POS

1. **Bloqueo por Sesión de Caja Vencida o Cerrada (`RN-CAJ-11`):**
   - Si el cajero no tiene una sesión `ABIERTA` en su sede o si una sesión quedó abierta de un día anterior en hora `America/Bogota`, la interfaz **bloquea la facturación** y presenta de forma obligatoria el flujo de *Cierre de Sesión Vencida* o *Apertura de Caja con Base Inicial*.
2. **Arqueo Ciego Estricto en Cierre de Caja:**
   - Al cerrar turno, la interfaz **JAMÁS muestra el "Efectivo Esperado en Sistema"** antes de que el cajero ingrese y confirme su conteo físico (*Efectivo Declarado*). Solo después del `POST` de cierre se revela el resumen de cuadre y, si existe diferencia, se exige justificación escrita.
3. **Idempotencia y Prevención de Doble Cobro (`RN-GEN-08`):**
   - Al presionar *"Confirmar Cobro"*, el botón entra inmediatamente en estado bloqueado (`disabled={isPending}`) enviando una `Idempotency-Key` única para garantizar que un doble toque en pantalla táctil nunca genere dos facturas ni descuente dos veces el Kardex.
