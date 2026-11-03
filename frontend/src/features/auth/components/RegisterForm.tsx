import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterFormValues } from '../schemas/authSchema';
import { apiRequest } from '../../../api/apiClient';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export const RegisterForm = () => {
  const [isPending, setIsPending] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { aceptoPrivacidad: false, municipioDefaultId: '' },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsPending(true);
    setApiError(null);
    try {
      // Caso 1.2: Sanitización correcta con Object.fromEntries + filter
      const { confirmarPassword, ...payload } = data;
      const sanitizedPayload = Object.fromEntries(
        Object.entries(payload).filter(
          ([, value]) => value !== '' && value !== undefined && value !== null
        )
      );

      const response = await apiRequest<{
        datos: { token: string; usuario: { id: number; rol: string; nombreCompleto: string } };
      }>('/auth/registro-cliente', {
        method: 'POST',
        body: JSON.stringify(sanitizedPayload),
      });

      // Auto-login tras registro exitoso (Caso 19)
      if (response.datos?.token) {
        localStorage.setItem('token', response.datos.token);
        localStorage.setItem('usuario', JSON.stringify(response.datos.usuario));
        navigate('/');
      } else {
        // Fallback por si el backend no retorna token
        navigate('/login');
      }
    } catch (error: any) {
      setApiError(error.message);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-12rem)] py-8">
      <div className="w-full max-w-md p-8 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl rounded-2xl">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Crear Cuenta</h2>

        {apiError && (
          <div className="bg-red-100 text-red-600 p-2.5 rounded-lg mb-4 text-xs">{apiError}</div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label
              htmlFor="reg-nombre"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Nombre completo *
            </label>
            <input
              id="reg-nombre"
              {...register('nombreCompleto')}
              disabled={isPending}
              placeholder="Nombre completo *"
              aria-invalid={!!errors.nombreCompleto}
              className="w-full p-3 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 outline-none focus:ring-2 focus:ring-indigo-500 text-sm disabled:opacity-50"
            />
            {errors.nombreCompleto && (
              <span className="text-xs text-red-500 mt-1 block">{errors.nombreCompleto.message}</span>
            )}
          </div>

          <div>
            <label
              htmlFor="reg-correo"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Correo electrónico *
            </label>
            <input
              id="reg-correo"
              {...register('correo')}
              type="email"
              disabled={isPending}
              placeholder="Correo electrónico *"
              aria-invalid={!!errors.correo}
              className="w-full p-3 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 outline-none focus:ring-2 focus:ring-indigo-500 text-sm disabled:opacity-50"
            />
            {errors.correo && (
              <span className="text-xs text-red-500 mt-1 block">{errors.correo.message}</span>
            )}
          </div>

          <div>
            <label
              htmlFor="reg-password"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Contraseña (mín. 8 caracteres) *
            </label>
            <div className="relative">
              <input
                id="reg-password"
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                disabled={isPending}
                placeholder="Contraseña (mín. 8 caracteres) *"
                aria-invalid={!!errors.password}
                className="w-full p-3 pr-10 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 outline-none focus:ring-2 focus:ring-indigo-500 text-sm disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <span className="text-xs text-red-500 mt-1 block">{errors.password.message}</span>
            )}
          </div>

          <div>
            <label
              htmlFor="reg-confirm-password"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Confirmar contraseña *
            </label>
            <input
              id="reg-confirm-password"
              {...register('confirmarPassword')}
              type={showPassword ? 'text' : 'password'}
              disabled={isPending}
              placeholder="Confirmar contraseña *"
              aria-invalid={!!errors.confirmarPassword}
              className="w-full p-3 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 outline-none focus:ring-2 focus:ring-indigo-500 text-sm disabled:opacity-50"
            />
            {errors.confirmarPassword && (
              <span className="text-xs text-red-500 mt-1 block">
                {errors.confirmarPassword.message}
              </span>
            )}
          </div>

          <div>
            <label
              htmlFor="reg-telefono"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Teléfono (opcional)
            </label>
            <input
              id="reg-telefono"
              {...register('telefono')}
              disabled={isPending}
              placeholder="Teléfono (opcional)"
              className="w-full p-3 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 outline-none focus:ring-2 focus:ring-indigo-500 text-sm disabled:opacity-50"
            />
            {errors.telefono && (
              <span className="text-xs text-red-500 mt-1 block">{errors.telefono.message}</span>
            )}
          </div>

          <div>
            <label
              htmlFor="reg-direccion"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Dirección de entrega (opcional)
            </label>
            <input
              id="reg-direccion"
              {...register('direccionDefault')}
              disabled={isPending}
              placeholder="Dirección de entrega (opcional)"
              className="w-full p-3 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 outline-none focus:ring-2 focus:ring-indigo-500 text-sm disabled:opacity-50"
            />
          </div>

          {/* Caso 1.3: Campo municipioDefaultId habilitado en el JSX */}
          <div>
            <label
              htmlFor="reg-municipio"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Municipio / Código DANE (opcional)
            </label>
            <input
              id="reg-municipio"
              {...register('municipioDefaultId')}
              disabled={isPending}
              placeholder="Ej. 05001 (Medellín)"
              className="w-full p-3 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 outline-none focus:ring-2 focus:ring-indigo-500 text-sm disabled:opacity-50"
            />
            {errors.municipioDefaultId && (
              <span className="text-xs text-red-500 mt-1 block">
                {errors.municipioDefaultId.message}
              </span>
            )}
          </div>

          <div className="flex items-start gap-2 mt-4">
            <input
              type="checkbox"
              {...register('aceptoPrivacidad')}
              id="privacidad"
              disabled={isPending}
              className="mt-1 w-4 h-4 text-indigo-600 rounded"
            />
            <label
              htmlFor="privacidad"
              className="text-xs text-slate-600 dark:text-slate-400 leading-tight"
            >
              Acepto la{' '}
              <Link
                to="/politica-privacidad"
                target="_blank"
                className="text-indigo-600 underline font-medium"
              >
                política de tratamiento de datos personales
              </Link>{' '}
              conforme a la Ley 1581 de 2012.
            </label>
          </div>
          {errors.aceptoPrivacidad && (
            <span className="text-xs text-red-500 block">{errors.aceptoPrivacidad.message}</span>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 mt-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-lg transition-all shadow-lg shadow-indigo-500/25 flex justify-center items-center"
          >
            {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Registrarse'}
          </button>
        </form>

        {/* Caso 2.1: Enlace de retorno a login */}
        <div className="mt-4 text-center">
          <Link to="/login" className="text-sm text-indigo-600 hover:underline">
            ¿Ya tienes una cuenta? Inicia sesión
          </Link>
        </div>
      </div>
    </div>
  );
};