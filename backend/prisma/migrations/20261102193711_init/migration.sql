-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('ADMIN', 'VENDEDOR', 'CLIENTE');

-- CreateEnum
CREATE TYPE "TipoUbicacion" AS ENUM ('CENTRAL', 'PUNTO_VENTA');

-- CreateEnum
CREATE TYPE "TipoMovimientoStock" AS ENUM ('CARGA_INICIAL', 'COMPRA_RECIBIDA', 'TRASLADO_ENVIADO', 'TRASLADO_RECIBIDO_BUENO', 'TRASLADO_RECIBIDO_DANADO', 'TRASLADO_CANCELADO_REINGRESO', 'NOVEDAD_LLEGO_DESTINO', 'NOVEDAD_RETORNO_ORIGEN', 'NOVEDAD_PERDIDA', 'NOVEDAD_EXCEDENTE_INCORPORADO', 'VENTA_POS', 'ANULACION_VENTA_POS', 'DEVOLUCION_POS_VENDIBLE', 'DEVOLUCION_POS_NO_VENDIBLE', 'RESERVA_WEB', 'LIBERACION_RESERVA_WEB', 'ENDURECIMIENTO_RESERVA_WEB', 'DESPACHO_WEB', 'RETORNO_LOGISTICO_WEB_VENDIBLE', 'RETORNO_LOGISTICO_WEB_NO_VENDIBLE', 'DEVOLUCION_COMERCIAL_WEB_VENDIBLE', 'DEVOLUCION_COMERCIAL_WEB_NO_VENDIBLE', 'AJUSTE_POSITIVO_FISICO', 'AJUSTE_NEGATIVO_FISICO', 'AJUSTE_POSITIVO_NO_VENDIBLE', 'BAJA_NO_VENDIBLE');

-- CreateEnum
CREATE TYPE "EstadoCompra" AS ENUM ('PEDIDA', 'RECIBIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "EstadoTraslado" AS ENUM ('SOLICITADO', 'APROBADO', 'ENVIADO', 'RETORNANDO_A_CENTRAL', 'RECIBIDO', 'RECIBIDO_CON_NOVEDAD', 'CERRADO', 'RECHAZADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoResolucionNovedad" AS ENUM ('LLEGO_A_PUNTO', 'RETORNO_A_CENTRAL', 'PERDIDA_AJUSTE', 'EXCEDENTE_INCORPORADO_DESDE_CENTRAL', 'EXCEDENTE_DESCARTADO_O_DEVUELTO');

-- CreateEnum
CREATE TYPE "EstadoSesionCaja" AS ENUM ('ABIERTA', 'CERRADA');

-- CreateEnum
CREATE TYPE "EstadoVentaPOS" AS ENUM ('COMPLETADA', 'ANULADA');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('EFECTIVO', 'TRANSFERENCIA', 'CONTRAENTREGA', 'COMPENSACION_CAMBIO');

-- CreateEnum
CREATE TYPE "TipoDescuento" AS ENUM ('PORCENTAJE', 'VALOR_FIJO', 'MANUAL_VENDEDOR_PORCENTAJE', 'MANUAL_VENDEDOR_FIJO', 'HEREDADO_CAMBIO_VARIANTE');

-- CreateEnum
CREATE TYPE "AlcancePromocion" AS ENUM ('TODA_LA_COMPRA', 'CATEGORIAS', 'PRODUCTOS');

-- CreateEnum
CREATE TYPE "CanalVenta" AS ENUM ('POS', 'WEB', 'AMBOS');

-- CreateEnum
CREATE TYPE "CondicionFisicaDevolucion" AS ENUM ('VENDIBLE', 'NO_VENDIBLE');

-- CreateEnum
CREATE TYPE "EstadoPedidoWeb" AS ENUM ('RECIBIDO', 'CONFIRMADO', 'EN_PREPARACION', 'ENVIADO', 'ENTREGADO', 'NO_ENTREGADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "EstadoPagoWeb" AS ENUM ('PENDIENTE', 'PAGADO', 'REEMBOLSADO', 'ANULADO');

-- CreateTable
CREATE TABLE "RegionEnvio" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "RegionEnvio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepartamentoDane" (
    "codigoDane" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "regionId" INTEGER NOT NULL,

    CONSTRAINT "DepartamentoDane_pkey" PRIMARY KEY ("codigoDane")
);

-- CreateTable
CREATE TABLE "MunicipioDane" (
    "codigoDane" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "departamentoId" TEXT NOT NULL,
    "atendidoWeb" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "MunicipioDane_pkey" PRIMARY KEY ("codigoDane")
);

-- CreateTable
CREATE TABLE "TarifaZonaEnvio" (
    "zona" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "tarifaCop" INTEGER NOT NULL,
    "diasEstimados" INTEGER NOT NULL,

    CONSTRAINT "TarifaZonaEnvio_pkey" PRIMARY KEY ("zona")
);

-- CreateTable
CREATE TABLE "ExcepcionTarifaEnvio" (
    "id" SERIAL NOT NULL,
    "municipioOrigenId" TEXT NOT NULL,
    "municipioDestinoId" TEXT NOT NULL,
    "tarifaCop" INTEGER NOT NULL,
    "diasEstimados" INTEGER NOT NULL,

    CONSTRAINT "ExcepcionTarifaEnvio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ubicacion" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoUbicacion" NOT NULL,
    "municipioDaneId" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "despachaWeb" BOOLEAN NOT NULL DEFAULT true,
    "prioridadDespacho" INTEGER NOT NULL DEFAULT 100,
    "baseCajaCop" INTEGER NOT NULL DEFAULT 200000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ubicacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "nombreCompleto" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "telefono" TEXT,
    "direccionDefault" TEXT,
    "municipioDefaultId" TEXT,
    "rol" "RolUsuario" NOT NULL,
    "ubicacionId" INTEGER,
    "topeDescuentoPorc" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "intentosFallidosLogin" INTEGER NOT NULL DEFAULT 0,
    "bloqueadoHasta" TIMESTAMP(3),
    "aceptoPrivacidadEn" TIMESTAMP(3),
    "permVender" BOOLEAN NOT NULL DEFAULT true,
    "permCaja" BOOLEAN NOT NULL DEFAULT true,
    "permDescuentoManual" BOOLEAN NOT NULL DEFAULT false,
    "permAnularVentas" BOOLEAN NOT NULL DEFAULT false,
    "permDevoluciones" BOOLEAN NOT NULL DEFAULT false,
    "permVerInventario" BOOLEAN NOT NULL DEFAULT true,
    "permSolicitarTraslado" BOOLEAN NOT NULL DEFAULT true,
    "permRecibirTraslado" BOOLEAN NOT NULL DEFAULT true,
    "permVerOtrosPuntos" BOOLEAN NOT NULL DEFAULT false,
    "permPedidosWeb" BOOLEAN NOT NULL DEFAULT false,
    "permVerVentasPunto" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Categoria" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "esCosmeticoUsoPersonal" BOOLEAN NOT NULL DEFAULT false,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Producto" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "categoriaId" INTEGER NOT NULL,
    "imagenesUrls" TEXT[],
    "reintegrableEnDevolucion" BOOLEAN NOT NULL DEFAULT true,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Variante" (
    "id" SERIAL NOT NULL,
    "productoId" INTEGER NOT NULL,
    "sku" TEXT NOT NULL,
    "codigoBarras" TEXT,
    "talla" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "precioVentaCop" INTEGER NOT NULL,
    "umbralStockBajo" INTEGER,
    "tieneMovimientos" BOOLEAN NOT NULL DEFAULT false,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Variante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaldoStock" (
    "id" SERIAL NOT NULL,
    "ubicacionId" INTEGER NOT NULL,
    "varianteId" INTEGER NOT NULL,
    "fisico" INTEGER NOT NULL DEFAULT 0,
    "reservadoBlando" INTEGER NOT NULL DEFAULT 0,
    "reservadoDuro" INTEGER NOT NULL DEFAULT 0,
    "noVendible" INTEGER NOT NULL DEFAULT 0,
    "bloqueadoDespachoWeb" BOOLEAN NOT NULL DEFAULT false,
    "motivoBloqueoWeb" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaldoStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimientoInventario" (
    "id" BIGSERIAL NOT NULL,
    "fechaHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo" "TipoMovimientoStock" NOT NULL,
    "ubicacionId" INTEGER NOT NULL,
    "varianteId" INTEGER NOT NULL,
    "cantidadConSigno" INTEGER NOT NULL,
    "afectaSaldo" TEXT NOT NULL,
    "saldoResultante" INTEGER NOT NULL,
    "documentoTipo" TEXT NOT NULL,
    "documentoId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "motivo" TEXT,

    CONSTRAINT "MovimientoInventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompraProveedor" (
    "id" SERIAL NOT NULL,
    "proveedorNombre" TEXT NOT NULL,
    "proveedorContacto" TEXT,
    "estado" "EstadoCompra" NOT NULL DEFAULT 'PEDIDA',
    "notas" TEXT,
    "creadoPorId" INTEGER NOT NULL,
    "recibidoPorId" INTEGER,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaRecepcion" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "CompraProveedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LineaCompra" (
    "id" SERIAL NOT NULL,
    "compraId" INTEGER NOT NULL,
    "varianteId" INTEGER NOT NULL,
    "cantidadPedida" INTEGER NOT NULL,
    "cantidadRecibida" INTEGER,
    "costoUnitarioCop" INTEGER,
    "observacionDiferencia" TEXT,

    CONSTRAINT "LineaCompra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Traslado" (
    "id" SERIAL NOT NULL,
    "esEnvioDirecto" BOOLEAN NOT NULL DEFAULT false,
    "ubicacionOrigenId" INTEGER NOT NULL,
    "ubicacionDestinoId" INTEGER NOT NULL,
    "estado" "EstadoTraslado" NOT NULL,
    "creadoPorId" INTEGER NOT NULL,
    "aprobadoPorId" INTEGER,
    "enviadoPorId" INTEGER,
    "recibidoPorId" INTEGER,
    "motivoRechazoCancelacion" TEXT,
    "observacionRecepcion" TEXT,
    "fechaSolicitud" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaAprobacion" TIMESTAMP(3),
    "fechaEnvio" TIMESTAMP(3),
    "fechaRecepcion" TIMESTAMP(3),
    "fechaCierre" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Traslado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LineaTraslado" (
    "id" SERIAL NOT NULL,
    "trasladoId" INTEGER NOT NULL,
    "varianteId" INTEGER NOT NULL,
    "cantidadSolicitada" INTEGER NOT NULL,
    "cantidadAprobada" INTEGER,
    "cantidadEnviada" INTEGER,
    "cantidadRecibidaBuena" INTEGER,
    "cantidadRecibidaDanada" INTEGER,
    "excedenteReportado" INTEGER NOT NULL DEFAULT 0,
    "unidadesFaltantesPendientes" INTEGER NOT NULL DEFAULT 0,
    "excedentePendienteResolver" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LineaTraslado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResolucionNovedadTraslado" (
    "id" SERIAL NOT NULL,
    "trasladoId" INTEGER NOT NULL,
    "lineaTrasladoId" INTEGER NOT NULL,
    "tipoResolucion" "TipoResolucionNovedad" NOT NULL,
    "cantidadResuelta" INTEGER NOT NULL,
    "motivo" TEXT NOT NULL,
    "responsable" TEXT,
    "adminUsuarioId" INTEGER NOT NULL,
    "fechaResolucion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResolucionNovedadTraslado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SesionCaja" (
    "id" SERIAL NOT NULL,
    "ubicacionId" INTEGER NOT NULL,
    "estado" "EstadoSesionCaja" NOT NULL DEFAULT 'ABIERTA',
    "fechaNegocioColombia" TEXT NOT NULL,
    "abiertaPorId" INTEGER NOT NULL,
    "cerradaPorId" INTEGER,
    "fechaApertura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaCierre" TIMESTAMP(3),
    "baseConfiguradaCop" INTEGER NOT NULL,
    "baseContadaCop" INTEGER NOT NULL,
    "observacionApertura" TEXT,
    "efectivoEsperadoCierreCop" INTEGER,
    "efectivoContadoCierreCop" INTEGER,
    "diferenciaCierreCop" INTEGER,
    "efectivoAEntregarCop" INTEGER,
    "observacionCierre" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "SesionCaja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsecutivoUbicacion" (
    "ubicacionId" INTEGER NOT NULL,
    "tipoDocumento" TEXT NOT NULL,
    "ultimoNumero" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ConsecutivoUbicacion_pkey" PRIMARY KEY ("ubicacionId","tipoDocumento")
);

-- CreateTable
CREATE TABLE "Promocion" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoDescuento" NOT NULL,
    "valor" INTEGER NOT NULL,
    "alcance" "AlcancePromocion" NOT NULL,
    "idsCategoriasElegibles" INTEGER[],
    "idsProductosElegibles" INTEGER[],
    "canalPermitido" "CanalVenta" NOT NULL,
    "minimoCompraCop" INTEGER NOT NULL DEFAULT 0,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "tieneUsos" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Promocion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VentaPOS" (
    "id" SERIAL NOT NULL,
    "numeroComprobante" INTEGER NOT NULL,
    "ubicacionId" INTEGER NOT NULL,
    "sesionCajaId" INTEGER NOT NULL,
    "vendedorId" INTEGER NOT NULL,
    "clienteNombreOpcional" TEXT,
    "clienteDocumentoOpcional" TEXT,
    "estado" "EstadoVentaPOS" NOT NULL DEFAULT 'COMPLETADA',
    "fechaHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaNegocioColombia" TEXT NOT NULL,
    "mesNegocioColombia" TEXT NOT NULL,
    "subtotalListaCop" INTEGER NOT NULL,
    "descuentoTotalCop" INTEGER NOT NULL DEFAULT 0,
    "totalNetoProductosCop" INTEGER NOT NULL,
    "descuentoTipoSnapshot" "TipoDescuento",
    "descuentoCodigoSnapshot" TEXT,
    "descuentoValorSnapshot" INTEGER,
    "descuentoMotivoManual" TEXT,
    "descuentoAutorizadoPorId" INTEGER,
    "esVentaDeCambio" BOOLEAN NOT NULL DEFAULT false,
    "ventaOrigenRaizId" INTEGER,
    "fechaVentaRaiz" TIMESTAMP(3),
    "tieneMedioPagoMixtoCambio" BOOLEAN NOT NULL DEFAULT false,
    "anuladaPorId" INTEGER,
    "fechaAnulacion" TIMESTAMP(3),
    "motivoAnulacion" TEXT,

    CONSTRAINT "VentaPOS_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LineaVentaPOS" (
    "id" SERIAL NOT NULL,
    "ventaId" INTEGER NOT NULL,
    "varianteId" INTEGER NOT NULL,
    "productoIdSnapshot" INTEGER NOT NULL,
    "nombreProductoSnapshot" TEXT NOT NULL,
    "skuSnapshot" TEXT NOT NULL,
    "tallaSnapshot" TEXT NOT NULL,
    "colorSnapshot" TEXT NOT NULL,
    "esReintegrableSnapshot" BOOLEAN NOT NULL,
    "cantidadVendida" INTEGER NOT NULL,
    "cantidadDevueltaAcum" INTEGER NOT NULL DEFAULT 0,
    "precioListaUnitarioCop" INTEGER NOT NULL,
    "subtotalListaLineaCop" INTEGER NOT NULL,
    "descuentoProrrateadoCop" INTEGER NOT NULL DEFAULT 0,
    "netoPagadoLineaCop" INTEGER NOT NULL,
    "reembolsadoAcumuladoCop" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LineaVentaPOS_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PagoVentaPOS" (
    "id" SERIAL NOT NULL,
    "ventaId" INTEGER NOT NULL,
    "metodo" "MetodoPago" NOT NULL,
    "montoCop" INTEGER NOT NULL,
    "montoRecibidoEfectivoCop" INTEGER,
    "vueltoEfectivoCop" INTEGER,
    "referenciaTransferencia" TEXT,
    "verificadoPorAdmin" BOOLEAN NOT NULL DEFAULT false,
    "verificadoPorId" INTEGER,
    "fechaVerificacion" TIMESTAMP(3),

    CONSTRAINT "PagoVentaPOS_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DevolucionPOS" (
    "id" SERIAL NOT NULL,
    "numeroComprobante" INTEGER NOT NULL,
    "ventaOriginalId" INTEGER NOT NULL,
    "ubicacionId" INTEGER NOT NULL,
    "sesionCajaId" INTEGER NOT NULL,
    "procesadoPorId" INTEGER NOT NULL,
    "autorizadoFueraPlazoPorId" INTEGER,
    "motivoFueraPlazo" TEXT,
    "esParteDeCambio" BOOLEAN NOT NULL DEFAULT false,
    "ventaNuevaCambioId" INTEGER,
    "fechaHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaNegocioColombia" TEXT NOT NULL,
    "mesNegocioColombia" TEXT NOT NULL,
    "totalReembolsadoCop" INTEGER NOT NULL,
    "medioReembolso" "MetodoPago" NOT NULL,
    "esExcepcionIliquidezCaja" BOOLEAN NOT NULL DEFAULT false,
    "referenciaReembolsoTransf" TEXT,
    "observacion" TEXT,

    CONSTRAINT "DevolucionPOS_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LineaDevolucionPOS" (
    "id" SERIAL NOT NULL,
    "devolucionId" INTEGER NOT NULL,
    "lineaVentaOriginalId" INTEGER NOT NULL,
    "varianteId" INTEGER NOT NULL,
    "cantidadDevuelta" INTEGER NOT NULL,
    "condicionFisica" "CondicionFisicaDevolucion" NOT NULL,
    "montoReembolsadoCop" INTEGER NOT NULL,

    CONSTRAINT "LineaDevolucionPOS_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PedidoWeb" (
    "id" SERIAL NOT NULL,
    "referenciaLegible" TEXT NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "ubicacionAsignadaId" INTEGER NOT NULL,
    "ubicacionDespachoReconocidoId" INTEGER,
    "tieneIncidenciaStock" BOOLEAN NOT NULL DEFAULT false,
    "tieneReservaActiva" BOOLEAN NOT NULL DEFAULT true,
    "estadoPedido" "EstadoPedidoWeb" NOT NULL DEFAULT 'RECIBIDO',
    "estadoPago" "EstadoPagoWeb" NOT NULL DEFAULT 'PENDIENTE',
    "metodoPago" "MetodoPago" NOT NULL,
    "reservaExpiraEn" TIMESTAMP(3),
    "municipioDestinoId" TEXT NOT NULL,
    "direccionEntrega" TEXT NOT NULL,
    "destinatarioNombre" TEXT NOT NULL,
    "destinatarioTelefono" TEXT NOT NULL,
    "zonaEnvioCalculada" INTEGER NOT NULL,
    "costoEnvioCop" INTEGER NOT NULL,
    "diasEstimadosSnapshot" INTEGER NOT NULL,
    "transportadora" TEXT,
    "numeroGuia" TEXT,
    "subtotalListaCop" INTEGER NOT NULL,
    "descuentoTotalCop" INTEGER NOT NULL DEFAULT 0,
    "totalNetoProductosCop" INTEGER NOT NULL,
    "totalAPagarCop" INTEGER NOT NULL,
    "descuentoTipoSnapshot" "TipoDescuento",
    "descuentoCodigoSnapshot" TEXT,
    "descuentoValorSnapshot" INTEGER,
    "ventaReconocida" BOOLEAN NOT NULL DEFAULT false,
    "fechaReconocimientoVenta" TIMESTAMP(3),
    "mesReconocimientoColombia" TEXT,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaConfirmacion" TIMESTAMP(3),
    "fechaEnPreparacion" TIMESTAMP(3),
    "fechaEnvio" TIMESTAMP(3),
    "fechaEntrega" TIMESTAMP(3),
    "fechaCancelacion" TIMESTAMP(3),
    "motivoCancelacionNoEntrega" TEXT,
    "referenciaPagoRecaudo" TEXT,
    "referenciaReembolsoCancelacion" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "PedidoWeb_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LineaPedidoWeb" (
    "id" SERIAL NOT NULL,
    "pedidoId" INTEGER NOT NULL,
    "varianteId" INTEGER NOT NULL,
    "nombreProductoSnapshot" TEXT NOT NULL,
    "skuSnapshot" TEXT NOT NULL,
    "tallaSnapshot" TEXT NOT NULL,
    "colorSnapshot" TEXT NOT NULL,
    "esReintegrableSnapshot" BOOLEAN NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "cantidadDevueltaAcum" INTEGER NOT NULL DEFAULT 0,
    "precioListaUnitarioCop" INTEGER NOT NULL,
    "subtotalListaLineaCop" INTEGER NOT NULL,
    "descuentoProrrateadoCop" INTEGER NOT NULL DEFAULT 0,
    "netoPagadoLineaCop" INTEGER NOT NULL,
    "reembolsadoAcumuladoCop" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LineaPedidoWeb_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistorialEstadoPedidoWeb" (
    "id" SERIAL NOT NULL,
    "pedidoId" INTEGER NOT NULL,
    "estadoPedido" "EstadoPedidoWeb" NOT NULL,
    "estadoPago" "EstadoPagoWeb" NOT NULL,
    "usuarioId" INTEGER,
    "observacion" TEXT,
    "fechaHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistorialEstadoPedidoWeb_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DevolucionComercialWeb" (
    "id" SERIAL NOT NULL,
    "pedidoId" INTEGER NOT NULL,
    "ubicacionImputacionVentaId" INTEGER NOT NULL,
    "ubicacionReingresoFisicoId" INTEGER NOT NULL,
    "registradoPorAdminId" INTEGER NOT NULL,
    "autorizadoFueraPlazo" BOOLEAN NOT NULL DEFAULT false,
    "motivo" TEXT NOT NULL,
    "totalReembolsadoProductosCop" INTEGER NOT NULL,
    "referenciaTransferenciaReembolso" TEXT NOT NULL,
    "fechaHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mesNegocioColombia" TEXT NOT NULL,

    CONSTRAINT "DevolucionComercialWeb_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FestivoColombia" (
    "fecha" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,

    CONSTRAINT "FestivoColombia_pkey" PRIMARY KEY ("fecha")
);

-- CreateTable
CREATE TABLE "ParametroSistema" (
    "clave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParametroSistema_pkey" PRIMARY KEY ("clave")
);

-- CreateTable
CREATE TABLE "RegistroIdempotencia" (
    "idempotencyKey" TEXT NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "endpoint" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "responseBody" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegistroIdempotencia_pkey" PRIMARY KEY ("idempotencyKey","usuarioId")
);

-- CreateTable
CREATE TABLE "RegistroAuditoria" (
    "id" BIGSERIAL NOT NULL,
    "fechaHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" INTEGER NOT NULL,
    "accion" TEXT NOT NULL,
    "entidadTipo" TEXT NOT NULL,
    "entidadId" TEXT NOT NULL,
    "datosMinimos" JSONB NOT NULL,

    CONSTRAINT "RegistroAuditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RegionEnvio_nombre_key" ON "RegionEnvio"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "ExcepcionTarifaEnvio_municipioOrigenId_municipioDestinoId_key" ON "ExcepcionTarifaEnvio"("municipioOrigenId", "municipioDestinoId");

-- CreateIndex
CREATE UNIQUE INDEX "Ubicacion_nombre_key" ON "Ubicacion"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_correo_key" ON "Usuario"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_nombre_key" ON "Categoria"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Producto_slug_key" ON "Producto"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Variante_sku_key" ON "Variante"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Variante_codigoBarras_key" ON "Variante"("codigoBarras");

-- CreateIndex
CREATE UNIQUE INDEX "SaldoStock_ubicacionId_varianteId_key" ON "SaldoStock"("ubicacionId", "varianteId");

-- CreateIndex
CREATE INDEX "MovimientoInventario_ubicacionId_varianteId_fechaHora_idx" ON "MovimientoInventario"("ubicacionId", "varianteId", "fechaHora");

-- CreateIndex
CREATE INDEX "MovimientoInventario_documentoTipo_documentoId_idx" ON "MovimientoInventario"("documentoTipo", "documentoId");

-- CreateIndex
CREATE UNIQUE INDEX "Promocion_codigo_key" ON "Promocion"("codigo");

-- CreateIndex
CREATE INDEX "VentaPOS_ubicacionId_mesNegocioColombia_idx" ON "VentaPOS"("ubicacionId", "mesNegocioColombia");

-- CreateIndex
CREATE UNIQUE INDEX "VentaPOS_ubicacionId_numeroComprobante_key" ON "VentaPOS"("ubicacionId", "numeroComprobante");

-- CreateIndex
CREATE UNIQUE INDEX "DevolucionPOS_ventaNuevaCambioId_key" ON "DevolucionPOS"("ventaNuevaCambioId");

-- CreateIndex
CREATE INDEX "DevolucionPOS_ubicacionId_mesNegocioColombia_idx" ON "DevolucionPOS"("ubicacionId", "mesNegocioColombia");

-- CreateIndex
CREATE UNIQUE INDEX "DevolucionPOS_ubicacionId_numeroComprobante_key" ON "DevolucionPOS"("ubicacionId", "numeroComprobante");

-- CreateIndex
CREATE UNIQUE INDEX "PedidoWeb_referenciaLegible_key" ON "PedidoWeb"("referenciaLegible");

-- CreateIndex
CREATE INDEX "PedidoWeb_ubicacionDespachoReconocidoId_mesReconocimientoCo_idx" ON "PedidoWeb"("ubicacionDespachoReconocidoId", "mesReconocimientoColombia");

-- CreateIndex
CREATE INDEX "PedidoWeb_estadoPedido_metodoPago_reservaExpiraEn_idx" ON "PedidoWeb"("estadoPedido", "metodoPago", "reservaExpiraEn");

-- AddForeignKey
ALTER TABLE "DepartamentoDane" ADD CONSTRAINT "DepartamentoDane_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "RegionEnvio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MunicipioDane" ADD CONSTRAINT "MunicipioDane_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "DepartamentoDane"("codigoDane") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExcepcionTarifaEnvio" ADD CONSTRAINT "ExcepcionTarifaEnvio_municipioOrigenId_fkey" FOREIGN KEY ("municipioOrigenId") REFERENCES "MunicipioDane"("codigoDane") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExcepcionTarifaEnvio" ADD CONSTRAINT "ExcepcionTarifaEnvio_municipioDestinoId_fkey" FOREIGN KEY ("municipioDestinoId") REFERENCES "MunicipioDane"("codigoDane") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ubicacion" ADD CONSTRAINT "Ubicacion_municipioDaneId_fkey" FOREIGN KEY ("municipioDaneId") REFERENCES "MunicipioDane"("codigoDane") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_municipioDefaultId_fkey" FOREIGN KEY ("municipioDefaultId") REFERENCES "MunicipioDane"("codigoDane") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_ubicacionId_fkey" FOREIGN KEY ("ubicacionId") REFERENCES "Ubicacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Variante" ADD CONSTRAINT "Variante_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaldoStock" ADD CONSTRAINT "SaldoStock_ubicacionId_fkey" FOREIGN KEY ("ubicacionId") REFERENCES "Ubicacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaldoStock" ADD CONSTRAINT "SaldoStock_varianteId_fkey" FOREIGN KEY ("varianteId") REFERENCES "Variante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_ubicacionId_fkey" FOREIGN KEY ("ubicacionId") REFERENCES "Ubicacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_varianteId_fkey" FOREIGN KEY ("varianteId") REFERENCES "Variante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompraProveedor" ADD CONSTRAINT "CompraProveedor_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompraProveedor" ADD CONSTRAINT "CompraProveedor_recibidoPorId_fkey" FOREIGN KEY ("recibidoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineaCompra" ADD CONSTRAINT "LineaCompra_compraId_fkey" FOREIGN KEY ("compraId") REFERENCES "CompraProveedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineaCompra" ADD CONSTRAINT "LineaCompra_varianteId_fkey" FOREIGN KEY ("varianteId") REFERENCES "Variante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Traslado" ADD CONSTRAINT "Traslado_ubicacionOrigenId_fkey" FOREIGN KEY ("ubicacionOrigenId") REFERENCES "Ubicacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Traslado" ADD CONSTRAINT "Traslado_ubicacionDestinoId_fkey" FOREIGN KEY ("ubicacionDestinoId") REFERENCES "Ubicacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Traslado" ADD CONSTRAINT "Traslado_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineaTraslado" ADD CONSTRAINT "LineaTraslado_trasladoId_fkey" FOREIGN KEY ("trasladoId") REFERENCES "Traslado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineaTraslado" ADD CONSTRAINT "LineaTraslado_varianteId_fkey" FOREIGN KEY ("varianteId") REFERENCES "Variante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResolucionNovedadTraslado" ADD CONSTRAINT "ResolucionNovedadTraslado_trasladoId_fkey" FOREIGN KEY ("trasladoId") REFERENCES "Traslado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SesionCaja" ADD CONSTRAINT "SesionCaja_ubicacionId_fkey" FOREIGN KEY ("ubicacionId") REFERENCES "Ubicacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsecutivoUbicacion" ADD CONSTRAINT "ConsecutivoUbicacion_ubicacionId_fkey" FOREIGN KEY ("ubicacionId") REFERENCES "Ubicacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VentaPOS" ADD CONSTRAINT "VentaPOS_ubicacionId_fkey" FOREIGN KEY ("ubicacionId") REFERENCES "Ubicacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VentaPOS" ADD CONSTRAINT "VentaPOS_sesionCajaId_fkey" FOREIGN KEY ("sesionCajaId") REFERENCES "SesionCaja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VentaPOS" ADD CONSTRAINT "VentaPOS_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineaVentaPOS" ADD CONSTRAINT "LineaVentaPOS_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "VentaPOS"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineaVentaPOS" ADD CONSTRAINT "LineaVentaPOS_varianteId_fkey" FOREIGN KEY ("varianteId") REFERENCES "Variante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoVentaPOS" ADD CONSTRAINT "PagoVentaPOS_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "VentaPOS"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevolucionPOS" ADD CONSTRAINT "DevolucionPOS_ventaOriginalId_fkey" FOREIGN KEY ("ventaOriginalId") REFERENCES "VentaPOS"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevolucionPOS" ADD CONSTRAINT "DevolucionPOS_ubicacionId_fkey" FOREIGN KEY ("ubicacionId") REFERENCES "Ubicacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevolucionPOS" ADD CONSTRAINT "DevolucionPOS_sesionCajaId_fkey" FOREIGN KEY ("sesionCajaId") REFERENCES "SesionCaja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevolucionPOS" ADD CONSTRAINT "DevolucionPOS_procesadoPorId_fkey" FOREIGN KEY ("procesadoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineaDevolucionPOS" ADD CONSTRAINT "LineaDevolucionPOS_devolucionId_fkey" FOREIGN KEY ("devolucionId") REFERENCES "DevolucionPOS"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineaDevolucionPOS" ADD CONSTRAINT "LineaDevolucionPOS_lineaVentaOriginalId_fkey" FOREIGN KEY ("lineaVentaOriginalId") REFERENCES "LineaVentaPOS"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineaDevolucionPOS" ADD CONSTRAINT "LineaDevolucionPOS_varianteId_fkey" FOREIGN KEY ("varianteId") REFERENCES "Variante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoWeb" ADD CONSTRAINT "PedidoWeb_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoWeb" ADD CONSTRAINT "PedidoWeb_ubicacionAsignadaId_fkey" FOREIGN KEY ("ubicacionAsignadaId") REFERENCES "Ubicacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoWeb" ADD CONSTRAINT "PedidoWeb_ubicacionDespachoReconocidoId_fkey" FOREIGN KEY ("ubicacionDespachoReconocidoId") REFERENCES "Ubicacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoWeb" ADD CONSTRAINT "PedidoWeb_municipioDestinoId_fkey" FOREIGN KEY ("municipioDestinoId") REFERENCES "MunicipioDane"("codigoDane") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineaPedidoWeb" ADD CONSTRAINT "LineaPedidoWeb_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "PedidoWeb"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineaPedidoWeb" ADD CONSTRAINT "LineaPedidoWeb_varianteId_fkey" FOREIGN KEY ("varianteId") REFERENCES "Variante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialEstadoPedidoWeb" ADD CONSTRAINT "HistorialEstadoPedidoWeb_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "PedidoWeb"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevolucionComercialWeb" ADD CONSTRAINT "DevolucionComercialWeb_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "PedidoWeb"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevolucionComercialWeb" ADD CONSTRAINT "DevolucionComercialWeb_ubicacionImputacionVentaId_fkey" FOREIGN KEY ("ubicacionImputacionVentaId") REFERENCES "Ubicacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevolucionComercialWeb" ADD CONSTRAINT "DevolucionComercialWeb_ubicacionReingresoFisicoId_fkey" FOREIGN KEY ("ubicacionReingresoFisicoId") REFERENCES "Ubicacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroIdempotencia" ADD CONSTRAINT "RegistroIdempotencia_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroAuditoria" ADD CONSTRAINT "RegistroAuditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
