import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ScanBarcode,
  Search,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Banknote,
  Printer,
  Send,
  CheckCircle2,
  User,
  X,
  ShoppingBag,
} from 'lucide-react';
import { PRODUCTOS_CATALOGO } from '../storefront/catalogData.js';
import { Producto, CategoriaSlug } from '../storefront/types.js';

interface PosCartLine {
  id: string; // varianteId
  productoId: string;
  nombre: string;
  sku: string;
  talla?: string;
  color?: string;
  precioUnitarioCOP: number;
  cantidad: number;
  categoria: CategoriaSlug;
}

type MetodoPago = 'EFECTIVO' | 'TRANSFERENCIA';

export const PosTerminalPage: React.FC = () => {
  // Filtros de Catálogo
  const [busqueda, setBusqueda] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState<CategoriaSlug | 'todas'>('todas');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Carrito de Venta POS
  const [cartLines, setCartLines] = useState<PosCartLine[]>([
    {
      id: 'var-dnm-m',
      productoId: 'prod-001',
      nombre: 'Chaqueta Denim Artesanal',
      sku: 'ROP-DNM-001-M',
      talla: 'M',
      color: 'Azul Índigo',
      precioUnitarioCOP: 189000,
      cantidad: 1,
      categoria: 'ropa',
    },
    {
      id: 'var-crm-100',
      productoId: 'prod-004',
      nombre: 'Crema Hidratante Botánica 100ml',
      sku: 'COS-CRM-004-100ML',
      talla: '100ml',
      precioUnitarioCOP: 45000,
      cantidad: 1,
      categoria: 'cosmeticos',
    },
  ]);

  // Cliente actual
  const [clienteNombre, setClienteNombre] = useState('Consumidor Final');
  const [mostrarModalCliente, setMostrarModalCliente] = useState(false);
  const [inputCedula, setInputCedula] = useState('');

  // Estados de Modales (Frames 3 y 4 de Julio)
  const [mostrarModalCobro, setMostrarModalCobro] = useState(false);
  const [mostrarModalExito, setMostrarModalExito] = useState(false);
  const [consecutivoVenta, setConsecutivoVenta] = useState('MED-000042');

  // Estado del Modal de Cobro
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('EFECTIVO');
  const [efectivoRecibido, setEfectivoRecibido] = useState<number>(0);
  const [comprobanteBancario, setComprobanteBancario] = useState('');

  // Atajos de Teclado Globales POS (F12 Cobrar, F2 Buscar, Esc Cerrar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F12') {
        e.preventDefault();
        if (cartLines.length > 0) {
          abrirModalCobro();
        }
      } else if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        setMostrarModalCobro(false);
        setMostrarModalCliente(false);
        setMostrarModalExito(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cartLines]);

  // Filtrado de productos en catálogo POS
  const productosFiltrados = useMemo(() => {
    return PRODUCTOS_CATALOGO.filter((prod) => {
      if (categoriaActiva !== 'todas' && prod.categoria !== categoriaActiva) {
        return false;
      }
      if (busqueda.trim() !== '') {
        const q = busqueda.toLowerCase().trim();
        const matchNombre = prod.nombre.toLowerCase().includes(q);
        const matchSku = prod.variantes.some((v) => v.sku.toLowerCase().includes(q));
        if (!matchNombre && !matchSku) return false;
      }
      return true;
    });
  }, [categoriaActiva, busqueda]);

  // Totales Financieros en COP Enteros (Invariante RN-GEN-04: Cero centavos)
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

  // Acciones de Carrito
  const handleAddProducto = (producto: Producto) => {
    const variante = producto.variantes[0];
    setCartLines((prev) => {
      const idx = prev.findIndex((l) => l.id === variante.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx].cantidad += 1;
        return copy;
      }
      return [
        ...prev,
        {
          id: variante.id,
          productoId: producto.id,
          nombre: producto.nombre,
          sku: variante.sku,
          talla: variante.talla,
          color: variante.color,
          precioUnitarioCOP: producto.precioCOP,
          cantidad: 1,
          categoria: producto.categoria,
        },
      ];
    });
  };

  const handleUpdateCantidad = (id: string, delta: number) => {
    setCartLines((prev) =>
      prev
        .map((l) => {
          if (l.id === id) {
            const nueva = l.cantidad + delta;
            return nueva > 0 ? { ...l, cantidad: nueva } : null;
          }
          return l;
        })
        .filter((l): l is PosCartLine => l !== null)
    );
  };

  const handleRemoveLine = (id: string) => {
    setCartLines((prev) => prev.filter((l) => l.id !== id));
  };

  const abrirModalCobro = () => {
    setEfectivoRecibido(totalPagarCOP); // Sugerir pago exacto
    setMostrarModalCobro(true);
  };

  const handleBilletesRapidos = (monto: number) => {
    setEfectivoRecibido((prev) => prev + monto);
  };

  const handleTecladoNumerico = (char: string) => {
    if (char === 'CLEAR') {
      setEfectivoRecibido(0);
      return;
    }
    const actualStr = efectivoRecibido === 0 ? '' : efectivoRecibido.toString();
    const nuevoStr = actualStr + char;
    setEfectivoRecibido(parseInt(nuevoStr, 10) || 0);
  };

  const handleConfirmarVenta = () => {
    // Generar consecutivo de venta simulado
    const nextNum = Math.floor(1000 + Math.random() * 9000);
    setConsecutivoVenta(`MED-00${nextNum}`);
    setMostrarModalCobro(false);
    setMostrarModalExito(true);
  };

  const handleNuevaVenta = () => {
    setCartLines([]);
    setClienteNombre('Consumidor Final');
    setEfectivoRecibido(0);
    setComprobanteBancario('');
    setMostrarModalExito(false);
  };

  return (
    <div className="h-full w-full flex flex-col md:flex-row overflow-hidden bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-800 shadow-sm select-none">
      {/* =========================================================================
          COLUMNA IZQUIERDA (60% ANCHO): CATÁLOGO TÁCTIL Y BÚSQUEDA RÁPIDA
      ========================================================================= */}
      <section
        className="w-full md:w-[60%] h-full flex flex-col border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 p-3 overflow-hidden bg-slate-50/50 dark:bg-slate-900/50"
        aria-label="Catálogo táctil de productos para venta"
      >
        {/* Barra Superior: Buscador Táctil con Icono de Escáner y Atajo F2 */}
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
            onClick={() => {
              searchInputRef.current?.focus();
              alert("Simulador: Escáner de código de barras USB listo para lectura.");
            }}
            className="px-3.5 py-3 rounded-xl bg-slate-800 text-white hover:bg-slate-700 active:scale-95 transition-all flex items-center justify-center shrink-0 shadow-sm"
            aria-label="Activar lector de código de barras"
            title="Activar Escáner"
          >
            <ScanBarcode className="w-5 h-5" />
          </button>
        </div>

        {/* Píldoras de Categorías (Botones Táctiles >= 48px de contacto ergonómico) */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-2 shrink-0 scrollbar-none" role="tablist">
          {[
            { slug: 'todas', label: 'Todas' },
            { slug: 'ropa', label: 'Ropa' },
            { slug: 'accesorios', label: 'Accesorios' },
            { slug: 'cosmeticos', label: 'Cosméticos' },
            { slug: 'artesanias', label: 'Artesanías' },
          ].map((cat) => (
            <button
              key={cat.slug}
              type="button"
              role="tab"
              aria-selected={categoriaActiva === cat.slug}
              onClick={() => setCategoriaActiva(cat.slug as CategoriaSlug | 'todas')}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                categoriaActiva === cat.slug
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Cuadrícula de Productos Frecuentes (Botones táctiles grandes) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-0.5">
          {productosFiltrados.map((prod) => (
            <button
              key={prod.id}
              type="button"
              onClick={() => handleAddProducto(prod)}
              className="min-h-[105px] p-2.5 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 active:scale-[0.98] transition-all text-left flex flex-col justify-between shadow-sm group hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-1 w-full">
                <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  {prod.categoriaLabel}
                </span>
                {prod.categoria === 'cosmeticos' && (
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
                  {formatCOP(prod.precioCOP)}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {prod.variantes[0]?.sku.slice(0, 11)}
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* =========================================================================
          COLUMNA DERECHA (40% ANCHO): CARRITO DE COBRO Y TOTALES (CA-53)
      ========================================================================= */}
      <section
        className="w-full md:w-[40%] h-full flex flex-col justify-between p-3.5 bg-white dark:bg-slate-950 overflow-hidden"
        aria-label="Carrito de compra y cobro de mostrador"
      >
        {/* Encabezado: Selector de Cliente y Estado */}
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

        {/* Lista de Ítems (Frames 1 vs 2) */}
        <div className="flex-1 overflow-y-auto py-2 space-y-2">
          {cartLines.length === 0 ? (
            /* FRAME 1: Carrito Vacío */
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center mb-3">
                <ShoppingBag className="w-8 h-8 opacity-40" />
              </div>
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                Carrito de venta vacío
              </h4>
              <p className="text-xs text-slate-500 max-w-xs">
                Escanee un código de barras o pulse un producto del catálogo táctil para iniciar la venta.
              </p>
            </div>
          ) : (
            /* FRAME 2: Venta en Curso */
            cartLines.map((line) => (
              <div
                key={line.id}
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
                    {line.talla && <span>· Talla: {line.talla}</span>}
                    {line.categoria === 'cosmeticos' && (
                      <span className="text-[9px] text-purple-600 font-semibold">
                        [Sin cambio]
                      </span>
                    )}
                  </div>
                </div>

                {/* Controles Táctiles de Cantidad (Mínimo 48px) */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800">
                    <button
                      type="button"
                      onClick={() => handleUpdateCantidad(line.id, -1)}
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
                      onClick={() => handleUpdateCantidad(line.id, 1)}
                      className="min-w-[32px] min-h-[32px] flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
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
                    onClick={() => handleRemoveLine(line.id)}
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

        {/* Panel de Totales y Botón de Cobro F12 */}
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

          {/* Caja Destacada: TOTAL A PAGAR (32px font negrita) */}
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

          {/* Botón Principal de Cobro de Alta Visibilidad (Ergonomía Mostrador) */}
          <button
            type="button"
            disabled={cartLines.length === 0}
            onClick={abrirModalCobro}
            className={`w-full min-h-[52px] py-3 px-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.99] ${
              cartLines.length === 0
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-emerald-600/30 ring-2 ring-emerald-500/20'
            }`}
          >
            <span>🟢 COBRAR (F12)</span>
          </button>
        </div>
      </section>

      {/* =========================================================================
          FRAME 3: MODAL DE COBRO RÁPIDO POS
      ========================================================================= */}
      {mostrarModalCobro && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cobro-modal-title"
        >
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            {/* Header del Modal */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 id="cobro-modal-title" className="text-lg font-black text-slate-900 dark:text-white">
                  Cobro de Venta Mostrador
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Total a liquidar: <strong className="font-mono text-emerald-600 text-sm">{formatCOP(totalPagarCOP)}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMostrarModalCobro(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Cerrar modal de cobro"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pestañas de Medio de Pago */}
            <div className="grid grid-cols-2 gap-3 my-4">
              <button
                type="button"
                onClick={() => setMetodoPago('EFECTIVO')}
                className={`min-h-[48px] py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border-2 transition-all ${
                  metodoPago === 'EFECTIVO'
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Banknote className="w-5 h-5" />
                <span>💵 EFECTIVO</span>
              </button>

              <button
                type="button"
                onClick={() => setMetodoPago('TRANSFERENCIA')}
                className={`min-h-[48px] py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border-2 transition-all ${
                  metodoPago === 'TRANSFERENCIA'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span>💳 TRANSFERENCIA</span>
              </button>
            </div>

            {/* Contenido según método de pago */}
            {metodoPago === 'EFECTIVO' ? (
              <div className="space-y-4">
                {/* Billetes Rápidos Colombianos */}
                <div>
                  <span className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Billetes Rápidos Sugeridos:
                  </span>
                  <div className="grid grid-cols-5 gap-2">
                    {[100000, 50000, 20000, 10000].map((monto) => (
                      <button
                        key={monto}
                        type="button"
                        onClick={() => handleBilletesRapidos(monto)}
                        className="min-h-[44px] py-2 px-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        +${monto / 1000}k
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setEfectivoRecibido(totalPagarCOP)}
                      className="min-h-[44px] py-2 px-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 font-bold text-xs text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200"
                    >
                      Exacto
                    </button>
                  </div>
                </div>

                {/* Input de Efectivo Recibido y Teclado Táctil 3x4 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Monto Recibido en Mano:
                    </label>
                    <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 text-right">
                      <span className="font-mono text-2xl font-black text-slate-900 dark:text-white">
                        {formatCOP(efectivoRecibido)}
                      </span>
                    </div>

                    {/* Caja Destacada de Cambio / Vuelto a Entregar */}
                    <div className="mt-3 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-500/40 text-center">
                      <span className="block text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                        CAMBIO / VUELTO A ENTREGAR
                      </span>
                      <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                        {formatCOP(cambioVueltoCOP)}
                      </span>
                    </div>
                  </div>

                  {/* Teclado Numérico en Pantalla */}
                  <div className="grid grid-cols-3 gap-1.5 p-2 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CLEAR', '0', '00'].map(
                      (k) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => handleTecladoNumerico(k)}
                          className={`min-h-[44px] rounded-xl font-bold font-mono text-sm transition-all flex items-center justify-center ${
                            k === 'CLEAR'
                              ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-xs'
                              : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm hover:bg-slate-50'
                          }`}
                        >
                          {k}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Método Transferencia */
              <div className="space-y-4 py-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Número de Aprobación / Comprobante Bancario (Nequi, Daviplata o Bancolombia):
                  </label>
                  <input
                    type="text"
                    value={comprobanteBancario}
                    onChange={(e) => setComprobanteBancario(e.target.value)}
                    placeholder="Ej. NQ-84920492 o TRX-4920"
                    className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 font-mono text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs">
                  Verifique en la app bancaria la acreditación en la cuenta oficial antes de confirmar.
                </div>
              </div>
            )}

            {/* Botón de Confirmación */}
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setMostrarModalCobro(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold text-xs text-slate-600 dark:text-slate-300"
              >
                Cancelar (Esc)
              </button>
              <button
                type="button"
                disabled={metodoPago === 'EFECTIVO' && efectivoRecibido < totalPagarCOP}
                onClick={handleConfirmarVenta}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50"
              >
                CONFIRMAR VENTA E IMPRIMIR (Enter)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          FRAME 4: MODAL DE VENTA EXITOSA
      ========================================================================= */}
      {mostrarModalExito && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">
              ¡Venta #{consecutivoVenta} Completada con Éxito!
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Inventario descargado del Kardex en tiempo real. Consecutivo fiscal emitido para Sede Medellín.
            </p>

            <div className="space-y-3 mb-6">
              <button
                type="button"
                onClick={() => alert(`Imprimiendo comprobante térmico 80 mm para venta #${consecutivoVenta}`)}
                className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center gap-2 shadow-sm hover:opacity-90"
              >
                <Printer className="w-4 h-4" />
                <span>🖨️ Imprimir Ticket 80mm</span>
              </button>

              <button
                type="button"
                onClick={() => alert(`Enviando recibo digital a bot de Telegram para venta #${consecutivoVenta}`)}
                className="w-full min-h-[48px] py-3 px-4 rounded-xl border-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center gap-2 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
              >
                <Send className="w-4 h-4" />
                <span>📲 Enviar Recibo por Telegram</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleNuevaVenta}
              className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-md hover:bg-emerald-500"
            >
              ➕ Nueva Venta
            </button>
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
