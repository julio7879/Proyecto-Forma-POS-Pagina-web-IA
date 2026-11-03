import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterFormValues } from '../schemas/authSchema';
import { apiRequest } from '../../../api/apiClient';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const RegisterForm = () => {
  const [isPending, setIsPending] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    // Cambiamos los valores por defecto al nuevo esquema
    defaultValues: { aceptoPrivacidad: false, municipioDefaultId: '54001' },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsPending(true);
    setApiError(null);
    try {
      await apiRequest('/auth/registro-cliente', {
        method: 'POST',
        body: JSON.stringify(data), // Los nombres ahora coinciden con el backend
      });
      navigate('/login');
    } catch (error: any) {
      setApiError(error.message);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl rounded-2xl">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Crear Cuenta</h2>
      {apiError && <div className="bg-red-100 text-red-600 p-2 rounded mb-4 text-sm">{apiError}</div>}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <input {...register('nombreCompleto')} placeholder="Nombre completo" className="w-full p-3 rounded-lg bg-slate-100 dark:bg-slate-800 border-none outline-none focus:ring-2 ring-indigo-500 text-sm" />
          {errors.nombreCompleto && <span className="text-xs text-red-500">{errors.nombreCompleto.message}</span>}
        </div>
        <div>
          <input {...register('correo')} type="email" placeholder="Correo electrónico" className="w-full p-3 rounded-lg bg-slate-100 dark:bg-slate-800 border-none outline-none focus:ring-2 ring-indigo-500 text-sm" />
          {errors.correo && <span className="text-xs text-red-500">{errors.correo.message}</span>}
        </div>
        <div>
          <input {...register('password')} type="password" placeholder="Contraseña (mín. 8 caracteres)" className="w-full p-3 rounded-lg bg-slate-100 dark:bg-slate-800 border-none outline-none focus:ring-2 ring-indigo-500 text-sm" />
          {errors.password && <span className="text-xs text-red-500">{errors.password.message}</span>}
        </div>
        <div>
          <input {...register('telefono')} placeholder="Teléfono" className="w-full p-3 rounded-lg bg-slate-100 dark:bg-slate-800 border-none outline-none focus:ring-2 ring-indigo-500 text-sm" />
          {errors.telefono && <span className="text-xs text-red-500">{errors.telefono.message}</span>}
        </div>
        <div>
          <input {...register('direccionDefault')} placeholder="Dirección" className="w-full p-3 rounded-lg bg-slate-100 dark:bg-slate-800 border-none outline-none focus:ring-2 ring-indigo-500 text-sm" />
          {errors.direccionDefault && <span className="text-xs text-red-500">{errors.direccionDefault.message}</span>}
        </div>
        
        <div className="flex items-start gap-2 mt-4">
          <input type="checkbox" {...register('aceptoPrivacidad')} id="privacidad" className="mt-1 w-4 h-4 text-indigo-600 rounded" />
          <label htmlFor="privacidad" className="text-xs text-slate-600 dark:text-slate-400 leading-tight">
            Acepto la política de tratamiento de datos personales conforme a la Ley 1581 de 2012.
          </label>
        </div>
        {errors.aceptoPrivacidad && <span className="text-xs text-red-500 block">{errors.aceptoPrivacidad.message}</span>}

        <button type="submit" disabled={isPending} className="w-full py-3 mt-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-lg transition-all shadow-lg shadow-indigo-500/25 flex justify-center items-center">
          {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Registrarse'}
        </button>
      </form>
    </div>
  );
};