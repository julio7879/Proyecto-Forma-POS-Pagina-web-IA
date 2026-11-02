---
id: MOD-10
modulo: 10-devoluciones-cambios
tags: [devoluciones, cambios, anulaciones, reembolsos, iliquidez, venta-raiz]
rf_codes: [RF-DEV-01, RF-DEV-02, RF-DEV-03, RF-DEV-04]
modelos_prisma: [DevolucionPOS, LineaDevolucionPOS, VentaPOS, DevolucionComercialWeb, SaldoStock]
criterios_ca: [CA-26, CA-27, CA-28, CA-29, CA-30, CA-31, CA-32, CA-33, CA-34, CA-54, CA-63, CA-65, QA-016, QA-017, QA-018, QA-019, QA-021]
---
# Módulo 10: Anulaciones, Devoluciones y Cambios (RF-DEV)

Relacionado con: [[RN-DEV-Devoluciones-y-Cambios]] | [[MOD-07-Sesiones-Caja]] | [[MOD-04-Inventario-Ledger]]

## 1. Alcance Funcional
Gestiona la reversión de operaciones de venta, devoluciones por dinero o saldo a favor en POS y web, cambios de prendas y control de iliquidez en caja registradora.

## 2. Requerimientos Funcionales Detallados

| Código RF | Nombre | Actores | Reglas | Entrada → Proceso → Salida | Criterios de Aceptación |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-DEV-01** | Anulación de venta de la sesión de caja de hoy | Vendedor (`permAnularVentas`), Admin | `RN-DEV-12`, `RN-CAJ-11` | **E:** `ventaId` y motivo.<br>**P:** Valida que sea de la caja `ABIERTA` de hoy y sin devoluciones previas. Repone stock, anula venta y descuenta del esperado de caja.<br>**S:** Venta `ANULADA`. | **CA-33:** Bloqueado si la caja está cerrada o es de días anteriores. |
| **RF-DEV-02** | Devolución en POS con plazo raíz y liquidez | Vendedor (`permDevoluciones`), Admin | `RN-DEV-01` a `10`, `CA-54` | **E:** Venta original, líneas, condición física y medio de reembolso.<br>**P:** 1) Misma tienda y caja abierta hoy (`CA-29`). 2) Plazo de **5 días calendario desde venta raíz** (`CA-63`). 3) Reembolso sobre neto prorrateado (`CA-26`). 4) Cosméticos van forzosos a no vendible (`CA-31`). 5) Si falta efectivo en caja, autoriza transferencia con ref/nota sin dejar la caja negativa (`CA-54`).<br>**S:** Comprobante `DevolucionPOS`. | **CA-26 a 29, CA-31, CA-34, CA-54, CA-63, QA-019:** Plazo raíz estricto y excepción de iliquidez funcional. |
| **RF-DEV-03** | Operación atómica de Cambio en POS | Vendedor (`permDevoluciones`), Admin | `RN-DEV-11`, `CA-30`, `CA-63` | **E:** Líneas devueltas + líneas nuevas.<br>**P:** 1) Mismo producto (talla/color) conserva precio neto: **diferencia $0 COP** (`QA-017`). 2) Producto distinto factura a precio lista vigente (`QA-018`). 3) Nueva venta preserva la fecha y venta raíz original (`CA-63`).<br>**S:** Devolución y venta enlazadas en una transacción. | **CA-30, CA-63, QA-017, QA-018:** Cambio de talla a $0 no renueva los 5 días de garantía. |
| **RF-DEV-04** | Devolución Comercial Web imputada a origen | Administrador | `RN-DEV-14` a `16`, `CA-65` | **E:** Pedido web pagado/enviado, líneas, sede de reingreso físico y transferencia.<br>**P:** Valida 5 días hábiles desde entrega. Ingresa stock en la sede receptora, pero resta financieramente de las Ventas Netas del **punto que despachó el pedido** (`CA-65`).<br>**S:** Devolución comercial registrada. | **CA-65, QA-021:** La tienda que despachó asume la resta financiera en reportes. |
