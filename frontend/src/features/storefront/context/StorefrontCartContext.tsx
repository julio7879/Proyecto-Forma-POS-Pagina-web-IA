import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { CartItem, SedeInfo } from '../types';

export const SEDES_OFICIALES: SedeInfo[] = [
  {
    id: 'CUCUTA_CENTRAL',
    nombre: 'Sede Principal (Cúcuta · Centro & Caobos)',
    ciudad: 'Cúcuta',
    esCentral: true,
    tiempoEntregaDias: 'Entrega mismo día (24h)',
  },
  {
    id: 'MEDELLIN',
    nombre: 'Hub Bucaramanga & Oriente',
    ciudad: 'Bucaramanga',
    esCentral: false,
    tiempoEntregaDias: '1-2 días hábiles DANE',
  },
  {
    id: 'BOGOTA',
    nombre: 'Punto Ocaña & Despacho Nacional',
    ciudad: 'Ocaña',
    esCentral: false,
    tiempoEntregaDias: '24-48 horas DANE',
  },
];

export const SEDES_DISPONIBLES = SEDES_OFICIALES;

interface StorefrontCartContextType {
  items: CartItem[];
  isCartOpen: boolean;
  totalItems: number;
  totalCOP: number;
  sedeActiva: SedeInfo;
  openCart: () => void;
  closeCart: () => void;
  setSedeActiva: (sede: SedeInfo) => void;
  addItem: (item: Omit<CartItem, 'sedeDespacho'> & { sedeDespacho?: CartItem['sedeDespacho'] }) => void;
  updateCantidad: (id: string, delta: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
}

export const getCartStorageKey = (): string => {
  try {
    const rawUser = localStorage.getItem('usuario');
    if (rawUser) {
      const u = JSON.parse(rawUser);
      const email = u?.correo || u?.email;
      if (email && typeof email === 'string') {
        return `forma_cart_${email.trim().toLowerCase()}`;
      }
    }
  } catch {
    // ignore storage errors
  }
  return 'forma_cart_guest';
};

export const loadCartItemsFromStorage = (key: string): CartItem[] => {
  try {
    const saved =
      localStorage.getItem(key) ||
      (key === 'forma_cart_guest' ? localStorage.getItem('forma_cart_items_v2') : null);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore storage errors
  }
  return [];
};

const StorefrontCartContext = createContext<StorefrontCartContextType | null>(null);

export const StorefrontCartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentKey, setCurrentKey] = useState<string>(getCartStorageKey);
  const [items, setItems] = useState<CartItem[]>(() => loadCartItemsFromStorage(getCartStorageKey()));

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [sedeActiva, setSedeActiva] = useState<SedeInfo>(SEDES_OFICIALES[0]);

  // Listener para sincronización de sesión y evento 'storage'
  useEffect(() => {
    const syncCartWithSession = () => {
      const activeKey = getCartStorageKey();
      if (activeKey !== currentKey) {
        setCurrentKey(activeKey);
        setItems(loadCartItemsFromStorage(activeKey));
      }
    };

    window.addEventListener('storage', syncCartWithSession);
    window.addEventListener('focus', syncCartWithSession);
    const interval = setInterval(syncCartWithSession, 800);

    return () => {
      window.removeEventListener('storage', syncCartWithSession);
      window.removeEventListener('focus', syncCartWithSession);
      clearInterval(interval);
    };
  }, [currentKey]);

  useEffect(() => {
    try {
      const activeKey = getCartStorageKey();
      localStorage.setItem(activeKey, JSON.stringify(items));
    } catch {
      // ignore storage errors
    }
  }, [items, currentKey]);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  const addItem = useCallback(
    (newItem: Omit<CartItem, 'sedeDespacho'> & { sedeDespacho?: CartItem['sedeDespacho'] }) => {
      setItems((prev) => {
        const existingIndex = prev.findIndex((it) => it.id === newItem.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          const actual = updated[existingIndex];
          const stockMax = newItem.stockDisponible ?? actual.stockDisponible ?? 999;
          const targetCantidad = actual.cantidad + newItem.cantidad;
          updated[existingIndex] = {
            ...actual,
            stockDisponible: stockMax,
            cantidad: Math.min(stockMax, targetCantidad),
          };
          return updated;
        }
        const stockMax = newItem.stockDisponible ?? 999;
        return [
          ...prev,
          {
            ...newItem,
            stockDisponible: stockMax,
            cantidad: Math.min(stockMax, newItem.cantidad),
            sedeDespacho: newItem.sedeDespacho || sedeActiva.id,
          },
        ];
      });
      setIsCartOpen(true);
    },
    [sedeActiva.id]
  );

  const updateCantidad = useCallback((id: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((it) => {
          if (it.id !== id) return it;
          const maxStock = it.stockDisponible ?? 999;
          const nuevaCantidad = Math.min(maxStock, Math.max(0, it.cantidad + delta));
          return { ...it, cantidad: nuevaCantidad };
        })
        .filter((it) => it.cantidad > 0)
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = useMemo(
    () => items.reduce((acc, it) => acc + it.cantidad, 0),
    [items]
  );

  const totalCOP = useMemo(
    () => items.reduce((acc, it) => acc + it.precioUnitarioCOP * it.cantidad, 0),
    [items]
  );

  return (
    <StorefrontCartContext.Provider
      value={{
        items,
        isCartOpen,
        totalItems,
        totalCOP,
        sedeActiva,
        openCart,
        closeCart,
        setSedeActiva,
        addItem,
        updateCantidad,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </StorefrontCartContext.Provider>
  );
};

export const useStorefrontCart = (): StorefrontCartContextType => {
  const ctx = useContext(StorefrontCartContext);
  if (!ctx) {
    // Fallback seguro para tests unitarios que renderizan componentes sin el Provider
    return {
      items: [],
      isCartOpen: false,
      totalItems: 0,
      totalCOP: 0,
      sedeActiva: SEDES_OFICIALES[0],
      openCart: () => {},
      closeCart: () => {},
      setSedeActiva: () => {},
      addItem: () => {},
      updateCantidad: () => {},
      removeItem: () => {},
      clearCart: () => {},
    };
  }
  return ctx;
};
