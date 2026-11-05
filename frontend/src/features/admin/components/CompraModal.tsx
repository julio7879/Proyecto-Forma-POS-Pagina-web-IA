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
  costoUnitarioCop: z
    .preprocess(
      (val) => {
        if (val === '' || val === null || val === undefined || Number.isNaN(Number(val))) {
          return undefined;
        }
        return Number(val);
      },
      z.number().int('El costo debe ser entero en COP').nonnegative().optional()
    ),
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
    resolver: zodResolver(compraSchema) as any,
    defaultValues: {
      proveedorNombre: '',
      proveedorContacto: '',
      notas: '',
      lineas: [{ varianteId: 0, cantidadPedida: 1, costoUnitarioCop: undefined }],
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
          costoUnitarioCop:
            typeof l.costoUnitarioCop === 'number' && !Number.isNaN(l.costoUnitarioCop)
              ? Math.trunc(l.costoUnitarioCop)
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#171717]/60 backdrop-blur-md"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-mirror-card w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Encabezado */}
        <div className="p-6 border-b border-[#50322A]/15 bg-[#E7DED2]/60 flex items-center justify-between">
          <div>
            <h2
              id="modal-compra-title"
              className="text-2xl font-black text-[#171717] font-display"
            >
              Nueva Orden de Compra
            </h2>
            <p className="text-xs font-semibold text-[#50322A] mt-1">
              Registra un pedido a proveedor. Ingresa exclusivamente a Bodega Central (RN-COM-01).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-2 rounded-full hover:bg-white/70 text-[#50322A] hover:text-[#661521] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario con botones de submit integrados */}
        <form
          id="form-crear-compra"
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto flex flex-col justify-between"
        >
          <div className="p-6 space-y-4">
            {apiError && (
              <div className="p-3.5 rounded-2xl bg-[#661521]/10 border border-[#661521]/40 text-xs font-bold text-[#661521]">
                {apiError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="proveedor"
                  className="block text-xs font-extrabold text-[#351912] uppercase tracking-wider mb-1.5"
                >
                  Proveedor *
                </label>
                <input
                  id="proveedor"
                  {...register('proveedorNombre')}
                  disabled={isPending}
                  placeholder="Ej. Distribuidora Textil S.A.S"
                  className="capsule-mirror-input w-full p-3 rounded-2xl text-sm font-semibold text-[#171717] disabled:opacity-50"
                />
                {errors.proveedorNombre && (
                  <span className="text-xs font-bold text-[#661521] mt-1 block">
                    {errors.proveedorNombre.message}
                  </span>
                )}
              </div>

              <div>
                <label
                  htmlFor="contacto"
                  className="block text-xs font-extrabold text-[#351912] uppercase tracking-wider mb-1.5"
                >
                  Contacto del proveedor
                </label>
                <input
                  id="contacto"
                  {...register('proveedorContacto')}
                  disabled={isPending}
                  placeholder="Ej. ventas@proveedor.com"
                  className="capsule-mirror-input w-full p-3 rounded-2xl text-sm font-semibold text-[#171717] disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="notas"
                className="block text-xs font-extrabold text-[#351912] uppercase tracking-wider mb-1.5"
              >
                Notas (opcional)
              </label>
              <textarea
                id="notas"
                {...register('notas')}
                disabled={isPending}
                rows={2}
                placeholder="Observaciones de la compra..."
                className="capsule-mirror-input w-full p-3 rounded-2xl text-sm font-semibold text-[#171717] disabled:opacity-50 resize-none"
              />
            </div>

            {/* Líneas dinámicas */}
            <div className="pt-4 border-t border-[#50322A]/15">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-extrabold text-[#351912] uppercase tracking-wider">
                  Líneas de Compra
                </h3>
                <button
                  type="button"
                  onClick={() => append({ varianteId: 0, cantidadPedida: 1, costoUnitarioCop: undefined })}
                  disabled={isPending}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#661521] text-white border border-[#D19650]/50 hover:bg-[#4A0E17] transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5 text-[#D19650]" />
                  Agregar Línea
                </button>
              </div>

              <div className="space-y-2.5">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="glass-mirror-pill grid grid-cols-12 gap-2.5 p-3 rounded-2xl border border-[#D19650]/35"
                  >
                    <div className="col-span-3">
                      <input
                        type="number"
                        {...register(`lineas.${index}.varianteId`, {
                          setValueAs: (v) =>
                            v === '' || v === null || v === undefined || Number.isNaN(Number(v))
                              ? 0
                              : Math.trunc(Number(v)),
                        })}
                        disabled={isPending}
                        placeholder="ID Variante"
                        className="capsule-mirror-input w-full p-2.5 rounded-xl text-xs font-mono tabular-nums font-bold text-[#171717] disabled:opacity-50"
                      />
                      {errors.lineas?.[index]?.varianteId && (
                        <span className="text-[11px] font-bold text-[#661521] mt-0.5 block">
                          {errors.lineas[index]?.varianteId?.message}
                        </span>
                      )}
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        {...register(`lineas.${index}.cantidadPedida`, {
                          setValueAs: (v) =>
                            v === '' || v === null || v === undefined || Number.isNaN(Number(v))
                              ? 0
                              : Math.trunc(Number(v)),
                        })}
                        disabled={isPending}
                        placeholder="Cantidad"
                        min="1"
                        className="capsule-mirror-input w-full p-2.5 rounded-xl text-xs font-mono tabular-nums font-bold text-[#171717] disabled:opacity-50"
                      />
                      {errors.lineas?.[index]?.cantidadPedida && (
                        <span className="text-[11px] font-bold text-[#661521] mt-0.5 block">
                          {errors.lineas[index]?.cantidadPedida?.message}
                        </span>
                      )}
                    </div>
                    <div className="col-span-5">
                      <input
                        type="number"
                        {...register(`lineas.${index}.costoUnitarioCop`, {
                          setValueAs: (v) =>
                            v === '' || v === null || v === undefined || Number.isNaN(Number(v))
                              ? undefined
                              : Math.trunc(Number(v)),
                        })}
                        disabled={isPending}
                        placeholder="Costo unitario COP (opcional)"
                        min="0"
                        className="capsule-mirror-input w-full p-2.5 rounded-xl text-xs font-mono tabular-nums font-bold text-[#171717] disabled:opacity-50"
                      />
                      {errors.lineas?.[index]?.costoUnitarioCop && (
                        <p className="text-[11px] font-bold text-[#661521] mt-1">
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
                        className="p-2 rounded-xl text-[#661521] hover:bg-[#661521]/10 disabled:opacity-30 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {errors.lineas && typeof errors.lineas.message === 'string' && (
                <span className="text-xs font-bold text-[#661521] mt-2 block">
                  {errors.lineas.message}
                </span>
              )}
            </div>
          </div>

          {/* Footer con acciones dentro del <form> */}
          <div className="p-6 border-t border-[#50322A]/15 bg-[#E7DED2]/60 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="glass-mirror-pill px-5 py-2.5 rounded-xl text-xs font-bold text-[#50322A] hover:text-[#171717] disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#661521] text-white border border-[#D19650] hover:bg-[#4A0E17] disabled:opacity-50 flex items-center gap-2 shadow-lg"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Crear Orden'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
