---
id: DB-PRISMA
tags: [base-de-datos, prisma, modelos, tablas, enums, postgresql]
modelos_prisma: [RegionEnvio, DepartamentoDane, MunicipioDane, TarifaZonaEnvio, ExcepcionTarifaEnvio, Ubicacion, Usuario, Categoria, Producto, Variante, SaldoStock, MovimientoInventario, CompraProveedor, LineaCompra, Traslado, LineaTraslado, ResolucionNovedadTraslado, SesionCaja, MovimientoCaja, RelevoTurnoCaja, ConsecutivoUbicacion, Promocion, VentaPOS, LineaVentaPOS, PagoVentaPOS, DevolucionPOS, LineaDevolucionPOS, PedidoWeb, LineaPedidoWeb, HistorialEstadoPedidoWeb, DevolucionComercialWeb, FestivoColombia, ParametroSistema, RegistroIdempotencia, RegistroAuditoria]
---
# Estructura Física de Base de Datos: 35 Modelos y 16 Enums

Relacionado con: [[Constraints-SQL-e-Indices]] | [[00-Indice-Mapa-Mental-MOC]] | [[MOD-04-Inventario-Ledger]]

El esquema oficial de base de datos se implementa en PostgreSQL (Supabase Cloud) mediante Prisma ORM (`backend/prisma/schema.prisma`), constando de **35 modelos relacionales** y **16 enumeraciones**:

## 1. Catálogo de los 16 Enums
1. **`RolUsuario`:** `ADMIN`, `VENDEDOR`, `CLIENTE`.
2. **`TipoUbicacion`:** `CENTRAL`, `PUNTO_VENTA`.
3. **`TipoMovimientoStock` (26 tipos granulares canónicos):** `CARGA_INICIAL`, `COMPRA_RECIBIDA`, `TRASLADO_ENVIADO`, `TRASLADO_RECIBIDO_BUENO`, `TRASLADO_RECIBIDO_DANADO`, `TRASLADO_CANCELADO_REINGRESO`, `NOVEDAD_LLEGO_DESTINO`, `NOVEDAD_RETORNO_ORIGEN`, `NOVEDAD_PERDIDA`, `NOVEDAD_EXCEDENTE_INCORPORADO`, `VENTA_POS`, `ANULACION_VENTA_POS`, `DEVOLUCION_POS_VENDIBLE`, `DEVOLUCION_POS_NO_VENDIBLE`, `RESERVA_WEB`, `LIBERACION_RESERVA_WEB`, `ENDURECIMIENTO_RESERVA_WEB`, `DESPACHO_WEB`, `RETORNO_LOGISTICO_WEB_VENDIBLE`, `RETORNO_LOGISTICO_WEB_NO_VENDIBLE`, `DEVOLUCION_COMERCIAL_WEB_VENDIBLE`, `DEVOLUCION_COMERCIAL_WEB_NO_VENDIBLE`, `AJUSTE_POSITIVO_FISICO`, `AJUSTE_NEGATIVO_FISICO`, `AJUSTE_POSITIVO_NO_VENDIBLE`, `BAJA_NO_VENDIBLE`.
4. **`EstadoCompra`:** `PEDIDA`, `RECIBIDA`, `CANCELADA`.
5. **`EstadoTraslado`:** `SOLICITADO`, `APROBADO`, `ENVIADO`, `RETORNANDO_A_CENTRAL`, `RECIBIDO`, `RECIBIDO_CON_NOVEDAD`, `CERRADO`, `RECHAZADO`, `CANCELADO`.
6. **`TipoResolucionNovedad`:** `LLEGO_A_PUNTO`, `RETORNO_A_CENTRAL`, `PERDIDA_AJUSTE`, `EXCEDENTE_INCORPORADO_DESDE_CENTRAL`, `EXCEDENTE_DESCARTADO_O_DEVUELTO`.
7. **`EstadoSesionCaja`:** `ABIERTA`, `CERRADA`.
8. **`TipoMovimientoCaja`:** `SANGRIA_RETIRO`, `GASTO_MENOR`, `INGRESO_MANUAL`.
9. **`EstadoVentaPOS`:** `COMPLETADA`, `ANULADA`.
10. **`MetodoPago`:** `EFECTIVO`, `TRANSFERENCIA`, `CONTRAENTREGA`, `COMPENSACION_CAMBIO`.
11. **`TipoDescuento`:** `PORCENTAJE`, `VALOR_FIJO`, `MANUAL_VENDEDOR_PORCENTAJE`, `MANUAL_VENDEDOR_FIJO`, `HEREDADO_CAMBIO_VARIANTE`.
12. **`AlcancePromocion`:** `TODA_LA_COMPRA`, `CATEGORIAS`, `PRODUCTOS`.
13. **`CanalVenta`:** `POS`, `WEB`, `AMBOS`.
14. **`CondicionFisicaDevolucion`:** `VENDIBLE`, `NO_VENDIBLE`.
15. **`EstadoPedidoWeb`:** `RECIBIDO`, `CONFIRMADO`, `EN_PREPARACION`, `ENVIADO`, `ENTREGADO`, `NO_ENTREGADO`, `CANCELADO`.
16. **`EstadoPagoWeb`:** `PENDIENTE`, `PAGADO`, `REEMBOLSADO`, `ANULADO`.

## 2. Mapa Estructurado de los 35 Modelos Relacionales

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

### E. Caja y Ventas POS (8 Modelos)
- **`SesionCaja`:** Sesiones de caja con apertura contada, arqueo y vigencia Bogotá.
- **`MovimientoCaja`:** Registro de sangrías/retiros de seguridad (`SANGRIA_RETIRO`), pagos menores (`GASTO_MENOR`) e ingresos de sencillo (`INGRESO_MANUAL`).
- **`RelevoTurnoCaja`:** Registro formal de relevos entre cajeros en una misma sesión de caja sin cerrarla.
- **`ConsecutivoUbicacion`:** Control secuencial atómico de comprobantes por sede.
- **`Promocion`:** Cupones de descuento configurables.
- **`VentaPOS`:** Cabecera de ventas presenciales en mostrador.
- **`LineaVentaPOS`:** Detalle de venta con snapshots de precios y descuentos.
- **`PagoVentaPOS`:** Registros de pago por efectivo, transferencia, contraentrega o compensación por cambio.

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

---

## 3. Consideraciones de Serialización y Tipado
- **Manejo de `BigInt`:** Todo campo `BigInt` (como consecutivos numéricos o IDs extendidos) debe serializarse a `Number` seguro (`BigInt.prototype.toJSON = function() { return Number(this); }`) en el arranque de Express para evitar fallos de serialización JSON (`TypeError: Do not know how to serialize a BigInt`).
- **Integridad Numérica:** Se garantiza que todo valor monetario y consecutivo se encuentre dentro del rango seguro de JavaScript (`Number.isSafeInteger(val)`), ya que el valor máximo de `INT4` de PostgreSQL ($2.147.483.647) es inferior a `Number.MAX_SAFE_INTEGER` ($9.007.199.254.740.991$).
