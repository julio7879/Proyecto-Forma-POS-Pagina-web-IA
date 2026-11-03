# Reserva de Inventario en Dos Niveles: Blanda vs. Dura

El inventario de cada SKU en cada sede mantiene dos niveles diferenciados de reserva digital: `reservadoBlando` (pedidos web pendientes de pago o pendientes de empaque) y `reservadoDuro` (pedidos web en estado `EN_PREPARACION` donde la prenda ya fue retirada físicamente del perchero y empacada). Decidimos este modelo de dos niveles para permitir que el POS ejerza preempción sobre reservas temporales sin arriesgar la venta una vez que el personal de la tienda física ya invirtió tiempo operativo en empacar el pedido web.
