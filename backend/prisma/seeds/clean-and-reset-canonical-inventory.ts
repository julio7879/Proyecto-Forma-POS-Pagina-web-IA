import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanAndReset() {
  console.log('--- INICIANDO LIMPIEZA TOTAL Y RESTABLECIMIENTO CANÓNICO ---');

  // 1. Limpieza de tablas transaccionales de Ventas POS
  const delLineasDevPOS = await prisma.lineaDevolucionPOS.deleteMany({});
  const delDevPOS = await prisma.devolucionPOS.deleteMany({});
  const delPagosVentaPOS = await prisma.pagoVentaPOS.deleteMany({});
  const delLineasVentaPOS = await prisma.lineaVentaPOS.deleteMany({});
  const delVentasPOS = await prisma.ventaPOS.deleteMany({});
  console.log(`✓ Ventas POS eliminadas: ${delVentasPOS.count} ventas, ${delLineasVentaPOS.count} líneas, ${delPagosVentaPOS.count} pagos, ${delDevPOS.count} devoluciones`);

  // 2. Limpieza de Traslados
  const delResNovTraslado = await prisma.resolucionNovedadTraslado.deleteMany({});
  const delLineasTraslado = await prisma.lineaTraslado.deleteMany({});
  const delTraslados = await prisma.traslado.deleteMany({});
  console.log(`✓ Traslados eliminados: ${delTraslados.count} traslados, ${delLineasTraslado.count} líneas, ${delResNovTraslado.count} resoluciones`);

  // 3. Limpieza de Pedidos Web
  const delHistorialWeb = await prisma.historialEstadoPedidoWeb.deleteMany({});
  const delDevWeb = await prisma.devolucionComercialWeb.deleteMany({});
  const delLineasWeb = await prisma.lineaPedidoWeb.deleteMany({});
  const delPedidosWeb = await prisma.pedidoWeb.deleteMany({});
  console.log(`✓ Pedidos Web eliminados: ${delPedidosWeb.count} pedidos, ${delLineasWeb.count} líneas, ${delHistorialWeb.count} estados, ${delDevWeb.count} devoluciones`);

  // 4. Limpieza de Cajas
  const delMovCaja = await prisma.movimientoCaja.deleteMany({});
  const delRelevoCaja = await prisma.relevoTurnoCaja.deleteMany({});
  const delSesionesCaja = await prisma.sesionCaja.deleteMany({});
  console.log(`✓ Sesiones de caja eliminadas: ${delSesionesCaja.count} sesiones, ${delMovCaja.count} movimientos, ${delRelevoCaja.count} relevos`);

  // 5. Limpieza de Movimientos de Inventario residuales (dejar solo compras iniciales)
  const delMovInv = await prisma.movimientoInventario.deleteMany({
    where: {
      tipo: {
        notIn: ['COMPRA_RECIBIDA', 'CARGA_INICIAL'],
      },
    },
  });
  console.log(`✓ Movimientos residuales de inventario eliminados: ${delMovInv.count} registros`);

  // 6. Obtener compras recibidas para reconstruir el saldo exacto por variante en Bodega Central
  const comprasRecibidas = await prisma.compraProveedor.findMany({
    where: { estado: 'RECIBIDA' },
    include: { lineas: true },
  });

  const sumPorVariante: Record<number, number> = {};
  for (const c of comprasRecibidas) {
    for (const l of c.lineas) {
      sumPorVariante[l.varianteId] = (sumPorVariante[l.varianteId] || 0) + l.cantidadRecibida;
    }
  }

  // 7. Restablecer SaldoStock en Bodega Central (ubicacionId = 1)
  const saldosCentral = await prisma.saldoStock.findMany({
    where: { ubicacionId: 1 },
  });

  let totalFisicoCentral = 0;
  for (const s of saldosCentral) {
    const cantObjetivo = sumPorVariante[s.varianteId] || 0;
    await prisma.saldoStock.update({
      where: { id: s.id },
      data: {
        fisico: cantObjetivo,
        reservadoBlando: 0,
        reservadoDuro: 0,
        noVendible: 0,
        bloqueadoDespachoWeb: false,
      },
    });
    totalFisicoCentral += cantObjetivo;
  }
  console.log(`✓ Bodega Central restablecida: ${totalFisicoCentral} unidades físicas y disponibles (${saldosCentral.length} variantes)`);

  // 8. Restablecer SaldoStock en Tiendas Físicas a 0
  const resetTiendas = await prisma.saldoStock.updateMany({
    where: {
      ubicacionId: { not: 1 },
    },
    data: {
      fisico: 0,
      reservadoBlando: 0,
      reservadoDuro: 0,
      noVendible: 0,
      bloqueadoDespachoWeb: false,
    },
  });
  console.log(`✓ Puntos de venta físicos restablecidos a 0 unidades (${resetTiendas.count} registros de saldo)`);

  // 9. Verificar Compras en Tránsito (estado = 'PEDIDA')
  const comprasPedidas = await prisma.compraProveedor.findMany({
    where: { estado: 'PEDIDA' },
    include: { lineas: true },
  });
  let totalTransito = 0;
  for (const c of comprasPedidas) {
    for (const l of c.lineas) {
      totalTransito += l.cantidadPedida || 0;
    }
  }
  console.log(`✓ Compras en tránsito confirmadas: ${totalTransito} unidades en ${comprasPedidas.length} órdenes`);

  // 10. Validación Final de Saldos
  const verificacion = await prisma.saldoStock.groupBy({
    by: ['ubicacionId'],
    _sum: {
      fisico: true,
      reservadoBlando: true,
      reservadoDuro: true,
      noVendible: true,
    },
  });

  console.log('\n=== REPORTE FINAL DE AUDITORÍA POST-LIMPIEZA ===');
  for (const row of verificacion) {
    const disponible = (row._sum.fisico || 0) - (row._sum.reservadoBlando || 0) - (row._sum.reservadoDuro || 0);
    console.log(`Ubicacion #${row.ubicacionId}: Físico = ${row._sum.fisico}, Blando = ${row._sum.reservadoBlando}, Duro = ${row._sum.reservadoDuro}, NoVendible = ${row._sum.noVendible} => DISPONIBLE = ${disponible}`);
  }

  console.log('--- RESTABLECIMIENTO COMPLETADO EXITOSAMENTE ---');
}

cleanAndReset()
  .catch((err) => {
    console.error('Error durante la limpieza y restablecimiento:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
