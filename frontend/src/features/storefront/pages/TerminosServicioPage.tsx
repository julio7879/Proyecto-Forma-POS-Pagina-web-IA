import React from 'react';
import { FileText, Shield, UserCheck, AlertTriangle, Copyright, RefreshCw, Mail, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TerminosServicioPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-10 px-4">
      {/* Header Editorial */}
      <div className="text-center mb-10 sm:mb-14">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D19650]/15 border border-[#D19650]/30 text-[#8A5828] text-xs font-semibold tracking-wide uppercase mb-4">
          <FileText className="w-4 h-4 text-[#C49A68]" />
          <span>Marco Legal & Condiciones de Uso</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1C1311] tracking-tight mb-3">
          Condiciones del Servicio de FORMA Tienda & POS
        </h1>
        <p className="text-sm sm:text-base text-[#77736E] font-medium">
          Última actualización: <span className="text-[#1C1311] font-semibold">8 de noviembre de 2026</span>
        </p>
      </div>

      {/* Bienvenida e Introducción General */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white/90 backdrop-blur-xl border border-[#E7E0D8] shadow-sm mb-8">
        <p className="text-[#292827] text-base leading-relaxed">
          Bienvenido a <strong className="text-[#1C1311]">FORMA Tienda & POS</strong>. Al acceder o utilizar nuestra aplicación web (accesible desde{' '}
          <a
            href="https://proyecto-forma-pos-pagina-web-ia.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#741C2B] font-semibold hover:underline inline-flex items-center gap-1"
          >
            https://proyecto-forma-pos-pagina-web-ia.vercel.app
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          ), aceptas cumplir y estar sujeto a los siguientes términos y condiciones de uso. Si no estás de acuerdo con alguna parte de estos términos, no debes utilizar la plataforma.
        </p>
      </div>

      <div className="space-y-6">
        {/* 1. Descripción del Servicio */}
        <section className="p-6 sm:p-8 rounded-3xl bg-white/90 backdrop-blur-xl border border-[#E7E0D8] shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-[#741C2B]/10 flex items-center justify-center text-[#741C2B] font-bold text-sm">
              1
            </div>
            <h2 className="text-xl font-bold text-[#1C1311]">Descripción del Servicio</h2>
          </div>
          <p className="text-[#403E3C] text-sm leading-relaxed">
            FORMA Tienda & POS es una plataforma web orientada a la gestión de puntos de venta, inventario, ventas y administración de comercios. Permite la autenticación de usuarios mediante cuentas de Google a través de Google OAuth.
          </p>
        </section>

        {/* 2. Registro y Cuentas de Usuario */}
        <section className="p-6 sm:p-8 rounded-3xl bg-white/90 backdrop-blur-xl border border-[#E7E0D8] shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-[#741C2B]/10 flex items-center justify-center text-[#741C2B] font-bold text-sm">
              2
            </div>
            <h2 className="text-xl font-bold text-[#1C1311]">Registro y Cuentas de Usuario</h2>
          </div>
          <ul className="space-y-3 text-sm text-[#403E3C] leading-relaxed">
            <li className="flex items-start gap-3">
              <UserCheck className="w-4 h-4 text-[#C49A68] shrink-0 mt-0.5" />
              <span>Para acceder a las funcionalidades del sistema, el usuario debe autenticarse mediante una cuenta de Google autorizada.</span>
            </li>
            <li className="flex items-start gap-3">
              <Shield className="w-4 h-4 text-[#C49A68] shrink-0 mt-0.5" />
              <span>El usuario es el único responsable de mantener la seguridad y confidencialidad de su cuenta y de todas las actividades que ocurran bajo su sesión.</span>
            </li>
            <li className="flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-[#C49A68] shrink-0 mt-0.5" />
              <span>Nos reservamos el derecho de suspender o cancelar cuentas que violen estos términos o que hagan un uso indebido de la plataforma.</span>
            </li>
          </ul>
        </section>

        {/* 3. Uso Aceptable */}
        <section className="p-6 sm:p-8 rounded-3xl bg-white/90 backdrop-blur-xl border border-[#E7E0D8] shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-[#741C2B]/10 flex items-center justify-center text-[#741C2B] font-bold text-sm">
              3
            </div>
            <h2 className="text-xl font-bold text-[#1C1311]">Uso Aceptable</h2>
          </div>
          <p className="text-[#403E3C] text-sm leading-relaxed mb-4">
            Al utilizar FORMA Tienda & POS, el usuario se compromete a:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-[#F5F3EF] border border-[#E7E0D8] text-xs sm:text-sm text-[#292827]">
              <strong className="text-[#1C1311] block mb-1">Finalidad Legal</strong>
              No utilizar el servicio para fines ilegales o no autorizados.
            </div>
            <div className="p-4 rounded-2xl bg-[#F5F3EF] border border-[#E7E0D8] text-xs sm:text-sm text-[#292827]">
              <strong className="text-[#1C1311] block mb-1">Integridad de Seguridad</strong>
              No intentar vulnerar, eludir o comprometer las medidas de seguridad, autenticación o infraestructura del servicio.
            </div>
            <div className="p-4 rounded-2xl bg-[#F5F3EF] border border-[#E7E0D8] text-xs sm:text-sm text-[#292827]">
              <strong className="text-[#1C1311] block mb-1">Cero Código Malicioso</strong>
              No cargar contenido malicioso, virus o cualquier código de naturaleza destructiva.
            </div>
            <div className="p-4 rounded-2xl bg-[#F5F3EF] border border-[#E7E0D8] text-xs sm:text-sm text-[#292827]">
              <strong className="text-[#1C1311] block mb-1">Veracidad de Datos</strong>
              Proporcionar datos e información verídica dentro de los registros del sistema.
            </div>
          </div>
        </section>

        {/* 4. Propiedad Intelectual */}
        <section className="p-6 sm:p-8 rounded-3xl bg-white/90 backdrop-blur-xl border border-[#E7E0D8] shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-[#741C2B]/10 flex items-center justify-center text-[#741C2B] font-bold text-sm">
              4
            </div>
            <h2 className="text-xl font-bold text-[#1C1311]">Propiedad Intelectual</h2>
          </div>
          <p className="text-[#403E3C] text-sm leading-relaxed flex items-start gap-3">
            <Copyright className="w-5 h-5 text-[#C49A68] shrink-0 mt-0.5" />
            <span>
              Todos los derechos, logotipos, diseños, código fuente y elementos gráficos relacionados con FORMA Tienda & POS son propiedad exclusiva de sus desarrolladores. No se concede ninguna licencia sobre dichos elementos fuera del uso normal previsto de la aplicación.
            </span>
          </p>
        </section>

        {/* 5. Disponibilidad y Modificaciones del Servicio */}
        <section className="p-6 sm:p-8 rounded-3xl bg-white/90 backdrop-blur-xl border border-[#E7E0D8] shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-[#741C2B]/10 flex items-center justify-center text-[#741C2B] font-bold text-sm">
              5
            </div>
            <h2 className="text-xl font-bold text-[#1C1311]">Disponibilidad y Modificaciones del Servicio</h2>
          </div>
          <div className="space-y-3 text-sm text-[#403E3C] leading-relaxed">
            <p>
              Nos esforzamos por garantizar la disponibilidad constante del servicio; no obstante, el acceso puede interrumpirse temporalmente por tareas de mantenimiento, actualizaciones o causas fuera de nuestro control razonable.
            </p>
            <p>
              Nos reservamos el derecho de actualizar, modificar o discontinuar funciones del sistema en cualquier momento con el fin de mejorar la experiencia y seguridad de los usuarios.
            </p>
          </div>
        </section>

        {/* 6. Limitación de Responsabilidad */}
        <section className="p-6 sm:p-8 rounded-3xl bg-white/90 backdrop-blur-xl border border-[#E7E0D8] shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-[#741C2B]/10 flex items-center justify-center text-[#741C2B] font-bold text-sm">
              6
            </div>
            <h2 className="text-xl font-bold text-[#1C1311]">Limitación de Responsabilidad</h2>
          </div>
          <p className="text-[#403E3C] text-sm leading-relaxed">
            FORMA Tienda & POS se proporciona <strong className="text-[#1C1311]">&quot;tal cual&quot;</strong> y <strong className="text-[#1C1311]">&quot;según disponibilidad&quot;</strong>. No nos hacemos responsables por pérdidas comerciales, errores de cálculo derivados de datos mal ingresados por el usuario, interrupciones técnicas o fallos derivados de servicios de terceros (como caídas en los servidores de hosting o de las API de Google).
          </p>
        </section>

        {/* 7. Modificación de los Términos */}
        <section className="p-6 sm:p-8 rounded-3xl bg-white/90 backdrop-blur-xl border border-[#E7E0D8] shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-[#741C2B]/10 flex items-center justify-center text-[#741C2B] font-bold text-sm">
              7
            </div>
            <h2 className="text-xl font-bold text-[#1C1311]">Modificación de los Términos</h2>
          </div>
          <p className="text-[#403E3C] text-sm leading-relaxed flex items-start gap-3">
            <RefreshCw className="w-5 h-5 text-[#741C2B] shrink-0 mt-0.5" />
            <span>
              Podemos revisar y actualizar estas Condiciones del Servicio periódicamente. Los cambios entrarán en vigencia inmediatamente después de su publicación en esta página.
            </span>
          </p>
        </section>

        {/* 8. Contacto */}
        <section className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#FAF6F0] to-[#F5F3EF] border border-[#D19650]/40 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-[#741C2B] flex items-center justify-center text-white font-bold text-sm">
              8
            </div>
            <h2 className="text-xl font-bold text-[#1C1311]">Contacto</h2>
          </div>
          <p className="text-[#403E3C] text-sm leading-relaxed mb-5">
            Para resolver dudas, soporte técnico o consultas relacionadas con estas Condiciones del Servicio, puedes comunicarte a:
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
              to="/privacidad"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-white hover:bg-[#FAF6F0] text-[#1C1311] text-xs sm:text-sm font-semibold transition-colors border border-[#E7E0D8]"
            >
              <span>Ver Política de Privacidad</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default TerminosServicioPage;
