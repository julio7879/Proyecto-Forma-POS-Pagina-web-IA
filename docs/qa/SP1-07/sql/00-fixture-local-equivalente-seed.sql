-- =============================================================================
-- SP1-07 · Fixture LOCAL equivalente a backend/prisma/seed.ts
-- -----------------------------------------------------------------------------
-- SOLO para reproducir las pruebas en un PostgreSQL local (Docker / psql).
-- NO ejecutar en Supabase: allá los datos ya existen vía `npx prisma db seed`.
--
-- Uso local:
--   psql "$URL_LOCAL" -f backend/prisma/migrations/20261102193711_init/migration.sql
--   psql "$URL_LOCAL" -f backend/prisma/migrations/20261102221000_add_movimientos_caja_y_relevos/migration.sql
--   psql "$URL_LOCAL" -f backend/prisma/constraints_post_migrate.sql
--   psql "$URL_LOCAL" -f docs/qa/SP1-07/sql/00-fixture-local-equivalente-seed.sql
-- =============================================================================

INSERT INTO "TarifaZonaEnvio" (zona, nombre, "tarifaCop", "diasEstimados") VALUES
  (1, 'Mismo Municipio', 8000, 2),
  (2, 'Mismo Departamento', 12000, 3),
  (3, 'Misma Región', 16000, 4),
  (4, 'Diferente Región', 22000, 6)
ON CONFLICT (zona) DO NOTHING;

INSERT INTO "RegionEnvio" (nombre) VALUES ('Región Oriente') ON CONFLICT (nombre) DO NOTHING;

INSERT INTO "DepartamentoDane" ("codigoDane", nombre, "regionId")
SELECT d.codigo, d.nombre, r.id
FROM (VALUES ('54', 'Norte de Santander'), ('68', 'Santander')) AS d(codigo, nombre)
CROSS JOIN (SELECT id FROM "RegionEnvio" WHERE nombre = 'Región Oriente') r
ON CONFLICT ("codigoDane") DO NOTHING;

INSERT INTO "MunicipioDane" ("codigoDane", nombre, "departamentoId", "atendidoWeb") VALUES
  ('54001', 'Cúcuta', '54', true),
  ('54498', 'Ocaña', '54', true),
  ('68001', 'Bucaramanga', '68', true)
ON CONFLICT ("codigoDane") DO NOTHING;

INSERT INTO "Ubicacion" (nombre, tipo, "municipioDaneId", direccion, "prioridadDespacho", "despachaWeb", "baseCajaCop", "updatedAt") VALUES
  ('Bodega Central',    'CENTRAL',     '54001', 'Zona Industrial Cúcuta',      40, true, 0,      now()),
  ('Punto Centro',      'PUNTO_VENTA', '54001', 'Av. 5 # 10-20 Centro Cúcuta', 10, true, 200000, now()),
  ('Punto Ocaña',       'PUNTO_VENTA', '54498', 'Calle Principal Ocaña',       20, true, 200000, now()),
  ('Punto Bucaramanga', 'PUNTO_VENTA', '68001', 'Carrera 33 Bucaramanga',      30, true, 200000, now())
ON CONFLICT (nombre) DO NOTHING;

-- Admin (el hash es un marcador: este fixture no se usa para login HTTP)
INSERT INTO "Usuario" ("nombreCompleto", correo, "passwordHash", rol, "ubicacionId", activo, "updatedAt")
SELECT 'Administrador General', 'admin@forma.com', '$2a$10$fixture.local.no.usar.para.login.................', 'ADMIN', id, true, now()
FROM "Ubicacion" WHERE tipo = 'CENTRAL'
ON CONFLICT (correo) DO NOTHING;

INSERT INTO "Categoria" (nombre, "esCosmeticoUsoPersonal", activa) VALUES
  ('Ropa', false, true), ('Accesorios', false, true), ('Cosméticos', true, true), ('Artesanías', false, true)
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO "Producto" (nombre, slug, descripcion, "categoriaId", "imagenesUrls", "reintegrableEnDevolucion", activo, "updatedAt")
SELECT p.nombre, p.slug, p.descr, c.id, ARRAY[]::text[], p.reint, true, now()
FROM (VALUES
  ('Camiseta Básica de Algodón',    'camiseta-basica-algodon',       'Camiseta unisex', 'Ropa',       true),
  ('Gorra Urbana Snapback',         'gorra-urbana-snapback',         'Gorra',           'Accesorios', true),
  ('Sérum Facial Vitamina C',       'serum-facial-vitamina-c',       'Sérum 30ml',      'Cosméticos', false),
  ('Labial Cremoso Larga Duración', 'labial-cremoso-larga-duracion', 'Labial',          'Cosméticos', false),
  ('Mochila Wayuu Tradicional',     'mochila-wayuu-tradicional',     'Mochila',         'Artesanías', true)
) AS p(nombre, slug, descr, cat, reint)
JOIN "Categoria" c ON c.nombre = p.cat
ON CONFLICT (slug) DO NOTHING;

INSERT INTO "Variante" ("productoId", sku, talla, color, "precioVentaCop", "tieneMovimientos", activa, "updatedAt")
SELECT pr.id, v.sku, v.talla, v.color, v.precio, false, true, now()
FROM (VALUES
  ('camiseta-basica-algodon', 'ROP-CAM-NEG-S', 'S', 'Negro', 45000),
  ('camiseta-basica-algodon', 'ROP-CAM-NEG-M', 'M', 'Negro', 45000),
  ('camiseta-basica-algodon', 'ROP-CAM-NEG-L', 'L', 'Negro', 45000),
  ('camiseta-basica-algodon', 'ROP-CAM-BLA-M', 'M', 'Blanco', 45000),
  ('gorra-urbana-snapback', 'ACC-GOR-NEG-U', 'Única', 'Negro', 38000),
  ('gorra-urbana-snapback', 'ACC-GOR-AZU-U', 'Única', 'Azul', 38000),
  ('serum-facial-vitamina-c', 'COS-SER-30ML', '30ml', 'Neutro', 65000),
  ('labial-cremoso-larga-duracion', 'COS-LAB-ROJ-U', 'Única', 'Rojo Carmín', 28000),
  ('labial-cremoso-larga-duracion', 'COS-LAB-ROS-U', 'Única', 'Rosa Palo', 28000),
  ('mochila-wayuu-tradicional', 'ART-MOC-GEO-M', 'Mediana', 'Multicolor', 140000)
) AS v(slug, sku, talla, color, precio)
JOIN "Producto" pr ON pr.slug = v.slug
ON CONFLICT (sku) DO NOTHING;
