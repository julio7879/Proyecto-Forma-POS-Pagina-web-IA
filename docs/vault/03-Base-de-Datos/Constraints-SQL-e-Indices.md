---
id: DB-SQL-CONSTRAINTS
tags: [sql, postgresql, check, indices-unicos, supabase, integridad]
criterios_ca: [CA-01, CA-02, CA-12, CA-51, QA-007]
---
# Restricciones Nativas SQL e Índices Únicos Parciales

Relacionado con: [[Esquema-Prisma-35-Modelos]] | [[RN-INV-Kardex-y-Saldos]] | [[RN-CAJ-VTA-Caja-y-Ventas-POS]]

Para blindar la integridad del sistema más allá del ORM Prisma, se ejecuta el script oficial `backend/prisma/constraints_post_migrate.sql` inmediatamente después de la primera migración de Prisma (`RNF-002`):

```sql
-- backend/prisma/constraints_post_migrate.sql
-- Ejecutar inmediatamente después de la primera migración de Prisma (RNF-002)

-- 1. Prohibición absoluta de saldos negativos o reservas superiores al stock físico (RN-INV-01, RN-VTA-03)
ALTER TABLE "SaldoStock"
  ADD CONSTRAINT chk_saldo_stock_no_negativo
  CHECK (
    "fisico" >= 0
    AND "reservadoBlando" >= 0
    AND "reservadoDuro" >= 0
    AND "noVendible" >= 0
    AND "fisico" >= ("reservadoBlando" + "reservadoDuro")
  );

-- 2. Garantizar que exista máximo UNA Bodega Central en todo el sistema (RN-UBI-01)
CREATE UNIQUE INDEX IF NOT EXISTS uq_unica_bodega_central
  ON "Ubicacion" ("tipo")
  WHERE "tipo" = 'CENTRAL';

-- 3. Garantizar que exista máximo UNA sesión de caja ABIERTA por cada punto de venta (RN-CAJ-03, QA-007)
CREATE UNIQUE INDEX IF NOT EXISTS uq_unica_sesion_caja_abierta_por_punto
  ON "SesionCaja" ("ubicacionId")
  WHERE "estado" = 'ABIERTA';

-- 4. Prohibir precios de venta menores o iguales a cero (RN-CAT-04)
ALTER TABLE "Variante"
  ADD CONSTRAINT chk_precio_venta_positivo
  CHECK ("precioVentaCop" > 0);

-- 5. Prohibir movimientos de caja con montos menores o iguales a cero (RN-CAJ-07, RN-GEN-04)
ALTER TABLE "MovimientoCaja"
  ADD CONSTRAINT chk_movimiento_caja_monto_positivo
  CHECK ("montoCop" > 0);
```

## Justificación Técnica de los Guardrails SQL
1. **`chk_saldo_stock_no_negativo`:** Impide físicamente en el motor de base de datos que una condición de carrera o un bug en el código deje stock en negativo o que las reservas excedan el físico.
2. **`uq_unica_bodega_central`:** Asegura que a nivel físico no pueda crearse más de una Bodega Central mediante un índice único parcial condicionado a `tipo = 'CENTRAL'`.
3. **`uq_unica_sesion_caja_abierta_por_punto`:** Previene aperturas simultáneas en el mismo punto de venta (`QA-007`), garantizando que un cajero no opere sobre dos cajas paralelas.
4. **`chk_precio_venta_positivo`:** Garantiza que ninguna variante nazca con precio negativo o cero (`CA-51`).
5. **`chk_movimiento_caja_monto_positivo`:** Asegura que todo ingreso o retiro manual de caja tenga un importe positivo en pesos enteros (`INT`).
