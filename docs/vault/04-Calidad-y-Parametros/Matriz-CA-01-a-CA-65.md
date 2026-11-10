---
id: MATRIZ-CA
tags: [calidad, criterios, ca, qa, testing, vitest]
---
# Matriz Completa de Criterios de Aceptación (CA-01 a CA-65) y Casos QA

Relacionado con: [[00-Indice-Mapa-Mental-MOC]] | [[PROGRESO-ACTUAL]] | [[RN-GEN-Principios-Inmutables]]

Esta matriz define los 65 criterios de aceptación normativos y los 25 casos de prueba cruzados (`QA-001` a `QA-025`) que deben verificarse en verde antes de dar por terminado cualquier módulo:

## A. Inventario, Catálogo y Traslados
| ID | Escenario Verificable | Resultado Esperado Exacto |
| :--- | :--- | :--- |
| **CA-01** | Un punto tiene 2 unidades disponibles y se intenta vender 3 | Se rechaza con «stock insuficiente» y el stock no cambia. |
| **CA-02 / QA-003** | Queda 1 unidad y dos ventas POS (o pedidos web) la confirman simultáneamente | Una se completa, la otra falla con conflicto (`409`); stock final `0`, jamás negativo. |
| **CA-03** | Un vendedor intenta realizar un ajuste manual de inventario | El backend lo rechaza (`403`). Solo el Administrador puede, con motivo obligatorio. |
| **CA-04** | Central con 30 unidades envía 30 a un punto | Central queda en `0` y tránsito en `30`. Al recibir buenas, el punto queda con `30`. |
| **CA-05** | Hay 30 unidades en estado `ENVIADO` (en tránsito) | Ni Central ni el punto destino pueden venderlas. |
| **CA-06** | Se envían 30 y el punto recibe 27 buenas | Con observación obligatoria suma 27 a físico y pasa a `RECIBIDO_CON_NOVEDAD`. |
| **CA-07** | Se intenta digitar `recibidaBuena + recibidaDanada = 31` sobre 30 enviadas | Se rechaza; la suma no puede superar lo enviado. |
| **CA-08** | La misma confirmación de recepción de traslado se envía dos veces | Respuesta idempotente; el stock jamás se duplica. |
| **CA-09** | Cancelar traslado en estado `ENVIADO` | Pasa a `RETORNANDO_A_CENTRAL`. La mercancía continúa en tránsito y el punto destino queda bloqueado de recibirla. |
| **CA-59 / QA-012** | Confirmar reingreso físico en Bodega Central de traslado retornando | Pasa a `CANCELADO` y repone el stock físico en Central. |
| **QA-014** | Dos administradores o procesos intentan cambiar de estado el mismo traslado a la vez | Manejo por versión de entidad (`version`); uno completa la transición y el otro recibe `409 Conflict`. |
| **CA-10** | Vendedor intenta resolver novedad de traslado | Se rechaza (`403`). Solo el Admin resuelve novedades pasando el traslado a `CERRADO`. |
| **CA-11** | Solicitado 30, aprobado 20, se intenta enviar 25 | Se rechaza: lo enviado no puede superar lo aprobado. |
| **CA-57 / QA-010** | Se envían 30 y llegan 28 buenas y 2 dañadas | Con observación, suma 28 a físico, 2 a no vendible y pasa directo a `RECIBIDO`. |
| **CA-58 / QA-011** | Llegan 31 de 30 y se marca novedad por excedente | Pasa a `RECIBIDO_CON_NOVEDAD`. Admin resuelve incorporando o descartando. |
| **QA-001 / QA-002** | Crear variante con SKU propio y cambiar precio tras venta | Cada talla maneja stock independiente. Cambiar precio no altera snapshots pasados. |

## B. Ventas POS y Sesiones de Caja
| ID | Escenario Verificable | Resultado Esperado Exacto |
| :--- | :--- | :--- |
| **CA-12** | Venta POS sin sesión de caja abierta en el punto | Se rechaza. |
| **CA-13** | Venta en efectivo de $117.000 con billete de $120.000 | Vuelto $3.000; efectivo esperado de la caja sube exactamente $117.000. |
| **CA-14** | Venta POS por transferencia sin referencia | Se rechaza. Con referencia: no suma al efectivo esperado de la caja. |
| **CA-15 / QA-008** | Cierre de caja con conteo de dinero | `esperado = baseContada + ventasEfectivo - reembolsosEfectivo - sangríasRetiros - gastosMenores + ingresosManuales`. `efectivoAEntregar = max(0, contado - baseConfigurada)`. |
| **CA-16** | Petición manipulada desde el cliente envía un precio alterado | Backend ignora el precio del cliente y aplica `precioVentaCop` vigente en BD. |
| **CA-17** | Falla el descuento de inventario durante la venta | ROLLBACK total: no queda venta, ni pago, ni salto de consecutivo. |
| **CA-18 / QA-006 / QA-025** | Reintento con misma `Idempotency-Key` en venta POS | Se devuelve la venta original; jamás se descuenta doble stock. |
| **CA-55** | Caja abre con base contada menor a la configurada | Efectivo esperado parte de la base contada real sin arrastrar faltantes falsos. |
| **CA-56 / QA-009** | Sesión de caja abierta de un día anterior en Colombia | Bloquea ventas, devoluciones, cambios y anulaciones; solo admite cierre. |
| **CA-60 / QA-004** | POS compra prenda que tiene reserva web blanda (`RECIBIDO`) | Venta POS procede con prioridad; el pedido web se reasigna a otra sede o Central. |
| **CA-61 / QA-005** | POS intenta vender prenda con reserva web dura (`EN_PREPARACION`) | Venta POS se bloquea: la prenda empacada está blindada. |
| **QA-007** | Dos aperturas simultáneas de caja en el mismo punto | Solo una procede; la otra se rechaza por índice único parcial. |

## C. Descuentos y Promociones
| ID | Escenario Verificable | Resultado Esperado Exacto |
| :--- | :--- | :--- |
| **CA-19** | Promoción del 10% sobre subtotal elegible | Descuento del 10% prorrateado exactamente por línea. |
| **CA-20** | Descuento fijo de $1.000 sobre 3 líneas de $10.000 | Partes: $333, $333 y $334 (residuo asignado a la última línea). Suma $1.000. |
| **CA-21** | Cupón vencido o sin monto mínimo | Se rechaza con mensaje explicativo. |
| **CA-22** | Intentar combinar dos promociones o promoción con descuento manual | Se rechaza por regla de no acumulación. |
| **CA-23** | Vendedor intenta superar su tope de descuento manual | Se rechaza. Solo el Admin puede aplicar descuentos mayores. |
| **CA-24** | Editar cupón usado previamente | No altera ventas ni pedidos históricos. |
| **CA-25** | Promoción fija mayor al subtotal de productos | Descuento se limita al subtotal dejando productos en $0 COP. Flete se cobra aparte. |

## D. Devoluciones, Cambios y Anulaciones
| ID | Escenario Verificable | Resultado Esperado Exacto |
| :--- | :--- | :--- |
| **CA-26** | Devolver 1 prenda de una venta con descuento | Reembolsa el neto unitario prorrateado efectivamente pagado, no el precio lista. |
| **CA-27** | Devolución en POS el día 6 | Vendedor es bloqueado; solo el Admin puede autorizarla motivadamente. |
| **CA-28** | Devolver más unidades de las compradas | Se rechaza. |
| **CA-29** | Devolver en Tienda B una compra de Tienda A | Se rechaza (`RN-DEV-01`). |
| **CA-30 / QA-017 / QA-018** | Cambio de prenda en mostrador | Misma prenda (talla/color) diferencia $0 COP. Prenda distinta factura a precio lista vigente. |
| **CA-31 / QA-016** | Devolución de cosméticos o artículos no reintegrables | Entran obligatoriamente a saldo `noVendible`. |
| **CA-32** | Reembolso en efectivo en POS | Resta del efectivo esperado de la caja actual. |
| **CA-33** | Anular venta de hoy vs venta de sesión cerrada | Permitido solo en la sesión abierta de hoy; cerrada se rechaza. |
| **CA-34** | Devolución en diciembre de venta de noviembre | Noviembre no cambia; resta en Ventas Netas de diciembre. |
| **CA-54 / QA-019** | Iliquidez de efectivo en caja al devolver | Habilita reembolso por transferencia sin dejar la caja negativa. |
| **CA-63** | Cambio en Día 4 e intento de devolución en Día 7 | Bloqueado: los 5 días se cuentan siempre desde la venta raíz (Día 1). |

## E. Pedidos Web, Envíos DANE y Reportes
| ID | Escenario Verificable | Resultado Esperado Exacto |
| :--- | :--- | :--- |
| **CA-35** | Desempate entre sedes con stock completo | Menor flete DANE, luego menor prioridad de despacho, luego menor ID. |
| **CA-36** | Ninguna sede individual tiene todo el carrito | Checkout bloqueado (no se dividen pedidos). |
| **CA-37** | Municipio destino sin cobertura web | Checkout bloqueado indicando falta de cobertura. |
| **CA-38** | Dos clientes web confirman última unidad a la vez | Uno completa y reserva; el otro recibe aviso de agotado. |
| **CA-39 / QA-015** | Transferencia web impaga vence 24h | Worker cancela pedido y libera reserva blanda con `SKIP LOCKED`. |
| **CA-40** | Pedido contraentrega entregado con pago pendiente | No suma a ventas reconocidas hasta que el Admin registra `PAGADO`. |
| **CA-41** | Vendedor de otra sede intenta despachar pedido | Rechazado (`403 Forbidden`). |
| **CA-42** | Reasignar pedido en estado `EN_PREPARACION` | Se rechaza: reserva dura está blindada. |
| **CA-43 / QA-013** | Tienda asignada marca «No puedo despachar» | Cuarentena de SKU en esa tienda (`bloqueadoDespachoWeb = true`), liberación de reserva blanda y reasignación automática a siguiente sede candidata. |
| **CA-62** | Ninguna sede candidata tiene stock completo para pedido web reasignado | Asignación forzosa en custodia a **Bodega Central** con `tieneIncidenciaStock = true` y alerta inmediata al Admin (sin quedar sede `NULL` ni rebotar en bucle). |
| **CA-44 / QA-022** | Cliente consulta pedidos de otro cliente | `403/404 Forbidden`. |
| **CA-45** | Pedido pagado el 30-Nov y enviado el 02-Dic | Venta web se reconoce el 02-Dic (fecha del último hito). |
| **CA-46** | Cliente intenta cancelar pedido `EN_PREPARACION` | Bloqueado: debe tramitarlo con soporte. |
| **CA-64 / QA-020** | Contraentrega no entregado pasa a `NO_ENTREGADO` | Retorno logístico: repone stock sin restar de Ventas Netas ni contar como devolución financiera. |
| **CA-65 / QA-021** | Devolución comercial web de prenda en Central | Prenda reingresa a Central pero la resta de Ventas Netas se imputa al punto que despachó (`ubicacionImputacionVentaId`). |

## F. Reportes, Seguridad, Invariantes y UI
| ID | Escenario Verificable | Resultado Esperado Exacto |
| :--- | :--- | :--- |
| **CA-47** | Cálculo de Ventas Netas de un período en hora legal Colombia | `ventasNetas = ventasBrutas - devolucionesAprobadas`; excluye estrictamente fletes de envío y bases iniciales de caja. |
| **CA-48** | Reporte financiero de mes cerrado | Una devolución procesada en diciembre de una compra de noviembre no altera el reporte histórico de noviembre. |
| **CA-49** | Consulta de reportes y métricas según el rol | Vendedor solo puede consultar métricas de su sede; Administrador consulta reportes consolidados y de cualquier sede. |
| **CA-50** | Revocación instantánea de permisos en memoria ($O(1)$) | Admin revoca permiso a usuario; siguiente petición rechaza la acción de inmediato sin esperar expiración del JWT (`UserPermissionCache`). |
| **CA-51** | Validación de precio de venta unitario en catálogo | Rechaza variantes con precio <= 0 o con decimales (`chk_precio_venta_positivo`). |
| **CA-52** | Agrupación temporal y vigencia de caja en `America/Bogota` | Fechas UTC se convierten a hora legal colombiana (UTC-5) para determinar pertenencia al día o mes de negocio (`ColombiaTime`). |
| **CA-53** | UI de Terminal POS adaptativa sin scroll vertical | A resolución mínima 1024x768px la pantalla de cobro se visualiza completa, con zonas táctiles y botones numéricos >= 48x48px. |
| **QA-023** | Bitácora inmutable de auditoría *append-only* | Acciones sensibles (permisos, anulaciones, ajustes) quedan en `RegistroAuditoria`; prohibido `UPDATE` o `DELETE`. |
| **QA-024** | Intento de acceso cruzado entre sedes por rol VENDEDOR | Vendedor de Sede A intenta consultar o mutar recursos transaccionales de Sede B; el backend bloquea con `403 Forbidden`. |
