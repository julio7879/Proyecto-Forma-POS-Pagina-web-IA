// frontend/src/features/admin/__tests__/AdminReportesPage.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminReportesPage } from '../pages/AdminReportesPage';
import { recordPosSale } from '../../pos/utils/posLedgerSync';

describe('AdminReportesPage - Generador Interactivo y Analítica 100% Real', () => {
  const hoyBogotaStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(
    new Date()
  );

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    // Sembrar ventas reales en posLedgerSync con fecha de hoy en Bogotá
    recordPosSale({
      id: 'TRX-REAL-1',
      consecutivo: 'FAC-1001',
      fechaHora: 'Hoy 10:30 a. m.',
      fechaIso: new Date().toISOString(),
      vendedor: 'Daniela Gómez',
      sede: 'Punto Bucaramanga',
      cliente: 'Catalina Suárez',
      medioPago: 'TRANSFERENCIA',
      subtotalCop: 310924,
      iva19Cop: 59076,
      totalCop: 370000,
      prendas: [
        {
          sku: 'ROP-PAN-ARE-32',
          nombre: 'Pantalón Lino Sartorial',
          categoria: 'Ropa',
          cantidad: 2,
          precioUnitarioCop: 185000,
          totalCop: 370000,
        },
      ],
    });

    recordPosSale({
      id: 'TRX-REAL-2',
      consecutivo: 'FAC-1002',
      fechaHora: 'Hoy 11:45 a. m.',
      fechaIso: new Date().toISOString(),
      vendedor: 'Camilo Mendoza',
      sede: 'Punto Centro (Cúcuta)',
      cliente: 'Sebastián Mora',
      medioPago: 'EFECTIVO',
      subtotalCop: 117647,
      iva19Cop: 22353,
      totalCop: 140000,
      prendas: [
        {
          sku: 'ART-MOC-GEO-M',
          nombre: 'Mochila Wayuu Tradicional',
          categoria: 'Artesanías',
          cantidad: 1,
          precioUnitarioCop: 140000,
          totalCop: 140000,
        },
      ],
    });
  });

  it('renderiza el encabezado ejecutivo y los filtros dinámicos con fecha de Colombia sin referencias técnicas a RN-* o CA-*', () => {
    const { container } = render(
      <MemoryRouter>
        <AdminReportesPage />
      </MemoryRouter>
    );

    // Título principal
    expect(screen.getByText('Reportes Gerenciales y Ventas por Prenda')).toBeInTheDocument();
    expect(
      screen.getByText(/Filtre por periodo, sede, vendedor o prenda específica/i)
    ).toBeInTheDocument();

    // Verificación de cero citas a RN-* o CA-*
    const textContent = container.textContent || '';
    expect(textContent).not.toMatch(/RN-[A-Z]+-[0-9]+/);
    expect(textContent).not.toMatch(/CA-[0-9]+/);
    expect(textContent).not.toMatch(/RF-[A-Z]+/);

    // Botones rápidos de rango de fechas con fecha real de Bogotá
    expect(screen.getByText(`Hoy (${hoyBogotaStr})`)).toBeInTheDocument();
    expect(screen.getByText('Últimos 7 días')).toBeInTheDocument();
    expect(screen.getByText(`Este Mes (${hoyBogotaStr.slice(0, 7)})`)).toBeInTheDocument();
    expect(screen.getByText('Trimestre Consolidado')).toBeInTheDocument();

    // Pestañas principales de navegación ejecutiva
    expect(screen.getByText('Tablero Analítico en Vivo')).toBeInTheDocument();
    expect(screen.getByText('Centro de Reportes y Descargas (BI Hub)')).toBeInTheDocument();
    expect(screen.getByText('10 Libros')).toBeInTheDocument();
  });

  it('permite filtrar por prenda específica (ej. Pantalón) y actualiza los resultados reales', () => {
    render(
      <MemoryRouter>
        <AdminReportesPage />
      </MemoryRouter>
    );

    const inputBusqueda = screen.getByPlaceholderText(/Pantalón/i);
    fireEvent.change(inputBusqueda, { target: { value: 'Pantalón' } });

    // La tabla de prendas debe mostrar el pantalón sembrado
    const pantalones = screen.getAllByText(/Pantalón Lino Sartorial/i);
    expect(pantalones.length).toBeGreaterThanOrEqual(1);

    // La prenda no relacionada no debe estar visible en este filtro
    expect(screen.queryByText('Mochila Wayuu Tradicional')).not.toBeInTheDocument();
  });

  it('permite cambiar entre pestañas analíticas: Prendas, Ranking Vendedores y Desglose Financiero', () => {
    render(
      <MemoryRouter>
        <AdminReportesPage />
      </MemoryRouter>
    );

    // Pestaña activa inicial: Prendas
    expect(screen.getByText('Volumen de Ventas por Prenda')).toBeInTheDocument();

    // Cambiar a Ranking de Vendedores
    const btnVendedores = screen.getByText('Ranking de Mejores Vendedores');
    fireEvent.click(btnVendedores);

    expect(screen.getByText('Rendimiento Global de Vendedores en Mostrador')).toBeInTheDocument();
    const danielas = screen.getAllByText(/Daniela Gómez/i);
    expect(danielas.length).toBeGreaterThanOrEqual(1);

    const podioOro = screen.getAllByText(/🥇 Oro/i);
    expect(podioOro.length).toBeGreaterThanOrEqual(1);

    // Cambiar a Desglose Financiero
    const btnFinanciero = screen.getByText('Desglose por Medios de Pago');
    fireEvent.click(btnFinanciero);

    expect(screen.getByText('Participación por Método de Pago')).toBeInTheDocument();
    expect(screen.getByText('Conciliación Financiera del Periodo')).toBeInTheDocument();
    expect(screen.getByText('Transferencia Bancolombia')).toBeInTheDocument();
  });

  it('permite alternar entre el Tablero Analítico y el Centro de Reportes y Descargas', () => {
    render(
      <MemoryRouter>
        <AdminReportesPage />
      </MemoryRouter>
    );

    const tabHub = screen.getByText('Centro de Reportes y Descargas (BI Hub)');
    fireEvent.click(tabHub);

    // Debe mostrar la vista del BI Hub con sus 10 libros oficiales
    expect(screen.getByText('Ventas Generales y Facturación')).toBeInTheDocument();
    expect(screen.getByText('Ventas Comparativas por Sucursal')).toBeInTheDocument();
    expect(screen.getByText('10 Libros')).toBeInTheDocument();

    // Y volver al Tablero Analítico
    const tabTablero = screen.getByText('Tablero Analítico en Vivo');
    fireEvent.click(tabTablero);
    expect(screen.getByText('Volumen de Ventas por Prenda')).toBeInTheDocument();
  });

  it('permite cambiar al Centro de Reportes (BI Hub), filtrar tarjetas y abrir el modal de previsualización de 10 filas', async () => {
    render(
      <MemoryRouter>
        <AdminReportesPage />
      </MemoryRouter>
    );

    // Cambiar a la pestaña del BI Hub
    const tabHub = screen.getByText(/Centro de Reportes y Descargas/i);
    fireEvent.click(tabHub);

    // Deben mostrarse los reportes del catálogo
    expect(screen.getByText('Ventas Generales y Facturación')).toBeInTheDocument();
    expect(screen.getByText('Ventas Comparativas por Sucursal')).toBeInTheDocument();
    expect(screen.getByText('Inventario y Existencias Multisede')).toBeInTheDocument();
    expect(screen.getByText('Cierre y Arqueo Ciego de Cajas')).toBeInTheDocument();

    // Abrir el modal de previsualización en el primer reporte
    const botonesConfigurar = screen.getAllByText('Configurar y Descargar');
    fireEvent.click(botonesConfigurar[0]);

    // El modal debe estar abierto mostrando la configuración y previsualización
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Configuración del Libro Excel')).toBeInTheDocument();
    expect(screen.getByText(/Previsualización de Datos/i)).toBeInTheDocument();
    expect(screen.getByText(/Mostrando primeras/i)).toBeInTheDocument();
    expect(screen.getByText('Descargar Libro Excel (.xlsx)')).toBeInTheDocument();
  });
});
