---
id: MOD-05
modulo: 05-compras-proveedores
tags: [compras, proveedores, central, recepcion, idempotencia]
rf_codes: [RF-COM-01, RF-COM-02]
modelos_prisma: [CompraProveedor, LineaCompra, SaldoStock, MovimientoInventario]
criterios_ca: []
---
# Módulo 05: Compras a Proveedores en Bodega Central (RF-COM)

Relacionado con: [[RN-COM-TRA-Compras-y-Traslados]] | [[MOD-04-Inventario-Ledger]] | [[RN-GEN-Principios-Inmutables]]

## 1. Alcance Funcional
Gestiona la adquisición de mercancía a proveedores ingresando exclusivamente por Bodega Central, con soporte para cancelación previa y recepción única e idempotente.

## 2. Requerimientos Funcionales Detallados

| Código RF | Nombre | Actores | Reglas | Entrada → Proceso → Salida | Criterios de Aceptación |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-COM-01** | Creación y cancelación de orden de compra | Administrador | `RN-COM-01`, `RN-COM-02`, `RN-COM-05` a `07` | **E:** Proveedor, contacto, notas y líneas (`varianteId`, `cantidadPedida > 0`, costo opcional).<br>**P:** Crea compra en `PEDIDA` sin tocar stock. Permite pasar a `CANCELADA` sin efecto en inventario.<br>**S:** Orden registrada. | En `PEDIDA` o `CANCELADA` no altera saldos de Central. |
| **RF-COM-02** | Recepción única de compra e ingreso a Central | Administrador | `RN-COM-03`, `RN-COM-04`, `RN-GEN-08` | **E:** `compraId`, `Idempotency-Key` y `cantidadRecibida >= 0` por línea.<br>**P:** En `prisma.$transaction`, valida estado `PEDIDA`. Suma `+ cantidadRecibida` al físico de Central vía `InventoryLedgerService` (`COMPRA_RECIBIDA`) y pasa a `RECIBIDA` inmutable.<br>**S:** Stock ingresado en Central. | Recepción idempotente (`RN-COM-03`). Reintentos no duplican stock. |
