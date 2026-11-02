---
id: ARQ-03
tags: [arquitectura, patrones, diseno, hexagonal, vertical-slices, ledger]
---
# Patrones de Arquitectura y Diseño de Software

Relacionado con: [[00-Indice-Mapa-Mental-MOC]] | [[ARQ-01-Estrategia-y-Alcance-MVP]]

## 1. Patrones de Arquitectura de Sistema
1. **Monolito Modular con Vertical Slices:** 12 módulos de dominio independientes. Cada caso de uso agrupa comando, validación Zod, lógica de negocio y persistencia (`prisma.$transaction`).
2. **Arquitectura Hexagonal (Ports & Adapters):** El dominio define puertos abstractos inyectables:
   - `PagoPort` (simulado en MVP $\rightarrow$ futuro Wompi/PayU).
   - `DespachoTransportadoraPort` (guía manual $\rightarrow$ futuro API Coordinadora/Envia).
   - `FacturacionPort` (comprobante interno $\rightarrow$ futuro DIAN).
   - `NotificacionPort` (bandeja simulada $\rightarrow$ futuro SMTP/WhatsApp).
3. **CQRS Ligero:** Separación clara entre mutaciones con bloqueo transaccional (*Commands*) y consultas optimizadas indexadas para reportes y catálogo público (*Queries*).
4. **Eventos de Dominio en Proceso:** Registro de auditoría *append-only*, invalidación de caché de permisos y alertas operativas gestionadas de forma síncrona/transaccional.

## 2. Patrones de Diseño (GoF y Dominio Empresarial)
- **Accounting Entry / Inventory Ledger (Fowler):** `InventoryLedgerService` es el único autorizado para modificar `SaldoStock`, requiriendo un `MovimientoInventario` inmutable por cada cambio.
- **Money & Penny Allocation (Fowler):** Utilidad `MoneyCOP` para aritmética entera y prorrateo exacto (`Math.floor()` con residuo a la última línea elegible, `RN-DES-09`).
- **Declarative State Machine:** Máquinas de estado finitas para compras, traslados, pedidos web, pagos y sesiones de caja.
- **Strategy + Composed Comparator:** Algoritmo `RN-WEB-05` de asignación DANE: `1.° tarifaCop ASC`, `2.° prioridadDespacho ASC`, `3.° id ASC`.
- **Snapshot + Root Reference:** Cada línea guarda fotos inmutables de precios y descuentos, con puntero a la venta raíz (`ventaOrigenRaizId`) para controlar plazos de devolución (`RN-DEV-03`).
- **Unit of Work:** Toda mutación de stock o dinero se ejecuta dentro de un único bloque `prisma.$transaction`.
