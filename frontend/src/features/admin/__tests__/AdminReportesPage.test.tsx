// frontend/src/features/admin/__tests__/AdminReportesPage.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminReportesPage } from '../pages/AdminReportesPage';
import * as XLSX from 'xlsx';

// Mock de XLSX para verificar llamadas de exportación
vi.mock('xlsx', () => ({
  utils: {
    book_new: vi.fn(() => ({ Sheets: {}, SheetNames: [] })),
    aoa_to_sheet: vi.fn(() => ({ '!ref': 'A1:H20' })),
    book_append_sheet: vi.fn(),
  },
  writeFile: vi.fn(),
}));

describe('AdminReportesPage - Generador Interactivo y Analítica Personalizada', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza el encabezado ejecutivo y los filtros dinámicos sin referencias técnicas a RN-* o CA-*', () => {
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

    // Botones rápidos de rango de fechas
    expect(screen.getByText(/Hoy \(05 Nov 2026\)/i)).toBeInTheDocument();
    expect(screen.getByText('Últimos 7 días')).toBeInTheDocument();
    expect(screen.getByText('Este Mes (Noviembre 2026)')).toBeInTheDocument();
    expect(screen.getByText('Trimestre Consolidado')).toBeInTheDocument();

    // Botón dominante de exportación Excel
    expect(
      screen.getByText('Exportar Reporte Personalizado a Excel (.xlsx)')
    ).toBeInTheDocument();
  });

  it('permite filtrar por prenda específica (ej. Pantalón) y actualiza los resultados', () => {
    render(
      <MemoryRouter>
        <AdminReportesPage />
      </MemoryRouter>
    );

    const inputBusqueda = screen.getByPlaceholderText(/Pantalón/i);
    fireEvent.change(inputBusqueda, { target: { value: 'Pantalón' } });

    // La tabla de prendas debe mostrar los pantalones
    const pantalones = screen.getAllByText(/Pantalón Lino Sartorial/i);
    expect(pantalones.length).toBeGreaterThanOrEqual(1);

    // La prenda no relacionada no debe estar visible en este filtro
    expect(screen.queryByText('Mochila Wayúu Tradicional')).not.toBeInTheDocument();
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

  it('ejecuta la exportación a Excel personalizada con 4 hojas y nombre dinámico con sede y fecha', async () => {
    render(
      <MemoryRouter>
        <AdminReportesPage />
      </MemoryRouter>
    );

    const btnExportar = screen.getByText('Exportar Reporte Personalizado a Excel (.xlsx)');
    fireEvent.click(btnExportar);

    await waitFor(() => {
      // Debe haber creado el workbook
      expect(XLSX.utils.book_new).toHaveBeenCalled();
      // Debe haber añadido las 4 hojas solicitadas: Resumen Ejecutivo, Prendas Vendidas, Ranking Vendedores, Desglose Financiero
      expect(XLSX.utils.book_append_sheet).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        'Resumen Ejecutivo'
      );
      expect(XLSX.utils.book_append_sheet).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        'Prendas Vendidas'
      );
      expect(XLSX.utils.book_append_sheet).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        'Ranking Vendedores'
      );
      expect(XLSX.utils.book_append_sheet).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        'Desglose Financiero'
      );

      // Debe haber llamado a writeFile con el patrón de nombre Reporte_Gerencial_FORMA_...
      expect(XLSX.writeFile).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringMatching(/^Reporte_Gerencial_FORMA_.*\.xlsx$/)
      );

      // Debe mostrar el mensaje de éxito en pantalla
      expect(screen.getByText(/generado con éxito/i)).toBeInTheDocument();
    });
  });
});
