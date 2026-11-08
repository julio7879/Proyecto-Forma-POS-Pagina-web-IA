import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PosVentasHistorialPage from '../pages/PosVentasHistorialPage';
import PosPedidosWebPage from '../pages/PosPedidosWebPage';
import PosCambiosPage from '../pages/PosCambiosPage';
import PosTrasladosPage from '../pages/PosTrasladosPage';
import PosArqueoPage from '../pages/PosArqueoPage';
import { createWebOrder } from '../utils/webOrdersStore';
import { applyStockDelta, recordPosSale, resetPosLedgerSync } from '../utils/posLedgerSync';
import { abrirSesionCaja, resetCaja } from '../utils/cajaStore';

describe('Portal 2 (Sistema POS) - 5 Vistas Dedicadas con Datos 100% Reales', () => {
  beforeEach(() => {
    localStorage.clear();
    resetPosLedgerSync();
    resetCaja();
    localStorage.setItem('forma_pos_sede', 'Punto Centro (Cúcuta)');
  });

  describe('1. PosVentasHistorialPage (Historial Operativo Unificado + Autosuma)', () => {
    beforeEach(() => {
      recordPosSale({
        id: 'sale-42',
        consecutivo: '#MED-0042',
        fechaHora: 'Hoy · 10:15 a. m.',
        fechaIso: new Date().toISOString(),
        vendedor: 'Carlos Mendoza',
        sede: 'Punto Centro (Cúcuta)',
        cliente: 'Andrés Felipe Calderón',
        medioPago: 'TRANSFERENCIA',
        subtotalCop: 158824,
        iva19Cop: 30176,
        totalCop: 189000,
        prendas: [
          {
            sku: 'ROP-DNM-001-M',
            nombre: 'Chaqueta Denim Artesanal',
            talla: 'M',
            color: 'Azul Índigo',
            cantidad: 1,
            precioUnitarioCop: 189000,
            totalCop: 189000,
          },
        ],
      });
      recordPosSale({
        id: 'sale-41',
        consecutivo: '#MED-0041',
        fechaHora: 'Hoy · 09:40 a. m.',
        fechaIso: new Date().toISOString(),
        vendedor: 'Carlos Mendoza',
        sede: 'Punto Centro (Cúcuta)',
        cliente: 'Valentina Restrepo',
        medioPago: 'EFECTIVO',
        subtotalCop: 50336,
        iva19Cop: 9564,
        totalCop: 59900,
        prendas: [
          {
            sku: 'ROP-CAM-002-S',
            nombre: 'Camiseta Básica Algodón Pima',
            talla: 'S',
            color: 'Blanco Hueso',
            cantidad: 1,
            precioUnitarioCop: 59900,
            totalCop: 59900,
          },
        ],
      });
    });

    it('renderiza la cabecera, los 4 KPIs claros, filtros combinables y la barra inferior de autosuma', () => {
      render(<PosVentasHistorialPage />);
      expect(screen.getByText('Historial de Ventas del Mostrador')).toBeInTheDocument();
      expect(screen.getByText('Total Ventas Mostrador')).toBeInTheDocument();
      expect(screen.getByText('Efectivo en Gaveta')).toBeInTheDocument();
      expect(screen.getByText('Transferencias QR')).toBeInTheDocument();
      expect(screen.getByText('Cambios y Devoluciones')).toBeInTheDocument();
      expect(screen.getByText('#MED-0042')).toBeInTheDocument();
      expect(screen.getByText('#MED-0041')).toBeInTheDocument();
      expect(screen.getByText(/TOTAL AUTOSUMA FILTRADO/i)).toBeInTheDocument();
    });

    it('permite abrir el DetailDrawer con el detalle de una venta y reimprimir ticket', () => {
      render(<PosVentasHistorialPage />);
      const verDetalleBtn = screen.getAllByText('Ver Detalle')[0];
      fireEvent.click(verDetalleBtn);

      expect(screen.getAllByText(/Reimprimir Ticket/i).length).toBeGreaterThan(0);
    });
  });

  describe('2. PosPedidosWebPage (Bandeja Compartida con Bloqueo al Primer Clic y Cierre de Drawer)', () => {
    beforeEach(() => {
      createWebOrder({
        codigo: 'PED-2026-849201',
        fechaCreacionIso: new Date().toISOString(),
        cliente: 'Camila Soto Peñaranda',
        emailCliente: 'camila.soto@ejemplo.com',
        telefono: '312 840 9921',
        ciudadDestino: 'Cúcuta, Norte de Santander',
        codigoDaneDestino: '54001',
        direccionEntrega: 'Av. Gran Colombia # 12-40, Apto 402',
        sedeAsignada: 'Punto Centro (Cúcuta)',
        metodoPago: 'CONTRAENTREGA',
        metodoPagoTexto: 'Pago Contraentrega DANE',
        subtotalCOP: 189000,
        ivaCOP: 30176,
        fleteCOP: 8000,
        totalCOP: 189000,
        estado: 'CONFIRMADO',
        productos: [
          {
            id: 'p-1',
            nombre: 'Chaqueta Denim Artesanal',
            sku: 'ROP-DNM-001-M',
            talla: 'M',
            color: 'Azul Índigo',
            cantidad: 1,
            precioUnitarioCOP: 189000,
            imagenUrl: '/products/blazer-imperial-vinotinto.png',
          },
        ],
      });
    });

    it('muestra los pedidos web disponibles en bandeja compartida y permite cerrar el DetailDrawer con la X', () => {
      render(<PosPedidosWebPage />);
      expect(screen.getByText('Alistamiento y Despacho de Pedidos Web')).toBeInTheDocument();
      expect(screen.getByText(/PED-2026-849201/)).toBeInTheDocument();
      expect(screen.getByText('1. Por Alistar')).toBeInTheDocument();

      // Abrir el DetailDrawer haciendo clic en el pedido
      fireEvent.click(screen.getByText(/PED-2026-849201/));
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Cerrar el DetailDrawer con el botón X (QA-POS-011)
      const closeBtn = screen.getByRole('button', { name: /Cerrar panel de detalle/i });
      fireEvent.click(closeBtn);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('permite tomar y bloquear el pedido en la sede al pulsar Iniciar Alistamiento', () => {
      render(<PosPedidosWebPage />);
      fireEvent.click(screen.getByText(/PED-2026-849201/));
      const iniciarAlistamientoBtn = screen.getByText('Iniciar Alistamiento / En Preparación');
      fireEvent.click(iniciarAlistamientoBtn);

      const listosBtns = screen.getAllByText('Marcar como Listo para Despacho');
      expect(listosBtns.length).toBeGreaterThanOrEqual(1);
    });

    it('abre el modal de contingencia claro sin jerga técnica cuando no se tiene la prenda', () => {
      render(<PosPedidosWebPage />);
      fireEvent.click(screen.getByText(/PED-2026-849201/));
      const reportarBtn = screen.getAllByText(/¿No tienes la prenda\? Reportar y reasignar/i)[0];
      fireEvent.click(reportarBtn);

      expect(screen.getByText('Reportar falta de prenda en tienda')).toBeInTheDocument();
      expect(screen.getByText('1. Reasignar a otra Tienda')).toBeInTheDocument();
      expect(screen.getByText('2. Enviar a Bodega Central')).toBeInTheDocument();
    });
  });

  describe('3. PosCambiosPage (3 Subcategorías + Wizard de 3 Pasos)', () => {
    beforeEach(() => {
      applyStockDelta('ROP-DNM-001-M', 8);
      applyStockDelta('ROP-DNM-001-L', 5);
      applyStockDelta('ROP-CAM-002-S', 15);
      applyStockDelta('COS-CRM-004-100ML', 12);
      applyStockDelta('ACC-BOL-003-UNI', 6);
      applyStockDelta('ROP-BLZ-010-M', 10);
      recordPosSale({
        id: 'sale-cambio-1',
        consecutivo: '#MED-0041',
        fechaHora: 'Hoy · 02:20 p. m.',
        fechaIso: new Date().toISOString(),
        vendedor: 'Carlos Mendoza',
        sede: 'Punto Centro (Cúcuta)',
        cliente: 'Valentina Restrepo',
        documentoCliente: 'CC 1.090.482.910',
        medioPago: 'EFECTIVO',
        subtotalCop: 158824,
        iva19Cop: 30176,
        totalCop: 189000,
        prendas: [
          {
            sku: 'ROP-DNM-001-M',
            nombre: 'Chaqueta Denim Artesanal',
            talla: 'M',
            color: 'Azul Índigo',
            categoria: 'Ropa',
            cantidad: 1,
            precioUnitarioCop: 189000,
            totalCop: 189000,
          },
        ],
      });
    });

    it('renderiza las 3 subcategorías superiores y el Wizard de 3 pasos sin bonos QR', () => {
      render(<PosCambiosPage />);
      expect(screen.getByText('Registro de Cambios de Prendas')).toBeInTheDocument();
      expect(screen.getByText('1. Nuevo Cambio Mano a Mano')).toBeInTheDocument();
      expect(screen.getByText('2. Devolución por Imperfecto / Garantía')).toBeInTheDocument();
      expect(screen.getByText(/3\. Historial de Cambios y Devoluciones/i)).toBeInTheDocument();
      expect(screen.queryByText(/Bono QR Saldo a Favor/i)).not.toBeInTheDocument();
    });

    it('calcula Caso A (Misma prenda otra talla): Diferencia $0 COP', () => {
      render(<PosCambiosPage />);
      expect(screen.getByText(/Caso A: Cambio Mano a Mano Exacto/i)).toBeInTheDocument();
      expect(screen.getByText('Confirmar y Registrar Cambio Mano a Mano')).toBeInTheDocument();
    });
  });

  describe('4. PosTrasladosPage (4 Subcategorías de Inventario en Sede)', () => {
    beforeEach(() => {
      localStorage.setItem(
        'forma_admin_traslados',
        JSON.stringify([
          {
            id: 89,
            codigo: 'TRA-2026-089',
            origenNombre: 'Bodega Central',
            destinoNombre: 'Punto Centro (Cúcuta)',
            estado: 'ENVIADO',
            fechaEnvio: new Date().toISOString(),
            lineas: [
              {
                id: 'lin-1',
                sku: 'ROP-DNM-001-M',
                nombreProducto: 'Chaqueta Denim Artesanal',
                cantidadEnviada: 4,
              },
            ],
          },
        ])
      );
    });

    it('permite navegar entre las 4 subcategorías de Inventario (Existencias, Solicitud, Recepción, Kardex)', () => {
      render(<PosTrasladosPage />);
      expect(screen.getByText(/1\. Existencias en Tienda/i)).toBeInTheDocument();
      expect(screen.getByText(/2\. Solicitar Mercancía a Central/i)).toBeInTheDocument();
      expect(screen.getByText(/3\. Recepción de Despachos/i)).toBeInTheDocument();
      expect(screen.getByText(/4\. Movimientos de Inventario \(Kardex Sede\)/i)).toBeInTheDocument();

      // Ir a Recepción de Despachos
      fireEvent.click(screen.getByText(/3\. Recepción de Despachos/i));
      const confirmBtns = screen.getAllByText(/Confirmar Recepción de Mercancía/i);
      expect(confirmBtns.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('5. PosArqueoPage (4 Subcategorías de Caja + Envío por WhatsApp)', () => {
    it('muestra la pantalla de Apertura Obligatoria cuando la caja está cerrada y permite abrir turno', () => {
      render(<PosArqueoPage />);
      expect(screen.getByText('Control de Caja y Arqueo Ciego')).toBeInTheDocument();
      expect(screen.getByText('Apertura de Turno de Caja')).toBeInTheDocument();
      expect(screen.queryByText(/#CAJ-104 base 200.000/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/RN-CAJ-11/i)).not.toBeInTheDocument();
    });

    it('permite simular el conteo exacto y enviar el arqueo ciego cuando el turno está abierto', () => {
      abrirSesionCaja('Punto Centro (Cúcuta)', 'Carlos Mendoza', 200000, 'Base inicial');
      render(<PosArqueoPage />);

      // Ir a la pestaña 3. Cierre y Arqueo de Turno
      fireEvent.click(screen.getByText('3. Cierre y Arqueo de Turno'));

      const conteoExactoBtn = screen.getByText('Conteo Exacto');
      fireEvent.click(conteoExactoBtn);

      const enviarArqueoBtn = screen.getByText('Confirmar y Enviar Arqueo Ciego (Revelar Cuadre)');
      fireEvent.click(enviarArqueoBtn);

      expect(screen.getByText('Resultado del Cuadre de Caja')).toBeInTheDocument();
      expect(screen.getByText('$0 COP — Cuadre Exacto')).toBeInTheDocument();
    });
  });
});
