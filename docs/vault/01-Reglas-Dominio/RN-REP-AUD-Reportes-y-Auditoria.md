---
id: RN-REP-AUD
tags: [reglas-negocio, reportes, ventas-netas, auditoria, bitacora, inmutabilidad]
criterios_ca: [CA-64, CA-65, QA-023]
modelos_prisma: [RegistroAuditoria, VentaPOS, DevolucionPOS, PedidoWeb, DevolucionComercialWeb]
relacionados: [RN-GEN-Principios-Inmutables, MOD-12-Reportes-Auditoria, Matriz-CA-01-a-CA-65]
---

# Reglas de Negocio: Reportes Financieros y Bitácora de Auditoría (`RN-REP` y `RN-AUD`)

Este documento compila las reglas oficiales de cálculo analítico de Ventas Netas, corte temporal oficial y bitácora forense *append-only*.

---

## 1. Reglas de Reportes Financieros y Ventas Netas (`RN-REP-01` a `RN-REP-06`)

- **RN-REP-01 [D] (Fórmula Oficial de Ventas Netas):**
  $$\text{Ventas Netas} = (\text{Ventas POS} + \text{Ventas Web Reconocidas}) - (\text{Devoluciones POS} + \text{Devoluciones Web Imputadas})$$
  - Todos los importes se consolidan en pesos colombianos enteros (`INT`, `RN-GEN-04`).
- **RN-REP-02 [D] (Exclusión Estricta de Fletes y Bases):**
  - El valor recaudado por concepto de fletes de envío (`fleteCop`) pertenece al operador logístico y **no** forma parte de las Ventas Netas.
  - La base inicial de caja (`baseCajaCop`) y los ingresos/egresos manuales menores son movimientos de flujo de caja, no venta neta.
- **RN-REP-03 [D] (Imputación Geográfica en Devoluciones Web, `CA-65`):**
  - Si un pedido web fue despachado y reconocido por la tienda física Centro (Sede 2) y posteriormente el cliente tramita una devolución comercial en Bodega Central:
    - La mercancía física reingresa a Central (`RETORNO_COMERCIAL`).
    - La deducción de la Venta Neta se imputa obligatoriamente a la tienda Centro (`ubicacionImputacionVentaId: 2`) que contabilizó la venta original.
- **RN-REP-04 [D] (Exclusión de Retornos Logísticos Contraentrega, `CA-64`):**
  - Si un pedido web contraentrega es rechazado por el cliente en el domicilio y la transportadora lo devuelve a Bodega Central:
    - El reingreso al inventario físico se tipifica como `RETORNO_LOGISTICO_WEB_VENDIBLE`.
    - Este retorno **no** descuenta de Ventas Netas, porque el pedido nunca estuvo en estado `PAGADO` (la venta jamás fue reconocida).
- **RN-REP-05 [D] (Corte Temporal Oficial Colombia, `RN-GEN-05`):**
  - Los reportes diarios, semanales o mensuales se agrupan evaluando las marcas de tiempo en el huso horario oficial `America/Bogota` (`YYYY-MM-DD` y `YYYY-MM`).
- **RN-REP-06 [D] (Inmutabilidad de Periodos Cerrados):**
  - Una vez concluido el mes calendario en hora legal de Colombia, los totales de ventas y cierres de caja quedan sellados; cualquier ajuste o devolución posterior se imputa en el mes en que efectivamente se procesa la transacción de retorno.

---

## 2. Reglas de Bitácora de Auditoría (`RN-AUD-01` a `RN-AUD-03`)

- **RN-AUD-01 [D] (Bitácora Append-Only Inmutable, `RN-GEN-03`, `QA-023`):**
  - La tabla `RegistroAuditoria` es estrictamente de inserción (*append-only*). Queda prohibido ejecutar `UPDATE` o `DELETE` sobre registros de auditoría.
- **RN-AUD-02 [D] (Eventos Auditables Obligatorios):**
  - Se genera un registro de auditoría con `usuarioId`, `accion`, `entidad`, `entidadId`, `ip`, `datosPrevios` y `datosNuevos` ante:
    1. Ajustes manuales motivados de inventario (`RN-INV-02`).
    2. Apertura, arqueo y cierre forzoso o regular de sesiones de caja (`RN-CAJ-01`, `RN-CAJ-06` y `RN-CAJ-10`).
    3. Anulaciones de ventas POS o pedidos web.
    4. Cambios de rol o asignación de permisos a usuarios (`RN-ROL-05`).
    5. Desactivación de sedes (`RN-UBI-05`).
- **RN-AUD-03 [D] (Centro de Alertas Gerenciales):**
  - El sistema detecta y expone en el dashboard gerencial alertas prioritarias:
    - Sesiones de caja con más de 24 horas abiertas sin cierre (`RN-CAJ-05`).
    - Pedidos web en custodia en Bodega Central con incidencia de stock (`RN-UBI-04`).
    - Descuadres de caja superiores al umbral de tolerancia.
    - SKUs con stock disponible inferior al umbral mínimo de seguridad (`RN-INV-07`).
