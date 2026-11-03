---
id: RN-UBI-CAT
tags: [ubicaciones, central, tiendas, catalogo, variantes, sku, cosmeticos]
criterios_ca: [CA-31, CA-51, QA-001, QA-002, QA-016]
modelos_prisma: [Ubicacion, Categoria, Producto, Variante]
---
# Reglas de Ubicaciones y Catálogo de Productos (RN-UBI y RN-CAT)

Relacionado con: [[MOD-02-Ubicaciones]] | [[MOD-03-Catalogo]] | [[RN-GEN-Principios-Inmutables]]

## 1. Ubicaciones Físicas y Cobertura (`RN-UBI-01` a `RN-UBI-06`)
- **RN-UBI-01 [D] (Bodega Central Única):** Existe una única Bodega Central (`tipo = CENTRAL`), garantizada por el índice único parcial `uq_unica_bodega_central`. Ubicada en Cúcuta (DANE `54001`). No opera cajas ni tiene vendedores asignados; despacha a clientes web y traslada a tiendas.
- **RN-UBI-02 [D] (Puntos de Venta):** Cada tienda física (`tipo = PUNTO_VENTA`) posee su propia caja registradora (`baseCajaCop` objetivo de $200.000 COP) y puede tener activo el flag `despachaWeb`.
- **RN-UBI-03 [D] (Prioridad de Despacho):** Cada ubicación tiene un entero `prioridadDespacho` (menor número = mayor prioridad de despacho web: Centro: 10, Ocaña: 20, Bucaramanga: 30, Central: 40).
- **RN-UBI-04 [D] (Custodia en Central):** Si un pedido web no puede ser atendido por ninguna tienda por falta de stock o avería, pasa en custodia a Bodega Central con `tieneIncidenciaStock = true` (`RN-WEB-16`).
- **RN-UBI-05 [D] (Condiciones de Desactivación Segura):** Para desactivar un punto de venta (`activa = false`), se deben cumplir en transacción las 5 condiciones obligatorias:
  1) La ubicación debe ser de tipo `PUNTO_VENTA` (la Bodega Central `tipo = CENTRAL` jamás puede ser desactivada).
  2) `SUM(fisico) == 0` y `SUM(noVendible) == 0` en `SaldoStock` (sin mercancía viva).
  3) Cero traslados abiertos donde la sede figure como origen o destino.
  4) Cero pedidos web asignados en curso (`RECIBIDO`, `CONFIRMADO`, `EN_PREPARACION`).
  5) Cero sesiones de caja en estado `ABIERTA`.
- **RN-UBI-06 [D]:** Todo registro histórico de una tienda desactivada permanece accesible para reportes y arqueos pasados.

## 2. Catálogo de Mercancía Estándar (`RN-CAT-01` a `RN-CAT-08`)
- **RN-CAT-01 [D] (Mercancía Física Estándar):** El sistema comercializa exclusivamente referencias físicas terminadas sin personalización:
  - **Ropa y Camisetas:** Variantes por talla (`XS, S, M, L, XL`) y color.
  - **Accesorios:** Gorras, bolsos, cinturones, gafas (talla única o medidas).
  - **Cosméticos y Cuidado Personal:** Cremas, sérums, labiales (por presentación/tono).
  - **Artesanías:** Piezas decorativas terminadas.
- **RN-CAT-02 [D] (Cosméticos y No Reintegrables, `CA-31`, `QA-016`):** Los productos de categorías con `esCosmeticoUsoPersonal = true` o artículos de higiene/aretes nacen con `reintegrableEnDevolucion = false`. Toda devolución autorizada de estos productos entra obligatoriamente a saldo `noVendible`.
- **RN-CAT-03 [D] (Inmutabilidad de SKU):** Cada variante tiene un `sku` alfanumérico único en el sistema. Una vez que la variante tiene su primer movimiento en Kardex (`tieneMovimientos = true`), su SKU es estrictamente inmutable.
- **RN-CAT-04 [D] (Precio Único Positivo Entero, `CA-51`):** `precioVentaCop` es un entero mayor a cero (`CHECK ("precioVentaCop" > 0)`) y es **único a nivel nacional** para esa variante (no hay precios distintos entre sedes).
- **RN-CAT-05 [D] (Cambios de Precio y Ventas Futuras):** Cambiar el precio de una variante solo rige para operaciones futuras; las ventas pasadas y pedidos web ya creados mantienen su snapshot original (`QA-002`).
- **RN-CAT-06 [D] (Desactivación de Catálogo):** Un producto o variante desactivado no aparece en búsquedas web ni POS, pero sus pedidos en curso se completan.
- **RN-CAT-07 [D] (Categorías del Sistema):** Categorías editables por el Administrador. Si una categoría se desactiva, sus productos existentes siguen operando pero no se pueden crear nuevos en ella.
- **RN-CAT-08 [D]:** No se admite venta fraccionada ni decimales de cantidad.
