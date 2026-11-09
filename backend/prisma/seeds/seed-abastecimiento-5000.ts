import { PrismaClient, TipoMovimientoStock } from '@prisma/client';
import { InventoryLedgerService } from '../../src/modules/04-inventario/InventoryLedgerService.js';

const prisma = new PrismaClient();

interface DistribuidorDef {
  id: string;
  nombre: string;
  nit: string;
  contacto: string;
  telefono: string;
  email: string;
  ciudad: string;
  especialidad: string;
  descuentoMayoristaPorc: number; // Porcentaje de margen sobre PVP (ej: 50% = costo al 50%)
  matcher: (p: { nombre: string; categoriaNombre: string; descripcion: string }) => boolean;
}

export const DISTRIBUIDORES_OFICIALES: DistribuidorDef[] = [
  {
    id: 'dist-1',
    nombre: 'Hilaturas & Sedas del Oriente S.A.S',
    nit: '900.542.110-4',
    contacto: 'María Camila Restrepo · Gerente de Cuentas',
    telefono: '+57 310 456 7890',
    email: 'ventas@sedasdeloriente.co',
    ciudad: 'Bucaramanga, Santander',
    especialidad: 'Sedas naturales andinas, lino 100% orgánico y champaña satinada',
    descuentoMayoristaPorc: 52, // Costo mayorista: 48% del PVP
    matcher: (p) =>
      p.categoriaNombre === 'Ropa' &&
      (p.nombre.toLowerCase().includes('lino') ||
        p.nombre.toLowerCase().includes('seda') ||
        p.descripcion.toLowerCase().includes('lino') ||
        p.descripcion.toLowerCase().includes('seda')),
  },
  {
    id: 'dist-2',
    nombre: 'Confecciones & Sastrería Imperial Andina S.A.S',
    nit: '901.238.455-8',
    contacto: 'Hernán Darío Gómez · Director Comercial',
    telefono: '+57 312 890 1234',
    email: 'pedidos@sastreriaandina.co',
    ciudad: 'Cúcuta, Norte de Santander',
    especialidad: 'Blazers en lana fría de sastre, chaquetas térmicas 3D y algodón peinado 220 GSM',
    descuentoMayoristaPorc: 55, // Costo mayorista: 45% del PVP
    matcher: (p) =>
      p.categoriaNombre === 'Ropa' &&
      !p.nombre.toLowerCase().includes('lino') &&
      !p.nombre.toLowerCase().includes('seda') &&
      !p.descripcion.toLowerCase().includes('lino') &&
      !p.descripcion.toLowerCase().includes('seda'),
  },
  {
    id: 'dist-3',
    nombre: 'Manufacturas de Cuero & Calzado La Fontana S.A.S',
    nit: '890.312.980-1',
    contacto: 'Valeria Cárdenas · Directora de Ventas Mayoristas',
    telefono: '+57 315 678 9012',
    email: 'mayoristas@lafontanaleather.co',
    ciudad: 'Bogotá D.C.',
    especialidad: 'Piel vacuna flor entera, calzado Oxford, mocasines miel y bolsos tote de lujo',
    descuentoMayoristaPorc: 50, // Costo mayorista: 50% del PVP
    matcher: (p) => p.categoriaNombre === 'Accesorios' || p.categoriaNombre === 'Calzado',
  },
  {
    id: 'dist-4',
    nombre: 'Laboratorios Botánicos & Cuidado Facial del Valle S.A.S',
    nit: '900.871.234-9',
    contacto: 'Dra. Elena Monsalve · Dirección Técnica y Despachos',
    telefono: '+57 318 234 5678',
    email: 'distribucion@botanicosdelvalle.co',
    ciudad: 'Cali, Valle del Cauca',
    especialidad: 'Sérums botánicos oro 24K, aceite puro de sacha inchi y cosmética limpia certificada',
    descuentoMayoristaPorc: 58, // Costo mayorista: 42% del PVP
    matcher: (p) => p.categoriaNombre === 'Cosméticos',
  },
  {
    id: 'dist-5',
    nombre: 'Maestría Artesanal & Tejidos Tradicionales S.A.S',
    nit: '800.654.321-7',
    contacto: 'Taita Jairo Chindoy · Maestro Tejedor y Representante',
    telefono: '+57 320 123 4567',
    email: 'contacto@maestriatradicional.co',
    ciudad: 'Nobsa, Boyacá / Pasto, Nariño',
    especialidad: 'Lana virgen de oveja hilada a mano, palma de iraca fina, werregue y tejidos Wayuu',
    descuentoMayoristaPorc: 48, // Costo mayorista: 52% del PVP
    matcher: (p) => p.categoriaNombre === 'Artesanías',
  },
];

async function main() {
  console.log('🚀 Iniciando siembra oficial de Abastecimiento Mayorista (~5.000 prendas)...');

  // 1. Validar Bodega Central
  const central = await prisma.ubicacion.findFirst({
    where: { tipo: 'CENTRAL' },
  });
  if (!central) {
    throw new Error('No se encontró Bodega Central configurada');
  }
  console.log(`🏢 Bodega Central localizada: [${central.id}] ${central.nombre}`);

  // 2. Validar Admin
  const admin = await prisma.usuario.findFirst({
    where: { rol: 'ADMIN', activo: true },
  });
  if (!admin) {
    throw new Error('No se encontró un usuario ADMIN activo para registrar las compras');
  }
  console.log(`👤 Usuario Admin autorizador: [${admin.id}] ${admin.nombreCompleto} (${admin.correo})`);

  // 3. Obtener catálogo activo con variantes
  const productos = await prisma.producto.findMany({
    where: { activo: true },
    include: {
      categoria: true,
      variantes: {
        where: { activa: true },
      },
    },
    orderBy: { id: 'asc' },
  });

  console.log(`📦 Productos activos encontrados: ${productos.length}`);

  // 4. Mapear variantes por distribuidor
  const variantesPorDistribuidor = new Map<string, Array<{
    varianteId: number;
    sku: string;
    nombreProducto: string;
    talla: string;
    color: string;
    precioVentaCop: number;
    costoUnitarioCop: number;
  }>>();

  for (const dist of DISTRIBUIDORES_OFICIALES) {
    variantesPorDistribuidor.set(dist.id, []);
  }

  for (const prod of productos) {
    const itemInfo = {
      nombre: prod.nombre,
      categoriaNombre: prod.categoria.nombre,
      descripcion: prod.descripcion,
    };
    const dist = DISTRIBUIDORES_OFICIALES.find((d) => d.matcher(itemInfo)) || DISTRIBUIDORES_OFICIALES[1]!;

    for (const v of prod.variantes) {
      // Costo mayorista: entero COP estrictamente menor que el precio de venta (RN-GEN-04)
      const factorCosto = (100 - dist.descuentoMayoristaPorc) / 100;
      const costoUnitarioCop = Math.max(1000, Math.round(v.precioVentaCop * factorCosto));

      variantesPorDistribuidor.get(dist.id)!.push({
        varianteId: v.id,
        sku: v.sku,
        nombreProducto: prod.nombre,
        talla: v.talla,
        color: v.color,
        precioVentaCop: v.precioVentaCop,
        costoUnitarioCop,
      });
    }
  }

  let totalPrendasRecibidas = 0;
  let totalPrendasPedidas = 0;
  let totalCostoCop = 0;

  // 5. Procesar cada uno de los 5 distribuidores
  for (const dist of DISTRIBUIDORES_OFICIALES) {
    const variantes = variantesPorDistribuidor.get(dist.id) || [];
    if (variantes.length === 0) continue;

    console.log(`\n======================================================`);
    console.log(`🏭 Procesando: ${dist.nombre} (${variantes.length} variantes asociadas)`);

    // A) ORDEN RECIBIDA: ~840 prendas por distribuidor (suman ~4.200 recibidas)
    const cantRecibidaPorVariante = Math.max(15, Math.round(840 / variantes.length));
    const lineasRecibidas = variantes.map((v) => ({
      varianteId: v.varianteId,
      cantidadPedida: cantRecibidaPorVariante,
      cantidadRecibida: cantRecibidaPorVariante,
      costoUnitarioCop: v.costoUnitarioCop,
      sku: v.sku,
    }));

    const cantTotalRecibida = lineasRecibidas.reduce((acc, l) => acc + l.cantidadRecibida, 0);

    // Crear orden en BD con timeout holgado
    await prisma.$transaction(
      async (tx) => {
        // 1. Crear la orden de compra
        const compraRec = await tx.compraProveedor.create({
          data: {
            proveedorNombre: dist.nombre,
            proveedorContacto: `${dist.contacto} · Tel: ${dist.telefono} · Correo: ${dist.email} (${dist.ciudad}) - NIT: ${dist.nit}`,
            notas: `Lote oficial de abastecimiento inicial. ${dist.especialidad}. Despachado por transportadora y verificado en muelle de Bodega Central.`,
            estado: 'PEDIDA',
            creadoPorId: admin.id,
            lineas: {
              create: lineasRecibidas.map((l) => ({
                varianteId: l.varianteId,
                cantidadPedida: l.cantidadPedida,
                cantidadRecibida: l.cantidadRecibida,
                costoUnitarioCop: l.costoUnitarioCop,
              })),
            },
          },
          include: { lineas: true },
        });

        // 2. Ingresar a Bodega Central vía InventoryLedgerService (RN-COM-01, RN-COM-03, RN-GEN-02)
        // Orden canónico anti-deadlock por varianteId ASC (RNF-003)
        const lineasOrdenadas = [...lineasRecibidas].sort((a, b) => a.varianteId - b.varianteId);

        for (const linea of lineasOrdenadas) {
          await InventoryLedgerService.registrarMovimiento(tx, {
            ubicacionId: central.id,
            varianteId: linea.varianteId,
            tipo: TipoMovimientoStock.COMPRA_RECIBIDA,
            cantidadConSigno: linea.cantidadRecibida,
            afectaSaldo: 'FISICO',
            documentoTipo: 'COMPRA',
            documentoId: compraRec.id,
            usuarioId: admin.id,
            motivo: `Ingreso por abastecimiento mayorista OC #${compraRec.id} - ${dist.nombre}`,
            autoCrearSiNoExiste: true,
          });
        }

        // 3. Pasar estado a RECIBIDA con fecha de recepción
        await tx.compraProveedor.update({
          where: { id: compraRec.id },
          data: {
            estado: 'RECIBIDA',
            recibidoPorId: admin.id,
            fechaRecepcion: new Date(),
            version: { increment: 1 },
          },
        });

        // 4. Registro de auditoría
        await tx.registroAuditoria.create({
          data: {
            usuarioId: admin.id,
            accion: 'RECEPCION_COMPRA_MAYORISTA',
            entidadTipo: 'CompraProveedor',
            entidadId: String(compraRec.id),
            datosMinimos: {
              compraId: compraRec.id,
              proveedorNombre: dist.nombre,
              unidadesIngresadas: cantTotalRecibida,
              ubicacionDestino: central.nombre,
            },
          },
        });

        console.log(`  ✅ Orden RECIBIDA #${compraRec.id}: ${cantTotalRecibida} unidades ingresadas al Kardex de Bodega Central`);
      },
      { timeout: 60000, maxWait: 15000 }
    );

    totalPrendasRecibidas += cantTotalRecibida;

    // B) ORDEN PEDIDA: ~160 prendas por distribuidor (suman ~800 pendientes)
    const cantPedidaPorVariante = Math.max(4, Math.round(160 / variantes.length));
    const lineasPendientes = variantes.map((v) => ({
      varianteId: v.varianteId,
      cantidadPedida: cantPedidaPorVariante,
      costoUnitarioCop: v.costoUnitarioCop,
    }));
    const cantTotalPedida = lineasPendientes.reduce((acc, l) => acc + l.cantidadPedida, 0);

    const compraPed = await prisma.compraProveedor.create({
      data: {
        proveedorNombre: dist.nombre,
        proveedorContacto: `${dist.contacto} · Tel: ${dist.telefono} · Correo: ${dist.email} (${dist.ciudad})`,
        notas: `Reposición proyectada de temporada. En proceso de alistamiento y despacho por el fabricante.`,
        estado: 'PEDIDA',
        creadoPorId: admin.id,
        lineas: {
          create: lineasPendientes.map((l) => ({
            varianteId: l.varianteId,
            cantidadPedida: l.cantidadPedida,
            costoUnitarioCop: l.costoUnitarioCop,
          })),
        },
      },
    });

    console.log(`  ⏳ Orden PEDIDA (Pendiente) #${compraPed.id}: ${cantTotalPedida} unidades en tránsito / por recibir`);
    totalPrendasPedidas += cantTotalPedida;

    const subtotalCosto = lineasRecibidas.reduce((acc, l) => acc + l.cantidadRecibida * (l.costoUnitarioCop || 0), 0) +
      lineasPendientes.reduce((acc, l) => acc + l.cantidadPedida * (l.costoUnitarioCop || 0), 0);
    totalCostoCop += subtotalCosto;
  }

  console.log(`\n======================================================`);
  console.log(`🎉 ABASTECIMIENTO COMPLETADO CON ÉXITO:`);
  console.log(`- Total Prendas RECIBIDAS en Bodega Central (Kardex): ${totalPrendasRecibidas.toLocaleString()} unds`);
  console.log(`- Total Prendas PEDIDAS (Pendientes de Recepción):    ${totalPrendasPedidas.toLocaleString()} unds`);
  console.log(`- TOTAL GLOBAL ABASTECIDO:                           ${(totalPrendasRecibidas + totalPrendasPedidas).toLocaleString()} unds`);
  console.log(`- Valorización Total Compra Mayorista:                $${totalCostoCop.toLocaleString('es-CO')} COP`);
  console.log(`======================================================\n`);
}

main()
  .catch((e) => {
    console.error('❌ Error sembrando abastecimiento:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
