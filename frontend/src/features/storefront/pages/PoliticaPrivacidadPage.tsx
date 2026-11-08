import React from 'react';
import { ShieldCheck, Lock, Mail, ExternalLink, CheckCircle2, UserCheck, Database, KeyRound } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PoliticaPrivacidadPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-10 px-4">
      {/* Header Editorial */}
      <div className="text-center mb-10 sm:mb-14">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D19650]/15 border border-[#D19650]/30 text-[#8A5828] text-xs font-semibold tracking-wide uppercase mb-4">
          <ShieldCheck className="w-4 h-4 text-[#C49A68]" />
          <span>Transparencia, Confianza & Seguridad</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1C1311] tracking-tight mb-3">
          Política de Privacidad de FORMA Tienda & POS
        </h1>
        <p className="text-sm sm:text-base text-[#77736E] font-medium">
          Última actualización: <span className="text-[#1C1311] font-semibold">8 de noviembre de 2026</span>
        </p>
      </div>

      {/* Introducción General */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white/90 backdrop-blur-xl border border-[#E7E0D8] shadow-sm mb-8">
        <p className="text-[#292827] text-base leading-relaxed">
          En <strong className="text-[#1C1311]">FORMA Tienda & POS</strong> (accesible desde{' '}
          <a
            href="https://proyecto-forma-pos-pagina-web-ia.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#741C2B] font-semibold hover:underline inline-flex items-center gap-1"
          >
            https://proyecto-forma-pos-pagina-web-ia.vercel.app
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          ), la privacidad y protección de los datos de nuestros usuarios es una prioridad. Este documento detalla qué información recopilamos, cómo la utilizamos y las medidas que implementamos para protegerla.
        </p>
      </div>

      <div className="space-y-6">
        {/* 1. Información que recopilamos */}
        <section className="p-6 sm:p-8 rounded-3xl bg-white/90 backdrop-blur-xl border border-[#E7E0D8] shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-[#741C2B]/10 flex items-center justify-center text-[#741C2B] font-bold text-sm">
              1
            </div>
            <h2 className="text-xl font-bold text-[#1C1311]">Información que recopilamos</h2>
          </div>
          <p className="text-[#403E3C] text-sm leading-relaxed mb-4">
            FORMA Tienda & POS únicamente solicita y recopila los datos mínimos necesarios para la autenticación e identificación del usuario a través del inicio de sesión con Google (Google OAuth):
          </p>
          <ul className="space-y-3 mb-5">
            <li className="flex items-start gap-3 text-sm text-[#292827]">
              <CheckCircle2 className="w-4 h-4 text-[#2E7D32] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#1C1311]">Nombre completo y apellido:</strong> Utilizado para personalizar la interfaz de usuario y mostrar el perfil de la cuenta.
              </div>
            </li>
            <li className="flex items-start gap-3 text-sm text-[#292827]">
              <CheckCircle2 className="w-4 h-4 text-[#2E7D32] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#1C1311]">Dirección de correo electrónico:</strong> Utilizada como identificador único de cuenta para iniciar sesión, enviar notificaciones del sistema y gestionar el acceso a los datos de su tienda/POS.
              </div>
            </li>
            <li className="flex items-start gap-3 text-sm text-[#292827]">
              <CheckCircle2 className="w-4 h-4 text-[#2E7D32] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#1C1311]">Foto de perfil pública:</strong> Utilizada exclusivamente para mostrar el avatar del usuario dentro de la aplicación.
              </div>
            </li>
          </ul>

          <div className="p-4 rounded-2xl bg-[#FFF8F0] border border-[#D19650]/30 flex items-start gap-3 text-xs sm:text-sm text-[#8A5828]">
            <Lock className="w-4 h-4 text-[#C49A68] shrink-0 mt-0.5" />
            <p>
              <strong>Compromiso de Cero Intrusión:</strong> No recopilamos ni solicitamos contraseñas de cuentas de Google, ni accedemos a contactos, archivos en Google Drive, correos de Gmail o cualquier otro dato sensible.
            </p>
          </div>
        </section>

        {/* 2. Uso de la información */}
        <section className="p-6 sm:p-8 rounded-3xl bg-white/90 backdrop-blur-xl border border-[#E7E0D8] shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-[#741C2B]/10 flex items-center justify-center text-[#741C2B] font-bold text-sm">
              2
            </div>
            <h2 className="text-xl font-bold text-[#1C1311]">Uso de la información</h2>
          </div>
          <p className="text-[#403E3C] text-sm leading-relaxed mb-4">
            La información recopilada se utiliza exclusivamente para:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-[#F5F3EF] border border-[#E7E0D8]">
              <KeyRound className="w-5 h-5 text-[#741C2B] mb-2" />
              <h3 className="font-semibold text-xs sm:text-sm text-[#1C1311] mb-1">Acceso Seguro</h3>
              <p className="text-xs text-[#77736E] leading-relaxed">
                Autenticar y permitir el acceso seguro a la plataforma FORMA Tienda & POS.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-[#F5F3EF] border border-[#E7E0D8]">
              <Database className="w-5 h-5 text-[#C49A68] mb-2" />
              <h3 className="font-semibold text-xs sm:text-sm text-[#1C1311] mb-1">Trazabilidad Operativa</h3>
              <p className="text-xs text-[#77736E] leading-relaxed">
                Asociar los registros, ventas, inventarios y configuraciones del punto de venta a la cuenta del usuario correspondiente.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-[#F5F3EF] border border-[#E7E0D8]">
              <UserCheck className="w-5 h-5 text-[#2E7D32] mb-2" />
              <h3 className="font-semibold text-xs sm:text-sm text-[#1C1311] mb-1">Atención & Soporte</h3>
              <p className="text-xs text-[#77736E] leading-relaxed">
                Proveer soporte técnico y responder a consultas sobre el servicio.
              </p>
            </div>
          </div>
        </section>

        {/* 3. Almacenamiento y seguridad */}
        <section className="p-6 sm:p-8 rounded-3xl bg-white/90 backdrop-blur-xl border border-[#E7E0D8] shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-[#741C2B]/10 flex items-center justify-center text-[#741C2B] font-bold text-sm">
              3
            </div>
            <h2 className="text-xl font-bold text-[#1C1311]">Almacenamiento y seguridad</h2>
          </div>
          <p className="text-[#403E3C] text-sm leading-relaxed">
            Implementamos estándares y medidas de seguridad técnicas y organizativas para proteger los datos de accesos no autorizados, alteración o pérdida. La información de autenticación se gestiona mediante protocolos seguros (HTTPS y tokens OAuth 2.0).
          </p>
        </section>

        {/* 4. Compartir datos con terceros */}
        <section className="p-6 sm:p-8 rounded-3xl bg-white/90 backdrop-blur-xl border border-[#E7E0D8] shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-[#741C2B]/10 flex items-center justify-center text-[#741C2B] font-bold text-sm">
              4
            </div>
            <h2 className="text-xl font-bold text-[#1C1311]">Compartir datos con terceros</h2>
          </div>
          <p className="text-[#403E3C] text-sm leading-relaxed">
            No vendemos, alquilamos ni transferimos datos personales a terceros con fines publicitarios, de marketing ni comerciales. Los datos únicamente se procesan para el funcionamiento interno de la aplicación.
          </p>
        </section>

        {/* 5. Conservación y eliminación de datos */}
        <section className="p-6 sm:p-8 rounded-3xl bg-white/90 backdrop-blur-xl border border-[#E7E0D8] shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-[#741C2B]/10 flex items-center justify-center text-[#741C2B] font-bold text-sm">
              5
            </div>
            <h2 className="text-xl font-bold text-[#1C1311]">Conservación y eliminación de datos</h2>
          </div>
          <p className="text-[#403E3C] text-sm leading-relaxed">
            Conservamos los datos del usuario mientras la cuenta permanezca activa en FORMA Tienda & POS. Los usuarios pueden solicitar la eliminación total de sus datos y registros en cualquier momento poniéndose en contacto con nosotros.
          </p>
        </section>

        {/* 6. Derechos del usuario */}
        <section className="p-6 sm:p-8 rounded-3xl bg-white/90 backdrop-blur-xl border border-[#E7E0D8] shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-[#741C2B]/10 flex items-center justify-center text-[#741C2B] font-bold text-sm">
              6
            </div>
            <h2 className="text-xl font-bold text-[#1C1311]">Derechos del usuario</h2>
          </div>
          <p className="text-[#403E3C] text-sm leading-relaxed mb-4">
            Usted tiene derecho a consultar, rectificar o solicitar la revocación del acceso a sus datos. Puede desvincular el acceso de FORMA Tienda & POS a su cuenta de Google en cualquier momento desde la configuración de seguridad de su cuenta de Google:
          </p>
          <a
            href="https://myaccount.google.com/permissions"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F5F3EF] hover:bg-[#E7E0D8] text-[#1C1311] text-xs sm:text-sm font-semibold transition-colors border border-[#E7E0D8]"
          >
            <span>Gestionar permisos en Google Account</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#741C2B]" />
          </a>
        </section>

        {/* 7. Contacto */}
        <section className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#FAF6F0] to-[#F5F3EF] border border-[#D19650]/40 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-[#741C2B] flex items-center justify-center text-white font-bold text-sm">
              7
            </div>
            <h2 className="text-xl font-bold text-[#1C1311]">Contacto</h2>
          </div>
          <p className="text-[#403E3C] text-sm leading-relaxed mb-5">
            Si tienes preguntas o inquietudes respecto a esta Política de Privacidad, puedes comunicarte con el desarrollador a través del correo oficial:
          </p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <a
              href="mailto:julioveg567@gmail.com"
              className="inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-[#1C1311] hover:bg-[#741C2B] text-white text-xs sm:text-sm font-semibold transition-all shadow-sm"
            >
              <Mail className="w-4 h-4 text-[#D19650]" />
              <span>julioveg567@gmail.com</span>
            </a>
            <Link
              to="/soporte"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-white hover:bg-[#FAF6F0] text-[#1C1311] text-xs sm:text-sm font-semibold transition-colors border border-[#E7E0D8]"
            >
              <span>Centro de Soporte & WhatsApp</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PoliticaPrivacidadPage;
