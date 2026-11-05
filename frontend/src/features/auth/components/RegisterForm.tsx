import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterFormValues } from '../schemas/authSchema';
import { apiRequest } from '../../../api/apiClient';
import { Loader2, Eye, EyeOff, Sparkles, UserPlus, ArrowRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleAuthButton } from './GoogleAuthButton';

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

      if (response.datos?.token) {
        localStorage.setItem('token', response.datos.token);
        localStorage.setItem('usuario', JSON.stringify(response.datos.usuario));
        navigate('/');
      } else {
        navigate('/login');
      }
    } catch (error: any) {
      setApiError(error.message);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="relative flex flex-col justify-center items-center min-h-[calc(100vh-10rem)] py-10 px-4 overflow-hidden">
      {/* Burbujas 3D de Cristal Espejo */}
      <div
        className="mirror-bubble-3d w-36 h-36 absolute top-14 left-[7%] animate-float-3d hidden md:block"
        aria-hidden="true"
      />
      <div
        className="mirror-bubble-3d w-48 h-48 absolute bottom-16 right-[7%] animate-float-3d hidden md:block"
        style={{ animationDelay: '-4s' }}
        aria-hidden="true"
      />

      <div className="glass-mirror-pill px-5 py-1.5 rounded-full flex items-center gap-2 mb-6 z-10">
        <Sparkles className="w-3.5 h-3.5 text-[#D19650]" />
        <span className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#50322A]">
          FORMA MAISON • MEMBRESÍA CLIENTE
        </span>
      </div>

      <div className="w-full max-w-[520px] p-8 sm:p-10 glass-mirror-card rounded-[2.25rem] z-10">
        <div className="w-12 h-12 rounded-full glass-mirror-pill flex items-center justify-center mx-auto mb-3 text-[#50322A]">
          <UserPlus className="w-5 h-5" />
        </div>

        <h2 className="text-3xl font-serif-editorial font-medium text-center text-[#50322A] mb-1">
          Crear Cuenta
        </h2>
        <p className="text-xs text-center text-[#171717]/75 mb-5">
          Regístrate para comprar con despacho DANE desde nuestras 4 sedes
        </p>

        {/* Conmutador en Cápsula */}
        <div className="p-1 rounded-full bg-[#E7DED2]/80 border border-white/80 grid grid-cols-2 mb-6 shadow-inner">
          <Link
            to="/login"
            className="py-2 px-4 rounded-full text-xs font-semibold text-[#50322A] hover:text-[#661521] text-center transition-colors"
          >
            Iniciar Sesión
          </Link>
          <span className="py-2 px-4 rounded-full bg-[#661521] text-white text-xs font-bold text-center shadow-md shadow-[#661521]/25">
            Crear Cuenta
          </span>
        </div>

        {apiError && (
          <div className="bg-[#661521]/10 border border-[#661521]/30 text-[#661521] p-3 rounded-2xl mb-4 text-xs font-semibold">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label
                htmlFor="reg-nombre"
                className="block text-[10px] font-bold uppercase tracking-wider text-[#50322A] mb-1 pl-2"
              >
                Nombre completo *
              </label>
              <input
                id="reg-nombre"
                {...register('nombreCompleto')}
                disabled={isPending}
                placeholder="Nombre completo *"
                aria-invalid={!!errors.nombreCompleto}
                className="w-full py-3 px-4 rounded-full capsule-mirror-input text-xs text-[#171717] placeholder:text-[#50322A]/50 disabled:opacity-50"
              />
              {errors.nombreCompleto && (
                <span className="text-[11px] text-[#661521] font-medium mt-1 pl-2 block">
                  {errors.nombreCompleto.message}
                </span>
              )}
            </div>

            <div>
              <label
                htmlFor="reg-correo"
                className="block text-[10px] font-bold uppercase tracking-wider text-[#50322A] mb-1 pl-2"
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
                className="w-full py-3 px-4 rounded-full capsule-mirror-input text-xs text-[#171717] placeholder:text-[#50322A]/50 disabled:opacity-50"
              />
              {errors.correo && (
                <span className="text-[11px] text-[#661521] font-medium mt-1 pl-2 block">
                  {errors.correo.message}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label
                htmlFor="reg-password"
                className="block text-[10px] font-bold uppercase tracking-wider text-[#50322A] mb-1 pl-2"
              >
                Contraseña (mín. 8) *
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  disabled={isPending}
                  placeholder="Contraseña (mín. 8 caracteres) *"
                  aria-invalid={!!errors.password}
                  className="w-full py-3 pl-4 pr-9 rounded-full capsule-mirror-input text-xs text-[#171717] placeholder:text-[#50322A]/50 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#50322A]/70 hover:text-[#661521]"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <span className="text-[11px] text-[#661521] font-medium mt-1 pl-2 block">
                  {errors.password.message}
                </span>
              )}
            </div>

            <div>
              <label
                htmlFor="reg-confirm-password"
                className="block text-[10px] font-bold uppercase tracking-wider text-[#50322A] mb-1 pl-2"
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
                className="w-full py-3 px-4 rounded-full capsule-mirror-input text-xs text-[#171717] placeholder:text-[#50322A]/50 disabled:opacity-50"
              />
              {errors.confirmarPassword && (
                <span className="text-[11px] text-[#661521] font-medium mt-1 pl-2 block">
                  {errors.confirmarPassword.message}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="reg-telefono"
                className="block text-[10px] font-bold uppercase tracking-wider text-[#50322A] mb-1 pl-2"
              >
                Teléfono
              </label>
              <input
                id="reg-telefono"
                {...register('telefono')}
                disabled={isPending}
                placeholder="Teléfono (opcional)"
                className="w-full py-2.5 px-3.5 rounded-full capsule-mirror-input text-xs text-[#171717] placeholder:text-[#50322A]/50 disabled:opacity-50"
              />
              {errors.telefono && (
                <span className="text-[11px] text-[#661521] mt-1 pl-2 block">
                  {errors.telefono.message}
                </span>
              )}
            </div>

            <div>
              <label
                htmlFor="reg-direccion"
                className="block text-[10px] font-bold uppercase tracking-wider text-[#50322A] mb-1 pl-2"
              >
                Dirección
              </label>
              <input
                id="reg-direccion"
                {...register('direccionDefault')}
                disabled={isPending}
                placeholder="Dirección de entrega (opcional)"
                className="w-full py-2.5 px-3.5 rounded-full capsule-mirror-input text-xs text-[#171717] placeholder:text-[#50322A]/50 disabled:opacity-50"
              />
            </div>

            <div>
              <label
                htmlFor="reg-municipio"
                className="block text-[10px] font-bold uppercase tracking-wider text-[#50322A] mb-1 pl-2"
              >
                Código DANE
              </label>
              <input
                id="reg-municipio"
                {...register('municipioDefaultId')}
                disabled={isPending}
                placeholder="Ej. 05001 (Medellín)"
                className="w-full py-2.5 px-3.5 rounded-full capsule-mirror-input text-xs text-[#171717] placeholder:text-[#50322A]/50 disabled:opacity-50"
              />
              {errors.municipioDefaultId && (
                <span className="text-[11px] text-[#661521] mt-1 pl-2 block">
                  {errors.municipioDefaultId.message}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-start gap-2.5 pt-2 px-2">
            <input
              type="checkbox"
              {...register('aceptoPrivacidad')}
              id="privacidad"
              disabled={isPending}
              className="mt-0.5 w-4 h-4 accent-[#661521] rounded"
            />
            <label htmlFor="privacidad" className="text-xs text-[#50322A] leading-tight">
              Acepto la{' '}
              <Link
                to="/politica-privacidad"
                target="_blank"
                className="text-[#661521] underline font-bold"
              >
                política de tratamiento de datos personales
              </Link>{' '}
              conforme a la Ley 1581 de 2012.
            </label>
          </div>
          {errors.aceptoPrivacidad && (
            <span className="text-xs text-[#661521] font-medium pl-2 block">
              {errors.aceptoPrivacidad.message}
            </span>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3.5 mt-2 bg-[#661521] hover:bg-[#4A0E17] disabled:opacity-50 text-white font-bold text-sm rounded-full transition-all shadow-xl shadow-[#661521]/25 border border-[#D19650]/40 flex justify-center items-center gap-2"
          >
            {isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>Registrarse</span>
                <ArrowRight className="w-4 h-4 text-[#D19650]" />
              </>
            )}
          </button>
        </form>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#50322A]/15" />
          </div>
          <div className="relative flex justify-center text-[10px] font-bold tracking-[0.16em] uppercase">
            <span className="glass-mirror-pill px-3 py-0.5 rounded-full text-[#50322A]/80">
              O regístrate con
            </span>
          </div>
        </div>

        <GoogleAuthButton onError={(msg) => setApiError(msg)} text="Continuar con Google" />

        <div className="mt-5 text-center text-xs text-[#50322A]">
          <Link to="/login" className="font-bold text-[#661521] hover:underline">
            ¿Ya tienes una cuenta? Inicia sesión
          </Link>
        </div>
      </div>
    </div>
  );
};
