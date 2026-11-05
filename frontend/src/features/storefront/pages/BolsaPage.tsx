import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Lock,
  Sparkles,
  Truck,
} from 'lucide-react';
import { useStorefrontCart } from '../context/StorefrontCartContext';

export const BolsaPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, totalItems, totalCOP, updateCantidad, removeItem, clearCart } =
    useStorefrontCart();

  const formatCOP = (val: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);

  // Discriminación legal de IVA 19% (Estatuto Tributario / RN-GEN-04 dinero entero)
  const baseGravableCOP = Math.round(totalCOP / 1.19);
  const ivaEstimadoCOP = totalCOP - baseGravableCOP;

  return (
    <div className="min-h-[calc(100vh-14rem)] w-full py-4 sm:py-8 animate-in fade-in duration-300">
      {/* Encabezado Editorial */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#50322A]/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-bold text-[#D19650] mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Boutique Omnicanal · Despacho Nacional Directo</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black tracking-tight text-[#50322A]">
            Tu Bolsa de Compras
          </h1>
          <p className="text-sm sm:text-base text-[#50322A]/80 mt-1 font-medium">
            {totalItems > 0
              ? `${totalItems} ${totalItems === 1 ? 'prenda de autor seleccionada' : 'prendas de autor seleccionadas'} con Sello de Origen Certificado.`
              : 'Revisa y gestiona las prendas que deseas llevar.'}
          </p>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={clearCart}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#661521] hover:text-[#50322A] transition-colors py-1.5 px-3 rounded-full hover:bg-white/60 self-start sm:self-end"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Vaciar bolsa</span>
          </button>
        )}
      </div>

      {items.length === 0 ? (
        /* Estado Vacío Elegante */
        <div className="rounded-[2.5rem] bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_12px_40px_rgb(80,50,42,0.08)] p-8 sm:p-16 text-center max-w-2xl mx-auto my-12">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[#661521]/5 border border-[#D19650]/30 flex items-center justify-center text-[#661521] shadow-inner">
            <ShoppingBag className="w-12 h-12 text-[#661521]" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-black text-[#50322A] mb-3">
            Tu bolsa de compras está vacía
          </h2>
          <p className="text-sm sm:text-base text-[#50322A]/75 max-w-md mx-auto mb-8 leading-relaxed">
            Descubre nuestras colecciones de autor, sastrería artesanal, marroquinería y cosmética botánica con garantía de calidad y envíos a todo el territorio nacional.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-[#661521] hover:bg-[#50322A] text-white font-extrabold text-sm uppercase tracking-wider transition-all duration-300 shadow-xl shadow-[#661521]/20 active:scale-95 border border-[#D19650]/50"
          >
            <Sparkles className="w-4 h-4 text-[#D19650]" />
            <span>Explorar Colecciones</span>
          </Link>
        </div>
      ) : (
        /* Vista de 2 Columnas */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Columna Izquierda: Lista de Prendas */}
          <div className="lg:col-span-8 space-y-4">
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-3xl bg-white/85 backdrop-blur-2xl border border-white/90 shadow-[0_8px_30px_rgb(80,50,42,0.06)] p-4 sm:p-6 transition-all hover:shadow-[0_12px_36px_rgb(80,50,42,0.10)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  {/* Foto y Datos Principales */}
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <img
                      src={
                        item.imagenUrl ||
                        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=400&q=80'
                      }
                      alt={item.nombre}
                      className="w-24 h-32 rounded-2xl object-cover border border-[#50322A]/10 shadow-sm shrink-0 bg-[#E7DED2]/30"
                    />

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#E7DED2] text-[#50322A] text-[10px] font-bold tracking-wider uppercase border border-[#50322A]/15">
                          Sede: {item.sedeDespacho || 'Central'}
                        </span>
                      </div>

                      <h3 className="font-display font-black text-lg text-[#50322A] truncate">
                        {item.nombre}
                      </h3>

                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {item.talla && (
                          <span className="px-2 py-0.5 rounded-md bg-white border border-[#50322A]/20 font-bold text-[#50322A]">
                            Talla: {item.talla}
                          </span>
                        )}
                        {item.color && (
                          <span className="px-2 py-0.5 rounded-md bg-white border border-[#50322A]/20 font-bold text-[#50322A]">
                            Color: {item.color}
                          </span>
                        )}
                        <span className="font-mono-tabular text-[11px] text-[#50322A]/60">
                          SKU: {item.sku}
                        </span>
                      </div>

                      <p className="text-xs font-medium text-[#50322A]/70">
                        Precio unitario:{' '}
                        <span className="font-bold font-mono-tabular text-[#50322A]">
                          {formatCOP(item.precioUnitarioCOP)}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Acciones: Steppers, Subtotal y Eliminar */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-[#50322A]/10">
                    {/* Steppers Táctiles Ergonomía */}
                    <div className="flex items-center border border-[#50322A]/20 rounded-full overflow-hidden bg-white shadow-xs">
                      <button
                        type="button"
                        onClick={() => updateCantidad(item.id, -1)}
                        className="p-2 sm:p-2.5 hover:bg-[#E7DED2] text-[#50322A] transition-colors active:scale-95"
                        aria-label="Disminuir una unidad"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 sm:px-4 text-sm font-bold font-mono-tabular text-[#171717] select-none">
                        {item.cantidad}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCantidad(item.id, 1)}
                        className="p-2 sm:p-2.5 hover:bg-[#E7DED2] text-[#50322A] transition-colors active:scale-95"
                        aria-label="Aumentar una unidad"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Subtotal de Línea en COP Entero */}
                    <div className="text-right min-w-[100px]">
                      <span className="block text-base sm:text-lg font-black font-mono-tabular text-[#50322A]">
                        {formatCOP(item.precioUnitarioCOP * item.cantidad)}
                      </span>
                    </div>

                    {/* Botón Eliminar */}
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="p-2 rounded-full hover:bg-rose-50 text-[#50322A]/40 hover:text-rose-600 transition-colors"
                      title="Eliminar de la bolsa"
                      aria-label={`Eliminar ${item.nombre} de la bolsa`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Enlace para Seguir Explorando */}
            <div className="pt-4">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-sm font-bold text-[#50322A] hover:text-[#661521] transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-[#D19650]" />
                <span>Seguir Explorando el Catálogo</span>
              </Link>
            </div>
          </div>

          {/* Columna Derecha: Resumen Financiero Sticky */}
          <div className="lg:col-span-4 sticky top-28 space-y-4">
            <div className="rounded-[2rem] bg-white/90 backdrop-blur-2xl border border-white/95 shadow-[0_12px_40px_rgb(80,50,42,0.10)] p-6 sm:p-7 space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-[#50322A]/10">
                <h2 className="font-display font-black text-xl text-[#50322A]">
                  Resumen de Compra
                </h2>
                <span className="text-xs font-bold uppercase tracking-widest text-[#D19650]">
                  IVA Incluido
                </span>
              </div>

              {/* Desglose Financiero */}
              <div className="space-y-3 text-xs sm:text-sm">
                <div className="flex justify-between items-center text-[#50322A]/80">
                  <span>Subtotal prendas ({totalItems})</span>
                  <span className="font-mono-tabular font-bold text-[#50322A]">
                    {formatCOP(totalCOP)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-[#50322A]/70">
                  <span>Base gravable estimada (19%)</span>
                  <span className="font-mono-tabular font-medium text-[#50322A]">
                    {formatCOP(baseGravableCOP)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-[#50322A]/70">
                  <span>IVA discriminado (19%)</span>
                  <span className="font-mono-tabular font-medium text-[#50322A]">
                    {formatCOP(ivaEstimadoCOP)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-[#50322A]/70 pt-1 border-t border-[#50322A]/5">
                  <span className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-[#D19650]" />
                    <span>Flete nacional DANE</span>
                  </span>
                  <span className="font-medium text-[11px] text-[#50322A]/60">
                    Se liquida en Checkout
                  </span>
                </div>
              </div>

              {/* Total a Pagar en COP Entero */}
              <div className="pt-4 border-t border-[#50322A]/15 space-y-1">
                <div className="flex justify-between items-baseline">
                  <span className="text-base font-bold text-[#50322A]">
                    Total a Pagar
                  </span>
                  <span className="text-3xl font-black font-mono-tabular text-[#50322A]">
                    {formatCOP(totalCOP)}
                  </span>
                </div>
                <p className="text-[11px] text-[#50322A]/60 text-right">
                  Pesos colombianos (COP) · Sin centavos
                </p>
              </div>

              {/* Leyenda Legal Estatuto del Consumidor (Ley 1480 de 2011) */}
              <div className="p-3.5 rounded-2xl bg-[#661521]/5 border border-[#661521]/15 text-xs text-[#661521] flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-[#661521]" />
                <span className="leading-snug">
                  <strong>5 días hábiles de retracto</strong> legal conforme a la Ley 1480 de 2011 y Sello de Origen Certificado.
                </span>
              </div>

              {/* Botón Dominante Continuar al Pago */}
              <button
                type="button"
                onClick={() => navigate('/checkout')}
                className="w-full py-4 px-6 rounded-full bg-[#661521] hover:bg-[#50322A] text-white font-extrabold text-sm uppercase tracking-wider flex items-center justify-between transition-all duration-300 shadow-xl shadow-[#661521]/25 border-2 border-[#D19650] active:scale-98 group"
              >
                <span>CONTINUAR CON EL PAGO</span>
                <span className="w-8 h-8 rounded-full bg-[#D19650] text-white flex items-center justify-center group-hover:translate-x-1 transition-transform">
                  <ArrowRight className="w-4 h-4 text-[#50322A]" />
                </span>
              </button>

              {/* Garantías de Seguridad */}
              <div className="flex items-center justify-center gap-2 text-[11px] font-bold text-[#50322A]/60 pt-1">
                <Lock className="w-3.5 h-3.5 text-[#D19650]" />
                <span>Transacción Segura · Idempotencia Bancaria Garantizada</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BolsaPage;
