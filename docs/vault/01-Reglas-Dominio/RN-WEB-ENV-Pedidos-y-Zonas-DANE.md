---
id: RN-WEB-ENV
tags: [web, ecommerce, dane, envios, reservas, ttl, cuarentena, custodia, retornos, devoluciones-web]
criterios_ca: [CA-35, CA-36, CA-37, CA-38, CA-39, CA-40, CA-41, CA-42, CA-43, CA-44, CA-45, CA-46, CA-62, CA-64, CA-65, QA-013, QA-014, QA-015, QA-020, QA-021, QA-022]
modelos_prisma: [PedidoWeb, LineaPedidoWeb, HistorialEstadoPedidoWeb, DevolucionComercialWeb, TarifaZonaEnvio, ExcepcionTarifaEnvio, MunicipioDane]
---
# Reglas de Pedidos Web, Envíos DANE y Retornos (RN-WEB y RN-ENV)

Relacionado con: [[MOD-11-Pedidos-Web-DANE]] | [[RN-INV-Kardex-y-Saldos]] | [[MOD-12-Reportes-Auditoria]]

## 1. Zonas de Envío DANE y Fletes (`RN-ENV-01` a `RN-ENV-04`)
- **RN-ENV-01 [D] (Liquidación por Municipio DANE y Cobertura):** El flete se liquida comparando el municipio DANE de la sede que despacha con el municipio DANE destino. Solo se despacha a municipios con `atendidoWeb = true` (`CA-37`).
- **RN-ENV-02 [D] (Tarifas y Plazos por Zona):**
  - **Zona 1 (Mismo Municipio):** $8.000 COP · 1 a 2 días hábiles.
  - **Zona 2 (Mismo Departamento):** $12.000 COP · 2 a 3 días hábiles.
  - **Zona 3 (Misma Región Geográfica):** $16.000 COP · 3 a 4 días hábiles.
  - **Zona 4 (Diferente Región):** $22.000 COP · 4 a 6 días hábiles.
- **RN-ENV-03 [D] (Excepción por Par Origen-Destino):** Si existe un registro en `ExcepcionTarifaEnvio` para ese par origen-destino, se aplica su tarifa y días en lugar de la zona estándar.
- **RN-ENV-04 [D] (Flete Entero COP y Cobro Aparte):** El flete se expresa en COP entero (`RN-GEN-04`) y se cobra aparte del subtotal de productos; no se prorratea con descuentos de línea.

## 2. Semáforo de Disponibilidad Web
- **RN-WEB-02 [D] (Semáforo de Disponibilidad Web):** El catálogo público muestra «Disponible» si `disponible >= 5`, «Últimas unidades» si `1 <= disponible <= 4`, y «Agotado» si `disponible == 0`. Nunca expone unidades numéricas exactas al público.

## 3. Asignación Determinista de Sede (`RN-WEB-05`, `CA-35`, `CA-36`)
Para todo el carrito web (sin envíos divididos):
1. **Filtro de Sedes Candidatas:** Sedes activas con `despachaWeb = true`, `bloqueadoDespachoWeb = false` para todos los SKUs del carrito, y `disponible >= cantidad` en **todas** las líneas.
2. **Criterio de Desempate Estricto:**
   1. Menor `tarifaCop` calculada hacia el destino.
   2. Menor `prioridadDespacho` (Centro: 10, Ocaña: 20, Bucaramanga: 30, Central: 40).
   3. Menor `id` numérico de ubicación.
3. Se incrementa `reservadoBlando` en la sede seleccionada.

## 4. TTL de Reservas, Cuarentena y Custodia en Central
- **RN-WEB-09 [D] (Worker TTL 24h, `CA-39`, `QA-015`):**
  Un pedido con pago `TRANSFERENCIA` en estado `RECIBIDO` tiene un TTL de 24 horas (`reservaExpiraEn`). Un worker periódico (cada 60 segundos) busca pedidos expirados usando `SELECT ... FOR UPDATE SKIP LOCKED`, libera `reservadoBlando` y pasa el pedido a `CANCELADO` sin colisionar con el Admin.
- **RN-WEB-15 [D] (Paso a «En Preparación», `CA-42`):**
  Mueve el stock de `reservadoBlando` a **`reservadoDuro`**. A partir de este hito, el POS no puede tomar el stock (`CA-61`) y el Admin no puede reasignar la tienda manualmente.
- **RN-WEB-16 [D] («No puedo despachar», Cuarentena y Custodia en Central, `CA-43`, `CA-62`, `QA-013`):**
  Si una sede asignada reporta «No puedo despachar»:
  1) Se activa `bloqueadoDespachoWeb = true` para esos SKUs en esa sede específica (cuarentena de SKU).
  2) Se libera la reserva blanda en esa sede y se reasigna a la siguiente tienda candidata.
  3) **Si ninguna otra sede tiene stock completo:** Se asigna en custodia a **Bodega Central** con `tieneIncidenciaStock = true` y `tieneReservaActiva = false`, emitiendo alerta al Administrador. El pedido jamás queda con ubicación `NULL` ni rebota en bucle infinito.

## 5. Retorno Logístico vs. Devolución Comercial Web
- **Retorno Logístico (Contraentrega No Entregado, `RN-WEB-23`, `CA-64`, `QA-020`):**
  Aplica a pedidos `CONTRAENTREGA` que nunca estuvieron en `PAGADO` (no son venta reconocida). Si pasa a `NO_ENTREGADO`, la mercancía reingresa a stock y el cobro se anula, **sin restar de Ventas Netas ni computar como devolución financiera**.
- **Devolución Comercial Web (`RN-DEV-14`, `CA-65`, `QA-021`):**
  Aplica a pedidos que ya fueron `PAGADOS` y `ENVIADOS` (ventas reconocidas). Plazo: **5 días hábiles** desde la entrega. La prenda puede reingresar físicamente en cualquier sede (incluso Central), pero la deducción financiera de la devolución se imputa **siempre a la ubicación que despachó y reconoció la venta originalmente** (`ubicacionImputacionVentaId`).
