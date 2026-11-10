---
id: MOD-09
modulo: 09-promociones-descuentos
tags: [descuentos, promociones, cupones, prorrateo, topes]
rf_codes: [RF-DES-01, RF-DES-02]
modelos_prisma: [Promocion, LineaVentaPOS, LineaPedidoWeb]
criterios_ca: [CA-19, CA-20, CA-21, CA-22, CA-23, CA-24, CA-25]
---
# Módulo 09: Motor de Promociones, Descuentos y Prorrateo (RF-DES)

Relacionado con: [[RN-DES-Promociones-y-Prorrateo]] | [[MOD-08-Ventas-POS]] | [[MOD-11-Pedidos-Web-DANE]]

## 1. Alcance Funcional
Administra los cupones de promoción por código, los descuentos manuales autorizados para vendedores en mostrador y el motor de prorrateo exacto por línea con asignación de residuos.

## 2. Requerimientos Funcionales Detallados

| Código RF | Nombre | Actores | Reglas | Entrada → Proceso → Salida | Criterios de Aceptación |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-DES-01** | Gestión de promociones por código | Administrador | `RN-DES-01`, `RN-DES-02` | **E:** Código, tipo (`PORCENTAJE` / `VALOR_FIJO`), canal, fechas y mínimo de compra.<br>**P:** Guarda promoción. Si ya fue usada, prohíbe eliminarla y solo permite desactivarla.<br>**S:** Promoción guardada. | **CA-24:** Modificar o desactivar cupones usados no altera ventas pasadas. |
| **RF-DES-02** | Cálculo y prorrateo de descuentos | Sistema (POS y Web) | `RN-DES-01`, `RN-DES-04`, `RN-DES-05`, `RN-DES-07`, `RN-DES-09` | **E:** Líneas del carrito y cupón o descuento manual.<br>**P:** 1) Prohíbe acumular descuentos (`CA-22`). 2) Promoción mayor a base se limita a la base dejando productos en $0 (`CA-25`). 3) Descuento manual POS valida `permDescuentoManual` y `topeDescuentoPorc` (`CA-23`). 4) Aplica `Math.floor(D * L_i / B)` y asigna residuo a la última línea (`CA-20`).<br>**S:** Descuentos y netos guardados en snapshot. | **CA-19 a CA-23, CA-25:** Prorrateo exacto sin pérdida de centavos ($1.000 entre 3 da 333, 333 y 334). |
