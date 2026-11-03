---
name: pos-postgres-concurrency-optimizer
description: Optimización de concurrencia, bloqueos a nivel de fila y transacciones ACID en PostgreSQL y Prisma (inspirada en microsoft/postgres-skills). Activar al diseñar o auditar endpoints transaccionales con alta concurrencia, como ventas en mostrador, pagos web simultáneos, traslados entre sedes y consultas de stock en tiempo real.
---

# Optimizador de Concurrencia y PostgreSQL en Alta Carga

Esta skill condensa las mejores prácticas de ingeniería transaccional de `microsoft/postgres-skills` adaptadas a PostgreSQL 15+, Prisma ORM y el Sistema POS Multisede.

---

## Cuándo Activar Esta Skill
- Al diseñar operaciones que adquieran bloqueos (`SELECT ... FOR UPDATE`, `UPDATE`, `INSERT`).
- Al optimizar transacciones batch con múltiples productos o variantes (`registrarMovimientosBatch`).
- Al diagnosticar cuellos de botella de bloqueo, contención o posibles deadlocks en el log de base de datos.
- Al verificar que los índices cubran adecuadamente las condiciones `WHERE`, `ORDER BY` y claves foráneas.

---

## Guía Técnica de Implementación

### 1. El Mandato del Orden Canónico (`RNF-003`)
Para prevenir *Deadlocks* (ciclos de bloqueo mutuo entre dos transacciones concurrentes):
- Todo lock pesimista sobre `SaldoStock` o `VarianteProducto` **DEBE** ordenar sus IDs ascendentemente antes de ejecutar la consulta:
  ```typescript
  const itemsOrdenados = [...items].sort((a, b) => a.varianteId - b.varianteId);
  ```
- Prohibido adquirir bloqueos en orden arbitrario o en el orden que los envió el cliente.

### 2. Duración Mínima de la Transacción (Anti-Contención)
- Las transacciones interactivas (`prisma.$transaction`) deben mantener los bloqueos por el menor tiempo posible:
  - **Fuera de la transacción:** Validaciones Zod, cálculo de hash bcrypt, llamadas a APIs externas (Google OAuth, transportadoras, pasarelas de pago).
  - **Dentro de la transacción:** Únicamente lecturas `FOR UPDATE` y escrituras atómicas en BD.
  - **Última instrucción:** Asignación del consecutivo por punto de venta (`RN-VTA-09`) inmediatamente antes del `COMMIT`.

### 3. Evitar Falsos Conflictos con Reservas Atómicas
- En lugar de verificar y luego actualizar en dos pasos desacoplados (susceptible a *Time-of-Check to Time-of-Use / TOCTOU*):
  - Utiliza incrementos/decrementos atómicos de PostgreSQL:
    ```typescript
    prisma.usuario.update({
      where: { id: usuarioId },
      data: { intentosFallidosLogin: { increment: 1 } }
    });
    ```
  - En inventario, centraliza en `InventoryLedgerService.ts` (`RN-GEN-02`), que ejecuta la verificación y el insert en `MovimientoInventario` de forma indivisible.

### 4. Auditoría de Índices y Planes de Ejecución
- Cada clave foránea (`usuarioId`, `ubicacionId`, `varianteId`, `pedidoId`) debe poseer índice B-Tree dedicado para evitar escaneos secuenciales (`Seq Scan`) durante bloqueos de integridad referencial (`P2003`).
- Los filtros temporales frecuentes (ej. `bloqueadoHasta > NOW()`, `fechaCreacion`) deben ser evaluados en UTC nativo.
