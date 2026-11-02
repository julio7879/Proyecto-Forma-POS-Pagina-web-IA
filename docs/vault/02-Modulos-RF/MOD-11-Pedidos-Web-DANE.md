---
id: MOD-11
modulo: 11-pedidos-web-dane-envios
tags: [web, ecommerce, dane, reservas, worker, ttl, custodia, retorno-logistico]
rf_codes: [RF-WEB-01, RF-WEB-02, RF-WEB-03, RF-WEB-04, RF-WEB-05, RF-WEB-06, RF-WEB-07]
modelos_prisma: [PedidoWeb, LineaPedidoWeb, HistorialEstadoPedidoWeb, TarifaZonaEnvio, SaldoStock]
criterios_ca: [CA-35, CA-36, CA-37, CA-38, CA-39, CA-40, CA-41, CA-42, CA-43, CA-44, CA-45, CA-46, CA-62, CA-64, QA-013, QA-014, QA-015, QA-020]
---
# Módulo 11: Tienda Web, Despacho Geográfico DANE y Pedidos (RF-WEB)

Relacionado con: [[RN-WEB-ENV-Pedidos-y-Zonas-DANE]] | [[MOD-04-Inventario-Ledger]] | [[RN-INV-Kardex-y-Saldos]]

## 1. Alcance Funcional
Gestiona la vitrina web pública, liquidación de fletes DANE, algoritmo determinista de asignación de sede, worker de reservas con expiración a 24 horas, cuarentena de SKU, custodia en Bodega Central y retorno logístico.

## 2. Requerimientos Funcionales Detallados

| Código RF | Nombre | Actores | Reglas | Entrada → Proceso → Salida | Criterios de Aceptación |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-WEB-01** | Catálogo con semáforo de disponibilidad | Público, Cliente | `RN-WEB-02`, `RN-CAT-06` | **E:** Navegación en tienda online.<br>**P:** Calcula disponible web agregado en sedes habilitadas. Muestra «Disponible», «Últimas unidades» (`<= 5`) o «Agotado».<br>**S:** Catálogo seguro sin exponer unidades numéricas. | Oculta stock real al público. |
| **RF-WEB-02** | Flete por Zonas DANE 1 a 4 | Cliente, Admin | `RN-ENV-01` a `06` | **E:** Municipio origen y municipio destino DANE.<br>**P:** Valida `atendidoWeb == true`. Asigna Zona 1 ($8k), 2 ($12k), 3 ($16k) o 4 ($22k) o excepción.<br>**S:** Flete entero COP y días hábiles. | **CA-37:** Destino sin cobertura bloquea el checkout. |
| **RF-WEB-03** | Asignación determinista de sede y reserva blanda | Cliente Autenticado | `RN-WEB-03` a `08`, `CA-35`, `CA-36` | **E:** Carrito completo, destino DANE y pago (`TRANSFERENCIA` / `CONTRAENTREGA`).<br>**P:** Busca sedes con stock completo para todo el pedido. Desempata por: 1) menor flete; 2) menor `prioridadDespacho`; 3) menor ID. Bloquea con `FOR UPDATE` e incrementa `reservadoBlando`.<br>**S:** Pedido `RECIBIDO` asignado. | **CA-35, CA-36, CA-38:** Sin envíos divididos. Concurrencia de última unidad resuelta sin sobreventa. |
| **RF-WEB-04** | Worker periódico de expiración TTL (60s) | Sistema (Worker) | `RN-WEB-09`, `CA-39` | **E:** Ejecución cada 60 segundos.<br>**P:** Busca pedidos por transferencia vencidos (`> 24h`) usando `FOR UPDATE SKIP LOCKED`. Libera reserva blanda y cancela el pedido.<br>**S:** Stock devuelto automáticamente. | **CA-39, QA-015:** Cancela transferencias impagas sin bloquear pedidos en revisión. |
| **RF-WEB-05** | Preparación, Despacho y Reconocimiento de Venta | Admin, Vendedor (`permPedidosWeb`) | `RN-WEB-10` a `12`, `RN-WEB-22` | **E:** Cambio de estado del pedido web.<br>**P:** `CONFIRMADO -> EN_PREPARACION` mueve de reserva blanda a reserva dura (`CA-42`). `ENVIADO` resta físico y reserva dura. Reconoce venta cuando se cumple `PAGADO` y `ENVIADO` (`CA-40`, `CA-45`).<br>**S:** Pedido actualizado y venta registrada. | **CA-40, CA-42, CA-45:** Contraentrega reconoce venta al registrar cobro y entrega. |
| **RF-WEB-06** | «No puedo despachar», Cuarentena y Custodia en Central | Vendedor, Admin | `RN-WEB-15`, `RN-WEB-16`, `CA-43`, `CA-62` | **E:** `pedidoId`, SKUs con problema y nota.<br>**P:** Libera reserva, marca `bloqueadoDespachoWeb = true` para ese SKU en ese punto y reasigna. Si ninguna otra tienda tiene stock, asigna en custodia a **Bodega Central** con `tieneIncidenciaStock = true` y alerta al Admin.<br>**S:** Pedido reasignado o en custodia Central. | **CA-43, CA-62, QA-013:** Cero pedidos huérfanos sin ubicación; sin bucle infinito. |
| **RF-WEB-07** | Retorno Logístico sin distorsión de Ventas Netas | Administrador | `RN-WEB-23`, `CA-64` | **E:** Pedido contraentrega `ENVIADO` que pasa a `NO_ENTREGADO`.<br>**P:** Repone stock y anula cobro **sin restar de Ventas Netas ni computar como devolución comercial**.<br>**S:** Retorno asentado con precisión financiera. | **CA-64, QA-020:** Contraentrega fallido no resta ventas ficticias. |
