---
name: pos-kardex-transaction
description: Procedimiento obligatorio para programar cualquier caso de uso que consulte, reserve, descuente, traslade o ajuste inventario o dinero en el Sistema POS y Tienda Web. Activar al tocar ventas POS, pedidos web, traslados, compras, devoluciones o sesiones de caja.
---
# Transacciones Seguras de Inventario y Dinero (POS + Web)

1. **Consultar Reglas en el Vault:** Lee en `docs/vault/01-Reglas-Dominio/` únicamente la nota del módulo actual antes de escribir código.
2. **Validación Zod:** Exige `z.number().int().positive()` para cantidades y precios.
3. **Ordenamiento Canónico Anti-Deadlock:** Ordena siempre las líneas por `varianteId ASC` antes de adquirir locks en base de datos:
   `const lineasOrdenadas = [...lineas].sort((a, b) => a.varianteId - b.varianteId);`
4. **Bloqueo y Kardex Atómico:** Dentro de `prisma.$transaction`, usa `tx.$queryRaw` con `FOR UPDATE` a través de `InventoryLedgerService` para actualizar `SaldoStock` e insertar en `MovimientoInventario`.
5. **Dos Niveles de Reserva (`RN-VTA-03`):**
   - Venta POS: verifica `fisico - reservadoDuro >= cantidad`. Si toma unidades de `reservadoBlando`, reasigna el pedido web afectado en la misma transacción (`RN-WEB-16`).
   - Pedido Web / Traslado: verifica `fisico - reservadoBlando - reservadoDuro >= cantidad`.
6. **Consecutivo Diferido (`RN-VTA-09`):** Incrementa `ConsecutivoUbicacion` como última instrucción antes del `COMMIT`.
