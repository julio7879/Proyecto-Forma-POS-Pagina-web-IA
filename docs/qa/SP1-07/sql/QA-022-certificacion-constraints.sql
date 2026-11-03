-- =============================================================================
-- SP1-07 · QA-022 · Certificación de constraints nativos de PostgreSQL
-- Responsable QA: Duvan (@duvancovilla292-prog)
-- -----------------------------------------------------------------------------
-- CÓMO USARLO EN SUPABASE
--   1. Supabase → SQL Editor → New query.
--   2. Pegar TODO este archivo y pulsar "Run" (una sola ejecución).
--   3. La tabla final muestra una fila por prueba con PASA / FALLA y el error
--      exacto que devolvió PostgreSQL. Tomar captura de esa tabla.
--
-- ES SEGURO: cada intento de escritura va dentro de un bloque con manejo de
-- excepciones (subtransacción). Si PostgreSQL rechaza el INSERT/UPDATE, no
-- queda nada escrito; si lo ACEPTA (constraint ausente), el bloque fuerza un
-- error para deshacerlo. Ningún dato de desarrollo queda modificado.
--
-- POR QUÉ NO USAR LAS CONSULTAS DE EJEMPLO DEL ISSUE #7
--   Usan columnas que no existen en schema.prisma ("codigo", "esBodegaCentral",
--   "activo", "cantidadFisica", tipo 'BODEGA', ids de texto). PostgreSQL las
--   rechaza con «column ... does not exist» ANTES de evaluar el constraint, así
--   que parecen pasar sin haber probado nada (falso positivo). Este script
--   distingue el error correcto (unique_violation / check_violation sobre el
--   constraint esperado) de cualquier otro error.
-- =============================================================================

DROP TABLE IF EXISTS pg_temp.qa_resultados;
CREATE TEMP TABLE qa_resultados (
  orden            int,
  caso             text,
  descripcion      text,
  resultado        text,
  sqlstate         text,
  constraint_real  text,
  mensaje_postgres text
);

-- -----------------------------------------------------------------------------
-- P0. Inventario: los constraints e índices esperados existen en la BD
-- -----------------------------------------------------------------------------
INSERT INTO qa_resultados (orden, caso, descripcion, resultado, constraint_real, mensaje_postgres)
SELECT 0, 'P0-INVENTARIO', 'Existe ' || e.nombre,
       CASE WHEN EXISTS (SELECT 1 FROM pg_constraint WHERE conname = e.nombre)
              OR EXISTS (SELECT 1 FROM pg_indexes   WHERE indexname = e.nombre)
            THEN 'PASA' ELSE 'FALLA' END,
       e.nombre,
       CASE WHEN EXISTS (SELECT 1 FROM pg_constraint WHERE conname = e.nombre)
              OR EXISTS (SELECT 1 FROM pg_indexes   WHERE indexname = e.nombre)
            THEN 'Encontrado' ELSE 'NO existe: ejecutar backend/prisma/constraints_post_migrate.sql' END
FROM (VALUES ('chk_saldo_stock_no_negativo'),
             ('uq_unica_bodega_central'),
             ('uq_unica_sesion_caja_abierta_por_punto'),
             ('chk_precio_venta_positivo'),
             ('chk_movimiento_caja_monto_positivo')) AS e(nombre);

-- Precondición: debe existir exactamente una Bodega Central (seed)
INSERT INTO qa_resultados (orden, caso, descripcion, resultado, mensaje_postgres)
SELECT 0, 'P0-PRECONDICION', 'Hay exactamente 1 ubicación CENTRAL antes de probar',
       CASE WHEN count(*) = 1 THEN 'PASA' ELSE 'FALLA' END,
       'Centrales encontradas: ' || count(*)
FROM "Ubicacion" WHERE tipo = 'CENTRAL';

-- -----------------------------------------------------------------------------
-- Función auxiliar: registra el resultado según el error recibido
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION pg_temp.qa_registrar(
  p_orden int, p_caso text, p_desc text, p_estado_esperado text,
  p_constraint_esperado text, p_estado text, p_constraint text, p_msg text
) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO qa_resultados VALUES (
    p_orden, p_caso, p_desc,
    CASE
      WHEN p_estado = 'QA001' THEN 'FALLA (la BD ACEPTÓ el dato inválido)'
      WHEN p_estado = p_estado_esperado AND p_constraint = p_constraint_esperado THEN 'PASA'
      ELSE 'FALLA (rechazado por otra causa: revisar)'
    END,
    p_estado, p_constraint, p_msg);
END $$;

-- -----------------------------------------------------------------------------
-- A1. RN-UBI-01: INSERT de una segunda Bodega Central → uq_unica_bodega_central
-- -----------------------------------------------------------------------------
DO $$
DECLARE v_state text; v_cons text; v_msg text;
BEGIN
  BEGIN
    INSERT INTO "Ubicacion" (nombre, tipo, "municipioDaneId", direccion, "updatedAt")
    SELECT 'QA SP1-07 Segunda Bodega Central', 'CENTRAL', "municipioDaneId", 'Prueba QA', now()
    FROM "Ubicacion" WHERE tipo = 'CENTRAL' LIMIT 1;
    RAISE EXCEPTION USING ERRCODE = 'QA001', MESSAGE = 'INSERT aceptado: no existe protección de Central única';
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_state = RETURNED_SQLSTATE, v_cons = CONSTRAINT_NAME, v_msg = MESSAGE_TEXT;
    PERFORM pg_temp.qa_registrar(1, 'A1-RN-UBI-01', 'INSERT segunda Bodega Central', '23505', 'uq_unica_bodega_central', v_state, v_cons, v_msg);
  END;
END $$;

-- -----------------------------------------------------------------------------
-- A2. RN-UBI-01: convertir un Punto de Venta existente en CENTRAL (vía UPDATE)
-- -----------------------------------------------------------------------------
DO $$
DECLARE v_state text; v_cons text; v_msg text;
BEGIN
  BEGIN
    UPDATE "Ubicacion" SET tipo = 'CENTRAL'
    WHERE id = (SELECT id FROM "Ubicacion" WHERE tipo = 'PUNTO_VENTA' ORDER BY id LIMIT 1);
    RAISE EXCEPTION USING ERRCODE = 'QA001', MESSAGE = 'UPDATE aceptado: quedaron 2 Centrales';
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_state = RETURNED_SQLSTATE, v_cons = CONSTRAINT_NAME, v_msg = MESSAGE_TEXT;
    PERFORM pg_temp.qa_registrar(2, 'A2-RN-UBI-01', 'UPDATE de Punto de Venta a CENTRAL', '23505', 'uq_unica_bodega_central', v_state, v_cons, v_msg);
  END;
END $$;

-- -----------------------------------------------------------------------------
-- B1. RN-INV-01: INSERT de SaldoStock con fisico = -5
-- -----------------------------------------------------------------------------
DO $$
DECLARE v_state text; v_cons text; v_msg text;
BEGIN
  BEGIN
    INSERT INTO "SaldoStock" ("ubicacionId", "varianteId", fisico, "reservadoBlando", "reservadoDuro", "noVendible", "updatedAt")
    VALUES ((SELECT id FROM "Ubicacion" WHERE tipo = 'CENTRAL' LIMIT 1),
            (SELECT id FROM "Variante" ORDER BY id LIMIT 1),
            -5, 0, 0, 0, now());
    RAISE EXCEPTION USING ERRCODE = 'QA001', MESSAGE = 'INSERT aceptado con fisico negativo';
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_state = RETURNED_SQLSTATE, v_cons = CONSTRAINT_NAME, v_msg = MESSAGE_TEXT;
    PERFORM pg_temp.qa_registrar(3, 'B1-RN-INV-01', 'SaldoStock con fisico = -5', '23514', 'chk_saldo_stock_no_negativo', v_state, v_cons, v_msg);
  END;
END $$;

-- -----------------------------------------------------------------------------
-- B2. RN-INV-01: reservas mayores al físico (fisico 2, reservadoBlando 3)
-- -----------------------------------------------------------------------------
DO $$
DECLARE v_state text; v_cons text; v_msg text;
BEGIN
  BEGIN
    INSERT INTO "SaldoStock" ("ubicacionId", "varianteId", fisico, "reservadoBlando", "reservadoDuro", "noVendible", "updatedAt")
    VALUES ((SELECT id FROM "Ubicacion" WHERE tipo = 'CENTRAL' LIMIT 1),
            (SELECT id FROM "Variante" ORDER BY id LIMIT 1),
            2, 3, 0, 0, now());
    RAISE EXCEPTION USING ERRCODE = 'QA001', MESSAGE = 'INSERT aceptado con reservas > físico';
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_state = RETURNED_SQLSTATE, v_cons = CONSTRAINT_NAME, v_msg = MESSAGE_TEXT;
    PERFORM pg_temp.qa_registrar(4, 'B2-RN-INV-01', 'reservadoBlando (3) > fisico (2)', '23514', 'chk_saldo_stock_no_negativo', v_state, v_cons, v_msg);
  END;
END $$;

-- -----------------------------------------------------------------------------
-- B3. RN-INV-01: noVendible = -1
-- -----------------------------------------------------------------------------
DO $$
DECLARE v_state text; v_cons text; v_msg text;
BEGIN
  BEGIN
    INSERT INTO "SaldoStock" ("ubicacionId", "varianteId", fisico, "reservadoBlando", "reservadoDuro", "noVendible", "updatedAt")
    VALUES ((SELECT id FROM "Ubicacion" WHERE tipo = 'CENTRAL' LIMIT 1),
            (SELECT id FROM "Variante" ORDER BY id LIMIT 1),
            0, 0, 0, -1, now());
    RAISE EXCEPTION USING ERRCODE = 'QA001', MESSAGE = 'INSERT aceptado con noVendible negativo';
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_state = RETURNED_SQLSTATE, v_cons = CONSTRAINT_NAME, v_msg = MESSAGE_TEXT;
    PERFORM pg_temp.qa_registrar(5, 'B3-RN-INV-01', 'SaldoStock con noVendible = -1', '23514', 'chk_saldo_stock_no_negativo', v_state, v_cons, v_msg);
  END;
END $$;

-- -----------------------------------------------------------------------------
-- B4. RN-INV-01: UPDATE de un saldo válido a negativo (simula descuento directo)
--     Crea un saldo válido temporal y luego intenta dejarlo en -1.
-- -----------------------------------------------------------------------------
DO $$
DECLARE v_state text; v_cons text; v_msg text; v_ubi int; v_var int;
BEGIN
  SELECT u.id, v.id INTO v_ubi, v_var
  FROM "Ubicacion" u CROSS JOIN "Variante" v
  WHERE NOT EXISTS (SELECT 1 FROM "SaldoStock" s WHERE s."ubicacionId" = u.id AND s."varianteId" = v.id)
  ORDER BY u.id, v.id LIMIT 1;

  IF v_ubi IS NULL THEN
    INSERT INTO qa_resultados VALUES (6, 'B4-RN-INV-01', 'UPDATE de saldo a fisico = -1', 'OMITIDA', NULL, NULL,
      'No hay par ubicación/variante libre para crear un saldo temporal');
    RETURN;
  END IF;

  BEGIN
    INSERT INTO "SaldoStock" ("ubicacionId", "varianteId", fisico, "updatedAt") VALUES (v_ubi, v_var, 1, now());
    UPDATE "SaldoStock" SET fisico = -1 WHERE "ubicacionId" = v_ubi AND "varianteId" = v_var;
    RAISE EXCEPTION USING ERRCODE = 'QA001', MESSAGE = 'UPDATE aceptado: saldo quedó negativo';
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_state = RETURNED_SQLSTATE, v_cons = CONSTRAINT_NAME, v_msg = MESSAGE_TEXT;
    PERFORM pg_temp.qa_registrar(6, 'B4-RN-INV-01', 'UPDATE de saldo a fisico = -1', '23514', 'chk_saldo_stock_no_negativo', v_state, v_cons, v_msg);
  END;
END $$;

-- -----------------------------------------------------------------------------
-- C1. RN-CAT-04 / CA-51: variante con precioVentaCop = 0
-- -----------------------------------------------------------------------------
DO $$
DECLARE v_state text; v_cons text; v_msg text;
BEGIN
  BEGIN
    INSERT INTO "Variante" ("productoId", sku, talla, color, "precioVentaCop", "updatedAt")
    VALUES ((SELECT id FROM "Producto" ORDER BY id LIMIT 1), 'QA-SP107-PRECIO-CERO', 'U', 'N/A', 0, now());
    RAISE EXCEPTION USING ERRCODE = 'QA001', MESSAGE = 'INSERT aceptado con precio 0';
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_state = RETURNED_SQLSTATE, v_cons = CONSTRAINT_NAME, v_msg = MESSAGE_TEXT;
    PERFORM pg_temp.qa_registrar(7, 'C1-CA-51', 'Variante con precioVentaCop = 0', '23514', 'chk_precio_venta_positivo', v_state, v_cons, v_msg);
  END;
END $$;

-- -----------------------------------------------------------------------------
-- D1. RN-CAJ-01 / QA-007: dos sesiones de caja ABIERTA en el mismo punto
-- -----------------------------------------------------------------------------
DO $$
DECLARE v_state text; v_cons text; v_msg text; v_punto int; v_admin int;
BEGIN
  SELECT id INTO v_punto FROM "Ubicacion" WHERE tipo = 'PUNTO_VENTA' ORDER BY id LIMIT 1;
  SELECT id INTO v_admin FROM "Usuario" WHERE rol = 'ADMIN' ORDER BY id LIMIT 1;
  BEGIN
    INSERT INTO "SesionCaja" ("ubicacionId", estado, "fechaNegocioColombia", "abiertaPorId", "baseConfiguradaCop", "baseContadaCop")
    VALUES (v_punto, 'ABIERTA', to_char(now() AT TIME ZONE 'America/Bogota', 'YYYY-MM-DD'), v_admin, 200000, 200000);
    INSERT INTO "SesionCaja" ("ubicacionId", estado, "fechaNegocioColombia", "abiertaPorId", "baseConfiguradaCop", "baseContadaCop")
    VALUES (v_punto, 'ABIERTA', to_char(now() AT TIME ZONE 'America/Bogota', 'YYYY-MM-DD'), v_admin, 200000, 200000);
    RAISE EXCEPTION USING ERRCODE = 'QA001', MESSAGE = 'Se aceptaron 2 cajas abiertas en el mismo punto';
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_state = RETURNED_SQLSTATE, v_cons = CONSTRAINT_NAME, v_msg = MESSAGE_TEXT;
    PERFORM pg_temp.qa_registrar(8, 'D1-QA-007', 'Segunda SesionCaja ABIERTA en el mismo punto', '23505', 'uq_unica_sesion_caja_abierta_por_punto', v_state, v_cons, v_msg);
  END;
END $$;

-- -----------------------------------------------------------------------------
-- E1. RN-CAJ-07: MovimientoCaja con montoCop = 0
-- -----------------------------------------------------------------------------
DO $$
DECLARE v_state text; v_cons text; v_msg text; v_sesion int; v_admin int; v_punto int;
BEGIN
  SELECT id INTO v_admin FROM "Usuario" WHERE rol = 'ADMIN' ORDER BY id LIMIT 1;
  -- Usa un punto sin caja abierta para no chocar con el índice de D1
  SELECT u.id INTO v_punto FROM "Ubicacion" u
  WHERE u.tipo = 'PUNTO_VENTA'
    AND NOT EXISTS (SELECT 1 FROM "SesionCaja" s WHERE s."ubicacionId" = u.id AND s.estado = 'ABIERTA')
  ORDER BY u.id LIMIT 1;
  BEGIN
    INSERT INTO "SesionCaja" ("ubicacionId", estado, "fechaNegocioColombia", "abiertaPorId", "baseConfiguradaCop", "baseContadaCop")
    VALUES (v_punto, 'ABIERTA', to_char(now() AT TIME ZONE 'America/Bogota', 'YYYY-MM-DD'), v_admin, 200000, 200000)
    RETURNING id INTO v_sesion;
    INSERT INTO "MovimientoCaja" ("sesionCajaId", "usuarioId", tipo, "montoCop", concepto)
    VALUES (v_sesion, v_admin, 'GASTO_MENOR', 0, 'Prueba QA SP1-07');
    RAISE EXCEPTION USING ERRCODE = 'QA001', MESSAGE = 'MovimientoCaja aceptado con monto 0';
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_state = RETURNED_SQLSTATE, v_cons = CONSTRAINT_NAME, v_msg = MESSAGE_TEXT;
    PERFORM pg_temp.qa_registrar(9, 'E1-RN-CAJ-07', 'MovimientoCaja con montoCop = 0', '23514', 'chk_movimiento_caja_monto_positivo', v_state, v_cons, v_msg);
  END;
END $$;

-- -----------------------------------------------------------------------------
-- Post-condición: nada quedó escrito
-- -----------------------------------------------------------------------------
INSERT INTO qa_resultados (orden, caso, descripcion, resultado, mensaje_postgres)
SELECT 10, 'P1-LIMPIEZA', 'No quedaron registros de prueba en la BD',
       CASE WHEN (SELECT count(*) FROM "Ubicacion" WHERE tipo = 'CENTRAL') = 1
             AND NOT EXISTS (SELECT 1 FROM "Ubicacion" WHERE nombre LIKE 'QA SP1-07%')
             AND NOT EXISTS (SELECT 1 FROM "Variante" WHERE sku LIKE 'QA-SP107%')
             AND NOT EXISTS (SELECT 1 FROM "SaldoStock" WHERE fisico < 0 OR "noVendible" < 0)
            THEN 'PASA' ELSE 'FALLA' END,
       'Centrales: ' || (SELECT count(*) FROM "Ubicacion" WHERE tipo = 'CENTRAL');

-- -----------------------------------------------------------------------------
-- RESULTADO FINAL (tomar captura de esta tabla para el Issue #7)
-- -----------------------------------------------------------------------------
SELECT orden, caso, descripcion, resultado, sqlstate, constraint_real, mensaje_postgres
FROM qa_resultados
ORDER BY orden, caso;
