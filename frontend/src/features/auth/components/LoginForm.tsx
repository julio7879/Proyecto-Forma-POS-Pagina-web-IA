import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormValues } from '../schemas/authSchema';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../../../api/apiClient';
import { Eye, EyeOff, Loader2, Mail, KeyRound, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { GoogleAuthButton } from './GoogleAuthButton';
import { FormaLogo } from '../../../components/common/FormaLogo';
import { setPortalAuth, isTestEnv } from '../../../shared/auth/portalAuthStorage';

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

      const userRole = response.datos.usuario.rol;
      if (isTestEnv()) {
        localStorage.setItem('token', response.datos.token);
        localStorage.setItem('usuario', JSON.stringify(response.datos.usuario));
      }

      if (userRole === 'ADMIN') {
        setPortalAuth('admin', { token: response.datos.token, usuario: response.datos.usuario });
        navigate('/admin/dashboard');
      } else if (userRole === 'VENDEDOR') {
        setPortalAuth('pos', { token: response.datos.token, usuario: response.datos.usuario });
        navigate('/pos/venta');
      } else {
        setPortalAuth('storefront', { token: response.datos.token, usuario: response.datos.usuario });
        navigate('/');
      }
    } catch (error: any) {
      if (error.status === 423 || error.code === 'CUENTA_BLOQUEADA') {
        setIsLocked(true);
      }
      setApiError(error.message);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="relative flex flex-col justify-center items-center min-h-[calc(100vh-10rem)] py-10 px-4 overflow-hidden">
      {/* Burbujas 3D de Cristal Espejo Flotantes (Stitch Login Mirror Glass) */}
      <div
        className="mirror-bubble-3d w-40 h-40 absolute top-12 left-[8%] animate-float-3d hidden md:block"
        aria-hidden="true"
      />
      <div
        className="mirror-bubble-3d w-24 h-24 absolute bottom-28 left-[14%] animate-float-3d hidden md:block"
        style={{ animationDelay: '-3s' }}
        aria-hidden="true"
      />
      <div
        className="mirror-bubble-3d w-52 h-52 absolute bottom-16 right-[7%] animate-float-3d hidden md:block"
        style={{ animationDelay: '-5s' }}
        aria-hidden="true"
      />

      {/* Píldora Superior FORMA MAISON */}
      <div className="glass-mirror-pill px-5 py-1.5 rounded-full flex items-center gap-2 mb-6 z-10">
        <Sparkles className="w-3.5 h-3.5 text-[#D19650]" />
        <span className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#50322A]">
          FORMA MAISON • ACCESO EXCLUSIVO
        </span>
        <span className="w-1.5 h-1.5 rounded-full bg-[#D19650]" />
      </div>

      {/* Tarjeta Central en Cristal Espejo Esmerilado */}
      <div className="w-full max-w-[460px] p-8 sm:p-10 glass-mirror-card rounded-[2.25rem] z-10">
        {/* Monograma Oficial FORMA en Cápsula Espejo */}
        <div className="w-14 h-14 rounded-full glass-mirror-pill flex items-center justify-center mx-auto mb-4 text-[#50322A] shadow-sm">
          <FormaLogo variant="icon" size="sm" theme="light" />
        </div>

        <h1 className="text-3xl sm:text-4xl font-serif-editorial font-medium text-center text-[#50322A] tracking-tight mb-1.5">
          Bienvenido a FORMA
        </h1>
        <p className="text-xs sm:text-sm text-center text-[#171717]/75 mb-6">
          Inicia sesión o explora nuestras colecciones privadas
        </p>

        {/* Conmutador en Cápsula (Iniciar Sesión / Crear Cuenta) */}
        <div className="p-1 rounded-full bg-[#E7DED2]/80 border border-white/80 grid grid-cols-2 mb-6 shadow-inner">
          <span className="py-2 px-4 rounded-full bg-[#661521] text-white text-xs font-bold text-center shadow-md shadow-[#661521]/25">
            Iniciar Sesión
          </span>
          <Link
            to="/register"
            className="py-2 px-4 rounded-full text-xs font-semibold text-[#50322A] hover:text-[#661521] text-center transition-colors"
          >
            Crear Cuenta
          </Link>
        </div>

        {isLocked && (
          <div className="bg-amber-100/90 border border-[#D19650] text-[#50322A] p-3.5 rounded-2xl mb-4 text-xs font-medium">
            Cuenta bloqueada por seguridad tras 5 intentos fallidos. Espere 15 minutos antes de volver a intentar (RF-USU-02).
          </div>
        )}

        {apiError && !isLocked && (
          <div className="bg-[#661521]/10 border border-[#661521]/30 text-[#661521] p-3 rounded-2xl mb-4 text-xs font-semibold">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label
              htmlFor="login-correo"
              className="block text-[10px] font-bold uppercase tracking-[0.14em] text-[#50322A] mb-1.5 pl-2"
            >
              Credencial Digital (Correo)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#50322A]/70 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="login-correo"
                {...register('correo')}
                type="email"
                disabled={isPending}
                placeholder="Correo electrónico"
                aria-invalid={!!errors.correo}
                className="w-full py-3.5 pl-11 pr-10 rounded-full capsule-mirror-input text-sm text-[#171717] placeholder:text-[#50322A]/50 disabled:opacity-50"
              />
              <ShieldCheck className="w-4 h-4 text-[#D19650] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            {errors.correo && (
              <span className="text-xs text-[#661521] font-medium mt-1 pl-3 block">
                {errors.correo.message}
              </span>
            )}
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="block text-[10px] font-bold uppercase tracking-[0.14em] text-[#50322A] mb-1.5 pl-2"
            >
              Clave Maestra
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-[#50322A]/70 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="login-password"
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                disabled={isPending}
                placeholder="Contraseña"
                aria-invalid={!!errors.password}
                className="w-full py-3.5 pl-11 pr-11 rounded-full capsule-mirror-input text-sm text-[#171717] placeholder:text-[#50322A]/50 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#50322A]/70 hover:text-[#661521]"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <span className="text-xs text-[#661521] font-medium mt-1 pl-3 block">
                {errors.password.message}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between px-2 pt-1 text-xs">
            <label className="inline-flex items-center gap-2 cursor-pointer text-[#50322A]">
              <input
                type="checkbox"
                defaultChecked
                className="w-3.5 h-3.5 rounded-full accent-[#661521]"
              />
              <span>Recordar sesión</span>
            </label>
            <span className="text-[#661521] font-semibold hover:underline cursor-pointer">
              ¿Olvidaste tu contraseña?
            </span>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3.5 mt-2 bg-[#661521] hover:bg-[#4A0E17] text-white font-bold text-sm rounded-full transition-all disabled:opacity-50 flex justify-center items-center gap-2 shadow-xl shadow-[#661521]/25 border border-[#D19650]/40 active:scale-[0.99]"
          >
            {isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>Ingresar</span>
                <ArrowRight className="w-4 h-4 text-[#D19650]" />
              </>
            )}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#50322A]/15" />
          </div>
          <div className="relative flex justify-center text-[10px] font-bold tracking-[0.16em] uppercase">
            <span className="glass-mirror-pill px-3 py-0.5 rounded-full text-[#50322A]/80">
              O continúa con
            </span>
          </div>
        </div>

        <GoogleAuthButton onError={(msg) => setApiError(msg)} />

        <div className="mt-6 pt-4 border-t border-[#50322A]/10 text-center text-xs text-[#50322A]">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="font-bold text-[#661521] underline hover:text-[#D19650] transition-colors">
            Solicitar Membresía / Regístrate
          </Link>
        </div>
      </div>
    </div>
  );
};
