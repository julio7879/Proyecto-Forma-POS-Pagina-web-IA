---
id: MOD-03
modulo: 03-catalogo-productos-variantes
tags: [catalogo, productos, variantes, sku, precios, cosmeticos]
rf_codes: [RF-CAT-01, RF-CAT-02, RF-CAT-03, RF-CAT-04]
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
| **RF-CAT-02** | Creación y edición de variantes con precio único | Administrador | `RN-CAT-01` a `RN-CAT-05` | **E:** `productoId` y datos de variantes (`sku` único, talla, color, `precioVentaCop` entero > 0).<br>**P:** Valida unicidad de SKU. Si `tieneMovimientos == true`, bloquea cambiar el SKU. Valida precio > 0 (`chk_precio_venta_positivo`). Si cambia el precio, audita.<br>**S:** Variante lista. | **CA-51, QA-001, QA-002:** Precios enteros > 0. SKU inmutable tras su primer movimiento. |
| **RF-CAT-03** | Desactivación de variantes con historial | Administrador | `RN-CAT-06`, `RN-GEN-07` | **E:** `varianteId` a desactivar.<br>**P:** Marca `activa = false`. Deja de figurar en ventas POS y tienda web; pedidos y traslados en curso continúan con normalidad.<br>**S:** Variante desactivada. | Prohibido borrado físico (`DELETE`). Conserva historial completo. |
| **RF-CAT-04** | Gestión de Productos Maestros (Ciclo de Vida) | Administrador | `RN-CAT-01`, `RN-CAT-07`, `RN-GEN-07` | **E:** `categoriaId`, `nombre`, `descripcion?`, `fotosUrls[]`, `reintegrableEnDevolucion`.<br>**P:** Crea o actualiza la entidad Producto. Si la categoría es de uso personal/cosméticos, fuerza `reintegrableEnDevolucion = false`. Valida que el nombre no esté duplicado en la misma categoría.<br>**S:** Producto maestro registrado. | Prohibido borrado físico; si se desactiva el producto, sus variantes se ocultan en cascada lógica. |

---

## 3. Ficha Técnica Oficial (Definition of Ready - DoR)

### 3.1. Contratos de API REST
- `POST /api/productos`: Crea un nuevo producto maestro.
- `GET /api/productos`: Lista productos con sus variantes activas y categoría.
- `GET /api/productos/:id`: Detalle de producto con stock consolidado.
- `PUT /api/productos/:id`: Actualiza metadatos y fotos del producto.
- `DELETE /api/productos/:id`: Desactivación lógica (`activa = false`).

### 3.2. Esquema Zod de Validación
```typescript
export const CrearProductoSchema = z.object({
  categoriaId: z.string().uuid('ID de categoría inválido'),
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  descripcion: z.string().max(1000).optional(),
  fotosUrls: z.array(z.string().url('URL de foto inválida')).default([]),
  reintegrableEnDevolucion: z.boolean().default(true),
});
```

### 3.3. Códigos de Respuesta HTTP
- `201 Created`: Producto maestro creado exitosamente `{ datos: { id, nombre, categoria, ... } }`.
- `400 Bad Request`: Error de validación Zod en campos o fotos.
- `403 Forbidden`: Intento de creación por usuario por un rol distinto de `ADMIN`.
- `409 Conflict`: Nombre de producto duplicado en la misma categoría.
