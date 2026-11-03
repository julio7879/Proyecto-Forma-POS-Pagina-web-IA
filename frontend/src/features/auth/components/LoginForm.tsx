import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormValues } from '../schemas/authSchema';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../../../api/apiClient';

export const LoginForm = () => {
  const [isPending, setIsPending] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsPending(true);
    setApiError(null);
    try {
      // Tipamos la respuesta esperada del backend
      const response = await apiRequest<{ datos: { token: string; usuario: { rol: string } } }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      // El backend devuelve la data dentro de 'datos'
      localStorage.setItem('token', response.datos.token);
      
      // Redirección por Rol (RN-GEN-01)
      const userRole = response.datos.usuario.rol; 
      if (userRole === 'ADMIN' || userRole === 'VENDEDOR') {
        navigate('/pos');
      } else {
        navigate('/');
      }
    } catch (error: any) {
      setApiError(error.message);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl rounded-2xl">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Iniciar Sesión</h2>
      {apiError && <div className="bg-red-100 text-red-600 p-2 rounded mb-4 text-sm">{apiError}</div>}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          {/* Cambiamos register('email') por register('correo') */}
          <input {...register('correo')} type="email" placeholder="Correo electrónico" className="w-full p-3 rounded-lg bg-slate-100 dark:bg-slate-800 border-none outline-none focus:ring-2 ring-indigo-500 text-sm" />
          {errors.correo && <span className="text-xs text-red-500">{errors.correo.message}</span>}
        </div>
        <div>
          <input {...register('password')} type="password" placeholder="Contraseña" className="w-full p-3 rounded-lg bg-slate-100 dark:bg-slate-800 border-none outline-none focus:ring-2 ring-indigo-500 text-sm" />
          {errors.password && <span className="text-xs text-red-500">{errors.password.message}</span>}
        </div>
        <button type="submit" disabled={isPending} className="w-full py-3 mt-2 bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-semibold rounded-lg transition-all disabled:opacity-50">
          {isPending ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
      <div className="mt-4 text-center">
        <Link to="/register" className="text-sm text-indigo-600 hover:underline">¿No tienes cuenta? Regístrate</Link>
      </div>
    </div>
  );
};