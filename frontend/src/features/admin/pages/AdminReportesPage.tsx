// frontend/src/features/admin/pages/AdminReportesPage.tsx
import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Download,
  DollarSign,
  Users,
  Store,
  Filter,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Shirt,
  ShoppingBag,
  CreditCard,
  Receipt,
  Crown,
  FileCheck,
} from 'lucide-react';

// Formato COP Entero sin decimales
const formatCOP = (valor: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Math.trunc(valor));
};

// Modelos de datos para el Motor de Analítica
export type CategoriaPrenda =
  | 'TODAS'
  | 'ROPA'
  | 'CALZADO'
  | 'ACCESORIOS'
  | 'COSMETICOS'
  | 'ARTESANIAS';

export type RangoFecha =
  | 'HOY'
  | '7DIAS'
  | 'ESTE_MES'
  | 'TRIMESTRE'
  | 'PERSONALIZADO';

export interface VentaTransaccion {
  id: string;
  consecutivo: string;
  fecha: string; // YYYY-MM-DD
  sede: string;
  vendedor: string;
  cliente: string;
  prendaNombre: string;
  categoria: CategoriaPrenda;
  tipoRopa?: 'PANTALON' | 'CAMISA' | 'CHAQUETA' | 'VESTIDO' | 'OTRO';
  cantidad: number;
  precioUnitarioCop: number;
  subtotalCop: number;
  descuentoCop: number;
  totalNetoCop: number;
  medioPago: 'EFECTIVO' | 'BANCOLOMBIA' | 'NEQUI' | 'DAVIPLATA' | 'TARJETA';
}

// Conjunto maestro de datos de ventas (Noviembre 2026 y periodos históricos)
const VENTAS_MAESTRAS_DEMO: VentaTransaccion[] = [
  // --- Ventas de HOY (2026-11-05) ---
  {
    id: 'TRX-5001',
    consecutivo: 'FAC-00840',
    fecha: '2026-11-05',
    sede: 'Punto Bucaramanga',
    vendedor: 'Daniela Gómez',
    cliente: 'Catalina Suárez',
    prendaNombre: 'Pantalón Lino Sartorial',
    categoria: 'ROPA',
    tipoRopa: 'PANTALON',
    cantidad: 2,
    precioUnitarioCop: 185000,
    subtotalCop: 370000,
    descuentoCop: 0,
    totalNetoCop: 370000,
    medioPago: 'BANCOLOMBIA',
  },
  {
    id: 'TRX-5002',
    consecutivo: 'FAC-00841',
    fecha: '2026-11-05',
    sede: 'Punto Bucaramanga',
    vendedor: 'Daniela Gómez',
    cliente: 'Marcela Pinzón',
    prendaNombre: 'Chaqueta Puffer Santuario 3D',
    categoria: 'ROPA',
    tipoRopa: 'CHAQUETA',
    cantidad: 1,
    precioUnitarioCop: 320000,
    subtotalCop: 320000,
    descuentoCop: 20000,
    totalNetoCop: 300000,
    medioPago: 'TARJETA',
  },
  {
    id: 'TRX-5003',
    consecutivo: 'FAC-00842',
    fecha: '2026-11-05',
    sede: 'Punto Centro (Cúcuta)',
    vendedor: 'Camilo Torres',
    cliente: 'Sebastián Mora',
    prendaNombre: 'Camisa Lino Cuello Nerú',
    categoria: 'ROPA',
    tipoRopa: 'CAMISA',
    cantidad: 3,
    precioUnitarioCop: 145000,
    subtotalCop: 435000,
    descuentoCop: 35000,
    totalNetoCop: 400000,
    medioPago: 'EFECTIVO',
  },
  {
    id: 'TRX-5004',
    consecutivo: 'FAC-00843',
    fecha: '2026-11-05',
    sede: 'Punto Caobos (Cúcuta)',
    vendedor: 'Valeria Silva',
    cliente: 'Andrea Rangel',
    prendaNombre: 'Pantalón Lino Sartorial',
    categoria: 'ROPA',
    tipoRopa: 'PANTALON',
    cantidad: 1,
    precioUnitarioCop: 185000,
    subtotalCop: 185000,
    descuentoCop: 0,
    totalNetoCop: 185000,
    medioPago: 'NEQUI',
  },
  {
    id: 'TRX-5005',
    consecutivo: 'FAC-00844',
    fecha: '2026-11-05',
    sede: 'Punto Ocaña',
    vendedor: 'Mateo Morales',
    cliente: 'Jorge Quintero',
    prendaNombre: 'Ruana Lana Virgen',
    categoria: 'ROPA',
    tipoRopa: 'CHAQUETA',
    cantidad: 2,
    precioUnitarioCop: 210000,
    subtotalCop: 420000,
    descuentoCop: 20000,
    totalNetoCop: 400000,
    medioPago: 'EFECTIVO',
  },
  {
    id: 'TRX-5006',
    consecutivo: 'FAC-00845',
    fecha: '2026-11-05',
    sede: 'Punto Bucaramanga',
    vendedor: 'Daniela Gómez',
    cliente: 'Felipe Hernández',
    prendaNombre: 'Botines Cuero Artesanal',
    categoria: 'CALZADO',
    cantidad: 1,
    precioUnitarioCop: 280000,
    subtotalCop: 280000,
    descuentoCop: 0,
    totalNetoCop: 280000,
    medioPago: 'BANCOLOMBIA',
  },

  // --- Ventas de los ÚLTIMOS 7 DÍAS (2026-10-30 a 2026-11-04) ---
  {
    id: 'TRX-4901',
    consecutivo: 'FAC-00820',
    fecha: '2026-11-04',
    sede: 'Punto Bucaramanga',
    vendedor: 'Daniela Gómez',
    cliente: 'Patricia Lozano',
    prendaNombre: 'Pantalón Lino Sartorial',
    categoria: 'ROPA',
    tipoRopa: 'PANTALON',
    cantidad: 4,
    precioUnitarioCop: 185000,
    subtotalCop: 740000,
    descuentoCop: 50000,
    totalNetoCop: 690000,
    medioPago: 'BANCOLOMBIA',
  },
  {
    id: 'TRX-4902',
    consecutivo: 'FAC-00821',
    fecha: '2026-11-04',
    sede: 'Punto Centro (Cúcuta)',
    vendedor: 'Camilo Torres',
    cliente: 'Eduardo Jaimes',
    prendaNombre: 'Pantalón Chino Drill Clásico',
    categoria: 'ROPA',
    tipoRopa: 'PANTALON',
    cantidad: 3,
    precioUnitarioCop: 160000,
    subtotalCop: 480000,
    descuentoCop: 0,
    totalNetoCop: 480000,
    medioPago: 'EFECTIVO',
  },
  {
    id: 'TRX-4903',
    consecutivo: 'FAC-00822',
    fecha: '2026-11-04',
    sede: 'Punto Caobos (Cúcuta)',
    vendedor: 'Valeria Silva',
    cliente: 'Diana Bautista',
    prendaNombre: 'Vestido Seda Silvestre',
    categoria: 'ROPA',
    tipoRopa: 'VESTIDO',
    cantidad: 2,
    precioUnitarioCop: 245000,
    subtotalCop: 490000,
    descuentoCop: 40000,
    totalNetoCop: 450000,
    medioPago: 'TARJETA',
  },
  {
    id: 'TRX-4904',
    consecutivo: 'FAC-00823',
    fecha: '2026-11-03',
    sede: 'Punto Bucaramanga',
    vendedor: 'Daniela Gómez',
    cliente: 'Álvaro Duarte',
    prendaNombre: 'Camisa Lino Cuello Nerú',
    categoria: 'ROPA',
    tipoRopa: 'CAMISA',
    cantidad: 4,
    precioUnitarioCop: 145000,
    subtotalCop: 580000,
    descuentoCop: 30000,
    totalNetoCop: 550000,
    medioPago: 'BANCOLOMBIA',
  },
  {
    id: 'TRX-4905',
    consecutivo: 'FAC-00824',
    fecha: '2026-11-03',
    sede: 'Punto Centro (Cúcuta)',
    vendedor: 'Camilo Torres',
    cliente: 'Mariana Galvis',
    prendaNombre: 'Chaqueta Puffer Santuario 3D',
    categoria: 'ROPA',
    tipoRopa: 'CHAQUETA',
    cantidad: 2,
    precioUnitarioCop: 320000,
    subtotalCop: 640000,
    descuentoCop: 0,
    totalNetoCop: 640000,
    medioPago: 'EFECTIVO',
  },
  {
    id: 'TRX-4906',
    consecutivo: 'FAC-00825',
    fecha: '2026-11-02',
    sede: 'Punto Ocaña',
    vendedor: 'Mateo Morales',
    cliente: 'Nelson Torrado',
    prendaNombre: 'Pantalón Lino Sartorial',
    categoria: 'ROPA',
    tipoRopa: 'PANTALON',
    cantidad: 3,
    precioUnitarioCop: 185000,
    subtotalCop: 555000,
    descuentoCop: 25000,
    totalNetoCop: 530000,
    medioPago: 'EFECTIVO',
  },
  {
    id: 'TRX-4907',
    consecutivo: 'FAC-00826',
    fecha: '2026-11-02',
    sede: 'Punto Bucaramanga',
    vendedor: 'Daniela Gómez',
    cliente: 'Tatiana Carvajal',
    prendaNombre: 'Ruana Lana Virgen',
    categoria: 'ROPA',
    tipoRopa: 'CHAQUETA',
    cantidad: 2,
    precioUnitarioCop: 210000,
    subtotalCop: 420000,
    descuentoCop: 0,
    totalNetoCop: 420000,
    medioPago: 'DAVIPLATA',
  },
  {
    id: 'TRX-4908',
    consecutivo: 'FAC-00827',
    fecha: '2026-11-01',
    sede: 'Punto Centro (Cúcuta)',
    vendedor: 'Camilo Torres',
    cliente: 'Camilo Pérez',
    prendaNombre: 'Camisa Oxford Silvestre',
    categoria: 'ROPA',
    tipoRopa: 'CAMISA',
    cantidad: 3,
    precioUnitarioCop: 135000,
    subtotalCop: 405000,
    descuentoCop: 20000,
    totalNetoCop: 385000,
    medioPago: 'NEQUI',
  },
  {
    id: 'TRX-4909',
    consecutivo: 'FAC-00828',
    fecha: '2026-10-31',
    sede: 'Punto Caobos (Cúcuta)',
    vendedor: 'Valeria Silva',
    cliente: 'Camila Villamizar',
    prendaNombre: 'Mochila Wayúu Tradicional',
    categoria: 'ARTESANIAS',
    cantidad: 2,
    precioUnitarioCop: 195000,
    subtotalCop: 390000,
    descuentoCop: 0,
    totalNetoCop: 390000,
    medioPago: 'TARJETA',
  },
  {
    id: 'TRX-4910',
    consecutivo: 'FAC-00829',
    fecha: '2026-10-30',
    sede: 'Punto Bucaramanga',
    vendedor: 'Daniela Gómez',
    cliente: 'Santiago Cáceres',
    prendaNombre: 'Perfume Botánico Esencia Andina',
    categoria: 'COSMETICOS',
    cantidad: 3,
    precioUnitarioCop: 115000,
    subtotalCop: 345000,
    descuentoCop: 15000,
    totalNetoCop: 330000,
    medioPago: 'BANCOLOMBIA',
  },

  // --- Ventas Históricas Acumuladas de NOVIEMBRE 2026 ---
  {
    id: 'TRX-4801',
    consecutivo: 'FAC-00750',
    fecha: '2026-11-01',
    sede: 'Punto Centro (Cúcuta)',
    vendedor: 'Camilo Torres',
    cliente: 'Gabriel Ortega',
    prendaNombre: 'Pantalón Lino Sartorial',
    categoria: 'ROPA',
    tipoRopa: 'PANTALON',
    cantidad: 6,
    precioUnitarioCop: 185000,
    subtotalCop: 1110000,
    descuentoCop: 80000,
    totalNetoCop: 1030000,
    medioPago: 'EFECTIVO',
  },
  {
    id: 'TRX-4802',
    consecutivo: 'FAC-00751',
    fecha: '2026-11-02',
    sede: 'Punto Bucaramanga',
    vendedor: 'Daniela Gómez',
    cliente: 'Lucía Santamaría',
    prendaNombre: 'Chaqueta Puffer Santuario 3D',
    categoria: 'ROPA',
    tipoRopa: 'CHAQUETA',
    cantidad: 5,
    precioUnitarioCop: 320000,
    subtotalCop: 1600000,
    descuentoCop: 100000,
    totalNetoCop: 1500000,
    medioPago: 'BANCOLOMBIA',
  },
  {
    id: 'TRX-4803',
    consecutivo: 'FAC-00752',
    fecha: '2026-11-03',
    sede: 'Punto Caobos (Cúcuta)',
    vendedor: 'Valeria Silva',
    cliente: 'Mateo Cárdenas',
    prendaNombre: 'Camisa Lino Cuello Nerú',
    categoria: 'ROPA',
    tipoRopa: 'CAMISA',
    cantidad: 5,
    precioUnitarioCop: 145000,
    subtotalCop: 725000,
    descuentoCop: 45000,
    totalNetoCop: 680000,
    medioPago: 'BANCOLOMBIA',
  },
  {
    id: 'TRX-4804',
    consecutivo: 'FAC-00753',
    fecha: '2026-11-04',
    sede: 'Punto Ocaña',
    vendedor: 'Mateo Morales',
    cliente: 'Karina Bayona',
    prendaNombre: 'Ruana Lana Virgen',
    categoria: 'ROPA',
    tipoRopa: 'CHAQUETA',
    cantidad: 4,
    precioUnitarioCop: 210000,
    subtotalCop: 840000,
    descuentoCop: 40000,
    totalNetoCop: 800000,
    medioPago: 'EFECTIVO',
  },
  {
    id: 'TRX-4805',
    consecutivo: 'FAC-00754',
    fecha: '2026-11-01',
    sede: 'Punto Bucaramanga',
    vendedor: 'Daniela Gómez',
    cliente: 'Ricardo Mantilla',
    prendaNombre: 'Pantalón Lino Sartorial',
    categoria: 'ROPA',
    tipoRopa: 'PANTALON',
    cantidad: 7,
    precioUnitarioCop: 185000,
    subtotalCop: 1295000,
    descuentoCop: 95000,
    totalNetoCop: 1200000,
    medioPago: 'BANCOLOMBIA',
  },
  {
    id: 'TRX-4806',
    consecutivo: 'FAC-00755',
    fecha: '2026-11-02',
    sede: 'Punto Centro (Cúcuta)',
    vendedor: 'Camilo Torres',
    cliente: 'Valentina Rey',
    prendaNombre: 'Camisa Lino Cuello Nerú',
    categoria: 'ROPA',
    tipoRopa: 'CAMISA',
    cantidad: 6,
    precioUnitarioCop: 145000,
    subtotalCop: 870000,
    descuentoCop: 50000,
    totalNetoCop: 820000,
    medioPago: 'EFECTIVO',
  },
  {
    id: 'TRX-4807',
    consecutivo: 'FAC-00756',
    fecha: '2026-11-03',
    sede: 'Punto Bucaramanga',
    vendedor: 'Daniela Gómez',
    cliente: 'Germán Albarracín',
    prendaNombre: 'Botines Cuero Artesanal',
    categoria: 'CALZADO',
    cantidad: 4,
    precioUnitarioCop: 280000,
    subtotalCop: 1120000,
    descuentoCop: 60000,
    totalNetoCop: 1060000,
    medioPago: 'BANCOLOMBIA',
  },
  {
    id: 'TRX-4808',
    consecutivo: 'FAC-00757',
    fecha: '2026-11-04',
    sede: 'Punto Caobos (Cúcuta)',
    vendedor: 'Valeria Silva',
    cliente: 'Estefanía Osorio',
    prendaNombre: 'Cinturón Cuero Grano Entero',
    categoria: 'ACCESORIOS',
    cantidad: 5,
    precioUnitarioCop: 85000,
    subtotalCop: 425000,
    descuentoCop: 25000,
    totalNetoCop: 400000,
    medioPago: 'NEQUI',
  },

  // --- Ventas Históricas de Octubre 2026 (para consolidado de Trimestre) ---
  {
    id: 'TRX-4001',
    consecutivo: 'FAC-00510',
    fecha: '2026-10-15',
    sede: 'Punto Bucaramanga',
    vendedor: 'Daniela Gómez',
    cliente: 'Juliana Flórez',
    prendaNombre: 'Pantalón Lino Sartorial',
    categoria: 'ROPA',
    tipoRopa: 'PANTALON',
    cantidad: 15,
    precioUnitarioCop: 185000,
    subtotalCop: 2775000,
    descuentoCop: 175000,
    totalNetoCop: 2600000,
    medioPago: 'BANCOLOMBIA',
  },
  {
    id: 'TRX-4002',
    consecutivo: 'FAC-00511',
    fecha: '2026-10-20',
    sede: 'Punto Bucaramanga',
    vendedor: 'Daniela Gómez',
    cliente: 'Rodrigo Celis',
    prendaNombre: 'Chaqueta Puffer Santuario 3D',
    categoria: 'ROPA',
    tipoRopa: 'CHAQUETA',
    cantidad: 12,
    precioUnitarioCop: 320000,
    subtotalCop: 3840000,
    descuentoCop: 240000,
    totalNetoCop: 3600000,
    medioPago: 'BANCOLOMBIA',
  },
  {
    id: 'TRX-4003',
    consecutivo: 'FAC-00512',
    fecha: '2026-10-18',
    sede: 'Punto Centro (Cúcuta)',
    vendedor: 'Camilo Torres',
    cliente: 'Héctor Moncada',
    prendaNombre: 'Camisa Lino Cuello Nerú',
    categoria: 'ROPA',
    tipoRopa: 'CAMISA',
    cantidad: 14,
    precioUnitarioCop: 145000,
    subtotalCop: 2030000,
    descuentoCop: 130000,
    totalNetoCop: 1900000,
    medioPago: 'EFECTIVO',
  },
  {
    id: 'TRX-4004',
    consecutivo: 'FAC-00513',
    fecha: '2026-10-22',
    sede: 'Punto Caobos (Cúcuta)',
    vendedor: 'Valeria Silva',
    cliente: 'Laura Rivas',
    prendaNombre: 'Vestido Seda Silvestre',
    categoria: 'ROPA',
    tipoRopa: 'VESTIDO',
    cantidad: 10,
    precioUnitarioCop: 245000,
    subtotalCop: 2450000,
    descuentoCop: 150000,
    totalNetoCop: 2300000,
    medioPago: 'TARJETA',
  },
  {
    id: 'TRX-4005',
    consecutivo: 'FAC-00514',
    fecha: '2026-10-25',
    sede: 'Punto Ocaña',
    vendedor: 'Mateo Morales',
    cliente: 'Gladys Navarro',
    prendaNombre: 'Ruana Lana Virgen',
    categoria: 'ROPA',
    tipoRopa: 'CHAQUETA',
    cantidad: 9,
    precioUnitarioCop: 210000,
    subtotalCop: 1890000,
    descuentoCop: 90000,
    totalNetoCop: 1800000,
    medioPago: 'EFECTIVO',
  },
];

export const AdminReportesPage: React.FC = () => {
  // Filtros dinámicos
  const [rangoFecha, setRangoFecha] = useState<RangoFecha>('ESTE_MES');
  const [fechaInicio, setFechaInicio] = useState<string>('2026-11-01');
  const [fechaFin, setFechaFin] = useState<string>('2026-11-30');
  const [filtroSede, setFiltroSede] = useState<string>('TODAS');
  const [filtroCategoria, setFiltroCategoria] = useState<CategoriaPrenda>('TODAS');
  const [busquedaPrenda, setBusquedaPrenda] = useState<string>('');
  const [subfiltroRopa, setSubfiltroRopa] = useState<string>('TODOS');

  // Pestaña activa del generador
  const [tabActiva, setTabActiva] = useState<'PRENDAS' | 'VENDEDORES' | 'FINANCIERO'>('PRENDAS');

  // Estado de exportación Excel
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Descarga secundaria de libros contables base
  const [descargandoLibro, setDescargandoLibro] = useState<string | null>(null);
  const [errorDescarga, setErrorDescarga] = useState<string | null>(null);

  // Filtrado reactivo de transacciones
  const transaccionesFiltradas = useMemo(() => {
    return VENTAS_MAESTRAS_DEMO.filter((t) => {
      // 1. Filtro de Sede
      if (filtroSede !== 'TODAS' && t.sede !== filtroSede) {
        return false;
      }

      // 2. Filtro de Categoría
      if (filtroCategoria !== 'TODAS' && t.categoria !== filtroCategoria) {
        return false;
      }

      // 3. Subfiltro de Ropa
      if (subfiltroRopa !== 'TODOS' && t.tipoRopa !== subfiltroRopa) {
        return false;
      }

      // 4. Búsqueda de Texto en Prenda
      if (busquedaPrenda.trim()) {
        const query = busquedaPrenda.toLowerCase();
        const coincidePrenda = t.prendaNombre.toLowerCase().includes(query);
        const coincideVendedor = t.vendedor.toLowerCase().includes(query);
        if (!coincidePrenda && !coincideVendedor) {
          return false;
        }
      }

      // 5. Filtro de Fecha
      if (rangoFecha === 'HOY') {
        return t.fecha === '2026-11-05';
      }
      if (rangoFecha === '7DIAS') {
        return t.fecha >= '2026-10-30' && t.fecha <= '2026-11-05';
      }
      if (rangoFecha === 'ESTE_MES') {
        return t.fecha.startsWith('2026-11');
      }
      if (rangoFecha === 'TRIMESTRE') {
        return t.fecha >= '2026-09-01' && t.fecha <= '2026-11-30';
      }
      if (rangoFecha === 'PERSONALIZADO') {
        return t.fecha >= fechaInicio && t.fecha <= fechaFin;
      }

      return true;
    });
  }, [
    rangoFecha,
    fechaInicio,
    fechaFin,
    filtroSede,
    filtroCategoria,
    subfiltroRopa,
    busquedaPrenda,
  ]);

  // Cálculos Consolidados (Ventas Netas, Totales, Unidades)
  const metricasGenerales = useMemo(() => {
    const totalVentasBrutas = transaccionesFiltradas.reduce((acc, t) => acc + t.subtotalCop, 0);
    const totalDescuentos = transaccionesFiltradas.reduce((acc, t) => acc + t.descuentoCop, 0);
    const totalVentasNetas = transaccionesFiltradas.reduce((acc, t) => acc + t.totalNetoCop, 0);
    const totalUnidades = transaccionesFiltradas.reduce((acc, t) => acc + t.cantidad, 0);
    const totalTickets = transaccionesFiltradas.length;
    const ticketPromedio = totalTickets > 0 ? Math.round(totalVentasNetas / totalTickets) : 0;
    const iva19Cop = Math.round(totalVentasNetas * 0.19);

    return {
      totalVentasBrutas,
      totalDescuentos,
      totalVentasNetas,
      totalUnidades,
      totalTickets,
      ticketPromedio,
      iva19Cop,
    };
  }, [transaccionesFiltradas]);

  // 1. Agrupación: Prendas y Productos más Vendidos
  const prendasAgrupadas = useMemo(() => {
    const mapa = new Map<
      string,
      {
        nombre: string;
        categoria: string;
        tipoRopa?: string;
        unidadesVendidas: number;
        totalFacturadoCop: number;
        transacciones: number;
      }
    >();

    for (const t of transaccionesFiltradas) {
      const actual = mapa.get(t.prendaNombre) || {
        nombre: t.prendaNombre,
        categoria: t.categoria,
        tipoRopa: t.tipoRopa,
        unidadesVendidas: 0,
        totalFacturadoCop: 0,
        transacciones: 0,
      };

      actual.unidadesVendidas += t.cantidad;
      actual.totalFacturadoCop += t.totalNetoCop;
      actual.transacciones += 1;
      mapa.set(t.prendaNombre, actual);
    }

    const lista = Array.from(mapa.values());
    lista.sort((a, b) => b.unidadesVendidas - a.unidadesVendidas);

    const totalUnidades = metricasGenerales.totalUnidades || 1;
    return lista.map((p) => ({
      ...p,
      precioPromedioCop: Math.round(p.totalFacturadoCop / p.unidadesVendidas),
      porcentajeVolumen: Number(((p.unidadesVendidas / totalUnidades) * 100).toFixed(1)),
    }));
  }, [transaccionesFiltradas, metricasGenerales.totalUnidades]);

  // 2. Agrupación: Ranking de Mejores Vendedores
  const rankingVendedores = useMemo(() => {
    const mapa = new Map<
      string,
      {
        vendedor: string;
        sede: string;
        unidadesVendidas: number;
        montoFacturadoCop: number;
        cantidadTickets: number;
      }
    >();

    for (const t of transaccionesFiltradas) {
      const actual = mapa.get(t.vendedor) || {
        vendedor: t.vendedor,
        sede: t.sede,
        unidadesVendidas: 0,
        montoFacturadoCop: 0,
        cantidadTickets: 0,
      };

      actual.unidadesVendidas += t.cantidad;
      actual.montoFacturadoCop += t.totalNetoCop;
      actual.cantidadTickets += 1;
      mapa.set(t.vendedor, actual);
    }

    const lista = Array.from(mapa.values());
    lista.sort((a, b) => b.montoFacturadoCop - a.montoFacturadoCop);

    return lista.map((v, index) => ({
      ...v,
      posicion: index + 1,
      ticketPromedioCop: Math.round(v.montoFacturadoCop / (v.cantidadTickets || 1)),
    }));
  }, [transaccionesFiltradas]);

  // 3. Agrupación: Desglose Financiero por Medios de Pago
  const desgloseMediosPago = useMemo(() => {
    const mapa = new Map<string, { medio: string; totalCop: number; transacciones: number }>();

    for (const t of transaccionesFiltradas) {
      const medioEtiqueta =
        t.medioPago === 'BANCOLOMBIA'
          ? 'Transferencia Bancolombia'
          : t.medioPago === 'NEQUI'
          ? 'Transferencia Nequi'
          : t.medioPago === 'DAVIPLATA'
          ? 'Transferencia Daviplata'
          : t.medioPago === 'EFECTIVO'
          ? 'Efectivo en Caja POS'
          : 'Tarjeta Débito / Crédito';

      const actual = mapa.get(medioEtiqueta) || {
        medio: medioEtiqueta,
        totalCop: 0,
        transacciones: 0,
      };

      actual.totalCop += t.totalNetoCop;
      actual.transacciones += 1;
      mapa.set(medioEtiqueta, actual);
    }

    const lista = Array.from(mapa.values());
    lista.sort((a, b) => b.totalCop - a.totalCop);

    const totalNeto = metricasGenerales.totalVentasNetas || 1;
    return lista.map((m) => ({
      ...m,
      porcentaje: Number(((m.totalCop / totalNeto) * 100).toFixed(1)),
    }));
  }, [transaccionesFiltradas, metricasGenerales.totalVentasNetas]);

  // Función Principal: Exportar Reporte Personalizado a Excel (.xlsx) Multi-Hoja
  const handleExportarExcelPersonalizado = () => {
    setIsExporting(true);
    setMensajeExito(null);

    try {
      const wb = XLSX.utils.book_new();

      const sedeEtiqueta =
        filtroSede === 'TODAS' ? 'Consolidado Todas las Sedes' : filtroSede;
      const categoriaEtiqueta =
        filtroCategoria === 'TODAS'
          ? 'Todas las Categorías'
          : filtroCategoria === 'ROPA'
          ? `Ropa (${subfiltroRopa === 'TODOS' ? 'Pantalones, Chaquetas, Camisas, Vestidos' : subfiltroRopa})`
          : filtroCategoria;
      const periodoEtiqueta =
        rangoFecha === 'HOY'
          ? 'Hoy (05 de Noviembre de 2026)'
          : rangoFecha === '7DIAS'
          ? 'Últimos 7 días'
          : rangoFecha === 'ESTE_MES'
          ? 'Mes en Curso (Noviembre 2026)'
          : rangoFecha === 'TRIMESTRE'
          ? 'Trimestre Consolidado'
          : `Del ${fechaInicio} al ${fechaFin}`;

      // 1. Hoja: Resumen Ejecutivo
      const resumenData = [
        ['FORMA STORE - REPORTE GERENCIAL EJECUTIVO'],
        ['Fecha de Generación:', new Date().toLocaleString('es-CO')],
        ['Sede Evaluada:', sedeEtiqueta],
        ['Periodo Seleccionado:', periodoEtiqueta],
        ['Filtro de Categoría:', categoriaEtiqueta],
        ['Búsqueda Aplicada:', busquedaPrenda || 'Ninguna (Todos los registros)'],
        [],
        ['CONSOLIDADO FINANCIERO Y OPERATIVO'],
        ['Concepto', 'Valor'],
        ['Ventas Brutas', formatCOP(metricasGenerales.totalVentasBrutas)],
        ['Descuentos Totales Aplicados', formatCOP(metricasGenerales.totalDescuentos)],
        ['VENTAS NETAS TOTALES', formatCOP(metricasGenerales.totalVentasNetas)],
        ['IVA 19% Discriminado', formatCOP(metricasGenerales.iva19Cop)],
        ['Total Unidades Físicas Vendidas', metricasGenerales.totalUnidades],
        ['Total Transacciones / Comprobantes', metricasGenerales.totalTickets],
        ['Ticket Promedio por Venta', formatCOP(metricasGenerales.ticketPromedio)],
        [],
        ['DESTACADOS DEL PERIODO'],
        ['Vendedor Estrella:', rankingVendedores[0]?.vendedor || 'N/A'],
        ['Monto Vendedor Estrella:', formatCOP(rankingVendedores[0]?.montoFacturadoCop || 0)],
        ['Prenda Más Vendida:', prendasAgrupadas[0]?.nombre || 'N/A'],
        ['Unidades Prenda Más Vendida:', `${prendasAgrupadas[0]?.unidadesVendidas || 0} unidades`],
      ];
      const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
      XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen Ejecutivo');

      // 2. Hoja: Prendas Vendidas
      const prendasData = [
        ['Posición', 'Prenda / Producto', 'Categoría', 'Unidades Vendidas', 'Precio Promedio COP', 'Total Facturado COP', '% Volumen del Periodo'],
        ...prendasAgrupadas.map((p, idx) => [
          idx + 1,
          p.nombre,
          p.categoria,
          p.unidadesVendidas,
          p.precioPromedioCop,
          p.totalFacturadoCop,
          `${p.porcentajeVolumen}%`,
        ]),
        [],
        ['TOTAL CONSOLIDADO', '', '', metricasGenerales.totalUnidades, '', metricasGenerales.totalVentasNetas, '100%'],
      ];
      const wsPrendas = XLSX.utils.aoa_to_sheet(prendasData);
      XLSX.utils.book_append_sheet(wb, wsPrendas, 'Prendas Vendidas');

      // 3. Hoja: Ranking Vendedores
      const vendedoresData = [
        ['Ranking', 'Vendedor', 'Sede Asignada', 'Unidades Vendidas', 'Total Facturado COP', 'Cantidad Tickets', 'Ticket Promedio COP'],
        ...rankingVendedores.map((v) => [
          v.posicion,
          v.vendedor,
          v.sede,
          v.unidadesVendidas,
          v.montoFacturadoCop,
          v.cantidadTickets,
          v.ticketPromedioCop,
        ]),
      ];
      const wsVendedores = XLSX.utils.aoa_to_sheet(vendedoresData);
      XLSX.utils.book_append_sheet(wb, wsVendedores, 'Ranking Vendedores');

      // 4. Hoja: Desglose Financiero
      const financieroData = [
        ['Medio de Pago / Canal', 'Monto Facturado COP', 'Participación %', 'Cantidad Transacciones'],
        ...desgloseMediosPago.map((dp) => [
          dp.medio,
          dp.totalCop,
          `${dp.porcentaje}%`,
          dp.transacciones,
        ]),
        [],
        ['TOTAL MEDIOS DE PAGO', metricasGenerales.totalVentasNetas, '100%', metricasGenerales.totalTickets],
      ];
      const wsFinanciero = XLSX.utils.aoa_to_sheet(financieroData);
      XLSX.utils.book_append_sheet(wb, wsFinanciero, 'Desglose Financiero');

      // Nombre del archivo solicitado: Reporte_Gerencial_FORMA_{Sede}_{Fecha}.xlsx
      const fechaArchivo = new Date().toISOString().slice(0, 10);
      const sedeNombreSanitizada = (filtroSede === 'TODAS' ? 'Consolidado' : filtroSede)
        .replace(/[^a-zA-Z0-9]/g, '_')
        .replace(/_+/g, '_');
      const nombreArchivo = `Reporte_Gerencial_FORMA_${sedeNombreSanitizada}_${fechaArchivo}.xlsx`;

      XLSX.writeFile(wb, nombreArchivo);
      setMensajeExito(`Reporte personalizado "${nombreArchivo}" generado con éxito.`);
    } catch (err: any) {
      setErrorDescarga('Error al generar el archivo Excel: ' + (err.message || 'Error desconocido'));
    } finally {
      setIsExporting(false);
    }
  };

  // Descarga secundaria de libros base desde backend
  const descargarLibroOficial = async (endpoint: string, nombreArchivo: string) => {
    setDescargandoLibro(endpoint);
    setMensajeExito(null);
    setErrorDescarga(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api${endpoint}`, {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        throw new Error('Error al generar el libro desde el servidor');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nombreArchivo;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setMensajeExito(`Libro oficial "${nombreArchivo}" descargado con éxito.`);
    } catch (err: any) {
      setErrorDescarga(err.message || 'No se pudo descargar el reporte');
    } finally {
      setDescargandoLibro(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado Editorial Apple Liquid Glass */}
      <div className="glass-mirror-card p-6 sm:p-7 rounded-3xl flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div>
          <span className="glass-mirror-pill inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-widest text-[#661521] border border-[#D19650]/40 mb-2">
            Centro de Analítica Personalizada y Exportación
          </span>
          <div className="flex items-center gap-3.5">
            <span className="p-3 bg-[#661521] text-[#D19650] border border-[#D19650] rounded-2xl shadow-md">
              <FileSpreadsheet className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-[#171717] font-display tracking-tight">
                Reportes Gerenciales y Ventas por Prenda
              </h1>
              <p className="text-sm sm:text-base font-medium text-[#50322A] mt-1">
                Filtre por periodo, sede, vendedor o prenda específica (pantalones, camisetas, calzado) y exporte a Excel (.xlsx).
              </p>
            </div>
          </div>
        </div>

        {/* Botón Dominante: Exportar Reporte Personalizado a Excel */}
        <div className="shrink-0">
          <button
            onClick={handleExportarExcelPersonalizado}
            disabled={isExporting}
            className="w-full sm:w-auto px-6 py-4 bg-[#661521] hover:bg-[#4A0E17] text-white border-2 border-[#D19650] text-sm font-black rounded-2xl shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-[#D19650]" />
                <span>Generando Libro Excel...</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5 text-[#D19650]" />
                <span>Exportar Reporte Personalizado a Excel (.xlsx)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Alertas de Éxito / Error */}
      {mensajeExito && (
        <div className="p-4 bg-[#D19650]/20 border border-[#D19650] text-[#351912] rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-[#661521] shrink-0" />
          <span>{mensajeExito}</span>
        </div>
      )}

      {errorDescarga && (
        <div className="p-4 bg-[#661521]/10 border border-[#661521]/40 text-[#661521] rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorDescarga}</span>
        </div>
      )}

      {/* BARRA DE FILTROS DINÁMICOS */}
      <div className="glass-mirror-card p-6 rounded-3xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#50322A]/15">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#351912]">
            <Filter className="w-4 h-4 text-[#661521]" />
            <span>Filtros Dinámicos del Reporte</span>
          </div>
          <span className="text-xs font-bold text-[#50322A]">
            {transaccionesFiltradas.length} transacciones encontradas
          </span>
        </div>

        {/* Fila 1: Botones Rápidos de Fecha */}
        <div className="space-y-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#50322A] block">
            Rango de Fechas
          </span>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'HOY', label: 'Hoy (05 Nov 2026)' },
              { key: '7DIAS', label: 'Últimos 7 días' },
              { key: 'ESTE_MES', label: 'Este Mes (Noviembre 2026)' },
              { key: 'TRIMESTRE', label: 'Trimestre Consolidado' },
              { key: 'PERSONALIZADO', label: 'Rango Personalizado' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setRangoFecha(key as RangoFecha)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                  rangoFecha === key
                    ? 'bg-[#661521] text-white border border-[#D19650] shadow-md scale-105'
                    : 'glass-mirror-pill text-[#351912] border border-[#50322A]/20 hover:border-[#661521]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Selectores de fecha para Rango Personalizado */}
          {rangoFecha === 'PERSONALIZADO' && (
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#50322A]">Desde:</span>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="capsule-mirror-input px-3 py-1.5 rounded-xl text-xs font-bold text-[#171717]"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#50322A]">Hasta:</span>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="capsule-mirror-input px-3 py-1.5 rounded-xl text-xs font-bold text-[#171717]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Fila 2: Selectores de Sede, Categoría y Búsqueda */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
          {/* Selector de Sede */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-[#50322A] mb-1.5">
              Punto de Venta / Sede
            </label>
            <div className="relative">
              <select
                value={filtroSede}
                onChange={(e) => setFiltroSede(e.target.value)}
                className="capsule-mirror-input w-full pl-9 pr-4 py-2.5 rounded-2xl text-xs font-bold text-[#171717] cursor-pointer"
              >
                <option value="TODAS">Todas las Sedes (Consolidado)</option>
                <option value="Punto Centro (Cúcuta)">Punto Centro (Cúcuta)</option>
                <option value="Punto Caobos (Cúcuta)">Punto Caobos (Cúcuta)</option>
                <option value="Punto Ocaña">Punto Ocaña</option>
                <option value="Punto Bucaramanga">Punto Bucaramanga</option>
              </select>
              <Store className="w-4 h-4 text-[#661521] absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Selector de Categoría / Tipo de Prenda */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-[#50322A] mb-1.5">
              Categoría de Producto
            </label>
            <div className="relative">
              <select
                value={filtroCategoria}
                onChange={(e) => {
                  setFiltroCategoria(e.target.value as CategoriaPrenda);
                  if (e.target.value !== 'ROPA') {
                    setSubfiltroRopa('TODOS');
                  }
                }}
                className="capsule-mirror-input w-full pl-9 pr-4 py-2.5 rounded-2xl text-xs font-bold text-[#171717] cursor-pointer"
              >
                <option value="TODAS">Todas las Categorías</option>
                <option value="ROPA">Ropa (Pantalones, Chaquetas, Camisas, Vestidos)</option>
                <option value="CALZADO">Calzado</option>
                <option value="ACCESORIOS">Accesorios</option>
                <option value="COSMETICOS">Cosméticos</option>
                <option value="ARTESANIAS">Artesanías</option>
              </select>
              <Shirt className="w-4 h-4 text-[#661521] absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Buscador de Prenda Específica */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-[#50322A] mb-1.5">
              Buscar Prenda o Vendedor
            </label>
            <div className="relative">
              <input
                type="text"
                value={busquedaPrenda}
                onChange={(e) => setBusquedaPrenda(e.target.value)}
                placeholder="Ej. Pantalón, Camisa, Daniela..."
                className="capsule-mirror-input w-full pl-9 pr-4 py-2.5 rounded-2xl text-xs font-bold text-[#171717] placeholder-[#50322A]/60"
              />
              <Search className="w-4 h-4 text-[#661521] absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Subfiltro específico de Ropa cuando la categoría es ROPA o TODAS */}
        {(filtroCategoria === 'ROPA' || filtroCategoria === 'TODAS') && (
          <div className="pt-2 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#50322A]">Filtrar prenda específica:</span>
            {[
              { key: 'TODOS', label: 'Todas las Prendas' },
              { key: 'PANTALON', label: 'Pantalones' },
              { key: 'CAMISA', label: 'Camisas' },
              { key: 'CHAQUETA', label: 'Chaquetas y Ruanas' },
              { key: 'VESTIDO', label: 'Vestidos' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSubfiltroRopa(key)}
                className={`px-3 py-1 rounded-xl text-[11px] font-extrabold transition-all ${
                  subfiltroRopa === key
                    ? 'bg-[#D19650] text-[#171717] border border-[#661521] shadow-sm'
                    : 'bg-[#E7DED2] text-[#351912] hover:bg-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* TARJETAS KPI RESUMEN DE VENTAS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-mirror-card p-5 rounded-3xl">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#50322A] flex items-center justify-between">
            <span>Ventas Netas</span>
            <DollarSign className="w-4 h-4 text-[#661521]" />
          </span>
          <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-[#171717] mt-1">
            {formatCOP(metricasGenerales.totalVentasNetas)}
          </div>
          <span className="text-[11px] text-[#661521] font-bold">
            IVA 19% incluido ({formatCOP(metricasGenerales.iva19Cop)})
          </span>
        </div>

        <div className="glass-mirror-card p-5 rounded-3xl">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#50322A] flex items-center justify-between">
            <span>Unidades Vendidas</span>
            <ShoppingBag className="w-4 h-4 text-[#661521]" />
          </span>
          <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-[#661521] mt-1">
            {metricasGenerales.totalUnidades}
          </div>
          <span className="text-[11px] text-[#50322A] font-medium">Prendas y productos físicos</span>
        </div>

        <div className="glass-mirror-card p-5 rounded-3xl">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#50322A] flex items-center justify-between">
            <span>Tickets / Ventas</span>
            <Receipt className="w-4 h-4 text-[#661521]" />
          </span>
          <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-[#171717] mt-1">
            {metricasGenerales.totalTickets}
          </div>
          <span className="text-[11px] text-[#50322A] font-medium">
            Promedio: {formatCOP(metricasGenerales.ticketPromedio)}
          </span>
        </div>

        <div className="glass-mirror-card p-5 rounded-3xl border border-[#D19650]/40">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#50322A] flex items-center justify-between">
            <span>Vendedor Líder</span>
            <Crown className="w-4 h-4 text-[#D19650]" />
          </span>
          <div className="text-xl sm:text-2xl font-black text-[#661521] truncate mt-1">
            {rankingVendedores[0]?.vendedor || 'Sin datos'}
          </div>
          <span className="text-[11px] text-[#351912] font-bold">
            {rankingVendedores[0]?.unidadesVendidas || 0} prendas · {formatCOP(rankingVendedores[0]?.montoFacturadoCop || 0)}
          </span>
        </div>
      </div>

      {/* PESTAÑAS ANALÍTICAS INTERACTIVAS */}
      <div className="flex items-center gap-2 border-b border-[#50322A]/20 pb-1">
        <button
          onClick={() => setTabActiva('PRENDAS')}
          className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all ${
            tabActiva === 'PRENDAS'
              ? 'bg-[#661521] text-white border border-[#D19650] shadow-md'
              : 'text-[#50322A] hover:bg-white/60'
          }`}
        >
          <Shirt className="w-4 h-4" />
          <span>Prendas y Productos más Vendidos</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-white/20">
            {prendasAgrupadas.length}
          </span>
        </button>

        <button
          onClick={() => setTabActiva('VENDEDORES')}
          className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all ${
            tabActiva === 'VENDEDORES'
              ? 'bg-[#661521] text-white border border-[#D19650] shadow-md'
              : 'text-[#50322A] hover:bg-white/60'
          }`}
        >
          <Crown className="w-4 h-4 text-[#D19650]" />
          <span>Ranking de Mejores Vendedores</span>
        </button>

        <button
          onClick={() => setTabActiva('FINANCIERO')}
          className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all ${
            tabActiva === 'FINANCIERO'
              ? 'bg-[#661521] text-white border border-[#D19650] shadow-md'
              : 'text-[#50322A] hover:bg-white/60'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Desglose por Medios de Pago</span>
        </button>
      </div>

      {/* VISTA 1: PRENDAS Y PRODUCTOS MÁS VENDIDOS */}
      {tabActiva === 'PRENDAS' && (
        <div className="glass-mirror-card rounded-3xl overflow-hidden shadow-xl border border-[#D19650]/30">
          <div className="p-5 bg-[#E7DED2]/50 border-b border-[#50322A]/15 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-[#171717] font-display flex items-center gap-2">
                <Shirt className="w-5 h-5 text-[#661521]" />
                <span>Volumen de Ventas por Prenda</span>
              </h3>
              <p className="text-xs text-[#50322A] font-medium mt-0.5">
                Cantidad exacta de pantalones, camisas, chaquetas y accesorios comercializados en el periodo.
              </p>
            </div>
            <div className="text-xs font-extrabold text-[#661521] bg-[#D19650]/20 px-3 py-1.5 rounded-xl border border-[#D19650]/40 self-start sm:self-auto">
              Total {metricasGenerales.totalUnidades} unidades vendidas
            </div>
          </div>

          {prendasAgrupadas.length === 0 ? (
            <div className="p-12 text-center text-[#50322A]">
              <Shirt className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="font-bold text-sm">No hay prendas vendidas que coincidan con los filtros aplicados.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#50322A]/20 bg-[#E7DED2]/85 text-xs font-extrabold text-[#351912] uppercase tracking-wider">
                    <th className="px-5 py-4 w-12 text-center">#</th>
                    <th className="px-5 py-4">Prenda / Producto</th>
                    <th className="px-5 py-4">Categoría</th>
                    <th className="px-5 py-4 text-center">Unidades Vendidas</th>
                    <th className="px-5 py-4">Volumen Relativo</th>
                    <th className="px-5 py-4 text-right">Precio Promedio</th>
                    <th className="px-5 py-4 text-right">Total Facturado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#50322A]/10 text-sm">
                  {prendasAgrupadas.map((p, idx) => (
                    <tr key={p.nombre} className="hover:bg-white/80 transition-colors">
                      <td className="px-5 py-4 text-center font-black font-mono text-xs text-[#50322A]">
                        {idx + 1}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-extrabold text-[#171717] text-sm">{p.nombre}</div>
                        <div className="text-xs text-[#50322A] font-medium">
                          {p.transacciones} venta(s) registradas
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-[#E7DED2] text-[#351912] border border-[#50322A]/20">
                          {p.categoria}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="font-black font-mono text-base text-[#661521] bg-[#661521]/10 px-3 py-1 rounded-xl border border-[#661521]/20">
                          {p.unidadesVendidas} uds
                        </span>
                      </td>
                      <td className="px-5 py-4 min-w-[160px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-[#50322A]/15 h-2.5 rounded-full overflow-hidden">
                            <div
                              className="bg-[#661521] h-full rounded-full transition-all"
                              style={{ width: `${Math.min(100, p.porcentajeVolumen * 2)}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono font-bold text-[#351912] tabular-nums">
                            {p.porcentajeVolumen}%
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right font-mono font-bold text-xs text-[#50322A] tabular-nums">
                        {formatCOP(p.precioPromedioCop)}
                      </td>
                      <td className="px-5 py-4 text-right font-mono font-black text-sm text-[#171717] tabular-nums">
                        {formatCOP(p.totalFacturadoCop)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VISTA 2: RANKING DE MEJORES VENDEDORES (TOP SELLERS) */}
      {tabActiva === 'VENDEDORES' && (
        <div className="space-y-6">
          {/* Podio Visual 1°, 2° y 3° Lugar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {rankingVendedores.slice(0, 3).map((v, i) => {
              const medallas = ['🥇 Oro', '🥈 Plata', '🥉 Bronce'];
              const coloresCard = [
                'border-[#D19650] bg-gradient-to-b from-[#D19650]/20 to-white/70 shadow-xl',
                'border-[#50322A]/30 bg-white/60 shadow-md',
                'border-[#50322A]/20 bg-white/50 shadow-sm',
              ];

              return (
                <div
                  key={v.vendedor}
                  className={`glass-mirror-card p-6 rounded-3xl relative flex flex-col justify-between ${coloresCard[i]}`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-[#661521] text-white border border-[#D19650]">
                        {medallas[i]}
                      </span>
                      <span className="text-xs font-bold text-[#50322A] font-mono">
                        Puesto #{v.posicion}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#661521] text-[#D19650] flex items-center justify-center font-black text-lg border border-[#D19650] shadow-md">
                        {v.vendedor.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-[#171717]">{v.vendedor}</h4>
                        <div className="text-xs font-bold text-[#50322A] flex items-center gap-1">
                          <Store className="w-3.5 h-3.5 text-[#661521]" />
                          <span>{v.sede}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#50322A]/15 grid grid-cols-2 gap-2 text-center">
                    <div className="p-2.5 rounded-2xl bg-white/60">
                      <span className="text-[10px] font-extrabold uppercase text-[#50322A] block">
                        Facturado
                      </span>
                      <span className="text-sm font-black font-mono text-[#661521] tabular-nums">
                        {formatCOP(v.montoFacturadoCop)}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-white/60">
                      <span className="text-[10px] font-extrabold uppercase text-[#50322A] block">
                        Prendas
                      </span>
                      <span className="text-sm font-black font-mono text-[#171717] tabular-nums">
                        {v.unidadesVendidas} uds
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tabla de Nómina Completa de Vendedores */}
          <div className="glass-mirror-card rounded-3xl overflow-hidden shadow-xl border border-[#D19650]/30">
            <div className="p-5 bg-[#E7DED2]/50 border-b border-[#50322A]/15">
              <h3 className="text-lg font-black text-[#171717] font-display flex items-center gap-2">
                <Users className="w-5 h-5 text-[#661521]" />
                <span>Rendimiento Global de Vendedores en Mostrador</span>
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#50322A]/20 bg-[#E7DED2]/85 text-xs font-extrabold text-[#351912] uppercase tracking-wider">
                    <th className="px-5 py-4 w-14 text-center">Puesto</th>
                    <th className="px-5 py-4">Vendedor</th>
                    <th className="px-5 py-4">Sede Asignada</th>
                    <th className="px-5 py-4 text-center">Unidades</th>
                    <th className="px-5 py-4 text-center">Tickets</th>
                    <th className="px-5 py-4 text-right">Ticket Promedio</th>
                    <th className="px-5 py-4 text-right">Total Facturado COP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#50322A]/10 text-sm">
                  {rankingVendedores.map((v) => (
                    <tr key={v.vendedor} className="hover:bg-white/80 transition-colors">
                      <td className="px-5 py-4 text-center font-black font-mono text-sm text-[#50322A]">
                        #{v.posicion}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-extrabold text-[#171717]">{v.vendedor}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="glass-mirror-pill inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold text-[#351912] border border-[#D19650]/40">
                          <Store className="w-3.5 h-3.5 text-[#661521]" />
                          <span>{v.sede}</span>
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center font-mono font-black text-sm text-[#661521]">
                        {v.unidadesVendidas}
                      </td>
                      <td className="px-5 py-4 text-center font-mono font-bold text-xs text-[#50322A]">
                        {v.cantidadTickets}
                      </td>
                      <td className="px-5 py-4 text-right font-mono font-bold text-xs text-[#50322A] tabular-nums">
                        {formatCOP(v.ticketPromedioCop)}
                      </td>
                      <td className="px-5 py-4 text-right font-mono font-black text-sm text-[#171717] tabular-nums">
                        {formatCOP(v.montoFacturadoCop)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VISTA 3: DESGLOSE FINANCIERO Y MEDIOS DE PAGO */}
      {tabActiva === 'FINANCIERO' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tarjeta de Medios de Pago */}
          <div className="glass-mirror-card p-6 rounded-3xl space-y-4">
            <h3 className="text-lg font-black text-[#171717] font-display flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#661521]" />
              <span>Participación por Método de Pago</span>
            </h3>
            <p className="text-xs text-[#50322A]">
              Recaudación discriminada entre efectivo en caja y transferencias electrónicas inmediatas.
            </p>

            <div className="space-y-3 pt-2">
              {desgloseMediosPago.map((mp) => (
                <div
                  key={mp.medio}
                  className="p-4 rounded-2xl bg-white/70 border border-[#50322A]/15 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-[#171717]">{mp.medio}</span>
                    <span className="font-mono text-[#661521]">{formatCOP(mp.totalCop)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-[#50322A]/10 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#661521] h-full rounded-full"
                        style={{ width: `${mp.porcentaje}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-mono font-bold text-[#50322A]">
                      {mp.porcentaje}% ({mp.transacciones} ops)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tarjeta de Conciliación y Liquidación Contable */}
          <div className="glass-mirror-card p-6 rounded-3xl space-y-4">
            <h3 className="text-lg font-black text-[#171717] font-display flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[#661521]" />
              <span>Conciliación Financiera del Periodo</span>
            </h3>
            <p className="text-xs text-[#50322A]">
              Estructura contable formal con descuentos e impuestos liquidados.
            </p>

            <div className="divide-y divide-[#50322A]/10 text-xs pt-2">
              <div className="py-3 flex justify-between items-center">
                <span className="font-semibold text-[#50322A]">Ventas Brutas Totales (Lista):</span>
                <span className="font-mono font-bold text-[#171717]">
                  {formatCOP(metricasGenerales.totalVentasBrutas)}
                </span>
              </div>
              <div className="py-3 flex justify-between items-center">
                <span className="font-semibold text-[#50322A]">Descuentos Comerciales Otorgados:</span>
                <span className="font-mono font-bold text-[#661521]">
                  - {formatCOP(metricasGenerales.totalDescuentos)}
                </span>
              </div>
              <div className="py-3 flex justify-between items-center bg-[#D19650]/15 px-3 rounded-xl">
                <span className="font-extrabold text-[#351912] text-sm">Ventas Netas Realizadas:</span>
                <span className="font-mono font-black text-base text-[#171717]">
                  {formatCOP(metricasGenerales.totalVentasNetas)}
                </span>
              </div>
              <div className="py-3 flex justify-between items-center">
                <span className="font-semibold text-[#50322A]">IVA Tarifa General 19% Discriminado:</span>
                <span className="font-mono font-bold text-[#50322A]">
                  {formatCOP(metricasGenerales.iva19Cop)}
                </span>
              </div>
              <div className="py-3 flex justify-between items-center">
                <span className="font-semibold text-[#50322A]">Base Gravable Neta (Subtotal sin IVA):</span>
                <span className="font-mono font-bold text-[#171717]">
                  {formatCOP(metricasGenerales.totalVentasNetas - metricasGenerales.iva19Cop)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECCIÓN COMPLEMENTARIA: LIBROS CONTABLES BASE DE AUDITORÍA */}
      <div className="glass-mirror-card p-6 rounded-3xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#50322A]/15">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-[#661521]" />
            <h3 className="text-base font-black text-[#171717] font-display">
              Descarga Adicional de Libros Contables Multi-Hoja
            </h3>
          </div>
          <span className="text-xs font-bold text-[#50322A]">Libros del Servidor</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Libro 1: Ventas Netas */}
          <div className="glass-mirror-pill p-4 rounded-2xl border border-[#D19650]/40 flex flex-col justify-between">
            <div>
              <div className="text-sm font-black text-[#171717] mb-1">
                Libro de Ventas Netas y NC
              </div>
              <p className="text-xs text-[#50322A] mb-3">
                Libro con facturas de venta, prorrateo de descuentos y notas de crédito.
              </p>
            </div>
            <button
              onClick={() =>
                descargarLibroOficial('/reportes/excel/ventas', `Libro_Ventas_Netas_${new Date().toISOString().slice(0, 10)}.xlsx`)
              }
              disabled={Boolean(descargandoLibro)}
              className="w-full py-2 px-3 bg-[#661521] hover:bg-[#4A0E17] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-[#D19650]" />
              <span>Descargar Ventas (.xlsx)</span>
            </button>
          </div>

          {/* Libro 2: Auditoría de Cajas */}
          <div className="glass-mirror-pill p-4 rounded-2xl border border-[#D19650]/40 flex flex-col justify-between">
            <div>
              <div className="text-sm font-black text-[#171717] mb-1">
                Auditoría de Cajas Ciegas
              </div>
              <p className="text-xs text-[#50322A] mb-3">
                Arqueos de efectivo, bases iniciales y comparativo del dinero esperado en punto.
              </p>
            </div>
            <button
              onClick={() =>
                descargarLibroOficial('/reportes/excel/cajas', `Libro_Auditoria_Cajas_${new Date().toISOString().slice(0, 10)}.xlsx`)
              }
              disabled={Boolean(descargandoLibro)}
              className="w-full py-2 px-3 bg-[#661521] hover:bg-[#4A0E17] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-[#D19650]" />
              <span>Descargar Cajas (.xlsx)</span>
            </button>
          </div>

          {/* Libro 3: Inventario Valorizado */}
          <div className="glass-mirror-pill p-4 rounded-2xl border border-[#D19650]/40 flex flex-col justify-between">
            <div>
              <div className="text-sm font-black text-[#171717] mb-1">
                Inventario Valorizado Multisede
              </div>
              <p className="text-xs text-[#50322A] mb-3">
                Saldos físicos valorizados al costo en Bodega Central y los 4 Puntos de Venta.
              </p>
            </div>
            <button
              onClick={() =>
                descargarLibroOficial('/reportes/excel/inventario', `Libro_Inventario_Valorizado_${new Date().toISOString().slice(0, 10)}.xlsx`)
              }
              disabled={Boolean(descargandoLibro)}
              className="w-full py-2 px-3 bg-[#661521] hover:bg-[#4A0E17] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-[#D19650]" />
              <span>Descargar Inventario (.xlsx)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReportesPage;
