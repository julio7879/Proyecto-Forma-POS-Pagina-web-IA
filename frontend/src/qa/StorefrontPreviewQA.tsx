/**
 * Vista previa SOLO PARA QA (Issue #32 / PR #29).
 * BentoGridHero y CartDrawer no están montados en ninguna ruta de la app,
 * así que esta página permite verlos en el navegador:
 *   npm run dev --prefix frontend  →  http://localhost:5173/qa-storefront.html
 */
import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import '../index.css';
import { BentoGridHero } from '../features/storefront/components/BentoGridHero';
import { CartDrawer } from '../features/storefront/components/CartDrawer';
import { CartItem, CategoriaSlug, SedeInfo } from '../features/storefront/types';

const sede: SedeInfo = {
  id: 'MEDELLIN',
  nombre: 'Sede Principal Medellín',
  ciudad: 'Medellín',
  esCentral: false,
  tiempoEntregaDias: '1-2 días hábiles',
};

const itemsIniciales: CartItem[] = [
  {
    id: 'var-001',
    productoId: 'prod-001',
    nombre: 'Chaqueta Denim Artesanal',
    sku: 'ROP-DNM-001-M',
    talla: 'M',
    color: 'Índigo',
    precioUnitarioCOP: 189000,
    cantidad: 1,
    imagenUrl:
      'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=300&q=60',
    sedeDespacho: 'MEDELLIN',
  },
  {
    id: 'var-002',
    productoId: 'prod-002',
    nombre: 'Mochila Wayuu Tejida a Mano',
    sku: 'ART-WAY-002',
    color: 'Multicolor',
    precioUnitarioCOP: 145000,
    cantidad: 2,
    imagenUrl:
      'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=300&q=60',
    sedeDespacho: 'MEDELLIN',
  },
];

const PreviewQA: React.FC = () => {
  const [categoria, setCategoria] = useState<CategoriaSlug | 'todas'>('todas');
  const [abierto, setAbierto] = useState(false);
  const [items, setItems] = useState<CartItem[]>(itemsIniciales);
  const [log, setLog] = useState<string[]>([]);

  const registrar = (msg: string) => setLog((l) => [msg, ...l].slice(0, 6));

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="flex flex-wrap items-center gap-2 p-3 mb-4 bg-amber-50 border border-amber-200 rounded-lg text-xs">
        <strong className="mr-2">QA SP1-08</strong>
        <button type="button" className="px-3 py-1 rounded border bg-white" onClick={() => setAbierto(true)}>
          Abrir carrito
        </button>
        <button type="button" className="px-3 py-1 rounded border bg-white" onClick={() => setItems([])}>
          Vaciar carrito
        </button>
        <button type="button" className="px-3 py-1 rounded border bg-white" onClick={() => setItems(itemsIniciales)}>
          Restaurar ítems
        </button>
        <span className="ml-auto text-slate-600">Categoría activa: <b>{categoria}</b></span>
      </div>

      <BentoGridHero
        sedeActiva={sede}
        categoriaActiva={categoria}
        onSeleccionarCategoria={(c) => {
          setCategoria(c);
          registrar(`onSeleccionarCategoria(${c})`);
        }}
        onExplorarProducto={(id) => registrar(`onExplorarProducto(${id})`)}
      />

      <pre className="text-[11px] bg-slate-900 text-slate-100 p-3 rounded">
        {log.length ? log.join('\n') : 'Eventos: (ninguno todavía)'}
      </pre>

      <CartDrawer
        isOpen={abierto}
        onClose={() => {
          setAbierto(false);
          registrar('onClose()');
        }}
        items={items}
        onUpdateCantidad={(id, delta) =>
          setItems((prev) =>
            prev
              .map((it) => (it.id === id ? { ...it, cantidad: it.cantidad + delta } : it))
              .filter((it) => it.cantidad > 0)
          )
        }
        onRemoveItem={(id) => setItems((prev) => prev.filter((it) => it.id !== id))}
        onCheckout={() => registrar('onCheckout()')}
      />
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PreviewQA />
  </React.StrictMode>
);
