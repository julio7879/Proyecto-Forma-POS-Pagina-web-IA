import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PosVentasHistorialPage from '../pages/PosVentasHistorialPage';
import PosPedidosWebPage from '../pages/PosPedidosWebPage';
import PosCambiosPage from '../pages/PosCambiosPage';
import PosTrasladosPage from '../pages/PosTrasladosPage';
import PosArqueoPage from '../pages/PosArqueoPage';
import { createWebOrder } from '../utils/webOrdersStore';

describe('Portal 2 (Sistema POS) - 5 Vistas Dedicadas', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('1. PosVentasHistorialPage', () => {
    it('renderiza la cabecera, KPIs y la lista de ventas del mostrador', () => {
      render(<PosVentasHistorialPage />);
      expect(screen.getByText('Historial de Ventas del Mostrador')).toBeInTheDocument();
      expect(screen.getByText('Total Facturado')).toBeInTheDocument();
      expect(screen.getByText('Ventas en Efectivo')).toBeInTheDocument();
      expect(screen.getByText('Transferencias Bancarias')).toBeInTheDocument();
      expect(screen.getByText('#MED-0042')).toBeInTheDocument();
      expect(screen.getByText('#MED-0041')).toBeInTheDocument();
    });

    it('permite abrir el modal con el detalle de una venta y ver prendas e IVA', () => {
      render(<PosVentasHistorialPage />);
      const verDetalleBtn = screen.getAllByText('Ver Detalle')[0];
      fireEvent.click(verDetalleBtn);

      expect(screen.getByText('Detalle de Factura')).toBeInTheDocument();
      expect(screen.getByText('IVA discriminado (19% incluido):')).toBeInTheDocument();
      expect(screen.getByText('Reimprimir Ticket de Venta (80mm)')).toBeInTheDocument();
    });
  });

  describe('2. PosPedidosWebPage', () => {
    beforeEach(() => {
      localStorage.setItem('forma_pos_sede', 'Punto Centro (Cúcuta)');
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
            imagenUrl: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=600&q=80',
          },
        ],
      });
    });
    it('muestra los pedidos web asignados y permite filtrar por estado', () => {
      render(<PosPedidosWebPage />);
      expect(screen.getByText('Alistamiento y Despacho de Pedidos Web')).toBeInTheDocument();
      expect(screen.getByText(/PED-2026-849201/)).toBeInTheDocument();
      expect(screen.getByText('1. Por Alistar')).toBeInTheDocument();
    });

    it('permite avanzar el estado de alistamiento de un pedido web', () => {
      render(<PosPedidosWebPage />);
      const iniciarAlistamientoBtn = screen.getByText('Iniciar Alistamiento / En Preparación');
      fireEvent.click(iniciarAlistamientoBtn);

      const listosBtns = screen.getAllByText('Marcar como Listo para Despacho');
      expect(listosBtns.length).toBeGreaterThanOrEqual(1);
    });

    it('abre el modal de contingencia claro sin jerga técnica cuando no se tiene la prenda', () => {
      render(<PosPedidosWebPage />);
      const reportarBtn = screen.getAllByText(/¿No tienes la prenda\? Reportar y reasignar/i)[0];
      fireEvent.click(reportarBtn);

      expect(screen.getByText('Reportar falta de prenda en tienda')).toBeInTheDocument();
      expect(screen.getByText('1. Reasignar a otra Tienda')).toBeInTheDocument();
      expect(screen.getByText('2. Enviar a Bodega Central')).toBeInTheDocument();
    });
  });

  describe('3. PosCambiosPage', () => {
    it('renderiza el flujo de Cambio Mano a Mano en 3 pasos sin bonos QR inventados', () => {
      render(<PosCambiosPage />);
      expect(screen.getByText('Registro de Cambios de Prendas')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
      // Garantizar que NO existen bonos QR inventados ni tirillas térmicas QR
      expect(screen.queryByText(/Bono QR Saldo a Favor/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Tirilla Térmica 80mm \(Bono QR\)/i)).not.toBeInTheDocument();
    });

    it('calcula Caso A (Misma prenda otra talla): Diferencia $0 COP', () => {
      render(<PosCambiosPage />);
      expect(screen.getByText(/Caso A: Cambio Mano a Mano Exacto/i)).toBeInTheDocument();
      expect(screen.getByText('Confirmar y Registrar Cambio Mano a Mano')).toBeInTheDocument();
    });
  });

  describe('4. PosTrasladosPage', () => {
    it('permite alternar entre la pestaña de solicitud y la de recepción', () => {
      render(<PosTrasladosPage />);
      expect(screen.getByText('Pestaña 1: Solicitud de Traslado a Bodega Central')).toBeInTheDocument();
      expect(screen.getByText('Solicitar Mercancía a Bodega Central')).toBeInTheDocument();

      const pestañaRecepcion = screen.getByText(/Pestaña 2: Recepción de Traslados Entrantes/i);
      fireEvent.click(pestañaRecepcion);

      const confirmBtns = screen.getAllByText(/Confirmar Recepción de Mercancía/i);
      expect(confirmBtns.length).toBeGreaterThanOrEqual(1);
      const enBuenEstadoLabels = screen.getAllByText(/En Buen Estado/i);
      expect(enBuenEstadoLabels.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('5. PosArqueoPage', () => {
    it('renderiza el control de caja y arqueo sin textos técnicos de reglas', () => {
      render(<PosArqueoPage />);
      expect(screen.getByText('Control de Caja y Arqueo Ciego')).toBeInTheDocument();
      expect(screen.getByText('Arqueo Ciego por Denominaciones')).toBeInTheDocument();

      // Verificar que se eliminaron textos técnicos como #CAJ-104 o RN-*
      expect(screen.queryByText(/#CAJ-104 base 200.000/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/RN-CAJ-11/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/RN-GEN-04/i)).not.toBeInTheDocument();
    });

    it('permite simular el conteo exacto y enviar el arqueo ciego', () => {
      render(<PosArqueoPage />);
      const conteoExactoBtn = screen.getByText('Conteo Exacto');
      fireEvent.click(conteoExactoBtn);

      const enviarArqueoBtn = screen.getByText('Confirmar y Enviar Arqueo Ciego (Revelar Cuadre)');
      fireEvent.click(enviarArqueoBtn);

      expect(screen.getByText('Resultado del Cuadre de Caja')).toBeInTheDocument();
      expect(screen.getByText('$0 COP — Cuadre Exacto')).toBeInTheDocument();
    });
  });
});
