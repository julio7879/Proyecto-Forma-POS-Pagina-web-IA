// frontend/src/features/admin/components/CompraModal.tsx
import { useState, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import {
  Plus,
  Trash2,
  X,
  Loader2,
  Building2,
  Sparkles,
  Layers,
  AlertCircle,
} from 'lucide-react';
import {
  createOrdenCompra,
  CrearOrdenCompraDto,
  DISTRIBUIDORES_OFICIALES,
  DistribuidorAsociado,
} from '../services/adminService';
import { getProductosCatalogo, ProductoDTO } from '../../storefront/services/catalogService';

const compraLineaSchema = z.object({
  productoId: z.number().int().positive('Seleccione una prenda'),
  varianteId: z.number().int().positive('Seleccione una talla y color'),
  cantidadPedida: z.number().int().positive('La cantidad debe ser mayor a 0'),
  costoUnitarioCop: z.number().int('El costo debe ser entero en COP').nonnegative().optional(),
});

const compraSchema = z.object({
  distribuidorId: z.string().optional(),
  proveedorNombre: z.string().trim().min(2, 'El proveedor es requerido').max(200),
  proveedorContacto: z.string().trim().max(250).optional(),
  notas: z.string().trim().max(500).optional(),
  lineas: z.array(compraLineaSchema).min(1, 'Debe agregar al menos una línea de producto'),
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

  // Catálogo completo con variantes y descripción de materiales
  const { data: productos = [] } = useQuery<ProductoDTO[]>({
    queryKey: ['catalogo-productos-compras'],
    queryFn: getProductosCatalogo,
    staleTime: 60_000,
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<CompraFormValues>({
    resolver: zodResolver(compraSchema) as any,
    defaultValues: {
      distribuidorId: 'dist-1',
      proveedorNombre: DISTRIBUIDORES_OFICIALES[0]!.nombre,
      proveedorContacto: `${DISTRIBUIDORES_OFICIALES[0]!.contacto} · Tel: ${DISTRIBUIDORES_OFICIALES[0]!.telefono} · Correo: ${DISTRIBUIDORES_OFICIALES[0]!.email} - NIT: ${DISTRIBUIDORES_OFICIALES[0]!.nit}`,
      notas: `Abastecimiento mayorista oficial. ${DISTRIBUIDORES_OFICIALES[0]!.especialidad}.`,
      lineas: [{ productoId: 0, varianteId: 0, cantidadPedida: 20, costoUnitarioCop: undefined }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lineas',
  });

  const selectedDistId = watch('distribuidorId');
  const watchedLineas = watch('lineas');

  // Distribuidor activo seleccionado
  const distribuidorActivo = useMemo<DistribuidorAsociado | undefined>(() => {
    return DISTRIBUIDORES_OFICIALES.find((d) => d.id === selectedDistId);
  }, [selectedDistId]);

  if (!isOpen) return null;

  // Manejar cambio de distribuidor
  const handleDistribuidorChange = (distId: string) => {
    setValue('distribuidorId', distId);
    if (distId === 'otro') {
      setValue('proveedorNombre', '');
      setValue('proveedorContacto', '');
      setValue('notas', '');
    } else {
      const dist = DISTRIBUIDORES_OFICIALES.find((d) => d.id === distId);
      if (dist) {
        setValue('proveedorNombre', dist.nombre);
        setValue('proveedorContacto', `${dist.contacto} · Tel: ${dist.telefono} · Correo: ${dist.email} (${dist.ciudad}) - NIT: ${dist.nit}`);
        setValue('notas', `Lote mayorista oficial. Especialidad: ${dist.especialidad}.`);
      }
    }
  };

  // Manejar selección de producto en una fila
  const handleProductoSelect = (index: number, prodId: number) => {
    const prod = productos.find((p) => p.id === prodId);
    setValue(`lineas.${index}.productoId`, prodId);

    if (prod && prod.variantes.length > 0) {
      const firstVar = prod.variantes[0]!;
      setValue(`lineas.${index}.varianteId`, firstVar.id);

      // Calcular costo mayorista sugerido con descuento (ej. 50% de margen)
      const descPorc = distribuidorActivo?.descuentoMayoristaPorc ?? 50;
      const costoSugerido = Math.max(1000, Math.round(firstVar.precioVentaCop * ((100 - descPorc) / 100)));
      setValue(`lineas.${index}.costoUnitarioCop`, costoSugerido);
    } else {
      setValue(`lineas.${index}.varianteId`, 0);
      setValue(`lineas.${index}.costoUnitarioCop`, undefined);
    }
  };

  // Manejar selección de variante
  const handleVarianteSelect = (index: number, varId: number, prodId: number) => {
    setValue(`lineas.${index}.varianteId`, varId);
    const prod = productos.find((p) => p.id === prodId);
    const variante = prod?.variantes.find((v) => v.id === varId);

    if (variante) {
      const descPorc = distribuidorActivo?.descuentoMayoristaPorc ?? 50;
      const costoSugerido = Math.max(1000, Math.round(variante.precioVentaCop * ((100 - descPorc) / 100)));
      setValue(`lineas.${index}.costoUnitarioCop`, costoSugerido);
    }
  };

  // Totales de la orden
  const totalUnidades = (watchedLineas || []).reduce((acc, l) => acc + (Number(l?.cantidadPedida) || 0), 0);
  const totalCostoCop = (watchedLineas || []).reduce((acc, l) => {
    const cant = Number(l?.cantidadPedida) || 0;
    const costo = Number(l?.costoUnitarioCop) || 0;
    return acc + cant * costo;
  }, 0);

  const onSubmit = async (values: CompraFormValues) => {
    setIsPending(true);
    setApiError(null);

    const dto: CrearOrdenCompraDto = {
      proveedorNombre: values.proveedorNombre,
      proveedorContacto: values.proveedorContacto?.trim() || undefined,
      notas: values.notas?.trim() || undefined,
      lineas: values.lineas.map((l) => ({
        varianteId: l.varianteId,
        cantidadPedida: l.cantidadPedida,
        costoUnitarioCop: l.costoUnitarioCop,
      })),
    };

    try {
      await createOrdenCompra(dto, `IDEMP-OC-${Date.now()}-${crypto.randomUUID()}`);
      reset();
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setApiError(err?.message || 'Error al registrar orden de abastecimiento');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-compra-title"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl rounded-3xl backdrop-blur-2xl bg-[#1A060B]/95 border border-white/[0.18] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col text-white relative animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />

        {/* Encabezado */}
        <div className="p-6 border-b border-white/10 bg-white/[0.04] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#C49A68]/15 border border-[#C49A68]/30">
              <Building2 className="w-5 h-5 text-[#E5BE90]" />
            </div>
            <div>
              <h2
                id="modal-compra-title"
                className="text-xl sm:text-2xl font-black text-white font-serif-editorial"
              >
                Nueva Orden de Abastecimiento Mayorista
              </h2>
              <p className="text-xs text-white/60 mt-0.5">
                Selecciona el distribuidor asociado, revisa los materiales y confección, y pide por mayor a precio preferencial.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form
          id="form-crear-compra"
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto flex flex-col justify-between custom-scrollbar"
        >
          <div className="p-6 space-y-5">
            {apiError && (
              <div className="p-3.5 rounded-2xl bg-[#EF4444]/20 border border-[#EF4444]/40 text-xs font-bold text-[#F87171] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{apiError}</span>
              </div>
            )}

            {/* SELECCIÓN DE DISTRIBUIDOR ASOCIADO */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-extrabold text-[#E5BE90] uppercase tracking-wider">
                  Distribuidor Mayorista Asociado
                </label>
                {distribuidorActivo && (
                  <span className="px-2.5 py-0.5 rounded-md bg-[#C49A68]/20 border border-[#C49A68]/40 text-[10px] font-mono font-bold text-[#E5BE90]">
                    Descuento Mayorista: ~{distribuidorActivo.descuentoMayoristaPorc}%
                  </span>
                )}
              </div>

              <select
                value={selectedDistId || 'dist-1'}
                onChange={(e) => handleDistribuidorChange(e.target.value)}
                disabled={isPending}
                className="w-full p-3 rounded-2xl bg-black/50 border border-white/20 text-sm font-bold text-white focus:outline-none focus:border-[#C49A68] cursor-pointer"
              >
                {DISTRIBUIDORES_OFICIALES.map((d) => (
                  <option key={d.id} value={d.id} className="bg-[#1A060B] text-white font-sans py-1">
                    {d.nombre} ({d.ciudad}) — {d.especialidad}
                  </option>
                ))}
                <option value="otro" className="bg-[#1A060B] text-white font-sans py-1">
                  Otro Distribuidor / Proveedor Personalizado...
                </option>
              </select>

              {/* Ficha técnica del distribuidor seleccionado */}
              {distribuidorActivo && (
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 text-xs grid grid-cols-1 md:grid-cols-2 gap-2 text-white/80">
                  <div>
                    <span className="text-white/50 block text-[10px] uppercase font-bold">Especialidad de Materiales:</span>
                    <span className="text-[#E5BE90] font-semibold">{distribuidorActivo.especialidad}</span>
                  </div>
                  <div>
                    <span className="text-white/50 block text-[10px] uppercase font-bold">Contacto Oficial:</span>
                    <span className="text-white font-medium">{distribuidorActivo.contacto} · NIT: {distribuidorActivo.nit}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Campos manuales si seleccionó "otro" */}
            {selectedDistId === 'otro' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-[#E5BE90] uppercase tracking-wider mb-1">
                    Nombre del Proveedor *
                  </label>
                  <input
                    {...register('proveedorNombre')}
                    disabled={isPending}
                    placeholder="Ej. Confecciones Textiles S.A.S"
                    className="w-full p-3 rounded-2xl bg-black/40 border border-white/15 text-sm font-semibold text-white focus:outline-none focus:border-[#C49A68]"
                  />
                  {errors.proveedorNombre && (
                    <span className="text-xs font-bold text-[#F87171] mt-1 block">
                      {errors.proveedorNombre.message}
                    </span>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-[#E5BE90] uppercase tracking-wider mb-1">
                    Contacto / Teléfono
                  </label>
                  <input
                    {...register('proveedorContacto')}
                    disabled={isPending}
                    placeholder="Ej. ventas@proveedor.com · Tel: +57 300..."
                    className="w-full p-3 rounded-2xl bg-black/40 border border-white/15 text-sm font-semibold text-white focus:outline-none focus:border-[#C49A68]"
                  />
                </div>
              </div>
            )}

            {/* SECCIÓN DE LÍNEAS DE MERCANCÍA */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#E5BE90]" />
                    <span>Prendas a Solicitar con sus Materiales y Tallas</span>
                  </h3>
                  <p className="text-[11px] text-white/50">
                    Selecciona cada referencia del catálogo. El costo por mayor se autoliquida con descuento respecto al precio de venta.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => append({ productoId: 0, varianteId: 0, cantidadPedida: 20, costoUnitarioCop: undefined })}
                  disabled={isPending}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#C49A68]/20 text-[#E5BE90] border border-[#C49A68]/40 hover:bg-[#C49A68]/30 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar Otra Prenda</span>
                </button>
              </div>

              {errors.lineas && (
                <span className="text-xs font-bold text-[#F87171] mb-2 block">
                  {errors.lineas.message}
                </span>
              )}

              <div className="space-y-4">
                {fields.map((field, index) => {
                  const currentProdId = watch(`lineas.${index}.productoId`);
                  const currentVarId = watch(`lineas.${index}.varianteId`);
                  const currentCant = watch(`lineas.${index}.cantidadPedida`) || 0;
                  const currentCosto = watch(`lineas.${index}.costoUnitarioCop`) || 0;

                  const currentProd = productos.find((p) => p.id === currentProdId);
                  const currentVar = currentProd?.variantes.find((v) => v.id === currentVarId);

                  return (
                    <div
                      key={field.id}
                      className="p-4 rounded-2xl bg-white/[0.04] border border-white/15 space-y-3 relative transition-all hover:border-[#C49A68]/50"
                    >
                      {/* Fila 1: Selección de Producto y Talla/Color */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                        {/* Selector de Producto */}
                        <div className="md:col-span-5">
                          <label className="block text-[10px] font-bold text-white/60 uppercase tracking-wider mb-1">
                            Prenda / Referencia
                          </label>
                          <select
                            value={currentProdId || 0}
                            onChange={(e) => handleProductoSelect(index, Number(e.target.value))}
                            disabled={isPending}
                            className="w-full p-2.5 rounded-xl bg-black/60 border border-white/20 text-xs font-bold text-white focus:border-[#C49A68] cursor-pointer"
                          >
                            <option value={0}>-- Selecciona una Prenda --</option>
                            {productos.map((prod) => (
                              <option key={prod.id} value={prod.id} className="bg-[#1A060B] text-white">
                                {prod.nombre} ({prod.categoriaNombre})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Selector de Variante (Talla y Color) */}
                        <div className="md:col-span-4">
                          <label className="block text-[10px] font-bold text-white/60 uppercase tracking-wider mb-1">
                            Talla, Color y SKU
                          </label>
                          <select
                            value={currentVarId || 0}
                            onChange={(e) => handleVarianteSelect(index, Number(e.target.value), currentProdId)}
                            disabled={isPending || !currentProd}
                            className="w-full p-2.5 rounded-xl bg-black/60 border border-white/20 text-xs font-mono font-bold text-white focus:border-[#C49A68] cursor-pointer disabled:opacity-40"
                          >
                            <option value={0}>
                              {currentProd ? '-- Selecciona Talla / Color --' : '-- Primero elige prenda --'}
                            </option>
                            {currentProd?.variantes.map((v) => (
                              <option key={v.id} value={v.id} className="bg-[#1A060B] text-white">
                                Talla {v.talla} · {v.color} ({v.sku})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Cantidad a pedir */}
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-bold text-white/60 uppercase tracking-wider mb-1">
                            Cantidad (Uds)
                          </label>
                          <input
                            type="number"
                            min="1"
                            {...register(`lineas.${index}.cantidadPedida`, {
                              valueAsNumber: true,
                            })}
                            disabled={isPending}
                            className="w-full p-2.5 rounded-xl bg-black/60 border border-white/20 text-xs font-mono font-bold text-center text-white focus:border-[#C49A68]"
                          />
                        </div>

                        {/* Botón eliminar línea */}
                        <div className="md:col-span-1 flex items-end justify-center pt-5">
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            disabled={fields.length === 1 || isPending}
                            className="p-2 rounded-xl bg-white/5 hover:bg-rose-950/60 text-white/50 hover:text-rose-400 transition-colors disabled:opacity-30 cursor-pointer"
                            title="Eliminar línea"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Fila 2: Descripción de Materiales y Comparativa Mayorista */}
                      {currentProd && (
                        <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                          {/* Materiales y Confección */}
                          <div className="flex-1">
                            <span className="text-[10px] uppercase font-bold text-[#C49A68] flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-[#E5BE90]" />
                              Materiales y Especificaciones Técnicas:
                            </span>
                            <p className="text-white/80 text-[11px] font-sans mt-0.5 leading-relaxed">
                              {currentProd.descripcion}
                            </p>
                          </div>

                          {/* Comparativa PVP vs Costo Mayorista */}
                          <div className="flex items-center gap-4 shrink-0 bg-white/[0.04] px-3.5 py-2 rounded-xl border border-white/10">
                            <div>
                              <span className="text-[10px] text-white/50 block font-bold uppercase">PVP Tienda:</span>
                              <span className="font-mono font-bold text-white line-through decoration-white/40">
                                ${((currentVar?.precioVentaCop || 0)).toLocaleString('es-CO')}
                              </span>
                            </div>

                            <div className="border-l border-white/10 pl-3">
                              <span className="text-[10px] text-[#E5BE90] block font-bold uppercase">Costo Mayorista:</span>
                              <div className="flex items-center gap-1 font-mono font-black text-emerald-400">
                                <span>$</span>
                                <input
                                  type="number"
                                  min="0"
                                  {...register(`lineas.${index}.costoUnitarioCop`, {
                                    valueAsNumber: true,
                                  })}
                                  disabled={isPending}
                                  className="w-24 bg-black/60 border border-emerald-500/40 rounded px-1.5 py-0.5 text-xs font-mono text-right text-emerald-300 focus:outline-none focus:border-emerald-400"
                                />
                              </div>
                            </div>

                            <div className="border-l border-white/10 pl-3 text-right">
                              <span className="text-[10px] text-white/50 block font-bold uppercase">Subtotal Línea:</span>
                              <span className="font-mono font-extrabold text-[#E5BE90]">
                                ${(currentCant * currentCosto).toLocaleString('es-CO')} COP
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Observaciones de la orden */}
            <div>
              <label htmlFor="notas" className="block text-xs font-extrabold text-[#E5BE90] uppercase tracking-wider mb-1.5">
                Notas y Trazabilidad del Envío (opcional)
              </label>
              <textarea
                id="notas"
                {...register('notas')}
                disabled={isPending}
                rows={2}
                placeholder="Observaciones de despacho, transportadora, número de guía..."
                className="w-full p-3 rounded-2xl bg-black/40 border border-white/15 text-xs font-semibold text-white placeholder-white/40 focus:outline-none focus:border-[#C49A68] resize-none"
              />
            </div>
          </div>

          {/* Footer con Resumen Financiero y Botón de Emisión */}
          <div className="p-6 border-t border-white/10 bg-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6 text-xs">
              <div>
                <span className="text-white/50 block text-[10px] uppercase font-bold">Total Prendas:</span>
                <span className="font-mono text-base font-black text-white">{totalUnidades.toLocaleString()} unds</span>
              </div>
              <div className="border-l border-white/15 pl-6">
                <span className="text-[#E5BE90] block text-[10px] uppercase font-bold">Total Inversión Mayorista:</span>
                <span className="font-mono text-base font-black text-emerald-400">${totalCostoCop.toLocaleString('es-CO')} COP</span>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-semibold bg-white/[0.07] border border-white/[0.14] text-white/80 hover:bg-white/[0.15] hover:text-white transition-all cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending || totalUnidades === 0}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-[#741C2B] to-[#912537] hover:from-[#912537] hover:to-[#A32E43] text-white border border-[#C49A68]/30 shadow-lg shadow-[#741C2B]/40 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Emitiendo Orden...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-[#E5BE90]" />
                    <span>Crear Orden de Abastecimiento</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
