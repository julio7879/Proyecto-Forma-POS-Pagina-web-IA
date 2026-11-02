---
id: MOD-03
modulo: 03-catalogo-productos-variantes
tags: [catalogo, productos, variantes, sku, precios, cosmeticos]
rf_codes: [RF-CAT-01, RF-CAT-02, RF-CAT-03]
modelos_prisma: [Categoria, Producto, Variante]
criterios_ca: [CA-31, CA-51, QA-001, QA-002, QA-016]
---
# Módulo 03: Catálogo de Productos, Variantes y Precios (RF-CAT)

Relacionado con: [[RN-UBI-CAT-Ubicaciones-Catalogo]] | [[Constraints-SQL-e-Indices]] | [[MOD-04-Inventario-Ledger]]

## 1. Alcance Funcional
Gestiona las categorías, productos físicos estándar (ropa, accesorios, cosméticos y artesanías) y sus variantes por SKU, con precios en enteros positivos y reglas de no reintegrabilidad para cosméticos e higiene.

## 2. Requerimientos Funcionales Detallados

| Código RF | Nombre | Actores | Reglas | Entrada → Proceso → Salida | Criterios de Aceptación |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-CAT-01** | Categorías con regla de cosméticos | Administrador | `RN-CAT-02`, `RN-CAT-07` | **E:** Nombre categoría y flag `esCosmeticoUsoPersonal`.<br>**P:** Crea o edita categoría. Al crear productos en cosméticos, marca `reintegrableEnDevolucion = false` por defecto.<br>**S:** Categoría configurada. | **CA-31, QA-016:** Cosméticos nacen no reintegrables (van siempre a no vendible). |
| **RF-CAT-02** | Creación y edición de variantes con precio único | Administrador | `RN-CAT-01` a `RN-CAT-05` | **E:** Datos producto y variantes (`sku` único, talla, color, `precioVentaCop` entero > 0).<br>**P:** Valida unicidad de SKU. Si `tieneMovimientos == true`, bloquea cambiar el SKU. Valida precio > 0 (`chk_precio_venta_positivo`). Si cambia el precio, audita.<br>**S:** Variante lista. | **CA-51, QA-001, QA-002:** Precios enteros > 0. SKU inmutable tras su primer movimiento. |
| **RF-CAT-03** | Desactivación de variantes con historial | Administrador | `RN-CAT-06`, `RN-GEN-07` | **E:** `varianteId` a desactivar.<br>**P:** Marca `activa = false`. Deja de figurar en ventas POS y tienda web; pedidos y traslados en curso continúan con normalidad.<br>**S:** Variante desactivada. | Prohibido borrado físico (`DELETE`). Conserva historial completo. |
