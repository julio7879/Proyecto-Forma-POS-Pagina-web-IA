---
id: DB-PRISMA
tags: [base-de-datos, prisma, modelos, tablas, enums, postgresql]
modelos_prisma: [RegionEnvio, DepartamentoDane, MunicipioDane, TarifaZonaEnvio, ExcepcionTarifaEnvio, Ubicacion, Usuario, Categoria, Producto, Variante, SaldoStock, MovimientoInventario, CompraProveedor, LineaCompra, Traslado, LineaTraslado, ResolucionNovedadTraslado, SesionCaja, ConsecutivoUbicacion, Promocion, VentaPOS, LineaVentaPOS, PagoVentaPOS, DevolucionPOS, LineaDevolucionPOS, PedidoWeb, LineaPedidoWeb, HistorialEstadoPedidoWeb, DevolucionComercialWeb, FestivoColombia, ParametroSistema, RegistroIdempotencia, RegistroAuditoria]
---
# Estructura Física de Base de Datos: 33 Modelos y 15 Enums

Relacionado con: [[Constraints-SQL-e-Indices]] | [[00-Indice-Mapa-Mental-MOC]] | [[MOD-04-Inventario-Ledger]]

El esquema oficial de base de datos se implementa en PostgreSQL (Supabase Cloud) mediante Prisma ORM (`backend/prisma/schema.prisma`), constando de **33 modelos relacionales** y **15 enumeraciones**:

## 1. Catálogo de los 15 Enums
1. **`RolUsuario`:** `ADMIN`, `VENDEDOR`, `CLIENTE`.
2. **`TipoUbicacion`:** `CENTRAL`, `PUNTO_VENTA`.
3. **`TipoMovimientoStock` (26 tipos granulares canónicos):** `CARGA_INICIAL`, `COMPRA_RECIBIDA`, `TRASLADO_ENVIADO`, `TRASLADO_RECIBIDO_BUENO`, `TRASLADO_RECIBIDO_DANADO`, `TRASLADO_CANCELADO_REINGRESO`, `NOVEDAD_LLEGO_DESTINO`, `NOVEDAD_RETORNO_ORIGEN`, `NOVEDAD_PERDIDA`, `NOVEDAD_EXCEDENTE_INCORPORADO`, `VENTA_POS`, `ANULACION_VENTA_POS`, `DEVOLUCION_POS_VENDIBLE`, `DEVOLUCION_POS_NO_VENDIBLE`, `RESERVA_WEB`, `LIBERACION_RESERVA_WEB`, `ENDURECIMIENTO_RESERVA_WEB`, `DESPACHO_WEB`, `RETORNO_LOGISTICO_WEB_VENDIBLE`, `RETORNO_LOGISTICO_WEB_NO_VENDIBLE`, `DEVOLUCION_COMERCIAL_WEB_VENDIBLE`, `DEVOLUCION_COMERCIAL_WEB_NO_VENDIBLE`, `AJUSTE_POSITIVO_FISICO`, `AJUSTE_NEGATIVO_FISICO`, `AJUSTE_POSITIVO_NO_VENDIBLE`, `BAJA_NO_VENDIBLE`.
4. **`EstadoCompra`:** `PEDIDA`, `RECIBIDA`, `CANCELADA`.
5. **`EstadoTraslado`:** `SOLICITADO`, `APROBADO`, `RECHAZADO`, `ENVIADO`, `RETORNANDO_A_CENTRAL`, `RECIBIDO`, `RECIBIDO_CON_NOVEDAD`, `CERRADO`, `CANCELADO`.
6. **`TipoResolucionNovedad`:** `LLEGO_DESPUES`, `RETORNO_A_CENTRAL`, `PERDIDA_ASUMIDA`, `INCORPORAR_A_PUNTO`, `DESCARTAR_EXCEDENTE`.
7. **`EstadoSesionCaja`:** `ABIERTA`, `CERRADA`.
8. **`EstadoVentaPOS`:** `COMPLETADA`, `ANULADA`.
9. **`MetodoPago`:** `EFECTIVO`, `TRANSFERENCIA`.
10. **`TipoDescuento`:** `PORCENTAJE`, `VALOR_FIJO`.
11. **`AlcancePromocion`:** `GLOBAL_ORDEN`, `CATEGORIA`, `PRODUCTO`.
12. **`CanalVenta`:** `POS`, `WEB`, `OMNICANAL`.
13. **`CondicionFisicaDevolucion`:** `VENDIBLE`, `NO_VENDIBLE`.
14. **`EstadoPedidoWeb`:** `RECIBIDO`, `CONFIRMADO`, `EN_PREPARACION`, `ENVIADO`, `ENTREGADO`, `NO_ENTREGADO`, `CANCELADO`.
15. **`EstadoPagoWeb`:** `PENDIENTE`, `PAGADO`, `RECHAZADO`, `REEMBOLSADO`, `ANULADO`.

## 2. Mapa Estructurado de los 33 Modelos Relacionales

### A. Geografía, DANE y Envíos (5 Modelos)
- **`RegionEnvio`:** Regiones agrupadoras para fletes.
- **`DepartamentoDane`:** Departamentos según codificación oficial DANE.
- **`MunicipioDane`:** Municipios de Colombia con flag `atendidoWeb`.
- **`TarifaZonaEnvio`:** Tarifas base para Zonas 1 a 4 con días estimados.
- **`ExcepcionTarifaEnvio`:** Tarifas particulares para pares origen-destino.

### B. Organización y Usuarios (2 Modelos)
- **`Ubicacion`:** Central y tiendas físicas, con prioridad, base de caja y flag `despachaWeb`.
- **`Usuario`:** Clientes, vendedores y admins, con los 11 permisos, tope de descuento y soporte híbrido para contraseña local o Google OAuth (`googleId`, `authProvider`, `passwordHash?`).

### C. Catálogo e Inventario Ledger (5 Modelos)
- **`Categoria`:** Categorías del catálogo con flag `esCosmeticoUsoPersonal`.
- **`Producto`:** Artículos estándar con política `reintegrableEnDevolucion`.
- **`Variante`:** SKUs físicos únicos con talla, color y precio entero COP.
- **`SaldoStock`:** Saldos cuádruples (`fisico`, `reservadoBlando`, `reservadoDuro`, `noVendible`).
- **`MovimientoInventario`:** Bitácora inmutable de Kardex (*append-only*).

### D. Compras y Traslados (5 Modelos)
- **`CompraProveedor`:** Cabecera de compras a proveedores en Central.
- **`LineaCompra`:** Detalle de compras con cantidades pedidas y recibidas.
- **`Traslado`:** Cabecera de traslados inter-sede con control de tránsito.
- **`LineaTraslado`:** Detalle de traslados con conteos de buenas y dañadas.
- **`ResolucionNovedadTraslado`:** Resoluciones administrativas de faltantes y excedentes.

### E. Caja y Ventas POS (6 Modelos)
- **`SesionCaja`:** Sesiones de caja con apertura contada, arqueo y vigencia Bogotá.
- **`ConsecutivoUbicacion`:** Control secuencial atómico de comprobantes por sede.
- **`Promocion`:** Cupones de descuento configurables.
- **`VentaPOS`:** Cabecera de ventas presenciales en mostrador.
- **`LineaVentaPOS`:** Detalle de venta con snapshots de precios y descuentos.
- **`PagoVentaPOS`:** Registros de pago por efectivo y transferencia.

### F. Devoluciones POS y Cambios (2 Modelos)
- **`DevolucionPOS`:** Cabecera de devoluciones en tienda física.
- **`LineaDevolucionPOS`:** Detalle de devolución y destino físico (vendible/no vendible).

### G. Comercio Electrónico y Web (4 Modelos)
- **`PedidoWeb`:** Pedidos web con asignación determinista, TTL y estados duales.
- **`LineaPedidoWeb`:** Detalle de pedidos con snapshots.
- **`HistorialEstadoPedidoWeb`:** Trazabilidad de cambios de estado del pedido.
- **`DevolucionComercialWeb`:** Devoluciones de pedidos web imputadas a la sede despachadora.

### H. Gobernanza y Soporte del Sistema (4 Modelos)
- **`FestivoColombia`:** Calendario de festivos para cálculo de días hábiles.
- **`ParametroSistema`:** Parámetros operativos clave-valor.
- **`RegistroIdempotencia`:** Cache de claves de idempotencia para evitar duplicados.
- **`RegistroAuditoria`:** Registro inmutable de acciones administrativas sensibles.
