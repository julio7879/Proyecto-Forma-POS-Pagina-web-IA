---
id: ARQ-04
tags: [arquitectura, concurrencia, acid, deadlock, reservas, idempotencia]
---
# Patrones de Concurrencia y Consistencia en Base de Datos

Relacionado con: [[00-Indice-Mapa-Mental-MOC]] | [[RN-INV-Kardex-y-Saldos]] | [[RN-GEN-Principios-Inmutables]]

## Catálogo de los 9 Patrones de Concurrencia y Consistencia

| # | Patrón Técnico | Reglas / Casos Resueltos | Implementación en Prisma + PostgreSQL |
| :---: | :--- | :--- | :--- |
| **1** | **Bloqueo Pesimista con Orden Canónico** | `RN-INV-05`, `CA-02`, `CA-38`, `QA-003` (Anti-deadlock y anti-sobreventa). | Ordenar líneas por `varianteId ASC` antes de adquirir locks: `SELECT * FROM "SaldoStock" ... ORDER BY "varianteId" ASC FOR UPDATE`. |
| **2** | **Preempción de Reserva en 2 Niveles** | `RN-VTA-03`, `RN-WEB-16`, `CA-60`, `CA-61`, `QA-004`, `QA-005`. | Distingue `reservadoBlando` (`RECIBIDO`/`CONFIRMADO`) y `reservadoDuro` (`EN_PREPARACION`). El POS vende si `fisico - reservadoDuro >= cant` y reasigna el pedido web si tomó blando. |
| **3** | **Cuarentena de SKU por Ubicación** | `RN-WEB-16`, `CA-43`, `CA-62` (Evita bucle al reportar «No puedo despachar»). | Activa `bloqueadoDespachoWeb = true` en `SaldoStock` para ese par `(ubicacionId, varianteId)` hasta ajuste administrativo. |
| **4** | **Custodia en Bodega Central** | `RN-WEB-16`, `CA-60`, `QA-013` (Garantiza que `ubicacionAsignadaId` jamás sea `NULL`). | Si ninguna sede tiene stock completo, se asigna en custodia a Central con `tieneIncidenciaStock = true` y `tieneReservaActiva = false`. |
| **5** | **Control Optimista por Versión** | `CA-08`, `CA-42`, `QA-014` (Colisión en cambio de estado de traslados/pedidos). | Condición en update: `WHERE id = :id AND version = :versionLeida`. Si no actualiza filas, arroja `HTTP 409 Conflict`. |
| **6** | **Clave de Idempotencia Transaccional** | `RN-GEN-08`, `RN-TRA-10`, `CA-08`, `CA-18`, `QA-006`. | Cabecera `Idempotency-Key`. Se almacena en `RegistroIdempotencia` en la misma transacción; si se repite, retorna la respuesta previa sin duplicar efectos. |
| **7** | **Worker TTL sin Bloqueo (`SKIP LOCKED`)** | `RN-WEB-07`, `RN-WEB-09`, `CA-39`, `QA-015`. | Worker periódico cancela pedidos con transferencia vencida (24h) reclamando filas con `SELECT ... FOR UPDATE SKIP LOCKED`. |
| **8** | **Secuencias Diferidas al Final de Transacción** | `RN-VTA-09`, `RN-DEV-13`, `CA-17`. | El incremento sobre `ConsecutivoUbicacion` se ejecuta en la última instrucción antes del `COMMIT`, reduciendo la retención del lock a $<1$ ms. |
| **9** | **Invariantes Declarativas e Índices Parciales** | `RN-INV-01`, `RN-CAJ-03`, `RN-UBI-01`, `QA-007`. | `CHECK` para impedir stock negativo (`fisico >= reservadoBlando + reservadoDuro`) y `UNIQUE INDEX ... WHERE` para garantizar 1 Central y 1 caja abierta. |
