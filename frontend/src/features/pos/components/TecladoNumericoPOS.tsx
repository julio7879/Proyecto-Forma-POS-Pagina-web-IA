import React from 'react';
import { Delete } from 'lucide-react';
import { TecladoNumericoPOSProps } from '../types/cobro.types';

export const TecladoNumericoPOS: React.FC<TecladoNumericoPOSProps> = ({
  valorActual,
  onValorChange,
  onTecla,
  disabled = false,
}) => {
  const handleKeyClick = (tecla: string) => {
    if (disabled) return;
    onTecla?.(tecla);

    if (tecla === 'C') {
      onValorChange(0);
      return;
    }

    if (tecla === '⌫') {
      const nuevo = Math.floor(valorActual / 10);
      onValorChange(nuevo);
      return;
    }

    if (tecla === '00') {
      if (valorActual === 0) return;
      const nuevo = valorActual * 100;
      if (nuevo <= 999_999_999) {
        onValorChange(nuevo);
      }
      return;
    }

    // Dígitos 0-9
    const digito = Number(tecla);
    if (!isNaN(digito)) {
      if (valorActual === 0) {
        onValorChange(digito);
      } else {
        const nuevo = valorActual * 10 + digito;
        if (nuevo <= 999_999_999) {
          onValorChange(nuevo);
        }
      }
    }
  };

  const TECLAS = [
    { tecla: '1', label: '1', className: 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white' },
    { tecla: '2', label: '2', className: 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white' },
    { tecla: '3', label: '3', className: 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white' },
    { tecla: '4', label: '4', className: 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white' },
    { tecla: '5', label: '5', className: 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white' },
    { tecla: '6', label: '6', className: 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white' },
    { tecla: '7', label: '7', className: 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white' },
    { tecla: '8', label: '8', className: 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white' },
    { tecla: '9', label: '9', className: 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white' },
    { tecla: 'C', label: 'C', className: 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 font-bold' },
    { tecla: '0', label: '0', className: 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white' },
    { tecla: '00', label: '00', className: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold' },
  ];

  return (
    <div className="space-y-2 p-2 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 select-none">
      <div className="grid grid-cols-3 gap-2">
        {TECLAS.map(({ tecla, label, className }) => (
          <button
            key={tecla}
            type="button"
            disabled={disabled}
            onClick={() => handleKeyClick(tecla)}
            className={`min-h-[50px] rounded-xl font-mono text-lg font-bold shadow-sm active:scale-95 transition-all flex items-center justify-center hover:brightness-95 disabled:opacity-50 disabled:pointer-events-none ${className}`}
            aria-label={tecla === 'C' ? 'Limpiar monto' : `Dígito ${tecla}`}
          >
            {label}
          </button>
        ))}
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={() => handleKeyClick('⌫')}
        className="w-full min-h-[46px] rounded-xl font-bold text-sm bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 shadow-sm active:scale-98 transition-all flex items-center justify-center gap-2 hover:bg-amber-200 dark:hover:bg-amber-900/80 disabled:opacity-50 disabled:pointer-events-none"
        aria-label="Retroceso"
      >
        <Delete className="w-4 h-4" />
        <span>⌫ Retroceso</span>
      </button>
    </div>
  );
};