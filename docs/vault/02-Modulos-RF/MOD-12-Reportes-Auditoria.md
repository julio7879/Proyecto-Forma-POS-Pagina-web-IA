---
id: MOD-12
modulo: 12-reportes-auditoria-dashboard
tags: [reportes, dashboard, auditoria, ventas-netas, alertas]
rf_codes: [RF-REP-01, RF-REP-02]
modelos_prisma: [RegistroAuditoria, VentaPOS, PedidoWeb, DevolucionPOS, DevolucionComercialWeb]
criterios_ca: [CA-47, CA-48, CA-49, QA-023]
---
# Módulo 12: Reportes Financieros, Dashboard y Auditoría (RF-REP)

Relacionado con: [[RN-GEN-Principios-Inmutables]] | [[MOD-08-Ventas-POS]] | [[MOD-11-Pedidos-Web-DANE]]

## 1. Alcance Funcional
Proporciona el cálculo inmutable de Ventas Netas por sede, canal y método de pago, el centro de alertas operativas en tiempo real y la bitácora de auditoría append-only para trazabilidad forense.

## 2. Requerimientos Funcionales Detallados

| Código RF | Nombre | Actores | Reglas | Entrada → Proceso → Salida | Criterios de Aceptación |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-REP-01** | Reporte de Ventas Netas con imputación geográfica | Admin, Vendedor (`permVerVentasPunto`) | `RN-REP-01` a `06`, `RN-WEB-24` | **E:** Rango de fechas en `America/Bogota` y sede.<br>**P:** Formula oficial: `Ventas Netas = (Ventas POS + Ventas Web Reconocidas) - (Devoluciones POS + Devoluciones Web imputadas)`. Excluye fletes, bases y retornos logísticos. Vendedor solo ve su sede; Admin ve consolidado.<br>**S:** Cuadro de mando financiero. | **CA-47 a CA-49:** Restricción de alcance por rol; mes cerrado inmutable. |
| **RF-REP-02** | Centro de alertas y log de auditoría inmutable | Administrador | `RN-AUD-01`, `RN-AUD-02`, `RN-WEB-16` | **E:** Consulta de eventos sensibles y alertas.<br>**P:** Consulta `RegistroAuditoria` append-only. Filtra pedidos con incidencia en Central, cajas vencidas, traslados retrasados y SKUs en cuarentena.<br>**S:** Panel de control gerencial. | **QA-023:** Prohibido modificar o borrar registros de auditoría. |
