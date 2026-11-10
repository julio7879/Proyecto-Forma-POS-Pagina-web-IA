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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col text-[#0F172A] relative animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="absolute inset-x-0 top-0 h-[2px] bg-[#741C2B] pointer-events-none" />

        {/* Encabezado */}
        <div className="p-6 border-b border-slate-200 bg-[#F8FAFC] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-slate-100 border border-slate-200">
              <Building2 className="w-5 h-5 text-[#741C2B]" />
            </div>
            <div>
              <h2
                id="modal-compra-title"
                className="text-xl sm:text-2xl font-black text-[#0F172A] font-serif-editorial"
              >
                Nueva Orden de Abastecimiento Mayorista
              </h2>
              <p className="text-xs text-[#475569] font-medium mt-0.5">
                Selecciona el distribuidor asociado, revisa los materiales y confección, y pide por mayor a precio preferencial.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#475569] hover:text-[#0F172A] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form
          id="form-crear-compra"
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto flex flex-col justify-between custom-scrollbar bg-white"
        >
          <div className="p-6 space-y-5">
            {apiError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-xs font-bold text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{apiError}</span>
              </div>
            )}

            {/* SELECCIÓN DE DISTRIBUIDOR ASOCIADO */}
            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black text-[#741C2B] uppercase tracking-wider">
                  Distribuidor Mayorista Asociado
                </label>
                {distribuidorActivo && (
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-300 text-[10px] font-mono font-bold text-emerald-800">
                    Descuento Mayorista: ~{distribuidorActivo.descuentoMayoristaPorc}%
                  </span>
                )}
              </div>

              <select
                value={selectedDistId || 'dist-1'}
                onChange={(e) => handleDistribuidorChange(e.target.value)}
                disabled={isPending}
                className="w-full p-3 rounded-2xl bg-white border border-slate-300 text-sm font-bold text-[#0F172A] focus:outline-none focus:border-[#741C2B] focus:ring-1 focus:ring-[#741C2B]/20 cursor-pointer shadow-xs"
              >
                {DISTRIBUIDORES_OFICIALES.map((d) => (
                  <option key={d.id} value={d.id} className="bg-white text-[#0F172A] font-sans py-1">
                    {d.nombre} ({d.ciudad}) — {d.especialidad}
                  </option>
                ))}
                <option value="otro" className="bg-white text-[#0F172A] font-sans py-1">
                  Otro Distribuidor / Proveedor Personalizado...
                </option>
              </select>

              {/* Ficha técnica del distribuidor seleccionado */}
              {distribuidorActivo && (
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs grid grid-cols-1 md:grid-cols-2 gap-2 text-[#475569] shadow-2xs">
                  <div>
                    <span className="text-[#64748B] block text-[10px] uppercase font-bold">Especialidad de Materiales:</span>
                    <span className="text-[#741C2B] font-bold">{distribuidorActivo.especialidad}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block text-[10px] uppercase font-bold">Contacto Oficial:</span>
                    <span className="text-[#0F172A] font-medium">{distribuidorActivo.contacto} · NIT: {distribuidorActivo.nit}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Campos manuales si seleccionó "otro" */}
            {selectedDistId === 'otro' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-[#741C2B] uppercase tracking-wider mb-1">
                    Nombre del Proveedor *
                  </label>
                  <input
                    {...register('proveedorNombre')}
                    disabled={isPending}
                    placeholder="Ej. Confecciones Textiles S.A.S"
                    className="w-full p-3 rounded-2xl bg-white border border-slate-300 text-sm font-semibold text-[#0F172A] focus:outline-none focus:border-[#741C2B] shadow-xs"
                  />
                  {errors.proveedorNombre && (
                    <span className="text-xs font-bold text-rose-700 mt-1 block">
                      {errors.proveedorNombre.message}
                    </span>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-black text-[#741C2B] uppercase tracking-wider mb-1">
                    Contacto / Teléfono
                  </label>
                  <input
                    {...register('proveedorContacto')}
                    disabled={isPending}
                    placeholder="Ej. ventas@proveedor.com · Tel: +57 300..."
                    className="w-full p-3 rounded-2xl bg-white border border-slate-300 text-sm font-semibold text-[#0F172A] focus:outline-none focus:border-[#741C2B] shadow-xs"
                  />
                </div>
              </div>
            )}

            {/* SECCIÓN DE LÍNEAS DE MERCANCÍA */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-xs font-black text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#741C2B]" />
                    <span>Prendas a Solicitar con sus Materiales y Tallas</span>
                  </h3>
                  <p className="text-[11px] text-[#475569] font-medium">
                    Selecciona cada referencia del catálogo. El costo por mayor se autoliquida con descuento respecto al precio de venta.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => append({ productoId: 0, varianteId: 0, cantidadPedida: 20, costoUnitarioCop: undefined })}
                  disabled={isPending}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#F8FAFC] text-[#741C2B] border border-slate-300 hover:bg-slate-100 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar Otra Prenda</span>
                </button>
              </div>

              {errors.lineas && (
                <span className="text-xs font-bold text-rose-700 mb-2 block">
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
                      className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200 space-y-3 relative transition-all hover:border-[#741C2B]/50 shadow-2xs"
                    >
                      {/* Fila 1: Selección de Producto y Talla/Color */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                        {/* Selector de Producto */}
                        <div className="md:col-span-5">
                          <label className="block text-[10px] font-bold text-[#475569] uppercase tracking-wider mb-1">
                            Prenda / Referencia
                          </label>
                          <select
                            value={currentProdId || 0}
                            onChange={(e) => handleProductoSelect(index, Number(e.target.value))}
                            disabled={isPending}
                            className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-[#0F172A] focus:border-[#741C2B] cursor-pointer shadow-xs"
                          >
                            <option value={0}>-- Selecciona una Prenda --</option>
                            {productos.map((prod) => (
                              <option key={prod.id} value={prod.id} className="bg-white text-[#0F172A]">
                                {prod.nombre} ({prod.categoriaNombre})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Selector de Variante (Talla y Color) */}
                        <div className="md:col-span-4">
                          <label className="block text-[10px] font-bold text-[#475569] uppercase tracking-wider mb-1">
                            Talla, Color y SKU
                          </label>
                          <select
                            value={currentVarId || 0}
                            onChange={(e) => handleVarianteSelect(index, Number(e.target.value), currentProdId)}
                            disabled={isPending || !currentProd}
                            className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-xs font-mono font-bold text-[#0F172A] focus:border-[#741C2B] cursor-pointer disabled:opacity-40 shadow-xs"
                          >
                            <option value={0}>
                              {currentProd ? '-- Selecciona Talla / Color --' : '-- Primero elige prenda --'}
                            </option>
                            {currentProd?.variantes.map((v) => (
                              <option key={v.id} value={v.id} className="bg-white text-[#0F172A]">
                                Talla {v.talla} · {v.color} ({v.sku})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Cantidad a pedir */}
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-bold text-[#475569] uppercase tracking-wider mb-1">
                            Cantidad (Uds)
                          </label>
                          <input
                            type="number"
                            min="1"
                            {...register(`lineas.${index}.cantidadPedida`, {
                              valueAsNumber: true,
                            })}
                            disabled={isPending}
                            className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-xs font-mono font-black text-center text-[#0F172A] focus:border-[#741C2B] shadow-xs"
                          />
                        </div>

                        {/* Botón eliminar línea */}
                        <div className="md:col-span-1 flex items-end justify-center pt-5">
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            disabled={fields.length === 1 || isPending}
                            className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-700 transition-colors disabled:opacity-30 cursor-pointer shadow-2xs"
                            title="Eliminar línea"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Fila 2: Descripción de Materiales y Comparativa Mayorista */}
                      {currentProd && (
                        <div className="p-3 rounded-xl bg-white border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-2xs">
                          {/* Materiales y Confección */}
                          <div className="flex-1">
                            <span className="text-[10px] uppercase font-black text-[#741C2B] flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-[#741C2B]" />
                              Materiales y Especificaciones Técnicas:
                            </span>
                            <p className="text-[#475569] text-[11px] font-sans font-medium mt-0.5 leading-relaxed">
                              {currentProd.descripcion}
                            </p>
                          </div>

                          {/* Comparativa PVP vs Costo Mayorista */}
                          <div className="flex items-center gap-4 shrink-0 bg-[#F8FAFC] px-3.5 py-2 rounded-xl border border-slate-200">
                            <div>
                              <span className="text-[10px] text-[#64748B] block font-bold uppercase">PVP Tienda:</span>
                              <span className="font-mono font-bold text-[#0F172A] line-through decoration-slate-400">
                                ${((currentVar?.precioVentaCop || 0)).toLocaleString('es-CO')}
                              </span>
                            </div>

                            <div className="border-l border-slate-200 pl-3">
                              <span className="text-[10px] text-[#741C2B] block font-bold uppercase">Costo Mayorista:</span>
                              <div className="flex items-center gap-1 font-mono font-black text-emerald-800">
                                <span>$</span>
                                <input
                                  type="number"
                                  min="0"
                                  {...register(`lineas.${index}.costoUnitarioCop`, {
                                    valueAsNumber: true,
                                  })}
                                  disabled={isPending}
                                  className="w-24 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs font-mono text-right text-emerald-800 focus:outline-none focus:border-emerald-600 font-black"
                                />
                              </div>
                            </div>

                            <div className="border-l border-slate-200 pl-3 text-right">
                              <span className="text-[10px] text-[#64748B] block font-bold uppercase">Subtotal Línea:</span>
                              <span className="font-mono font-black text-[#741C2B]">
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
              <label htmlFor="notas" className="block text-xs font-black text-[#741C2B] uppercase tracking-wider mb-1.5">
                Notas y Trazabilidad del Envío (opcional)
              </label>
              <textarea
                id="notas"
                {...register('notas')}
                disabled={isPending}
                rows={2}
                placeholder="Observaciones de despacho, transportadora, número de guía..."
                className="w-full p-3 rounded-2xl bg-white border border-slate-300 text-xs font-semibold text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#741C2B] resize-none shadow-xs"
              />
            </div>
          </div>

          {/* Footer con Resumen Financiero y Botón de Emisión */}
          <div className="p-6 border-t border-slate-200 bg-[#F8FAFC] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6 text-xs">
              <div>
                <span className="text-[#64748B] block text-[10px] uppercase font-bold">Total Prendas:</span>
                <span className="font-mono text-base font-black text-[#0F172A]">{totalUnidades.toLocaleString()} unds</span>
              </div>
              <div className="border-l border-slate-200 pl-6">
                <span className="text-[#741C2B] block text-[10px] uppercase font-bold">Total Inversión Mayorista:</span>
                <span className="font-mono text-base font-black text-emerald-800">${totalCostoCop.toLocaleString('es-CO')} COP</span>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-bold bg-white border border-slate-300 text-[#0F172A] hover:bg-slate-100 transition-all cursor-pointer disabled:opacity-50 shadow-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending || totalUnidades === 0}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-black bg-[#741C2B] hover:bg-[#5A1420] text-white shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Emitiendo Orden...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-white" />
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
