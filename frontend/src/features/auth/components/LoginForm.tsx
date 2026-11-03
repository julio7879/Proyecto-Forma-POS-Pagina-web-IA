import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormValues } from '../schemas/authSchema';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../../../api/apiClient';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export const LoginForm = () => {
  const [isPending, setIsPending] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsPending(true);
    setApiError(null);
    setIsLocked(false);
    try {
      const response = await apiRequest<{
        datos: { token: string; usuario: { id: number; rol: string; nombreCompleto: string } };
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      // Guardamos token y snapshot del usuario para el Navbar (Caso 14)
      localStorage.setItem('token', response.datos.token);
      localStorage.setItem('usuario', JSON.stringify(response.datos.usuario));

      // Redirección canónica por rol (RN-GEN-01, Caso 2)
      const userRole = response.datos.usuario.rol;
      if (userRole === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (userRole === 'VENDEDOR') {
        navigate('/pos/venta');
      } else {
        navigate('/');
      }
    } catch (error: any) {
      // Manejo del bloqueo por fuerza bruta (HTTP 423, Caso 15)
      if (error.status === 423 || error.code === 'CUENTA_BLOQUEADA') {
        setIsLocked(true);
      }
      setApiError(error.message);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-12rem)] py-8">
      <div className="w-full max-w-md p-8 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl rounded-2xl">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Iniciar Sesión</h2>

        {isLocked && (
          <div className="bg-amber-100 border border-amber-300 text-amber-800 p-3 rounded-lg mb-4 text-xs font-medium">
            Cuenta bloqueada por seguridad tras 5 intentos fallidos. Espere 15 minutos antes de volver a intentar (RF-USU-02).
          </div>
        )}

        {apiError && !isLocked && (
          <div className="bg-red-100 text-red-600 p-2.5 rounded-lg mb-4 text-xs">{apiError}</div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label
              htmlFor="login-correo"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Correo electrónico
            </label>
            <input
              id="login-correo"
              {...register('correo')}
              type="email"
              disabled={isPending}
              placeholder="Correo electrónico"
              aria-invalid={!!errors.correo}
              className="w-full p-3 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 outline-none focus:ring-2 focus:ring-indigo-500 text-sm disabled:opacity-50"
            />
            {errors.correo && (
              <span className="text-xs text-red-500 mt-1 block">{errors.correo.message}</span>
            )}
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Contraseña
            </label>
            <div className="relative">
              <input
                id="login-password"
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                disabled={isPending}
                placeholder="Contraseña"
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

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 mt-2 bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-semibold rounded-lg transition-all disabled:opacity-50 flex justify-center items-center"
          >
            {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Ingresar'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link to="/register" className="text-sm text-indigo-600 hover:underline">
            ¿No tienes cuenta? Regístrate
          </Link>
        </div>
      </div>
    </div>
  );
};