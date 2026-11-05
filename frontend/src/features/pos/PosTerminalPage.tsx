// frontend/src/features/pos/PosTerminalPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  ScanBarcode,
  Search,
  Trash2,
  Plus,
  Minus,
  Printer,
  Send,
  CheckCircle2,
  User,
  X,
  ShoppingBag,
  Loader2,
} from 'lucide-react';
import {
  searchProduct,
  submitSale,
  ProductoBusquedaDTO,
  CrearVentaPOSDto,
  MetodoPagoPOS,
  VarianteBusquedaDTO,
} from './services/posService';
import { TicketVentaPOS } from './components/TicketVentaPOS';
import { CobroRapidoModal } from './components/CobroRapidoModal';
import { VentaTicketDTO } from './types/ticket.types';

interface PosCartLine {
  varianteId: number;
  productoId: number;
  nombre: string;
  sku: string;
  talla: string;
  color: string;
  precioUnitarioCOP: number;
  cantidad: number;
  categoriaNombre: string;
  esCosmetico: boolean;
  stockDisponible: number;
}

export const PosTerminalPage: React.FC = () => {
  // Búsqueda
  const [busqueda, setBusqueda] = useState('');
  const [productos, setProductos] = useState<ProductoBusquedaDTO[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [busquedaError, setBusquedaError] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Carrito
  const [cartLines, setCartLines] = useState<PosCartLine[]>([]);

  // Cliente
  const [clienteNombre, setClienteNombre] = useState('Consumidor Final');
  const [mostrarModalCliente, setMostrarModalCliente] = useState(false);
  const [inputCedula, setInputCedula] = useState('');

  // Modales
  const [mostrarModalCobro, setMostrarModalCobro] = useState(false);
  const [mostrarModalExito, setMostrarModalExito] = useState(false);
  const [ticketGenerado, setTicketGenerado] = useState<VentaTicketDTO | null>(null);

  // Selector de variante
  const [productoSeleccionando, setProductoSeleccionando] =
    useState<ProductoBusquedaDTO | null>(null);

  // Cobro
  const [metodoPago, setMetodoPago] = useState<MetodoPagoPOS>('EFECTIVO');
  const [efectivoRecibido, setEfectivoRecibido] = useState<number>(0);
  const [comprobanteBancario, setComprobanteBancario] = useState('');

  // Anti-doble venta
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorVenta, setErrorVenta] = useState<string | null>(null);

  // Atajos
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F12') {
        e.preventDefault();
        if (cartLines.length > 0 && !isSubmitting) abrirModalCobro();
      } else if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        setMostrarModalCobro(false);
        setMostrarModalCliente(false);
        setProductoSeleccionando(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cartLines, isSubmitting]);

  // Búsqueda con debounce
  useEffect(() => {
    if (busqueda.trim().length < 2) {
      setProductos([]);
      return;
    }
    const timer = setTimeout(async () => {
      setBuscando(true);
      setBusquedaError(null);
      try {
        const results = await searchProduct(busqueda.trim());
        setProductos(results);
      } catch (error: any) {
        setBusquedaError(error.message || 'Error al buscar productos');
        setProductos([]);
      } finally {
        setBuscando(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [busqueda]);

  // Totales en COP entero (RN-GEN-04)
  const totalPagarCOP = cartLines.reduce(
    (acc, line) => acc + line.precioUnitarioCOP * line.cantidad,
    0
  );
  const baseGravableCOP = Math.round(totalPagarCOP / 1.19);
  const ivaEstimadoCOP = totalPagarCOP - baseGravableCOP;
  const cambioVueltoCOP = Math.max(0, efectivoRecibido - totalPagarCOP);

  const formatCOP = (val: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);

  // ============================================
  // Carrito
  // ============================================
  const agregarVarianteAlCarrito = (
    producto: ProductoBusquedaDTO,
    variante: VarianteBusquedaDTO
  ) => {
    setCartLines((prev) => {
      const idx = prev.findIndex((l) => l.varianteId === variante.varianteId);
      if (idx >= 0) {
        const copy = [...prev];
        if (copy[idx].cantidad + 1 > variante.stockDisponible) return copy;
        copy[idx].cantidad += 1;
        return copy;
      }
      return [
        ...prev,
        {
          varianteId: variante.varianteId,
          productoId: producto.productoId,
          nombre: producto.nombre,
          sku: variante.sku,
          talla: variante.talla,
          color: variante.color,
          precioUnitarioCOP: variante.precioUnitarioCop,
          cantidad: 1,
          categoriaNombre: producto.categoriaNombre,
          esCosmetico: producto.esCosmeticoUsoPersonal,
          stockDisponible: variante.stockDisponible,
        },
      ];
    });
  };

  const handleAddProducto = (producto: ProductoBusquedaDTO) => {
    const variantesConStock = producto.variantes.filter((v) => v.stockDisponible > 0);
    if (variantesConStock.length === 0) return;

    if (variantesConStock.length === 1) {
      agregarVarianteAlCarrito(producto, variantesConStock[0]);
      return;
    }
    setProductoSeleccionando(producto);
  };

  const handleSeleccionarVariante = (variante: VarianteBusquedaDTO) => {
    if (!productoSeleccionando) return;
    agregarVarianteAlCarrito(productoSeleccionando, variante);
    setProductoSeleccionando(null);
  };

  const handleUpdateCantidad = (varianteId: number, delta: number) => {
    setCartLines((prev) =>
      prev
        .map((l) => {
          if (l.varianteId === varianteId) {
            const nueva = l.cantidad + delta;
            if (nueva <= 0) return null;
            if (nueva > l.stockDisponible) return l;
            return { ...l, cantidad: nueva };
          }
          return l;
        })
        .filter((l): l is PosCartLine => l !== null)
    );
  };

  const handleRemoveLine = (varianteId: number) => {
    setCartLines((prev) => prev.filter((l) => l.varianteId !== varianteId));
  };

  // ============================================
  // Cobro
  // ============================================
  const abrirModalCobro = () => {
    setEfectivoRecibido(totalPagarCOP);
    setErrorVenta(null);
    setMostrarModalCobro(true);
  };

  const handleConfirmarVenta = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorVenta(null);

    try {
      const payload: CrearVentaPOSDto = {
        ubicacionId: 1,
        clienteNombre: clienteNombre !== 'Consumidor Final' ? clienteNombre : undefined,
        lineas: cartLines.map((l) => ({
          varianteId: l.varianteId,
          sku: l.sku,
          cantidad: l.cantidad,
        })),
        pagos: [
          {
            metodoPago,
            montoRecibidoCop: metodoPago === 'EFECTIVO' ? efectivoRecibido : undefined,
            referenciaTransferencia:
              metodoPago === 'TRANSFERENCIA' ? comprobanteBancario : undefined,
          },
        ],
      };

      const idempotencyKey = crypto.randomUUID();
      const response = await submitSale(payload, idempotencyKey);

      setTicketGenerado(response.ticket);
      setMostrarModalCobro(false);
      setMostrarModalExito(true);
    } catch (error: any) {
      setErrorVenta(error.message || 'Error al procesar la venta');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNuevaVenta = () => {
    setCartLines([]);
    setClienteNombre('Consumidor Final');
    setEfectivoRecibido(0);
    setComprobanteBancario('');
    setMostrarModalExito(false);
    setTicketGenerado(null);
    setBusqueda('');
    setProductos([]);
  };

  return (
    <div className="h-full w-full flex flex-col md:flex-row overflow-hidden bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-800 shadow-sm select-none">
      {/* COLUMNA IZQUIERDA (60%) */}
      <section
        className="w-full md:w-[60%] h-full flex flex-col border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 p-3 overflow-hidden bg-slate-50/50 dark:bg-slate-900/50"
        aria-label="Catálogo táctil de productos para venta"
      >
        <div className="relative mb-3 flex gap-2">
          <div className="relative flex-1">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
              aria-hidden="true"
            />
            <input
              ref={searchInputRef}
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Escanear código de barras, SKU o escribir prenda... (F2)"
              className="w-full pl-11 pr-24 py-3 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-[11px] font-mono text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600">
              Atajo: F2
            </span>
          </div>
          <button
            type="button"
            onClick={() => searchInputRef.current?.focus()}
            className="px-3.5 py-3 rounded-xl bg-slate-800 text-white hover:bg-slate-700 active:scale-95 transition-all flex items-center justify-center shrink-0 shadow-sm"
            aria-label="Activar lector de código de barras"
            title="Activar Escáner"
          >
            <ScanBarcode className="w-5 h-5" />
          </button>
        </div>

        {buscando && (
          <div className="flex items-center justify-center py-4 text-xs text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Buscando productos...
          </div>
        )}
        {busquedaError && (
          <div className="mb-2 p-2 rounded-lg bg-red-50 dark:bg-red-950/40 text-xs text-red-700 dark:text-red-300">
            {busquedaError}
          </div>
        )}

        <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-0.5">
          {productos.length === 0 && !buscando && busqueda.trim().length >= 2 && (
            <div className="col-span-full text-center py-12 text-xs text-slate-500">
              No se encontraron productos para «{busqueda}»
            </div>
          )}
          {productos.map((prod) => {
            const stockTotal = prod.variantes.reduce((acc, v) => acc + v.stockDisponible, 0);
            const agotado = stockTotal === 0;
            const primeraVariante = prod.variantes[0];
            const variantesConStock = prod.variantes.filter((v) => v.stockDisponible > 0);
            return (
              <button
                key={prod.productoId}
                type="button"
                onClick={() => handleAddProducto(prod)}
                disabled={agotado}
                className="min-h-[105px] p-2.5 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 active:scale-[0.98] transition-all text-left flex flex-col justify-between shadow-sm group hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-start justify-between gap-1 w-full">
                  <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    {prod.categoriaNombre}
                  </span>
                  {prod.esCosmeticoUsoPersonal && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 shrink-0">
                      Uso personal
                    </span>
                  )}
                </div>

                <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight">
                  {prod.nombre}
                </h4>

                <div className="flex items-baseline justify-between mt-1 pt-1 border-t border-slate-100 dark:border-slate-700/60 w-full">
                  <span className="text-xs font-bold font-mono text-emerald-700 dark:text-emerald-400">
                    {formatCOP(primeraVariante?.precioUnitarioCop || 0)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {agotado
                      ? 'Agotado'
                      : variantesConStock.length > 1
                        ? `${variantesConStock.length} var.`
                        : `Stock: ${stockTotal}`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* COLUMNA DERECHA (40%) */}
      <section
        className="w-full md:w-[40%] h-full flex flex-col justify-between p-3.5 bg-white dark:bg-slate-950 overflow-hidden"
        aria-label="Carrito de compra y cobro de mostrador"
      >
        <div className="pb-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Cliente Mostrador
              </span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {clienteNombre}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMostrarModalCliente(true)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cambiar
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2 space-y-2">
          {cartLines.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center mb-3">
                <ShoppingBag className="w-8 h-8 opacity-40" />
              </div>
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                Carrito de venta vacío
              </h4>
              <p className="text-xs text-slate-500 max-w-xs">
                Escanee un código de barras o pulse un producto del catálogo táctil para iniciar la
                venta.
              </p>
            </div>
          ) : (
            cartLines.map((line) => (
              <div
                key={line.varianteId}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2"
              >
                <div className="flex-1 min-w-0">
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {line.nombre}
                  </h5>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                      {formatCOP(line.precioUnitarioCOP)}
                    </span>
                    <span>
                      · {line.talla} / {line.color}
                    </span>
                    {line.esCosmetico && (
                      <span className="text-[9px] text-purple-600 font-semibold">
                        [Sin cambio]
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800">
                    <button
                      type="button"
                      onClick={() => handleUpdateCantidad(line.varianteId, -1)}
                      className="min-w-[32px] min-h-[32px] flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                      aria-label="Restar una unidad"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-2 text-xs font-bold font-mono text-slate-900 dark:text-white">
                      {line.cantidad}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUpdateCantidad(line.varianteId, 1)}
                      disabled={line.cantidad >= line.stockDisponible}
                      className="min-w-[32px] min-h-[32px] flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-30"
                      aria-label="Sumar una unidad"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span className="text-xs font-bold font-mono min-w-[75px] text-right text-slate-900 dark:text-white">
                    {formatCOP(line.precioUnitarioCOP * line.cantidad)}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleRemoveLine(line.varianteId)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    aria-label={`Eliminar ${line.nombre}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-3 border-t-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shrink-0">
          <div className="space-y-1 text-xs mb-3">
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Subtotal:</span>
              <span className="font-mono font-medium">{formatCOP(baseGravableCOP)}</span>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Descuento aplicado:</span>
              <span className="font-mono font-medium text-emerald-600">-$0</span>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>IVA (19% discriminado):</span>
              <span className="font-mono font-medium">{formatCOP(ivaEstimadoCOP)}</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-between mb-3 shadow-md">
            <div>
              <span className="block text-[11px] font-bold uppercase tracking-widest text-slate-400">
                TOTAL A PAGAR
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold">
                IVA 19% Incluido · COP Entero
              </span>
            </div>
            <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-emerald-400">
              {formatCOP(totalPagarCOP)}
            </span>
          </div>

          <button
            type="button"
            disabled={cartLines.length === 0 || isSubmitting}
            onClick={abrirModalCobro}
            className={`w-full min-h-[52px] py-3 px-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.99] ${
              cartLines.length === 0 || isSubmitting
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-emerald-600/30 ring-2 ring-emerald-500/20'
            }`}
          >
            <span>🟢 COBRAR (F12)</span>
          </button>
        </div>
      </section>

      {/* ============================================
          SELECTOR DE VARIANTE (Talla / Color)
      ============================================ */}
      {productoSeleccionando && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="variante-selector-title"
        >
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3
                  id="variante-selector-title"
                  className="text-lg font-black text-slate-900 dark:text-white"
                >
                  {productoSeleccionando.nombre}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Selecciona talla y color disponibles
                </p>
              </div>
              <button
                type="button"
                onClick={() => setProductoSeleccionando(null)}
                aria-label="Cerrar selector de variante"
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto">
              {productoSeleccionando.variantes
                .filter((v) => v.stockDisponible > 0)
                .map((variante) => (
                  <button
                    key={variante.varianteId}
                    type="button"
                    onClick={() => handleSeleccionarVariante(variante)}
                    className="min-h-[60px] p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500 active:scale-[0.98] transition-all text-left"
                  >
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {variante.talla} · {variante.color}
                    </div>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-xs font-mono text-emerald-700 dark:text-emerald-400">
                        {formatCOP(variante.precioUnitarioCop)}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        Stock: {variante.stockDisponible}
                      </span>
                    </div>
                    <div className="text-[9px] font-mono text-slate-400 mt-0.5">
                      {variante.sku}
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================
          MODAL DE COBRO RÁPIDO (componente separado)
      ============================================ */}
      <CobroRapidoModal
        isOpen={mostrarModalCobro}
        onClose={() => setMostrarModalCobro(false)}
        totalPagarCOP={totalPagarCOP}
        metodoPago={metodoPago}
        setMetodoPago={setMetodoPago}
        efectivoRecibido={efectivoRecibido}
        setEfectivoRecibido={setEfectivoRecibido}
        comprobanteBancario={comprobanteBancario}
        setComprobanteBancario={setComprobanteBancario}
        cambioVueltoCOP={cambioVueltoCOP}
        isSubmitting={isSubmitting}
        errorVenta={errorVenta}
        onConfirmar={handleConfirmarVenta}
        formatCOP={formatCOP}
      />

      {/* ============================================
          MODAL DE ÉXITO CON TICKET VISIBLE
      ============================================ */}
      {mostrarModalExito && ticketGenerado && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-4 max-h-[90vh]">
            {/* Columna izquierda: Confirmación */}
            <div className="flex-1 flex flex-col justify-between">
              <div className="text-center md:text-left">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto md:mx-0 mb-4">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">
                  ¡Venta {ticketGenerado.consecutivo} Completada!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  Inventario descargado del Kardex en tiempo real. Consecutivo fiscal emitido.
                </p>

                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 mb-4 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Total:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {formatCOP(ticketGenerado.totalNetoCop)}
                    </span>
                  </div>
                  {ticketGenerado.descuentoTotalCop > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Descuento:</span>
                      <span className="font-mono font-bold">
                        -{formatCOP(ticketGenerado.descuentoTotalCop)}
                      </span>
                    </div>
                  )}
                  {ticketGenerado.metodoPago === 'EFECTIVO' &&
                    ticketGenerado.cambioCop !== undefined && (
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>Cambio:</span>
                        <span className="font-mono font-bold">
                          {formatCOP(ticketGenerado.cambioCop)}
                        </span>
                      </div>
                    )}
                </div>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center gap-2 shadow-sm hover:opacity-90"
                >
                  <Printer className="w-4 h-4" />
                  <span>🖨️ Imprimir Ticket 80mm</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    alert(
                      `Enviando recibo digital a bot de Telegram para venta ${ticketGenerado.consecutivo}`
                    )
                  }
                  className="w-full min-h-[44px] py-2.5 px-4 rounded-xl border-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center gap-2 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                >
                  <Send className="w-4 h-4" />
                  <span>📲 Enviar por Telegram</span>
                </button>

                <button
                  type="button"
                  onClick={handleNuevaVenta}
                  className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-md hover:bg-emerald-500"
                >
                  ➕ Nueva Venta
                </button>
              </div>
            </div>

            {/* Columna derecha: Ticket visible (RN-VTA-10, 80mm) */}
            <div className="md:w-[320px] flex-shrink-0 overflow-y-auto border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 pt-4 md:pt-0 md:pl-4 max-h-[70vh] print:hidden">
              <TicketVentaPOS ticket={ticketGenerado} />
            </div>
          </div>
        </div>
      )}

      {/* MODAL CAMBIO DE CLIENTE */}
      {mostrarModalCliente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-xl border border-slate-200 dark:border-slate-800">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
              Asignar Cliente a la Venta
            </h4>
            <input
              type="text"
              value={inputCedula}
              onChange={(e) => setInputCedula(e.target.value)}
              placeholder="Cédula o Nombre completo..."
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setMostrarModalCliente(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (inputCedula.trim()) setClienteNombre(inputCedula.trim());
                  setMostrarModalCliente(false);
                }}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PosTerminalPage;