import React, { useState, useMemo, useEffect } from 'react';
import {
  Receipt,
  Search,
  DollarSign,
  Banknote,
  CreditCard,
  Printer,
  Eye,
  X,
  ShoppingBag,
  User,
  MapPin,
  Sparkles,
  FileSpreadsheet,
  CheckCircle2,
} from 'lucide-react';
import { TicketVentaPOS } from '../components/TicketVentaPOS';
import { VentaTicketDTO } from '../types/ticket.types';
import { getPosRegisteredSales } from '../utils/posLedgerSync';

export interface PrendaVentaHistorial {
  sku: string;
  nombre: string;
  talla: string;
  color: string;
  cantidad: number;
  precioUnitarioCop: number;
  totalCop: number;
  imagenUrl: string;
}

export interface VentaHistorialItem {
  id: string;
  consecutivo: string;
  fechaHora: string;
  fechaCorta: string;
  vendedor: string;
  cliente: string;
  documentoCliente?: string;
  medioPago: 'EFECTIVO' | 'TRANSFERENCIA';
  referenciaPago?: string;
  subtotalCop: number;
  iva19Cop: number;
  totalCop: number;
  montoRecibidoCop?: number;
  cambioCop?: number;
  prendas: PrendaVentaHistorial[];
}

const formatCOP = (valor: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Math.trunc(valor));
};

const escapeXml = (str: string | number | undefined | null): string => {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

const VENTAS_INICIALES_MOCK: VentaHistorialItem[] = [
  {
    id: 'vta-0050',
    consecutivo: '#BUC-0050',
    fechaHora: 'Hoy · 09:40 a. m. (America/Bogota)',
    fechaCorta: 'Hoy 09:40 AM',
    vendedor: 'Daniela Gómez',
    cliente: 'Camila Andrea Suárez',
    documentoCliente: 'CC 1.098.712.330',
    medioPago: 'EFECTIVO',
    subtotalCop: 158824,
    iva19Cop: 30176,
    totalCop: 189000,
    montoRecibidoCop: 200000,
    cambioCop: 11000,
    prendas: [
      {
        sku: 'ROP-DNM-001-S',
        nombre: 'Chaqueta Denim Artesanal',
        talla: 'S',
        color: 'Azul Índigo',
        cantidad: 1,
        precioUnitarioCop: 189000,
        totalCop: 189000,
        imagenUrl:
          'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'vta-0049',
    consecutivo: '#BUC-0049',
    fechaHora: 'Hoy · 08:30 a. m. (America/Bogota)',
    fechaCorta: 'Hoy 08:30 AM',
    vendedor: 'Daniela Gómez',
    cliente: 'Javier Enrique Prada',
    documentoCliente: 'CC 91.240.852',
    medioPago: 'TRANSFERENCIA',
    referenciaPago: 'NEQUI-QR-78219',
    subtotalCop: 82353,
    iva19Cop: 15647,
    totalCop: 98000,
    prendas: [
      {
        sku: 'COS-KIT-008-SET',
        nombre: 'Kit Botánico Cuidado Facial',
        talla: 'Set x3',
        color: 'Natural',
        cantidad: 1,
        precioUnitarioCop: 98000,
        totalCop: 98000,
        imagenUrl:
          'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'vta-0042',
    consecutivo: '#MED-0042',
    fechaHora: 'Hoy · 10:15 a. m. (America/Bogota)',
    fechaCorta: 'Hoy 10:15 AM',
    vendedor: 'Carlos Mendoza',
    cliente: 'Andrés Felipe Calderón',
    documentoCliente: 'CC 88.241.503',
    medioPago: 'TRANSFERENCIA',
    referenciaPago: 'BANCOLOMBIA-QR-88912',
    subtotalCop: 291597,
    iva19Cop: 55403,
    totalCop: 347000,
    prendas: [
      {
        sku: 'ACC-BOL-003-UNI',
        nombre: 'Bolso Cuero Graso Unisex',
        talla: 'Única',
        color: 'Miel Natural',
        cantidad: 1,
        precioUnitarioCop: 249000,
        totalCop: 249000,
        imagenUrl:
          'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=600&q=80',
      },
      {
        sku: 'COS-KIT-008-SET',
        nombre: 'Kit Botánico Cuidado Facial',
        talla: 'Set x3',
        color: 'Natural',
        cantidad: 1,
        precioUnitarioCop: 98000,
        totalCop: 98000,
        imagenUrl:
          'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'vta-0041',
    consecutivo: '#MED-0041',
    fechaHora: 'Ayer · 04:30 p. m. (America/Bogota)',
    fechaCorta: 'Ayer 04:30 PM',
    vendedor: 'Carlos Mendoza',
    cliente: 'Valentina Restrepo',
    documentoCliente: 'CC 1.090.482.910',
    medioPago: 'EFECTIVO',
    subtotalCop: 196639,
    iva19Cop: 37361,
    totalCop: 234000,
    montoRecibidoCop: 250000,
    cambioCop: 16000,
    prendas: [
      {
        sku: 'ROP-DNM-001-M',
        nombre: 'Chaqueta Denim Artesanal',
        talla: 'M',
        color: 'Azul Índigo',
        cantidad: 1,
        precioUnitarioCop: 189000,
        totalCop: 189000,
        imagenUrl:
          'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=600&q=80',
      },
      {
        sku: 'COS-CRM-004-100ML',
        nombre: 'Crema Hidratante Botánica 100ml',
        talla: '100ml',
        color: 'Natural',
        cantidad: 1,
        precioUnitarioCop: 45000,
        totalCop: 45000,
        imagenUrl:
          'https://images.unsplash.com/photo-1608248597359-5633454b5683?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'vta-0040',
    consecutivo: '#MED-0040',
    fechaHora: 'Ayer · 01:20 p. m. (America/Bogota)',
    fechaCorta: 'Ayer 01:20 PM',
    vendedor: 'Laura Marcela Díaz',
    cliente: 'Julián Camilo Peña',
    documentoCliente: 'CC 1.094.221.098',
    medioPago: 'EFECTIVO',
    subtotalCop: 222689,
    iva19Cop: 42311,
    totalCop: 265000,
    montoRecibidoCop: 300000,
    cambioCop: 35000,
    prendas: [
      {
        sku: 'CAL-BOT-006-39',
        nombre: 'Botines Chelsea Cuero Vélez',
        talla: '39',
        color: 'Tabaco Envejecido',
        cantidad: 1,
        precioUnitarioCop: 265000,
        totalCop: 265000,
        imagenUrl:
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'vta-0039',
    consecutivo: '#MED-0039',
    fechaHora: 'Hace 2 días · 05:45 p. m. (America/Bogota)',
    fechaCorta: '2 días atrás',
    vendedor: 'Laura Marcela Díaz',
    cliente: 'Mariana Duque Gómez',
    documentoCliente: 'CC 60.334.190',
    medioPago: 'TRANSFERENCIA',
    referenciaPago: 'NEQUI-QR-33109',
    subtotalCop: 100672,
    iva19Cop: 19128,
    totalCop: 119800,
    prendas: [
      {
        sku: 'ROP-CAM-002-S',
        nombre: 'Camiseta Básica Algodón Pima',
        talla: 'S',
        color: 'Blanco Hueso',
        cantidad: 2,
        precioUnitarioCop: 59900,
        totalCop: 119800,
        imagenUrl:
          'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'vta-0038',
    consecutivo: '#MED-0038',
    fechaHora: 'Hace 2 días · 02:10 p. m. (America/Bogota)',
    fechaCorta: '2 días atrás',
    vendedor: 'Carlos Mendoza',
    cliente: 'Consumidor Final',
    medioPago: 'EFECTIVO',
    subtotalCop: 113445,
    iva19Cop: 21555,
    totalCop: 135000,
    montoRecibidoCop: 150000,
    cambioCop: 15000,
    prendas: [
      {
        sku: 'ART-MOC-005-STD',
        nombre: 'Mochila Tejeduría Ancestral',
        talla: 'Estándar',
        color: 'Tierra / Crudo',
        cantidad: 1,
        precioUnitarioCop: 135000,
        totalCop: 135000,
        imagenUrl:
          'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
];

export const PosVentasHistorialPage: React.FC = () => {
  const [ventas, setVentas] = useState<VentaHistorialItem[]>(VENTAS_INICIALES_MOCK);
  const [busqueda, setBusqueda] = useState<string>('');
  const [filtroPago, setFiltroPago] = useState<'TODOS' | 'EFECTIVO' | 'TRANSFERENCIA'>('TODOS');
  const [ventaSeleccionada, setVentaSeleccionada] = useState<VentaHistorialItem | null>(null);
  const [mostrarModalTicket, setMostrarModalTicket] = useState<boolean>(false);

  // Vendedor y sede activa del turno
  const [vendedorActivo, setVendedorActivo] = useState<string>('Carlos Mendoza');
  const [sedeActiva, setSedeActiva] = useState<string>('Punto Centro (Cúcuta)');
  const [filtroSoloMiTurno, setFiltroSoloMiTurno] = useState<boolean>(true);
  const [mensajeExcelExito, setMensajeExcelExito] = useState<string | null>(null);

  // Cargar usuario y sede activa del localStorage
  useEffect(() => {
    try {
      const rawUser = localStorage.getItem('usuario');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        const name = u.nombreCompleto || u.nombre || 'Carlos Mendoza';
        setVendedorActivo(name);
      }
      const rawSede = localStorage.getItem('forma_pos_sede');
      if (rawSede) {
        setSedeActiva(rawSede);
      }
    } catch {}
  }, []);

  // Cargar ventas registradas en POS sincronizadas en tiempo real
  useEffect(() => {
    const syncSales = () => {
      try {
        const registradas: VentaHistorialItem[] = getPosRegisteredSales().map((s) => ({
          id: s.id,
          consecutivo: s.consecutivo,
          fechaHora: s.fechaHora,
          fechaCorta: s.fechaCorta || 'Hoy ' + (s.fechaHora.split('·')[1]?.trim() || ''),
          vendedor: s.vendedor,
          cliente: s.cliente || 'Consumidor Final',
          documentoCliente: s.documentoCliente,
          medioPago: (s.medioPago || s.metodoPago || 'EFECTIVO') as 'EFECTIVO' | 'TRANSFERENCIA',
          referenciaPago: s.referenciaPago,
          subtotalCop: s.subtotalCop,
          iva19Cop: s.iva19Cop ?? s.ivaCop ?? 0,
          totalCop: s.totalCop,
          montoRecibidoCop: s.montoRecibidoCop ?? s.efectivoRecibidoCop,
          cambioCop: s.cambioCop,
          prendas: (s.prendas || s.items || []).map((i) => ({
            sku: i.sku,
            nombre: i.nombre,
            talla: i.talla || 'Única',
            color: i.color || 'Estándar',
            cantidad: i.cantidad,
            precioUnitarioCop: i.precioUnitarioCop ?? i.precioUnitarioCOP ?? 0,
            totalCop: i.totalCop,
            imagenUrl: i.imagenUrl || '/products/blazer-imperial-vinotinto.png',
          })),
        }));

        setVentas((prev) => {
          const ids = new Set(registradas.map((r) => r.consecutivo));
          const mockSinDuplicados = prev.filter((p) => !ids.has(p.consecutivo));
          return [...registradas, ...mockSinDuplicados];
        });
      } catch {
        // Ignorar errores
      }
    };

    syncSales();
    window.addEventListener('forma-pos-ledger-update', syncSales);
    return () => window.removeEventListener('forma-pos-ledger-update', syncSales);
  }, []);

  // Filtrado reactivo por turno del vendedor, sede, consecutivo, cliente o fecha
  const ventasFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const vNameClean = vendedorActivo.toLowerCase().split(' ')[0] || '';

    return ventas.filter((v) => {
      if (filtroSoloMiTurno && vNameClean) {
        if (!v.vendedor.toLowerCase().includes(vNameClean)) {
          return false;
        }
      }
      if (filtroPago !== 'TODOS' && v.medioPago !== filtroPago) {
        return false;
      }
      if (!q) return true;
      const matchConsecutivo = v.consecutivo.toLowerCase().includes(q);
      const matchCliente = v.cliente.toLowerCase().includes(q);
      const matchVendedor = v.vendedor.toLowerCase().includes(q);
      const matchFecha = v.fechaHora.toLowerCase().includes(q);
      const matchPrenda = v.prendas.some(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.talla.toLowerCase().includes(q)
      );
      return matchConsecutivo || matchCliente || matchVendedor || matchFecha || matchPrenda;
    });
  }, [ventas, busqueda, filtroPago, filtroSoloMiTurno, vendedorActivo]);

  // KPIs agregados sobre las ventas filtradas del turno
  const totalFacturadoCop = useMemo(
    () => ventasFiltradas.reduce((acc, v) => acc + v.totalCop, 0),
    [ventasFiltradas]
  );
  const totalEfectivoCop = useMemo(
    () =>
      ventasFiltradas
        .filter((v) => v.medioPago === 'EFECTIVO')
        .reduce((acc, v) => acc + v.totalCop, 0),
    [ventasFiltradas]
  );
  const totalTransferenciaCop = useMemo(
    () =>
      ventasFiltradas
        .filter((v) => v.medioPago === 'TRANSFERENCIA')
        .reduce((acc, v) => acc + v.totalCop, 0),
    [ventasFiltradas]
  );

  // Exportar ventas a Excel (.xlsx / XML Spreadsheet)
  const exportarVentasExcel = () => {
    const cleanStr = (s: string) =>
      s
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_-]/g, '');

    const vendedorSlug = cleanStr(vendedorActivo);
    const sedeSlug = cleanStr(sedeActiva.replace(/\s*\(Cúcuta\)/i, ''));

    let fechaHoyStr = new Date().toISOString().slice(0, 10);
    try {
      fechaHoyStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Bogota',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());
    } catch {}

    const nombreArchivo = `Ventas_Diarias_${vendedorSlug}_${sedeSlug}_${fechaHoyStr}.xlsx`;

    const ventasAExportar = ventasFiltradas.length > 0 ? ventasFiltradas : ventas;

    const filas: {
      consecutivo: string;
      fechaHora: string;
      vendedor: string;
      sede: string;
      sku: string;
      prenda: string;
      talla: string;
      color: string;
      cantidad: number;
      medioPago: string;
      subtotalCop: number;
      ivaCop: number;
      totalCop: number;
    }[] = [];

    ventasAExportar.forEach((v) => {
      if (v.prendas && v.prendas.length > 0) {
        v.prendas.forEach((p) => {
          const subtotalPrenda = Math.round(p.totalCop / 1.19);
          const ivaPrenda = p.totalCop - subtotalPrenda;
          filas.push({
            consecutivo: v.consecutivo,
            fechaHora: v.fechaHora,
            vendedor: v.vendedor,
            sede: sedeActiva,
            sku: p.sku,
            prenda: p.nombre,
            talla: p.talla,
            color: p.color,
            cantidad: p.cantidad,
            medioPago: v.medioPago,
            subtotalCop: subtotalPrenda,
            ivaCop: ivaPrenda,
            totalCop: p.totalCop,
          });
        });
      } else {
        filas.push({
          consecutivo: v.consecutivo,
          fechaHora: v.fechaHora,
          vendedor: v.vendedor,
          sede: sedeActiva,
          sku: 'N/A',
          prenda: 'Venta Global Mostrador',
          talla: '-',
          color: '-',
          cantidad: 1,
          medioPago: v.medioPago,
          subtotalCop: v.subtotalCop,
          ivaCop: v.iva19Cop,
          totalCop: v.totalCop,
        });
      }
    });

    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Author>FORMA POS</Author>
  <Created>${new Date().toISOString()}</Created>
  <Company>FORMA Moda Colombiana</Company>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="HeaderStyle">
   <Font ss:Bold="1" ss:Color="#FFFFFF" ss:FontName="Calibri" ss:Size="11"/>
   <Interior ss:Color="#661521" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D19650"/>
   </Borders>
  </Style>
  <Style ss:ID="CurrencyStyle">
   <NumberFormat ss:Format="&quot;$&quot;#,##0;[Red]\-&quot;$&quot;#,##0"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="CenterStyle">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="TextStyle">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Ventas Diarias">
  <Table>
   <Column ss:Width="110"/>
   <Column ss:Width="160"/>
   <Column ss:Width="140"/>
   <Column ss:Width="150"/>
   <Column ss:Width="120"/>
   <Column ss:Width="200"/>
   <Column ss:Width="70"/>
   <Column ss:Width="110"/>
   <Column ss:Width="70"/>
   <Column ss:Width="110"/>
   <Column ss:Width="110"/>
   <Column ss:Width="100"/>
   <Column ss:Width="110"/>
   <Row ss:Height="26">
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Consecutivo</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Fecha/Hora</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Vendedor</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Sede</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">SKU</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Prenda</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Talla</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Color</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Cantidad</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Medio de Pago</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Subtotal COP</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">IVA COP</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Total COP</Data></Cell>
   </Row>
   ${filas
     .map(
       (f) => `
   <Row ss:Height="20">
    <Cell ss:StyleID="CenterStyle"><Data ss:Type="String">${escapeXml(f.consecutivo)}</Data></Cell>
    <Cell ss:StyleID="TextStyle"><Data ss:Type="String">${escapeXml(f.fechaHora)}</Data></Cell>
    <Cell ss:StyleID="TextStyle"><Data ss:Type="String">${escapeXml(f.vendedor)}</Data></Cell>
    <Cell ss:StyleID="TextStyle"><Data ss:Type="String">${escapeXml(f.sede)}</Data></Cell>
    <Cell ss:StyleID="CenterStyle"><Data ss:Type="String">${escapeXml(f.sku)}</Data></Cell>
    <Cell ss:StyleID="TextStyle"><Data ss:Type="String">${escapeXml(f.prenda)}</Data></Cell>
    <Cell ss:StyleID="CenterStyle"><Data ss:Type="String">${escapeXml(f.talla)}</Data></Cell>
    <Cell ss:StyleID="TextStyle"><Data ss:Type="String">${escapeXml(f.color)}</Data></Cell>
    <Cell ss:StyleID="CenterStyle"><Data ss:Type="Number">${f.cantidad}</Data></Cell>
    <Cell ss:StyleID="CenterStyle"><Data ss:Type="String">${escapeXml(f.medioPago)}</Data></Cell>
    <Cell ss:StyleID="CurrencyStyle"><Data ss:Type="Number">${f.subtotalCop}</Data></Cell>
    <Cell ss:StyleID="CurrencyStyle"><Data ss:Type="Number">${f.ivaCop}</Data></Cell>
    <Cell ss:StyleID="CurrencyStyle"><Data ss:Type="Number">${f.totalCop}</Data></Cell>
   </Row>`
     )
     .join('')}
  </Table>
 </Worksheet>
</Workbook>`;

    const blob = new Blob([xmlContent], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8',
    });
    if (typeof window.URL.createObjectURL === 'function') {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = nombreArchivo;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    }
    setMensajeExcelExito(`Reporte "${nombreArchivo}" generado y descargado correctamente.`);
    setTimeout(() => setMensajeExcelExito(null), 4000);
  };

  // Convertir a DTO de Ticket para impresión
  const ticketDataParaImprimir: VentaTicketDTO | null = useMemo(() => {
    if (!ventaSeleccionada) return null;
    return {
      nombreTienda: 'FORMA BOUTIQUE STORE',
      nombreSede: sedeActiva,
      direccionSede: 'Calle 10 # 3-45, Centro Comercial Plaza',
      telefonoSede: '(+57) 310 492 8810',
      consecutivo: ventaSeleccionada.consecutivo,
      fechaHora: ventaSeleccionada.fechaHora,
      cajeroNombre: ventaSeleccionada.vendedor,
      clienteNombre: ventaSeleccionada.cliente,
      items: ventaSeleccionada.prendas.map((p) => ({
        sku: p.sku,
        nombre: p.nombre,
        talla: p.talla,
        color: p.color,
        cantidad: p.cantidad,
        precioUnitarioCop: p.precioUnitarioCop,
        subtotalCop: p.totalCop,
        descuentoCop: 0,
        totalCop: p.totalCop,
      })),
      subtotalCop: ventaSeleccionada.subtotalCop,
      descuentoTotalCop: 0,
      ivaDiscriminadoCop: ventaSeleccionada.iva19Cop,
      totalNetoCop: ventaSeleccionada.totalCop,
      metodoPago: ventaSeleccionada.medioPago,
      montoRecibidoCop: ventaSeleccionada.montoRecibidoCop,
      cambioCop: ventaSeleccionada.cambioCop,
      referenciaTransferencia: ventaSeleccionada.referenciaPago,
    };
  }, [ventaSeleccionada]);

  return (
    <div className="min-h-full lg:h-full w-full overflow-y-auto bg-[#F4EFEA] text-[#1C1311] rounded-2xl border border-[#D8CFC6] shadow-inner p-2.5 sm:p-5 select-none font-sans">
      {/* =========================================================================
          CABECERA EDITORIAL Y KPIS DE VENTAS DEL PUNTO DE VENTA
      ========================================================================= */}
      <header className="bg-white rounded-2xl border-2 border-[#E2D9CE] shadow-sm p-4 sm:p-5 mb-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#EFEAE4]">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#661521] text-white flex items-center justify-center shrink-0 shadow-md">
              <Receipt className="w-6 h-6 text-[#D19650]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-[#1C1311] text-[#D19650] font-mono text-xs font-black tracking-wider uppercase">
                  Punto de Venta
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#059669] text-xs font-extrabold">
                  {ventas.length} Ventas Registradas
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[#1C1311] tracking-tight mt-1">
                Historial de Ventas del Mostrador
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs bg-[#FAF7F4] px-3.5 py-2.5 rounded-xl border border-[#E5DDD3]">
              <MapPin className="w-4 h-4 text-[#661521]" />
              <span className="font-bold text-[#1C1311]">Sede {sedeActiva}</span>
            </div>

            <div className="flex items-center gap-2 text-xs bg-[#FAF7F4] px-3.5 py-2.5 rounded-xl border border-[#E5DDD3]">
              <User className="w-4 h-4 text-[#D19650]" />
              <span className="font-bold text-stone-700">
                Turno: <strong className="text-[#1C1311]">{vendedorActivo}</strong>
              </span>
            </div>

            {/* Botón Dominante de Exportación Diaria a Excel (.xlsx) */}
            <button
              type="button"
              onClick={exportarVentasExcel}
              className="min-h-[46px] px-4 py-2.5 rounded-xl bg-[#059669] hover:bg-emerald-700 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer"
              title="Descargar reporte diario de ventas en formato Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>Exportar Ventas Diarias a Excel (.xlsx)</span>
            </button>
          </div>
        </div>

        {mensajeExcelExito && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-[#059669] text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{mensajeExcelExito}</span>
          </div>
        )}

        {/* Tarjetas de Resumen Financiero */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-4">
          <div className="p-3.5 rounded-xl bg-[#FAF7F4] border border-[#E5DDD3]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Total Facturado
              </span>
              <DollarSign className="w-4 h-4 text-[#059669]" />
            </div>
            <p className="text-xl sm:text-2xl font-black font-mono tabular-nums text-[#1C1311] mt-1">
              {formatCOP(totalFacturadoCop)}
            </p>
            <p className="text-[11px] text-stone-500 mt-0.5">En {ventas.length} comprobantes emitidos</p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#FAF7F4] border border-[#E5DDD3]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Ventas en Efectivo
              </span>
              <Banknote className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-xl sm:text-2xl font-black font-mono tabular-nums text-[#059669] mt-1">
              {formatCOP(totalEfectivoCop)}
            </p>
            <p className="text-[11px] text-stone-500 mt-0.5">Dinero en gaveta física</p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#FAF7F4] border border-[#E5DDD3]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Transferencias Bancarias
              </span>
              <CreditCard className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-xl sm:text-2xl font-black font-mono tabular-nums text-indigo-900 mt-1">
              {formatCOP(totalTransferenciaCop)}
            </p>
            <p className="text-[11px] text-stone-500 mt-0.5">Bancolombia QR & Nequi</p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#1C1311] text-white border-2 border-[#D19650]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#D19650]">
                Ticket Promedio
              </span>
              <Sparkles className="w-4 h-4 text-[#D19650]" />
            </div>
            <p className="text-xl sm:text-2xl font-black font-mono tabular-nums text-white mt-1">
              {ventas.length > 0 ? formatCOP(totalFacturadoCop / ventas.length) : '$0 COP'}
            </p>
            <p className="text-[11px] text-[#E7DED2]/80 mt-0.5">Promedio por transacción</p>
          </div>
        </div>
      </header>

      {/* =========================================================================
          BARRA DE BÚSQUEDA Y FILTROS RÁPIDOS
      ========================================================================= */}
      <div className="bg-white rounded-2xl border-2 border-[#E2D9CE] shadow-sm p-4 mb-5 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por consecutivo (#MED-0042), cliente, prenda, SKU o fecha..."
            className="w-full min-h-[48px] pl-10 pr-4 rounded-xl bg-[#FAF7F4] border-2 border-[#D8CFC6] text-sm font-semibold text-[#1C1311] placeholder:text-stone-400 focus:outline-none focus:border-[#661521]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Alternador de Turno vs Sede Completa */}
          <div className="flex items-center gap-1 bg-[#FAF7F4] p-1 rounded-xl border border-[#D8CFC6]">
            <button
              type="button"
              onClick={() => setFiltroSoloMiTurno(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filtroSoloMiTurno
                  ? 'bg-[#1C1311] text-[#D19650] shadow-sm'
                  : 'text-stone-600 hover:text-[#1C1311]'
              }`}
            >
              Mi Turno ({vendedorActivo.split(' ')[0]})
            </button>
            <button
              type="button"
              onClick={() => setFiltroSoloMiTurno(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                !filtroSoloMiTurno
                  ? 'bg-[#1C1311] text-[#D19650] shadow-sm'
                  : 'text-stone-600 hover:text-[#1C1311]'
              }`}
            >
              Toda la Sede
            </button>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-xs font-bold text-stone-500 mr-1 hidden sm:inline">Medio de Pago:</span>
            {(['TODOS', 'EFECTIVO', 'TRANSFERENCIA'] as const).map((medio) => (
              <button
                key={medio}
                type="button"
                onClick={() => setFiltroPago(medio)}
                className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-extrabold border transition-all shrink-0 ${
                  filtroPago === medio
                    ? 'bg-[#661521] text-white border-[#661521] shadow-sm'
                    : 'bg-[#FAF7F4] text-[#1C1311] border-[#D8CFC6] hover:bg-stone-200/60'
                }`}
              >
                {medio === 'TODOS' ? 'Todos' : medio === 'EFECTIVO' ? 'Efectivo' : 'Transferencia'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* =========================================================================
          TABLA / TARJETAS LIMPIAS DEL HISTORIAL DE VENTAS
      ========================================================================= */}
      <section className="bg-white rounded-2xl border-2 border-[#E2D9CE] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#EFEAE4] flex items-center justify-between">
          <h2 className="text-base font-black text-[#1C1311]">
            Ventas Registradas en el Punto ({ventasFiltradas.length})
          </h2>
          <span className="text-xs text-stone-500 font-medium">
            Haz clic en cualquier venta para ver el detalle o reimprimir ticket
          </span>
        </div>

        {ventasFiltradas.length === 0 ? (
          <div className="p-10 text-center text-stone-500 space-y-2">
            <ShoppingBag className="w-12 h-12 mx-auto text-stone-300" />
            <p className="font-bold text-sm">No se encontraron ventas con los criterios de búsqueda.</p>
            <button
              type="button"
              onClick={() => {
                setBusqueda('');
                setFiltroPago('TODOS');
              }}
              className="text-xs text-[#661521] font-bold underline"
            >
              Restablecer filtros
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-[#FAF7F4] border-b border-[#E5DDD3] text-stone-600 font-extrabold uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-4">Consecutivo</th>
                  <th className="py-3 px-4">Fecha / Hora</th>
                  <th className="py-3 px-4">Vendedor</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Medio de Pago</th>
                  <th className="py-3 px-4 text-right">Total Pagado</th>
                  <th className="py-3 px-4 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFEAE4]">
                {ventasFiltradas.map((v) => (
                  <tr
                    key={v.id}
                    onClick={() => setVentaSeleccionada(v)}
                    className="hover:bg-[#FAF7F4] cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-mono font-black text-sm text-[#1C1311]">
                      <span className="px-2 py-0.5 rounded-lg bg-[#1C1311] text-[#D19650]">
                        {v.consecutivo}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-stone-700 whitespace-nowrap">
                      {v.fechaHora}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#1C1311]">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-stone-400" />
                        <span>{v.vendedor}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-stone-800">
                      <div>
                        <span>{v.cliente}</span>
                        {v.documentoCliente && (
                          <span className="block text-[11px] text-stone-500 font-mono">
                            {v.documentoCliente}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black ${
                          v.medioPago === 'EFECTIVO'
                            ? 'bg-emerald-100 text-[#059669] border border-emerald-300'
                            : 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                        }`}
                      >
                        {v.medioPago === 'EFECTIVO' ? (
                          <>
                            <Banknote className="w-3.5 h-3.5" />
                            <span>Efectivo</span>
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Transferencia</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-black text-sm text-[#1C1311]">
                      {formatCOP(v.totalCop)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setVentaSeleccionada(v);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white border border-[#D8CFC6] text-xs font-extrabold text-[#661521] hover:bg-[#661521] hover:text-white transition-all inline-flex items-center gap-1 shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver Detalle</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* =========================================================================
          MODAL CON EL DETALLE DE LA VENTA SELECCIONADA
      ========================================================================= */}
      {ventaSeleccionada && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-[#F4EFEA] text-[#1C1311] rounded-3xl border-2 border-[#D19650] shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Cabecera del Detalle */}
            <div className="bg-[#1C1311] text-white p-4 sm:p-5 rounded-t-3xl flex items-center justify-between gap-3 border-b border-[#D19650]/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#661521] border border-[#D19650]/50 flex items-center justify-center text-[#D19650]">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-black text-[#D19650]">
                      {ventaSeleccionada.consecutivo}
                    </span>
                    <span className="text-xs text-[#E7DED2]/80">Detalle de Factura</span>
                  </div>
                  <p className="text-xs text-stone-300">{ventaSeleccionada.fechaHora}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setVentaSeleccionada(null)}
                aria-label="Cerrar modal de detalle"
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido del Detalle */}
            <div className="p-4 sm:p-6 space-y-4">
              {/* Metadatos del Cliente y Vendedor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-4 rounded-2xl border border-[#E5DDD3]">
                <div>
                  <span className="text-xs font-bold uppercase text-stone-500 block">Cliente</span>
                  <p className="text-sm font-black text-[#1C1311] mt-0.5">
                    {ventaSeleccionada.cliente}
                  </p>
                  {ventaSeleccionada.documentoCliente && (
                    <span className="text-xs font-mono text-stone-600 block">
                      {ventaSeleccionada.documentoCliente}
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-xs font-bold uppercase text-stone-500 block">
                    Atendido por
                  </span>
                  <p className="text-sm font-black text-[#1C1311] mt-0.5">
                    {ventaSeleccionada.vendedor}
                  </p>
                  <span className="text-xs text-stone-600 block">Cajero Mostrador POS</span>
                </div>
              </div>

              {/* Lista de Prendas Vendidas con Fotos de Estudio */}
              <div>
                <h3 className="text-xs font-extrabold uppercase text-stone-700 tracking-wider mb-2.5">
                  Prendas en esta Venta ({ventaSeleccionada.prendas.length})
                </h3>

                <div className="space-y-2.5">
                  {ventaSeleccionada.prendas.map((prenda, idx) => (
                    <div
                      key={`${prenda.sku}-${idx}`}
                      className="p-3 bg-white rounded-2xl border border-[#E5DDD3] flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={prenda.imagenUrl}
                          alt={prenda.nombre}
                          className="w-16 h-16 rounded-xl object-cover border border-stone-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="text-sm font-black text-[#1C1311] truncate">
                            {prenda.nombre}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs font-mono text-stone-600">
                            <span className="px-1.5 py-0.5 rounded bg-stone-100 text-[#1C1311] font-bold">
                              SKU: {prenda.sku}
                            </span>
                            <span>Talla: {prenda.talla}</span>
                            <span>Color: {prenda.color}</span>
                          </div>
                          <p className="text-xs text-stone-600 mt-1">
                            {prenda.cantidad} unidad(es) × {formatCOP(prenda.precioUnitarioCop)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono text-sm font-black text-[#1C1311]">
                          {formatCOP(prenda.totalCop)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Liquidación Financiera con IVA 19% discriminado */}
              <div className="bg-[#FAF7F4] p-4 rounded-2xl border-2 border-[#E5DDD3] space-y-2">
                <div className="flex justify-between text-xs font-medium text-stone-600">
                  <span>Subtotal antes de impuestos:</span>
                  <span className="font-mono">{formatCOP(ventaSeleccionada.subtotalCop)}</span>
                </div>
                <div className="flex justify-between text-xs font-medium text-stone-600">
                  <span>IVA discriminado (19% incluido):</span>
                  <span className="font-mono">{formatCOP(ventaSeleccionada.iva19Cop)}</span>
                </div>
                <div className="pt-2 border-t border-[#E5DDD3] flex justify-between items-baseline">
                  <span className="text-sm font-black text-[#1C1311]">Total Pagado:</span>
                  <span className="text-xl font-black font-mono text-[#059669]">
                    {formatCOP(ventaSeleccionada.totalCop)} COP
                  </span>
                </div>

                {/* Desglose de Pago */}
                <div className="pt-2 border-t border-dashed border-[#D8CFC6] flex flex-wrap items-center justify-between text-xs">
                  <span className="font-bold text-stone-700">
                    Medio de pago: {ventaSeleccionada.medioPago}
                  </span>
                  {ventaSeleccionada.medioPago === 'EFECTIVO' &&
                    ventaSeleccionada.montoRecibidoCop && (
                      <span className="font-mono text-stone-600">
                        Recibido: {formatCOP(ventaSeleccionada.montoRecibidoCop)} · Cambio:{' '}
                        {formatCOP(ventaSeleccionada.cambioCop || 0)}
                      </span>
                    )}
                  {ventaSeleccionada.medioPago === 'TRANSFERENCIA' &&
                    ventaSeleccionada.referenciaPago && (
                      <span className="font-mono text-stone-600">
                        Ref: {ventaSeleccionada.referenciaPago}
                      </span>
                    )}
                </div>
              </div>

              {/* Botón de Reimpresión de Ticket */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMostrarModalTicket(true)}
                  className="flex-1 min-h-[52px] px-5 rounded-2xl bg-[#661521] hover:bg-[#52101a] text-white font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <Printer className="w-4 h-4 text-[#D19650]" />
                  <span>Reimprimir Ticket de Venta (80mm)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setVentaSeleccionada(null)}
                  className="min-h-[52px] px-5 rounded-2xl bg-white border-2 border-[#D8CFC6] text-stone-800 font-extrabold text-xs hover:bg-stone-100"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL DE IMPRESIÓN DE TICKET TÉRMICO 80MM
      ========================================================================= */}
      {mostrarModalTicket && ticketDataParaImprimir && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-4 max-h-[92vh] overflow-y-auto">
            <TicketVentaPOS
              ticket={ticketDataParaImprimir}
              onClose={() => setMostrarModalTicket(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PosVentasHistorialPage;
