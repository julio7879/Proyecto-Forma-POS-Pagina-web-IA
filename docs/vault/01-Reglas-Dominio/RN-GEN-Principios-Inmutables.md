---
id: RN-GEN
tags: [principios, dinero, cop, timezone, bogota, idempotencia, acid, kardex, seguridad]
criterios_ca: [CA-08, CA-16, CA-17, CA-18, CA-51, CA-52]
modelos_prisma: [RegistroAuditoria, RegistroIdempotencia]
---
# Principios Generales Inquebrantables (RN-GEN-01 a RN-GEN-12)

Relacionado con: [[00-Indice-Mapa-Mental-MOC]] | [[MOD-04-Inventario-Ledger]] | [[Esquema-Prisma-35-Modelos]]

Estas 12 reglas constituyen las invariantes no negociables de la arquitectura del sistema:

- **RN-GEN-01 [D] (Backend Única Fuente de Verdad):** Precios, descuentos, tarifas de envío, disponibilidad de stock y permisos se calculan y validan exclusivamente en el backend. El cliente web (POS, Tienda Web o Panel Admin) jamás calcula totales definitivos ni stock disponible por su cuenta.
- **RN-GEN-02 [D] (Kardex Único e Inmutable):** El stock de una variante solo cambia mediante movimientos inmutables registrados en `InventoryLedgerService`. Queda terminantemente prohibido ejecutar `prisma.saldoStock.update()` o `updateMany()` fuera de este servicio.
- **RN-GEN-03 [D] (Inmutabilidad Histórica):** Ventas, devoluciones, traslados, pagos, sesiones de caja cerradas y movimientos de stock no se editan ni se borran físicamente. Los errores se corrigen mediante documentos inversos o de ajuste motivados.
- **RN-GEN-04 [D] (Dinero Entero COP):** Todo dinero se almacena y calcula en pesos colombianos enteros (`number` entero / `INT` de PostgreSQL), sin centavos ni números de punto flotante. Prohibido usar flotantes; usar siempre `MoneyCOP.ts`.
- **RN-GEN-05 [D] (Zona Horaria Oficial):** Las marcas temporales se persisten en base de datos en UTC (`timestamptz`). Los cortes de día (`YYYY-MM-DD`), meses (`YYYY-MM`), sesiones de caja vencidas (`RN-CAJ-05`) y plazos de devolución se miden en hora legal de Colombia (`America/Bogota`, UTC-5) usando `ColombiaTime.ts`.
- **RN-GEN-06 [D] (Snapshots de Condiciones):** Cada documento (línea de venta, pedido web, devolución) guarda una copia inmutable (*snapshot*) de los precios, costos, descuentos y tarifas vigentes en el momento de la transacción. Modificaciones posteriores en el catálogo no alteran el histórico.
- **RN-GEN-07 [D] (Borrado Lógico):** Todo registro maestro con historial (usuarios, puntos de venta, productos, variantes, promociones) se desactiva (`activa = false`), nunca se borra físicamente.
- **RN-GEN-08 [D] (Idempotencia Transaccional):** Toda mutación transaccional (`POST` de ventas, pedidos, pagos, recepciones) exige el header `Idempotency-Key` para evitar duplicidades por doble clic o reintentos de red.
- **RN-GEN-09 [D] (Atomicidad ACID):** Toda operación que involucre inventario o dinero se ejecuta dentro de `prisma.$transaction` interactiva: se completa al 100% o se realiza un `ROLLBACK` absoluto.
- **RN-GEN-10 [D] (Autorización por Solicitud):** Cada endpoint valida rol, permisos granulares y ámbito geográfico (`ubicacionId`) en cada petición mediante `authPermission.ts`.
- **RN-GEN-11 [D] (Desacoplamiento Logístico-Financiero):** El estado logístico de un pedido web (`EstadoPedidoWeb`) y el estado financiero de su pago (`EstadoPagoWeb`) operan como dos máquinas de estado separadas.
- **RN-GEN-12 [D] (Auditoría Append-Only):** Toda acción sensible (cambios de permisos, ajustes de stock, anulaciones, desbloqueos web) se registra de forma obligatoria en la tabla inmutable `RegistroAuditoria`.
