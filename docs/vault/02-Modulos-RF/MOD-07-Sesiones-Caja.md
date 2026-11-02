---
id: MOD-07
modulo: 07-sesiones-caja-arqueo
tags: [caja, arqueo, sesiones, efectivo, base-contada, bogota]
rf_codes: [RF-CAJ-01, RF-CAJ-02, RF-CAJ-03]
modelos_prisma: [SesionCaja, Ubicacion, Usuario]
criterios_ca: [CA-12, CA-15, CA-55, CA-56, QA-007, QA-008, QA-009]
---
# Módulo 07: Sesiones de Caja, Base Contada y Arqueo (RF-CAJ)

Relacionado con: [[RN-CAJ-VTA-Caja-y-Ventas-POS]] | [[Constraints-SQL-e-Indices]] | [[MOD-08-Ventas-POS]]

## 1. Alcance Funcional
Administra la apertura, vigencia diaria y cierre de cajas en puntos físicos, asegurando que cada punto tenga una sola caja abierta y que las sesiones de días anteriores bloqueen operaciones comerciales.

## 2. Requerimientos Funcionales Detallados

| Código RF | Nombre | Actores | Reglas | Entrada → Proceso → Salida | Criterios de Aceptación |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-CAJ-01** | Apertura de caja con base contada | Vendedor (`permCaja`), Admin | `RN-CAJ-01` a `04` | **E:** `ubicacionId`, `baseContadaCop` y observación si difiere de $200.000 COP.<br>**P:** Valida que no exista otra caja abierta en ese punto (`uq_unica_sesion_caja_abierta_por_punto`). Guarda `fechaNegocioColombia = hoy_bogota()`.<br>**S:** Sesión `ABIERTA`. | **QA-007:** Dos aperturas simultáneas en el mismo punto permiten solo una y rechazan la otra. |
| **RF-CAJ-02** | Guardián de vigencia diaria de sesión | Sistema (Middleware POS) | `RN-CAJ-05`, `RN-CAJ-11` | **E:** Intento de venta POS, devolución, cambio o anulación.<br>**P:** Verifica que la sesión abierta pertenezca a `hoy_bogota()`. Si es de un día anterior, bloquea la acción exigiendo su cierre inmediato.<br>**S:** Autorización concedida o `400 Bad Request`. | **CA-12, CA-56, QA-009:** Una caja olvidada de ayer bloquea ventas/devoluciones y solo permite cerrarla. |
| **RF-CAJ-03** | Arqueo y cierre inmutable de caja | Vendedor (`permCaja`), Admin | `RN-CAJ-06` a `10` | **E:** `sesionCajaId`, `efectivoContadoCierreCop` y nota.<br>**P:** Calcula `esperado = baseContadaCop + ventasEfectivo - reembolsosEfectivo`, diferencia y `efectivoAEntregar = max(0, contado - baseConfiguradaCop)`. Pasa a `CERRADA` inmutable.<br>**S:** Arqueo cerrado. | **CA-15, CA-55, QA-008:** Arqueo parte de la base contada real. Efectivo a entregar nunca es negativo. |
