---
id: MOD-06
modulo: 06-traslados-novedades
tags: [traslados, transito, novedades, faltantes, excedentes, retornando]
rf_codes: [RF-TRA-01, RF-TRA-02, RF-TRA-03, RF-TRA-04, RF-TRA-05, RF-TRA-06]
modelos_prisma: [Traslado, LineaTraslado, ResolucionNovedadTraslado, SaldoStock, MovimientoInventario]
criterios_ca: [CA-04, CA-05, CA-06, CA-07, CA-08, CA-09, CA-10, CA-11, CA-57, CA-58, CA-59, QA-010, QA-011, QA-012]
---
# Módulo 06: Traslados entre Sedes, Recepción y Novedades (RF-TRA)

Relacionado con: [[RN-COM-TRA-Compras-y-Traslados]] | [[MOD-04-Inventario-Ledger]] | [[RN-INV-Kardex-y-Saldos]]

## 1. Alcance Funcional
Gestiona el flujo logístico de mercancía entre Bodega Central y los Puntos de Venta, control de mercancía en tránsito, cancelación con retorno físico y conciliación de faltantes/excedentes.

## 2. Requerimientos Funcionales Detallados

| Código RF | Nombre | Actores | Reglas | Entrada → Proceso → Salida | Criterios de Aceptación |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-TRA-01** | Solicitud de punto o Envío directo de Central | Vendedor (`permSolicitarTraslado`), Admin | `RN-TRA-01`, `RN-TRA-02`, `RN-TRA-05` | **E:** Líneas `(varianteId, cantidad > 0)`.<br>**P:** Solicitud inicia en `SOLICITADO`. Envío directo de Central inicia en `APROBADO`. Sin movimiento de stock.<br>**S:** Documento `Traslado` creado. | Puntos solo crean y consultan traslados donde son destino. |
| **RF-TRA-02** | Aprobación total/parcial o rechazo en Central | Administrador | `RN-TRA-04`, `RN-TRA-05` | **E:** `trasladoId`, acción (`APROBAR` con `aprobada <= solicitada` o `RECHAZAR`).<br>**P:** Transiciona a `APROBADO` o `RECHAZADO`. No reserva stock aún.<br>**S:** Traslado evaluado. | **CA-11:** Cantidad aprobada nunca excede la solicitada. |
| **RF-TRA-03** | Despacho desde Central a Tránsito | Administrador | `RN-TRA-03`, `RN-TRA-14` | **E:** `trasladoId` en `APROBADO`, `cantidadEnviada <= aprobada`.<br>**P:** Valida `disponible >= cantidadEnviada`. Resta de físico en Central (`TRASLADO_SALIDA`) y pasa a `ENVIADO` (en tránsito).<br>**S:** Stock en tránsito. | **CA-04, CA-05:** Central baja, tránsito sube. Ningún punto puede vender en tránsito. |
| **RF-TRA-04** | Cancelación y flujo «Retornando a Central» | Admin | `RN-TRA-12`, `RN-AUD-02` | **E:** `trasladoId` y motivo.<br>**P:** En `ENVIADO` pasa a `RETORNANDO_A_CENTRAL` (sigue en tránsito, punto bloqueado). Cuando regresa físicamente a Central, Admin confirma reingreso (+ físico Central) y pasa a `CANCELADO`.<br>**S:** Reingreso verificado. | **CA-09, CA-59, QA-012:** Solo se repone stock en Central cuando Admin confirma reingreso físico. |
| **RF-TRA-05** | Recepción en punto (Completa, Dañados o Novedad) | Vendedor (`permRecibirTraslado`), Admin | `RN-TRA-07` a `11`, `RN-TRA-17` | **E:** `trasladoId`, `Idempotency-Key`, `recibidaBuena`, `recibidaDanada`, `excedenteReportado` y nota.<br>**P:** Valida `recibidaBuena + recibidaDanada <= enviada` (`CA-07`). Suma buenas a físico y dañadas a no vendible. Si `faltantes == 0` y `excedente == 0`: pasa a `RECIBIDO` (`CA-57`). Si hay faltantes o excedente: pasa a `RECIBIDO_CON_NOVEDAD` (`CA-58`).<br>**S:** Traslado recibido o en novedad. | **CA-06, CA-07, CA-08, CA-57, CA-58, QA-010, QA-011:** Dañadas van a no vendible. Faltantes/excedentes abren novedad. |
| **RF-TRA-06** | Resolución administrativa de novedades | Administrador | `RN-TRA-11`, `RN-TRA-18`, `RN-TRA-19` | **E:** `trasladoId`, resolución por línea (`LLEGO`, `RETORNO`, `PERDIDA`, `INCORPORAR_EXCEDENTE`).<br>**P:** Aplica ajustes de Kardex correspondientes. Al resolver el 100% de unidades pendientes pasa a `CERRADO`.<br>**S:** Novedad cerrada. | **CA-10:** Solo Admin resuelve novedades. |
