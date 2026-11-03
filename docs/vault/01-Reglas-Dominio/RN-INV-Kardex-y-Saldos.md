---
id: RN-INV
tags: [inventario, kardex, saldos, ledger, reservas, deadlock, bloqueo-canonico]
criterios_ca: [CA-01, CA-02, CA-03, QA-003]
modelos_prisma: [SaldoStock, MovimientoInventario, Variante, Ubicacion]
---
# Reglas de Inventario y Kardex Ledger (RN-INV-01 a RN-INV-09)

Relacionado con: [[MOD-04-Inventario-Ledger]] | [[RN-GEN-Principios-Inmutables]] | [[Constraints-SQL-e-Indices]]

## 1. Saldo Cuádruple por Ubicación y Variante (`RN-INV-01`)
En la tabla `SaldoStock` cada registro mantiene 4 valores enteros (`>= 0`):
1. **`fisico`:** Conteo real existente dentro de la sede física.
2. **`reservadoBlando`:** Unidades comprometidas en pedidos web en estado `RECIBIDO` o `CONFIRMADO`.
3. **`reservadoDuro`:** Unidades empacadas en pedidos web en estado `EN_PREPARACION`.
4. **`noVendible`:** Mercancía averiada, defectuosa o devuelta no apta para venta comercial.

### Fórmulas Oficiales:
- **Disponible General (Web y Traslados):**
  ```text
  disponible = fisico - reservadoBlando - reservadoDuro
  ```
- **Restricción PostgreSQL (`chk_saldo_stock_no_negativo`):**
  ```sql
  CHECK (fisico >= 0 AND reservadoBlando >= 0 AND reservadoDuro >= 0 AND noVendible >= 0
         AND fisico >= (reservadoBlando + reservadoDuro))
  ```

## 2. Invariantes del Motor Ledger (`InventoryLedgerService`)
- **RN-INV-02 [D] (Ajustes Manuales):** Solo el Administrador puede ajustar saldos directamente, indicando siempre motivo estandarizado y cantidad con signo. Genera registro en `MovimientoInventario` y `RegistroAuditoria` (`CA-03`).
- **RN-INV-03 [D] (Ordenamiento Canónico Anti-Deadlock, `RNF-003`):** Antes de adquirir bloqueos con `SELECT ... FOR UPDATE` en `prisma.$transaction`, el arreglo de líneas se ordena siempre en memoria por `varianteId ASC`:
  ```typescript
  const lineasOrdenadas = [...lineas].sort((a, b) => a.varianteId - b.varianteId);
  ```
- **RN-INV-04 [D] (Centralización Absoluta):** Ningún controlador o servicio puede alterar `SaldoStock` directamente. Toda mutación pasa por `InventoryLedgerService.registrarMovimiento()`.
- **RN-INV-05 [D] (Concurrencia Estricta, `CA-02`, `QA-003`):** Si dos transacciones intentan adquirir la última unidad disponible, una se procesa y la otra falla con error de stock insuficiente (`409 Conflict`), manteniendo el stock en 0 y jamás negativo.
- **RN-INV-06 [D] (Carga Inicial):** La carga inicial de inventario se registra con tipo de movimiento canónico `CARGA_INICIAL` con motivo "Inventario inicial".
- **RN-INV-07 [D] (Alerta de Stock Bajo):** Cuando `disponible <= umbralStockBajo` (3 unidades por defecto), el sistema dispara alerta en el panel de inventario.
- **RN-INV-08 [D] (Bajas de No Vendible):** Las unidades defectuosas solo salen de `noVendible` mediante baja motivada (`BAJA_NO_VENDIBLE`) o reincorporación motivada.
- **RN-INV-09 [D] (26 Tipos Granulares en `TipoMovimientoStock`):** Cada inserción en Kardex tipifica el movimiento distinguiendo signo y condición física (`VENTA_POS`, `ANULACION_VENTA_POS`, `COMPRA_RECIBIDA`, `TRASLADO_ENVIADO`, `TRASLADO_RECIBIDO_BUENO`, `DEVOLUCION_POS_VENDIBLE`, `DEVOLUCION_POS_NO_VENDIBLE`, `RESERVA_WEB`, `ENDURECIMIENTO_RESERVA_WEB`, `DESPACHO_WEB`, etc., según `schema.prisma`).
