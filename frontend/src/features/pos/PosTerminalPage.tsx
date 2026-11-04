import React from 'react';

export const PosTerminalPage: React.FC = () => {
  return (
    <div className="h-full flex flex-col justify-center items-center">
      <h2 className="text-xl font-bold">Terminal Punto de Venta</h2>
      <p className="text-xs text-slate-500">Búsqueda rápida por nombre/SKU, apertura y cobro de caja.</p>
    </div>
  );
};

export default PosTerminalPage;
