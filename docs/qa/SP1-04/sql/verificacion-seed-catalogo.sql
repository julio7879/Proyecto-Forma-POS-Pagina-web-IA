-- QA Issue #15 (PR #13) - Verificación del seed de catálogo.
-- NOTA: los nombres reales de tablas/columnas (schema.prisma) son "Categoria", "Producto" y "Variante".
-- La guía del Issue usa "CategoriaProducto", "VarianteProducto" y la columna "codigo", que NO existen.

-- A) CA-CAT-01 / CA-CAT-02: 4 categorías; solo Cosméticos con esCosmeticoUsoPersonal = true
SELECT "id", "nombre", "esCosmeticoUsoPersonal", "activa" FROM "Categoria" ORDER BY "nombre";

-- B) CA-CAT-02: productos no reintegrables (esperado: Sérum Facial y Labial Cremoso, categoría Cosméticos)
SELECT p."slug", p."nombre", c."nombre" AS categoria, p."reintegrableEnDevolucion"
FROM "Producto" p JOIN "Categoria" c ON c."id" = p."categoriaId"
WHERE p."reintegrableEnDevolucion" = false;

-- B2) Coherencia: todo producto de categoría cosmética debe ser no reintegrable (esperado: 0 filas)
SELECT p."slug" FROM "Producto" p JOIN "Categoria" c ON c."id" = p."categoriaId"
WHERE c."esCosmeticoUsoPersonal" = true AND p."reintegrableEnDevolucion" = true;

-- C) CA-CAT-03: 10 variantes, SKUs únicos, precios enteros > 0
SELECT "sku", "talla", "color", "precioVentaCop" FROM "Variante" ORDER BY "sku";
SELECT count(*) AS total, count(DISTINCT "sku") AS skus_unicos, min("precioVentaCop") AS precio_min
FROM "Variante";   -- esperado: 10 | 10 | > 0

-- D) CA-CAT-04: tras correr el seed 2 veces, los conteos deben ser idénticos
SELECT (SELECT count(*) FROM "Categoria") AS categorias,   -- 4
       (SELECT count(*) FROM "Producto")  AS productos,    -- 5
       (SELECT count(*) FROM "Variante")  AS variantes;    -- 10
