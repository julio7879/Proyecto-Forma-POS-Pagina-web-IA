---
id: MOD-08
modulo: 08-ventas-pos-terminal
tags: [pos, terminal, ventas, preempcion, efectivo, transferencia, consecutivo]
rf_codes: [RF-POS-01, RF-POS-02]
modelos_prisma: [VentaPOS, LineaVentaPOS, PagoVentaPOS, ConsecutivoUbicacion, SaldoStock]
criterios_ca: [CA-13, CA-14, CA-16, CA-17, CA-18, CA-60, CA-61, QA-004, QA-005, QA-006]
---
# Módulo 08: Terminal Punto de Venta (POS) y Prioridad Física (RF-POS)

Relacionado con: [[RN-CAJ-VTA-Caja-y-Ventas-POS]] | [[MOD-04-Inventario-Ledger]] | [[MOD-09-Descuentos]]

## 1. Alcance Funcional
Gestiona el carrito de ventas en mostrador, precios oficiales validados en servidor, preempción de stock sobre pedidos web blandos, protección de reservas duras y facturación con consecutivos diferidos.

## 2. Requerimientos Funcionales Detallados

| Código RF | Nombre | Actores | Reglas | Entrada → Proceso → Salida | Criterios de Aceptación |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-POS-01** | Búsqueda de catálogo en terminal POS | Vendedor (`permVender`), Admin | `RN-VTA-03`, `CA-16` | **E:** Búsqueda por SKU, nombre o categoría en terminal.<br>**P:** Muestra variantes activas en la sede con su precio oficial vigente en BD y stock físico/disponible.<br>**S:** Variante añadida al carrito POS. | **CA-16:** El backend ignora precios del frontend y usa `variante.precioVentaCop`. |
| **RF-POS-02** | Confirmación atómica de Venta POS con Preempción | Vendedor (`permVender`), Admin | `RN-VTA-01`, `02`, `03`, `09` y `10`, `RN-WEB-16`, `RN-GEN-08` | **E:** `Idempotency-Key`, líneas, descuento opcional y pagos (`EFECTIVO` / `TRANSFERENCIA`).<br>**P:** En `prisma.$transaction`: 1) Valida caja abierta hoy. 2) Ordena líneas `varianteId ASC` y bloquea con `FOR UPDATE`. 3) Verifica `fisico - reservadoDuro >= cantidad`. Si toma unidades de `reservadoBlando`, procede y reasigna los pedidos web afectados (`CA-60`). Si están en `reservadoDuro` (`EN_PREPARACION`), aborta (`CA-61`). 4) Descuenta stock, genera consecutivo diferido y guarda venta.<br>**S:** Venta `COMPLETADA` y comprobante impreso. | **CA-13, CA-14, CA-17, CA-18, CA-60, CA-61, QA-004 a 006:** Venta atómica e idempotente. Prioridad sobre reserva blanda, protege reserva dura. |
