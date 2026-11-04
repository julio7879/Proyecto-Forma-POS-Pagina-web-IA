// frontend/src/features/admin/components/CompraModal.tsx
import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, X, Loader2 } from 'lucide-react';
import { createOrdenCompra, CrearOrdenCompraDto } from '../services/adminService';

const compraLineaSchema = z.object({
  varianteId: z.number().int().positive('Debe seleccionar una variante'),
  cantidadPedida: z.number().int().positive('La cantidad debe ser mayor a 0'),
  // FIX: usar z.number().optional() y manejar NaN en el submit
  costoUnitarioCop: z.number().int('El costo debe ser entero en COP').nonnegative().optional(),
});

const compraSchema = z.object({
  proveedorNombre: z.string().trim().min(2, 'El proveedor es requerido').max(200),
  proveedorContacto: z.string().trim().max(200).optional(),
  notas: z.string().trim().max(500).optional(),
  lineas: z.array(compraLineaSchema).min(1, 'Debe agregar al menos una línea'),
});

type CompraFormValues = z.infer<typeof compraSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CompraModal = ({ isOpen, onClose, onSuccess }: Props) => {
  const [isPending, setIsPending] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CompraFormValues>({
    resolver: zodResolver(compraSchema),
    defaultValues: {
      proveedorNombre: '',
      proveedorContacto: '',
      notas: '',
      lineas: [{ varianteId: 0, cantidadPedida: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lineas',
  });

  const onSubmit = async (data: CompraFormValues) => {
    setIsPending(true);
    setApiError(null);
    try {
      const payload: CrearOrdenCompraDto = {
        proveedorNombre: data.proveedorNombre,
        proveedorContacto: data.proveedorContacto || undefined,
        notas: data.notas || undefined,
        lineas: data.lineas.map((l) => ({
          varianteId: l.varianteId,
          cantidadPedida: l.cantidadPedida,
          // FIX: manejar NaN o undefined explícitamente
          costoUnitarioCop:
            typeof l.costoUnitarioCop === 'number' && !Number.isNaN(l.costoUnitarioCop)
              ? l.costoUnitarioCop
              : undefined,
        })),
      };
      const idempotencyKey = crypto.randomUUID();
      await createOrdenCompra(payload, idempotencyKey);
      reset();
      onSuccess?.();
      onClose();
    } catch (error: any) {
      setApiError(error.message);
    } finally {
      setIsPending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-compra-title"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-white/20 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Encabezado */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2
              id="modal-compra-title"
              className="text-xl font-black text-slate-900 dark:text-white font-display"
            >
              Nueva Orden de Compra
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Registra un pedido a proveedor. Ingresa exclusivamente a Bodega Central (RN-COM-01).
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form
          id="form-crear-compra"
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto p-6 space-y-4"
        >
          {apiError && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-xs text-red-800 dark:text-red-200">
              {apiError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="proveedor"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Proveedor *
              </label>
              <input
                id="proveedor"
                {...register('proveedorNombre')}
                disabled={isPending}
                placeholder="Ej. Distribuidora Textil S.A.S"
                className="w-full p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-xs disabled:opacity-50"
              />
              {errors.proveedorNombre && (
                <span className="text-xs text-red-500 mt-1 block">
                  {errors.proveedorNombre.message}
                </span>
              )}
            </div>

            <div>
              <label
                htmlFor="contacto"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Contacto del proveedor
              </label>
              <input
                id="contacto"
                {...register('proveedorContacto')}
                disabled={isPending}
                placeholder="Ej. ventas@proveedor.com"
                className="w-full p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-xs disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="notas"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Notas (opcional)
            </label>
            <textarea
              id="notas"
              {...register('notas')}
              disabled={isPending}
              rows={2}
              placeholder="Observaciones de la compra..."
              className="w-full p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-xs disabled:opacity-50 resize-none"
            />
          </div>

          {/* Líneas dinámicas */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Líneas de Compra
              </h3>
              <button
                type="button"
                onClick={() => append({ varianteId: 0, cantidadPedida: 1 })}
                disabled={isPending}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar Línea
              </button>
            </div>

            <div className="space-y-2">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid grid-cols-12 gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60"
                >
                  <div className="col-span-3">
                    <input
                      type="number"
                      {...register(`lineas.${index}.varianteId`, { valueAsNumber: true })}
                      disabled={isPending}
                      placeholder="ID Variante"
                      className="w-full p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-xs disabled:opacity-50"
                    />
                    {errors.lineas?.[index]?.varianteId && (
                      <span className="text-[10px] text-red-500 mt-0.5 block">
                        {errors.lineas[index]?.varianteId?.message}
                      </span>
                    )}
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      {...register(`lineas.${index}.cantidadPedida`, { valueAsNumber: true })}
                      disabled={isPending}
                      placeholder="Cantidad"
                      min="1"
                      className="w-full p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-xs disabled:opacity-50"
                    />
                    {errors.lineas?.[index]?.cantidadPedida && (
                      <span className="text-[10px] text-red-500 mt-0.5 block">
                        {errors.lineas[index]?.cantidadPedida?.message}
                      </span>
                    )}
                  </div>
                  <div className="col-span-5">
                    <input
                      type="number"
                      {...register(`lineas.${index}.costoUnitarioCop`, { valueAsNumber: true })}
                      disabled={isPending}
                      placeholder="Costo unitario (opcional)"
                      className="w-full p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-xs disabled:opacity-50"
                    />
                    {errors.lineas?.[index]?.costoUnitarioCop && (
                      <p className="text-[10px] text-rose-500 mt-1">
                        {errors.lineas[index]?.costoUnitarioCop?.message}
                      </p>
                    )}
                  </div>
                  <div className="col-span-1 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      disabled={isPending || fields.length === 1}
                      aria-label="Eliminar línea"
                      className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {errors.lineas && typeof errors.lineas.message === 'string' && (
              <span className="text-xs text-red-500 mt-2 block">{errors.lineas.message}</span>
            )}
          </div>
        </form>

        {/* Footer con acciones */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="form-crear-compra"
            disabled={isPending}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 flex items-center gap-1.5 shadow-lg shadow-indigo-500/25"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Crear Orden'}
          </button>
        </div>
      </div>
    </div>
  );
};