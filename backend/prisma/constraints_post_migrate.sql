-- Ejecutar inmediatamente después de las migraciones de Prisma (RNF-002)

-- 1. Prohibición absoluta de saldos negativos o reservas superiores al stock físico (RN-INV-01, RN-VTA-03)
DO $$
BEGIN
  ALTER TABLE "SaldoStock"
    ADD CONSTRAINT chk_saldo_stock_no_negativo
    CHECK (
      "fisico" >= 0
      AND "reservadoBlando" >= 0
      AND "reservadoDuro" >= 0
      AND "noVendible" >= 0
      AND "fisico" >= ("reservadoBlando" + "reservadoDuro")
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Garantizar que exista máximo UNA Bodega Central en todo el sistema (RN-UBI-01)
CREATE UNIQUE INDEX IF NOT EXISTS uq_unica_bodega_central
  ON "Ubicacion" ("tipo")
  WHERE "tipo" = 'CENTRAL';

-- 3. Garantizar que exista máximo UNA sesión de caja ABIERTA por cada punto de venta (RN-CAJ-03, QA-007)
CREATE UNIQUE INDEX IF NOT EXISTS uq_unica_sesion_caja_abierta_por_punto
  ON "SesionCaja" ("ubicacionId")
  WHERE "estado" = 'ABIERTA';

-- 4. Prohibir precios de venta menores o iguales a cero (RN-CAT-04)
DO $$
BEGIN
  ALTER TABLE "Variante"
    ADD CONSTRAINT chk_precio_venta_positivo
    CHECK ("precioVentaCop" > 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 5. Prohibir montos menores o iguales a cero en movimientos de caja (RN-GEN-04, RN-CAJ-07)
DO $$
BEGIN
  ALTER TABLE "MovimientoCaja"
    ADD CONSTRAINT chk_movimiento_caja_monto_positivo
    CHECK ("montoCop" > 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
