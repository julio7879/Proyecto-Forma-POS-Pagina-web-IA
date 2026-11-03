# Sistema POS y Tienda Web Multisede (Forma-SPOS)

Glosario canónico y ubicuo del dominio para el Sistema POS + Tienda Web Multisede. Define de forma no ambigua los términos del negocio, sus sinónimos prohibidos y su semántica formal.

---

## 1. Inventario y Kardex

**Kardex (`MovimientoInventario`)**:
Bitácora transaccional e inmutable (*append-only*) que registra cronológicamente cada cambio en el stock físico o reservado de una variante en una sede.
_Avoid_: Historial de stock, tabla de auditoría de inventario, log de inventario.

**Saldo de Stock (`SaldoStock`)**:
Registro cuádruple acumulado por sede y variante que almacena exactamente cuatro cantidades enteras: `fisico`, `reservadoBlando`, `reservadoDuro` y `noVendible`.
_Avoid_: Existencias, balance de stock, inventario actual.

**Preempción POS**:
Regla de negocio donde una venta presencial en mostrador toma de forma prioritaria una prenda que tenía `reservadoBlando` web, forzando la reasignación automática del pedido web a otra sede o custodia en Central.
_Avoid_: Robo de stock, override de inventario, cancelación de reserva.

**Reserva Blanda (`reservadoBlando`)**:
Reserva temporal de stock adquirida por un pedido web en estado `RECIBIDO` o `CONFIRMADO` con vigencia TTL (24h para transferencias), susceptible de ser desplazada por una venta POS presencial.
_Avoid_: Stock comprometido, apartado tentativo, pre-reserva.

**Reserva Dura (`reservadoDuro`)**:
Reserva definitiva y blindada de stock que se activa cuando la sede despachadora cambia el pedido web a `EN_PREPARACION` (prenda empacada); inviolable e inaccesible para ventas POS o reasignaciones automáticas.
_Avoid_: Stock bloqueado, reserva confirmada, apartado permanente.

**Mercancía en Tránsito**:
Unidades enviadas en un traslado inter-sedes que han salido del stock físico del origen pero aún no han sido recibidas en el destino, inaccesibles para venta en ambas sedes.
_Avoid_: Mercancía flotante, stock en camino, traslado pendiente.

**No Vendible (`noVendible`)**:
Subsaldo de inventario físico reservado exclusivamente para artículos devueltos averiados, prendas de uso personal/cosméticos sin derecho a reintegro comercial, o productos en peritaje.
_Avoid_: Merma, descarte, ropa dañada, stock defectuoso.

---

## 2. Ventas y Caja

**Sesión de Caja (`SesionCaja`)**:
Período operativo de recaudo en un punto de venta físico, iniciado con un conteo obligatorio de base inicial (`baseContadaCop`), restringido al día de negocio en hora legal de Colombia (`America/Bogota`) y cerrado mediante arqueo ciego.
_Avoid_: Turno de caja, caja registradora, apertura de caja.

**Arqueo Ciego**:
Protocolo de cierre de caja donde el cajero debe declarar físicamente el dinero en efectivo sin que la interfaz le revele el saldo esperado calculado por el sistema.
_Avoid_: Cuadre de caja, conteo asistido, conciliación visual.

**Base Inicial Contada**:
Importe de dinero en efectivo verificado físicamente por el cajero al momento de abrir la sesión de caja, contrastado contra la base configurada de la sede para registrar posibles descuadres de apertura.
_Avoid_: Fondo de caja, saldo inicial, cambio base.

**Sangría / Retiro de Caja**:
Extracción autorizada de dinero en efectivo de la gaveta durante el turno (por motivos de seguridad o traslado a caja fuerte), clasificada en `MovimientoCaja` con tipo `SANGRIA_RETIRO`.
_Avoid_: Salida de caja, retiro parcial, vaciado de efectivo.

---

## 3. Devoluciones, Cambios y Logística

**Devolución en Mostrador POS**:
Reintegro de un artículo adquirido en tienda física, procesado en la misma sede de la venta raíz dentro de un plazo estricto de 5 días calendario.
_Avoid_: Retorno de compra, reembolso en tienda, reclamo POS.

**Cambio de Prenda**:
Transacción atómica que liquida la devolución de una prenda y la compra simultánea de un nuevo artículo en la misma sesión de caja, conservando el precio neto pagado si es la misma referencia con diferente talla/color.
_Avoid_: Canje, permuta, trueque, sustitución.

**Compensación de Cambio (`COMPENSACION_CAMBIO`)**:
Medio de pago virtual interno en `MetodoPago` que imputa el valor neto liquidado de una prenda devuelta como pago parcial o total de la nueva prenda adquirida en un cambio.
_Avoid_: Saldo a favor, nota de crédito, vale de tienda, bono de cambio.

**Retorno Logístico (Web)**:
Proceso operativo donde un pedido web en modalidad `CONTRAENTREGA` no puede ser entregado (`NO_ENTREGADO`); la mercancía reingresa al stock físico y el cobro se cancela sin afectar las Ventas Netas del ejercicio.
_Avoid_: Devolución contraentrega, rebote de envío, cancelación de guía.

**Devolución Comercial Web (Derecho de Retracto)**:
Reintegro de un pedido web previamente pagado y entregado, ejercido dentro de los 5 días hábiles siguientes a la entrega; la prenda puede reingresar en Central o cualquier sede, pero la deducción contable se imputa a la sede despachadora original.
_Avoid_: Reclamo de garantía web, anulación de despacho, retracto logístico.

---

## 4. Comercio Electrónico y Geografía

**Cuarentena de SKU**:
Bloqueo selectivo de un SKU específico en una sede (`bloqueadoDespachoWeb = true`), aplicado automáticamente cuando la sede notifica «No puedo despachar», evitando que se le sigan asignando pedidos web de esa referencia.
_Avoid_: Veto de producto, tienda inhabilitada, SKU suspendido.

**Custodia en Bodega Central**:
Estado de contingencia de un pedido web donde ninguna sede con cobertura cuenta con el stock completo; el pedido es asumido por Bodega Central con `tieneIncidenciaStock = true` para abastecimiento o decisión administrativa.
_Avoid_: Pedido huérfano, pedido en el limbo, backorder.

**Asignación Determinista de Sede**:
Algoritmo puro que selecciona la sede óptima de despacho para un carrito web considerando sucesivamente: 1) stock completo del carrito, 2) menor flete DANE, 3) menor orden de prioridad, 4) menor ID alfanumérico.
_Avoid_: Ruteo inteligente, balanceo dinámico de pedidos, asignación por cercanía.
