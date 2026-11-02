---
id: MOD-04
modulo: 04-inventario-kardex-ledger
tags: [inventario, kardex, saldos, ledger, bloqueos, deadlock, ajustes]
rf_codes: [RF-INV-01, RF-INV-02, RF-INV-03, RF-INV-04]
modelos_prisma: [SaldoStock, MovimientoInventario, Variante, Ubicacion]
criterios_ca: [CA-01, CA-02, CA-03, QA-003]
---
# Módulo 04: Inventario Multisede, Kardex Inmutable y Ajustes (RF-INV)

Relacionado con: [[RN-INV-Kardex-y-Saldos]] | [[RN-GEN-Principios-Inmutables]] | [[Constraints-SQL-e-Indices]]

## 1. Alcance Funcional
Proporciona el motor central de consistencia de stock (`InventoryLedgerService`) para todas las transacciones del sistema, garantizando control de concurrencia, bloqueo ordenado anti-deadlock e historial append-only.

## 2. Requerimientos Funcionales Detallados

| Código RF | Nombre | Actores | Reglas | Entrada → Proceso → Salida | Criterios de Aceptación |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-INV-01** | Motor transaccional de Kardex con bloqueo canónico | Sistema | `RN-GEN-02`, `RN-GEN-09`, `RN-INV-01` a `05` | **E:** Comandos de movimiento `(ubicacionId, varianteId, tipo, cantidadConSigno, documentoTipo, documentoId, motivo)`.<br>**P:** 1) Ordena por `varianteId ASC`. 2) Bloquea con `SELECT ... FOR UPDATE`. 3) Verifica que ningún saldo quede negativo ni reservas > físico (`chk_saldo_stock_no_negativo`). 4) Actualiza `SaldoStock`, marca `tieneMovimientos = true` e inserta en `MovimientoInventario` inmutable.<br>**S:** Saldos actualizados atómicamente. | **CA-01, CA-02, QA-003:** Stock insuficiente provoca ROLLBACK. Concurrencia de la última unidad procesa una y rechaza la otra (stock en 0, jamás negativo). |
| **RF-INV-02** | Carga inicial y Ajustes manuales motivados | Administrador | `RN-INV-02`, `RN-INV-06`, `RN-INV-08` | **E:** `ubicacionId`, `varianteId`, cantidad entera con signo y motivo obligatorio.<br>**P:** Valida rol `ADMIN`. Invoca `InventoryLedgerService`. Si tenía `bloqueadoDespachoWeb == true`, permite rehabilitar despacho web. Audita.<br>**S:** Ajuste asentado en Kardex. | **CA-03:** Vendedores reciben `403 Forbidden` al intentar hacer ajustes. |
| **RF-INV-03** | Bajas de saldo «No vendible» | Administrador | `RN-INV-08`, `RN-AUD-02` | **E:** `ubicacionId`, `varianteId`, cantidad y motivo de merma/destrucción.<br>**P:** Descuenta de `noVendible` con tipo `BAJA_NO_VENDIBLE`. Audita.<br>**S:** Saldo defectuoso depurado. | Unidades no vendibles nunca suman a disponible ni se trasladan. |
| **RF-INV-04** | Consulta de inventario por alcance de rol | Admin, Vendedor | `RN-INV-07`, `RN-INV-09`, `RN-ROL-05` | **E:** Filtros por sede, categoría o SKU.<br>**P:** Vendedor requiere `permVerInventario` (su sede) o `permVerOtrosPuntos` (otras sedes). Muestra físico, reservado blando, reservado duro, disponible y alertas.<br>**S:** Tabla de inventario. | Vendedor sin permiso para otros puntos recibe `403`. |
