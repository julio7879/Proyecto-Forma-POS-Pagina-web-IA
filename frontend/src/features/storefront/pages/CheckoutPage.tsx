import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  ShoppingBag,
  Truck,
  QrCode,
  Building2,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Clock,
  Sparkles,
  Lock,
  User,
  CreditCard,
  MailCheck,
  ExternalLink,
} from 'lucide-react';
import { apiRequest } from '../../../api/apiClient';
import { useStorefrontCart } from '../context/StorefrontCartContext';
import { CartItem } from '../types';

interface DestinoDANE {
  codigo: string;
  departamento: string;
  ciudad: string;
  sedeSugerida: string;
  fleteCop: number;
  permiteContraentrega: boolean;
}

const DESTINOS_DANE: DestinoDANE[] = [
  {
    codigo: '54001',
    departamento: 'Norte de Santander',
    ciudad: 'Cúcuta',
    sedeSugerida: 'Punto Centro (Cúcuta)',
    fleteCop: 8000,
    permiteContraentrega: true,
  },
  {
    codigo: '68001',
    departamento: 'Santander',
    ciudad: 'Bucaramanga',
    sedeSugerida: 'Punto Bucaramanga',
    fleteCop: 8000,
    permiteContraentrega: true,
  },
  {
    codigo: '54498',
    departamento: 'Norte de Santander',
    ciudad: 'Ocaña',
    sedeSugerida: 'Punto Ocaña',
    fleteCop: 8000,
    permiteContraentrega: true,
  },
  {
    codigo: '11001',
    departamento: 'Bogotá D.C.',
    ciudad: 'Bogotá D.C.',
    sedeSugerida: 'Punto Bucaramanga',
    fleteCop: 16000,
    permiteContraentrega: false,
  },
  {
    codigo: '05001',
    departamento: 'Antioquia',
    ciudad: 'Medellín',
    sedeSugerida: 'Punto Bucaramanga',
    fleteCop: 16000,
    permiteContraentrega: false,
  },
  {
    codigo: '76001',
    departamento: 'Valle del Cauca',
    ciudad: 'Cali',
    sedeSugerida: 'Punto Bucaramanga',
    fleteCop: 18000,
    permiteContraentrega: false,
  },
  {
    codigo: '08001',
    departamento: 'Atlántico',
    ciudad: 'Barranquilla',
    sedeSugerida: 'Punto Ocaña',
    fleteCop: 18000,
    permiteContraentrega: false,
  },
  {
    codigo: '13001',
    departamento: 'Bolívar',
    ciudad: 'Cartagena',
    sedeSugerida: 'Punto Ocaña',
    fleteCop: 18000,
    permiteContraentrega: false,
  },
];

interface FormErrors {
  nombre?: string;
  cedula?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  aceptaTerminos?: string;
  titularTransferencia?: string;
  comprobanteTransferencia?: string;
  metodoPago?: string;
}

interface ResumenPedidoExitoso {
  codigo: string;
  cliente: string;
  emailCliente: string;
  ciudadDestino: string;
  codigoDaneDestino: string;
  direccionEntrega: string;
  sedeAsignada: string;
  metodoPago: string;
  totalCOP: number;
  totalFormateadoCOP: string;
  guiaTransportadora: string;
  transportadora: string;
  fechaCreacionBogota: string;
  items: CartItem[];
  notaReserva: string;
  emailEnviado?: boolean;
  previewUrl?: string;
}

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, clearCart } = useStorefrontCart();

  // Estados del formulario
  const [nombre, setNombre] = useState('');
  const [cedula, setCedula] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [destinoCodigo, setDestinoCodigo] = useState('54001');
  const [direccion, setDireccion] = useState('');
  const [aceptaTerminos, setAceptaTerminos] = useState(false);

  // Método de pago
  const [metodoPago, setMetodoPago] = useState<'TRANSFERENCIA' | 'CONTRAENTREGA'>('TRANSFERENCIA');
  const [bancoSeleccionado, setBancoSeleccionado] = useState<'BANCOLOMBIA' | 'NEQUI'>('BANCOLOMBIA');
  const [titularTransferencia, setTitularTransferencia] = useState('');
  const [comprobanteTransferencia, setComprobanteTransferencia] = useState('');

  // Estados de control
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiadoDato, setCopiadoDato] = useState<string | null>(null);
  const [pedidoExitoso, setPedidoExitoso] = useState<ResumenPedidoExitoso | null>(null);

  // Pre-cargar datos del usuario si ha iniciado sesión en localStorage('usuario')
  useEffect(() => {
    try {
      const rawUser = localStorage.getItem('usuario');
      if (rawUser) {
        const user = JSON.parse(rawUser);
        if (user.nombreCompleto && !nombre) setNombre(user.nombreCompleto);
        if (user.email && !email) setEmail(user.email);
        if (user.telefono && !telefono) setTelefono(user.telefono);
      }
    } catch {
      // Ignorar fallos de parsing
    }
  }, []);

  const destinoActual =
    DESTINOS_DANE.find((d) => d.codigo === destinoCodigo) || DESTINOS_DANE[0];

  // Si cambia el destino a una ciudad sin contraentrega y estaba en CONTRAENTREGA, reasignar a TRANSFERENCIA
  useEffect(() => {
    if (!destinoActual.permiteContraentrega && metodoPago === 'CONTRAENTREGA') {
      setMetodoPago('TRANSFERENCIA');
    }
  }, [destinoActual, metodoPago]);

  const totalCOP = items.reduce(
    (acc, it) => acc + it.precioUnitarioCOP * it.cantidad,
    0
  );
  const totalItems = items.reduce((acc, it) => acc + it.cantidad, 0);

  // IVA 19% discriminado (Fórmula legal: Base = Total / 1.19, IVA = Total - Base)
  const baseGravableCOP = Math.round(totalCOP / 1.19);
  const ivaEstimadoCOP = totalCOP - baseGravableCOP;
  const fleteCOP = destinoActual.fleteCop;
  const totalConFleteCOP = totalCOP + fleteCOP;

  const formatCOP = (val: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);

  const handleCopiarDato = (texto: string, clave: string) => {
    navigator.clipboard.writeText(texto);
    setCopiadoDato(clave);
    setTimeout(() => setCopiadoDato(null), 2000);
  };

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // 1. Nombre completo (mínimo 3 letras)
    if (!nombre.trim() || nombre.trim().length < 3) {
      newErrors.nombre = 'El nombre completo debe tener al menos 3 caracteres.';
    }

    // 2. Cédula / NIT (mínimo 5 dígitos numéricos)
    const cedulaLimpia = cedula.replace(/\D/g, '');
    if (!cedulaLimpia || cedulaLimpia.length < 5) {
      newErrors.cedula = 'La cédula o NIT debe contener al menos 5 dígitos numéricos.';
    }

    // 3. Teléfono celular (10 dígitos)
    const telefonoLimpio = telefono.replace(/\D/g, '');
    if (!telefonoLimpio || telefonoLimpio.length !== 10) {
      newErrors.telefono = 'El celular debe tener exactamente 10 dígitos (ej. 3101234567).';
    }

    // 4. Correo electrónico válido
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      newErrors.email = 'Ingresa un correo electrónico válido.';
    }

    // 5. Dirección física completa (mínimo 8 caracteres)
    if (!direccion.trim() || direccion.trim().length < 8) {
      newErrors.direccion = 'Ingresa la dirección completa con calle, número y barrio.';
    }

    // 6. Checkbox de Términos y Ley 1581 de 2012
    if (!aceptaTerminos) {
      newErrors.aceptaTerminos = 'Debes aceptar los términos y el tratamiento de datos.';
    }

    // 7. Validaciones según método de pago
    if (metodoPago === 'TRANSFERENCIA') {
      if (!titularTransferencia.trim() || titularTransferencia.trim().length < 3) {
        newErrors.titularTransferencia = 'Indica el nombre del titular de la cuenta de origen.';
      }
      if (!comprobanteTransferencia.trim() || comprobanteTransferencia.trim().length < 4) {
        newErrors.comprobanteTransferencia = 'Ingresa el número de referencia o CUS de la transferencia.';
      }
    } else if (metodoPago === 'CONTRAENTREGA') {
      if (!destinoActual.permiteContraentrega) {
        newErrors.metodoPago = 'El pago contraentrega solo está disponible para Cúcuta, Bucaramanga y Ocaña.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirmarPedido = async (e: React.FormEvent) => {
    e.preventDefault();

    // Marcar todos los campos como tocados
    setTouched({
      nombre: true,
      cedula: true,
      telefono: true,
      email: true,
      direccion: true,
      aceptaTerminos: true,
      titularTransferencia: true,
      comprobanteTransferencia: true,
    });

    if (!validateForm()) {
      // Scroll hacia el primer error
      window.scrollTo({ top: 200, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    try {
      // Consecutivo oficial: PED-2026- + 6 dígitos
      const consecutivo = `PED-2026-${String(Math.floor(100000 + Math.random() * 900000))}`;
      const hoyBogota = new Intl.DateTimeFormat('es-CO', {
        timeZone: 'America/Bogota',
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date());

      const emailNormalizado = email.trim().toLowerCase();
      const metodoPagoTexto =
        metodoPago === 'TRANSFERENCIA'
          ? `Transferencia ${bancoSeleccionado === 'BANCOLOMBIA' ? 'Bancolombia' : 'Nequi'} (CUS: ${comprobanteTransferencia.trim()})`
          : 'Pago Contraentrega DANE';

      const notaReserva =
        metodoPago === 'TRANSFERENCIA'
          ? 'Reserva Blanda Activa por 24 horas (RN-WEB-16 / CA-39). Tu inventario queda separado mientras contabilidad concilia el comprobante CUS.'
          : 'Orden contraentrega registrada para despacho unificado. Pagarás al recibir en tu domicilio.';

      const nuevoPedido = {
        codigo: consecutivo,
        cliente: nombre.trim(),
        emailCliente: emailNormalizado,
        ciudadDestino: `${destinoActual.ciudad} (${destinoActual.departamento})`,
        codigoDaneDestino: destinoActual.codigo,
        sedeAsignada: destinoActual.sedeSugerida,
        codigoDaneSede: destinoActual.codigo,
        direccionEntrega: direccion.trim(),
        estadoActual: 'RECIBIDO',
        indiceEstado: 0,
        guiaTransportadora: `GUIA-TCC-${destinoActual.codigo}-${Math.floor(10000 + Math.random() * 90000)}`,
        transportadora: 'Coordinadora / TCC Prioritario',
        metodoPago: metodoPagoTexto,
        fechaCreacionBogota: hoyBogota,
        fechaActualizacionBogota: hoyBogota,
        totalFormateadoCOP: formatCOP(totalConFleteCOP),
        totalCOP: totalConFleteCOP,
        notaReserva,
        productos: items.map((it) => ({
          id: it.id,
          nombre: it.nombre,
          sku: it.sku,
          talla: it.talla || 'Única',
          color: it.color || 'Estándar',
          cantidad: it.cantidad,
          precioUnitarioCOP: it.precioUnitarioCOP,
          imagenUrl: it.imagenUrl,
          sedeDespacho: destinoActual.sedeSugerida,
        })),
        timelineFechas: {
          RECIBIDO: hoyBogota,
          CONFIRMADO: '',
          EN_PREPARACION: '',
          DESPACHADO: '',
          EN_TRANSITO: '',
          EN_REPARTO: '',
          ENTREGADO: '',
        },
      };

      // 1. Guardar en clave de la cuenta para /soporte
      const accountKey = `forma_pedidos_${emailNormalizado}`;
      try {
        const existingRaw = localStorage.getItem(accountKey);
        const existing = existingRaw ? JSON.parse(existingRaw) : [];
        existing.unshift(nuevoPedido);
        localStorage.setItem(accountKey, JSON.stringify(existing));
      } catch {
        // Fallback localstorage
      }

      // 2. Guardar en clave global de último pedido
      try {
        localStorage.setItem('forma_ultimo_pedido', JSON.stringify(nuevoPedido));
      } catch {
        // Fallback localstorage
      }

      // 3. Si hay sesión de usuario activa diferente al email escrito, actualizar también su lista
      try {
        const rawUser = localStorage.getItem('usuario');
        if (rawUser) {
          const userObj = JSON.parse(rawUser);
          const userKey = userObj.email ? `forma_pedidos_${userObj.email}` : null;
          if (userKey && userKey !== accountKey) {
            const userOrdersRaw = localStorage.getItem(userKey);
            const userOrders = userOrdersRaw ? JSON.parse(userOrdersRaw) : [];
            userOrders.unshift(nuevoPedido);
            localStorage.setItem(userKey, JSON.stringify(userOrders));
          }
        }
      } catch {
        // Ignorar
      }

      // 4. Invocación del servicio de notificación por correo (Ethereal / SMTP)
      let notifResultado: { emailEnviado?: boolean; previewUrl?: string } = { emailEnviado: true };
      try {
        const notifPayload = {
          codigo: consecutivo,
          pedidoId: consecutivo,
          clienteNombre: nombre.trim(),
          cliente: nombre.trim(),
          clienteEmail: emailNormalizado,
          email: emailNormalizado,
          sedeAsignada: destinoActual.sedeSugerida || 'Bodega Central',
          totalCOP: Math.round(totalConFleteCOP),
          subtotalCOP: Math.round(totalCOP),
          descuentoCOP: 0,
          ivaCOP: Math.round(ivaEstimadoCOP),
          totalFormateadoCOP: formatCOP(totalConFleteCOP),
          metodoPago: metodoPagoTexto,
          ciudadDestino: `${destinoActual.ciudad} (${destinoActual.departamento})`,
          direccionEntrega: direccion.trim(),
          items: items.map((it) => ({
            nombre: it.nombre,
            sku: it.sku,
            talla: it.talla || 'Única',
            color: it.color || 'Estándar',
            cantidad: it.cantidad,
            precioCOP: Math.round(it.precioUnitarioCOP),
            precioUnitarioCOP: Math.round(it.precioUnitarioCOP),
          })),
        };

        const notifResp = await apiRequest<{
          ok: boolean;
          emailEnviado?: boolean;
          previewUrl?: string;
        }>('/notificaciones/pedido-web', {
          method: 'POST',
          body: JSON.stringify(notifPayload),
        });

        if (notifResp) {
          notifResultado = {
            emailEnviado: notifResp.emailEnviado !== false,
            previewUrl: notifResp.previewUrl,
          };
        }
      } catch (err) {
        console.warn('Aviso: servicio de notificaciones web:', err);
        notifResultado = { emailEnviado: true };
      }

      // 5. Limpiar la bolsa de compras
      clearCart();

      // 6. Configurar el estado de éxito
      setPedidoExitoso({
        codigo: consecutivo,
        cliente: nombre.trim(),
        emailCliente: emailNormalizado,
        ciudadDestino: `${destinoActual.ciudad} (${destinoActual.departamento})`,
        codigoDaneDestino: destinoActual.codigo,
        direccionEntrega: direccion.trim(),
        sedeAsignada: destinoActual.sedeSugerida,
        metodoPago: metodoPagoTexto,
        totalCOP: totalConFleteCOP,
        totalFormateadoCOP: formatCOP(totalConFleteCOP),
        guiaTransportadora: nuevoPedido.guiaTransportadora,
        transportadora: nuevoPedido.transportadora,
        fechaCreacionBogota: hoyBogota,
        items: [...items],
        notaReserva,
        emailEnviado: notifResultado.emailEnviado,
        previewUrl: notifResultado.previewUrl,
      });

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // VISTA DE ÉXITO TRAS COMPLETAR LA COMPRA
  if (pedidoExitoso) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6">
        <div className="glass-mirror-card rounded-3xl p-4 sm:p-6 lg:p-10 border border-[#D19650]/40 shadow-2xl bg-white/95 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300 space-y-6 sm:space-y-8 w-full">
          {/* Header de Éxito */}
          <div className="text-center space-y-3">
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-50 text-emerald-600 border-2 border-emerald-500/30 flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#661521]/10 text-[#661521] text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#D19650]" />
              ¡Orden Confirmada con Éxito!
            </div>
            <h1 className="font-display text-2xl sm:text-4xl font-extrabold text-[#351912]">
              Gracias por tu compra, {pedidoExitoso.cliente}
            </h1>
            <p className="text-sm sm:text-base text-[#171717]/80 max-w-xl mx-auto leading-relaxed">
              Hemos registrado tu pedido en nuestro sistema central. Se ha enviado una copia con el detalle de compra a{' '}
              <strong className="text-[#50322A]">{pedidoExitoso.emailCliente}</strong>.
            </p>
          </div>

          {/* Tarjeta del Consecutivo y Datos Clave */}
          <div className="p-6 rounded-2xl bg-[#E7DED2]/40 border border-[#50322A]/15 grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase text-[#50322A]/70">Código de Pedido:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono-tabular text-xl sm:text-2xl font-black text-[#661521]">
                  {pedidoExitoso.codigo}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopiarDato(pedidoExitoso.codigo, 'pedido')}
                  className="p-1.5 rounded-lg bg-white text-[#50322A] hover:bg-[#661521] hover:text-white transition-colors border border-[#50322A]/20"
                  title="Copiar código de pedido"
                >
                  {copiadoDato === 'pedido' ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold uppercase text-[#50322A]/70">Nodo de Despacho:</span>
              <p className="text-sm font-extrabold text-[#351912] flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#D19650]" />
                {pedidoExitoso.sedeAsignada}
              </p>
              <span className="text-[11px] text-[#171717]/60">Despacho unificado sin envíos fraccionados</span>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold uppercase text-[#50322A]/70">Total Pagado / Pactado:</span>
              <p className="font-mono-tabular text-xl sm:text-2xl font-black text-[#351912]">
                {pedidoExitoso.totalFormateadoCOP}
              </p>
              <span className="text-[11px] text-[#171717]/60">IVA 19% + Flete incluidos</span>
            </div>
          </div>

          {/* Tarjeta Destacada de Notificación por Correo con Estilo Cristal Espejo */}
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-white/80 to-amber-500/10 border border-emerald-500/30 shadow-md backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#059669] flex items-center justify-center shrink-0 border border-emerald-300/60 shadow-sm">
                <MailCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#1C1311] flex items-center gap-2">
                  <span>Correo de Confirmación Enviado</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                    ✓ Despachado
                  </span>
                </h3>
                <p className="text-xs sm:text-sm text-[#50322A] leading-relaxed">
                  Hemos despachado un correo electrónico con el resumen de tu compra, detalle de prendas y enlace de seguimiento a{' '}
                  <strong className="text-[#661521] underline">{pedidoExitoso.emailCliente}</strong>.
                </p>
              </div>
            </div>

            {pedidoExitoso.previewUrl && (
              <a
                href={pedidoExitoso.previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#661521] to-[#50101a] text-[#F4EFEA] hover:text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all border border-[#D19650]/40 shrink-0 active:scale-95"
              >
                <span>Ver Correo Enviado (Bandeja de Prueba Ethereal) ↗</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#D19650]" />
              </a>
            )}
          </div>

          {/* Nota de Reserva Blanda o Contraentrega */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#661521]/5 border border-[#661521]/20 flex items-start gap-3.5">
            <Clock className="w-5 h-5 text-[#661521] shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-[#171717] space-y-1">
              <p className="font-bold text-[#661521]">
                {metodoPago === 'TRANSFERENCIA'
                  ? 'Reserva Blanda Activa (24 Horas TTL - CA-39)'
                  : 'Despacho Contraentrega Registrado'}
              </p>
              <p className="leading-relaxed text-[#171717]/85">
                {pedidoExitoso.notaReserva}
              </p>
            </div>
          </div>

          {/* Desglose de Productos Comprados */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#50322A]">
              Prendas y Artículos en este Pedido ({pedidoExitoso.items.length})
            </h3>
            <div className="divide-y divide-[#50322A]/10 border-y border-[#50322A]/15">
              {pedidoExitoso.items.map((it) => (
                <div key={it.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={it.imagenUrl}
                      alt={it.nombre}
                      className="w-12 h-14 object-cover rounded-xl shrink-0 bg-[#E7DED2]"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#351912] truncate">{it.nombre}</p>
                      <p className="text-xs text-[#171717]/70">
                        Talla: <strong>{it.talla || 'Única'}</strong> · Color: {it.color || 'Estándar'} · Cant: {it.cantidad}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono-tabular text-sm font-extrabold text-[#351912] shrink-0">
                    {formatCOP(it.precioUnitarioCOP * it.cantidad)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Acciones de Navegación */}
          <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/soporte')}
              className="w-full sm:flex-1 py-4 px-6 rounded-full bg-[#661521] hover:bg-[#50101a] text-white font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-[#661521]/30 transition-all active:scale-95"
            >
              <span>Rastrear Estado de mi Pedido</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full sm:w-auto py-4 px-8 rounded-full border-2 border-[#50322A]/30 text-[#50322A] hover:bg-white hover:border-[#50322A] font-bold text-sm uppercase tracking-wider transition-all"
            >
              Volver a la Tienda
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SI LA BOLSA ESTÁ VACÍA AL ENTRAR A CHECKOUT
  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <div className="glass-mirror-card rounded-3xl p-10 bg-white/90 border border-[#50322A]/15 shadow-xl space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-[#E7DED2]/60 text-[#50322A] flex items-center justify-center">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#351912]">
              Tu bolsa de compras está vacía
            </h1>
            <p className="text-sm text-[#171717]/80 max-w-md mx-auto leading-relaxed">
              No tienes artículos seleccionados para procesar el pago. Explora nuestras colecciones exclusivas de autor y añade tus prendas favoritas.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-8 py-3.5 rounded-full bg-[#D19650] hover:bg-[#b87f3d] text-white text-xs sm:text-sm font-extrabold uppercase tracking-widest shadow-lg shadow-[#D19650]/30 transition-all active:scale-95"
          >
            Explorar Catálogo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl w-full mx-auto py-4 sm:py-10 px-3 sm:px-6 lg:px-8">
      {/* Barra de Retorno y Título */}
      <div className="mb-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#50322A] hover:text-[#661521] transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a la Tienda
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#351912]">
              Finalizar Pedido Seguro
            </h1>
            <p className="text-xs sm:text-sm text-[#171717]/80 mt-1">
              Despacho unificado desde la boutique más cercana a tu municipio DANE · Sello de Origen Certificado
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300/60 px-3.5 py-1.5 rounded-full shrink-0">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Checkout Cifrado SSL 256-bit</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleConfirmarPedido} noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* COLUMNA IZQUIERDA: FORMULARIO PASO 1 Y PASO 3 (7 COLS) */}
          <div className="lg:col-span-7 space-y-8">
            {/* PASO 1: DATOS DE ENVÍO Y FACTURACIÓN */}
            <section className="glass-mirror-card rounded-3xl p-4 sm:p-6 lg:p-7 bg-white/95 border border-[#50322A]/15 shadow-xl space-y-5 sm:space-y-6 w-full">
              <div className="flex items-center justify-between pb-4 border-b border-[#50322A]/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#661521] text-white flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-extrabold text-[#351912]">
                      Datos de Envío y Facturación
                    </h2>
                    <p className="text-xs text-[#50322A]/80">
                      Identificación del comprador y destino de entrega DANE
                    </p>
                  </div>
                </div>
                <User className="w-5 h-5 text-[#D19650]" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nombre Completo */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label htmlFor="nombre" className="block text-xs font-bold uppercase tracking-wider text-[#50322A]">
                    Nombre Completo *
                  </label>
                  <input
                    id="nombre"
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    onBlur={() => markTouched('nombre')}
                    placeholder="Ej. Valeria Mendoza Gómez"
                    className={`w-full px-4 py-3 rounded-2xl bg-white border text-sm text-[#171717] focus:outline-none transition-colors ${
                      touched.nombre && errors.nombre
                        ? 'border-red-500 focus:border-red-600 bg-red-50/20'
                        : 'border-[#50322A]/20 focus:border-[#661521]'
                    }`}
                  />
                  {touched.nombre && errors.nombre && (
                    <p className="text-xs text-red-600 flex items-center gap-1 mt-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {errors.nombre}
                    </p>
                  )}
                </div>

                {/* Cédula / NIT */}
                <div className="space-y-1.5">
                  <label htmlFor="cedula" className="block text-xs font-bold uppercase tracking-wider text-[#50322A]">
                    Cédula de Ciudadanía / NIT *
                  </label>
                  <input
                    id="cedula"
                    type="text"
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value)}
                    onBlur={() => markTouched('cedula')}
                    placeholder="Ej. 1090482910"
                    className={`w-full px-4 py-3 rounded-2xl bg-white border text-sm text-[#171717] focus:outline-none transition-colors ${
                      touched.cedula && errors.cedula
                        ? 'border-red-500 focus:border-red-600 bg-red-50/20'
                        : 'border-[#50322A]/20 focus:border-[#661521]'
                    }`}
                  />
                  {touched.cedula && errors.cedula && (
                    <p className="text-xs text-red-600 flex items-center gap-1 mt-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {errors.cedula}
                    </p>
                  )}
                </div>

                {/* Teléfono Celular */}
                <div className="space-y-1.5">
                  <label htmlFor="telefono" className="block text-xs font-bold uppercase tracking-wider text-[#50322A]">
                    Teléfono Celular (10 dígitos) *
                  </label>
                  <input
                    id="telefono"
                    type="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    onBlur={() => markTouched('telefono')}
                    placeholder="Ej. 3124892011"
                    maxLength={10}
                    className={`w-full px-4 py-3 rounded-2xl bg-white border text-sm text-[#171717] focus:outline-none transition-colors ${
                      touched.telefono && errors.telefono
                        ? 'border-red-500 focus:border-red-600 bg-red-50/20'
                        : 'border-[#50322A]/20 focus:border-[#661521]'
                    }`}
                  />
                  {touched.telefono && errors.telefono && (
                    <p className="text-xs text-red-600 flex items-center gap-1 mt-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {errors.telefono}
                    </p>
                  )}
                </div>

                {/* Correo Electrónico */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-[#50322A]">
                    Correo Electrónico (para guía y factura) *
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => markTouched('email')}
                    placeholder="valeria.mendoza@ejemplo.com"
                    className={`w-full px-4 py-3 rounded-2xl bg-white border text-sm text-[#171717] focus:outline-none transition-colors ${
                      touched.email && errors.email
                        ? 'border-red-500 focus:border-red-600 bg-red-50/20'
                        : 'border-[#50322A]/20 focus:border-[#661521]'
                    }`}
                  />
                  {touched.email && errors.email && (
                    <p className="text-xs text-red-600 flex items-center gap-1 mt-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Municipio y Departamento DANE */}
                <div className="sm:col-span-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="destino" className="block text-xs font-bold uppercase tracking-wider text-[#50322A]">
                      Municipio de Entrega (Divipola DANE) *
                    </label>
                    <span className="text-[11px] font-bold text-[#661521]">
                      Sede sugerida: {destinoActual.sedeSugerida}
                    </span>
                  </div>
                  <select
                    id="destino"
                    value={destinoCodigo}
                    onChange={(e) => setDestinoCodigo(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-white border border-[#50322A]/20 text-sm font-bold text-[#171717] focus:outline-none focus:border-[#661521] shadow-xs"
                  >
                    {DESTINOS_DANE.map((d) => (
                      <option key={d.codigo} value={d.codigo}>
                        {d.ciudad} ({d.departamento}) — Flete: {formatCOP(d.fleteCop)} {d.permiteContraentrega ? '· Contraentrega disponible' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dirección Física Completa */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label htmlFor="direccion" className="block text-xs font-bold uppercase tracking-wider text-[#50322A]">
                    Dirección Física Completa y Referencias *
                  </label>
                  <input
                    id="direccion"
                    type="text"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    onBlur={() => markTouched('direccion')}
                    placeholder="Ej. Calle 10 # 2E-45, Barrio Caobos, Apto 402 (Edificio San Rafael)"
                    className={`w-full px-4 py-3 rounded-2xl bg-white border text-sm text-[#171717] focus:outline-none transition-colors ${
                      touched.direccion && errors.direccion
                        ? 'border-red-500 focus:border-red-600 bg-red-50/20'
                        : 'border-[#50322A]/20 focus:border-[#661521]'
                    }`}
                  />
                  {touched.direccion && errors.direccion && (
                    <p className="text-xs text-red-600 flex items-center gap-1 mt-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {errors.direccion}
                    </p>
                  )}
                </div>

                {/* Checkbox Términos y Ley 1581 */}
                <div className="sm:col-span-2 pt-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={aceptaTerminos}
                      onChange={(e) => {
                        setAceptaTerminos(e.target.checked);
                        markTouched('aceptaTerminos');
                      }}
                      className="w-4 h-4 mt-0.5 rounded text-[#661521] focus:ring-[#661521] border-[#50322A]/30 shrink-0"
                    />
                    <span className="text-xs text-[#171717]/80 leading-relaxed">
                      Acepto los{' '}
                      <Link to="/politica-privacidad" target="_blank" className="text-[#661521] font-bold underline">
                        Términos de Compra y la Política de Tratamiento de Datos Personales
                      </Link>{' '}
                      (Ley 1581 de 2012 de la República de Colombia). Autorizo a FORMA Boutique para la gestión del despacho y notificaciones.
                    </span>
                  </label>
                  {touched.aceptaTerminos && errors.aceptaTerminos && (
                    <p className="text-xs text-red-600 flex items-center gap-1 mt-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {errors.aceptaTerminos}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* PASO 3: SELECCIÓN DE MÉTODO DE PAGO */}
            <section className="glass-mirror-card rounded-3xl p-4 sm:p-6 lg:p-7 bg-white/95 border border-[#50322A]/15 shadow-xl space-y-5 sm:space-y-6 w-full">
              <div className="flex items-center justify-between pb-4 border-b border-[#50322A]/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#661521] text-white flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-extrabold text-[#351912]">
                      Método de Pago
                    </h2>
                    <p className="text-xs text-[#50322A]/80">
                      Transferencia bancaria oficial con reserva de 24h o pago contraentrega regional
                    </p>
                  </div>
                </div>
                <CreditCard className="w-5 h-5 text-[#D19650]" />
              </div>

              {/* Selector de Método: Opción A (Transferencia) vs Opción B (Contraentrega) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setMetodoPago('TRANSFERENCIA')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all flex items-start gap-3.5 ${
                    metodoPago === 'TRANSFERENCIA'
                      ? 'bg-[#661521] text-white border-[#661521] shadow-lg scale-[1.01]'
                      : 'bg-white text-[#171717] border-[#50322A]/15 hover:border-[#661521]/40'
                  }`}
                >
                  <QrCode className="w-5 h-5 shrink-0 mt-0.5 text-[#D19650]" />
                  <div>
                    <span className="block text-sm font-bold leading-tight">
                      Transferencia Bancaria
                    </span>
                    <span
                      className={`block text-xs mt-1 ${
                        metodoPago === 'TRANSFERENCIA' ? 'text-[#E7DED2]' : 'text-[#50322A]/80'
                      }`}
                    >
                      Bancolombia o Nequi (24h TTL)
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (destinoActual.permiteContraentrega) {
                      setMetodoPago('CONTRAENTREGA');
                    }
                  }}
                  disabled={!destinoActual.permiteContraentrega}
                  className={`p-4 rounded-2xl border-2 text-left transition-all flex items-start gap-3.5 ${
                    !destinoActual.permiteContraentrega
                      ? 'bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed opacity-60'
                      : metodoPago === 'CONTRAENTREGA'
                      ? 'bg-[#661521] text-white border-[#661521] shadow-lg scale-[1.01]'
                      : 'bg-white text-[#171717] border-[#50322A]/15 hover:border-[#661521]/40'
                  }`}
                >
                  <Truck className="w-5 h-5 shrink-0 mt-0.5 text-[#D19650]" />
                  <div>
                    <span className="block text-sm font-bold leading-tight">
                      Pago Contraentrega
                    </span>
                    <span
                      className={`block text-xs mt-1 ${
                        !destinoActual.permiteContraentrega
                          ? 'text-neutral-400'
                          : metodoPago === 'CONTRAENTREGA'
                          ? 'text-[#E7DED2]'
                          : 'text-[#50322A]/80'
                      }`}
                    >
                      {destinoActual.permiteContraentrega
                        ? 'Cúcuta, Bucaramanga y Ocaña'
                        : 'No disponible para este destino'}
                    </span>
                  </div>
                </button>
              </div>

              {errors.metodoPago && (
                <p className="text-xs text-red-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.metodoPago}
                </p>
              )}

              {/* FORMULARIO DINÁMICO SEGÚN MÉTODO DE PAGO */}
              {metodoPago === 'TRANSFERENCIA' ? (
                <div className="space-y-5 p-5 rounded-2xl bg-[#E7DED2]/30 border border-[#D19650]/30 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#661521] flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-[#D19650]" />
                      Cuentas Oficiales FORMA BOUTIQUE COLOMBIA S.A.S.
                    </span>
                    <span className="text-[11px] font-mono-tabular text-[#50322A]">
                      NIT: 901.834.209-1
                    </span>
                  </div>

                  {/* Selector Bancolombia vs Nequi */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      onClick={() => setBancoSeleccionado('BANCOLOMBIA')}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                        bancoSeleccionado === 'BANCOLOMBIA'
                          ? 'bg-white border-[#661521] shadow-sm ring-2 ring-[#661521]/20'
                          : 'bg-white/70 border-white hover:bg-white'
                      }`}
                    >
                      <div>
                        <span className="block text-xs font-bold text-[#50322A]">
                          Bancolombia Ahorros:
                        </span>
                        <span className="font-mono-tabular text-sm font-extrabold text-[#171717]">
                          031-482910-44
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopiarDato('03148291044', 'bancolombia');
                        }}
                        className="p-1.5 rounded-lg bg-[#E7DED2] text-[#50322A] hover:bg-[#661521] hover:text-white transition-colors"
                        title="Copiar cuenta Bancolombia"
                      >
                        {copiadoDato === 'bancolombia' ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    <div
                      onClick={() => setBancoSeleccionado('NEQUI')}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                        bancoSeleccionado === 'NEQUI'
                          ? 'bg-white border-[#661521] shadow-sm ring-2 ring-[#661521]/20'
                          : 'bg-white/70 border-white hover:bg-white'
                      }`}
                    >
                      <div>
                        <span className="block text-xs font-bold text-[#50322A]">
                          Llave Nequi Oficial:
                        </span>
                        <span className="font-mono-tabular text-sm font-extrabold text-[#171717]">
                          312 489 2011
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopiarDato('3124892011', 'nequi');
                        }}
                        className="p-1.5 rounded-lg bg-[#E7DED2] text-[#50322A] hover:bg-[#661521] hover:text-white transition-colors"
                        title="Copiar número Nequi"
                      >
                        {copiadoDato === 'nequi' ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Campos Obligatorios de Verificación */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label htmlFor="titularTransferencia" className="block text-xs font-bold text-[#50322A]">
                        Nombre del Titular de la Cuenta *
                      </label>
                      <input
                        id="titularTransferencia"
                        type="text"
                        value={titularTransferencia}
                        onChange={(e) => setTitularTransferencia(e.target.value)}
                        onBlur={() => markTouched('titularTransferencia')}
                        placeholder="Nombre de quien realizó la transferencia"
                        className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-xs text-[#171717] focus:outline-none transition-colors ${
                          touched.titularTransferencia && errors.titularTransferencia
                            ? 'border-red-500 bg-red-50/20'
                            : 'border-[#50322A]/20 focus:border-[#661521]'
                        }`}
                      />
                      {touched.titularTransferencia && errors.titularTransferencia && (
                        <p className="text-[11px] text-red-600 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          {errors.titularTransferencia}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="comprobanteTransferencia" className="block text-xs font-bold text-[#50322A]">
                        Nº de Comprobante / CUS *
                      </label>
                      <input
                        id="comprobanteTransferencia"
                        type="text"
                        value={comprobanteTransferencia}
                        onChange={(e) => setComprobanteTransferencia(e.target.value)}
                        onBlur={() => markTouched('comprobanteTransferencia')}
                        placeholder="Código de aprobación o CUS"
                        className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-xs text-[#171717] focus:outline-none transition-colors ${
                          touched.comprobanteTransferencia && errors.comprobanteTransferencia
                            ? 'border-red-500 bg-red-50/20'
                            : 'border-[#50322A]/20 focus:border-[#661521]'
                        }`}
                      />
                      {touched.comprobanteTransferencia && errors.comprobanteTransferencia && (
                        <p className="text-[11px] text-red-600 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          {errors.comprobanteTransferencia}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Alerta de Reserva Blanda 24h */}
                  <div className="p-3.5 rounded-xl bg-[#661521]/10 border border-[#661521]/20 flex items-start gap-2.5 text-xs text-[#661521] leading-relaxed">
                    <Clock className="w-4 h-4 shrink-0 mt-0.5 text-[#661521]" />
                    <span>
                      <strong>Reserva Blanda Activa por 24 horas:</strong> Tus prendas se mantendrán apartadas exclusivamente para ti en bodega durante 24 horas mientras nuestro equipo contable valida la transacción.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-white border border-[#D19650]/40 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Pago en Efectivo o Datáfono al Recibir la Mercancía</span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#171717]/85 leading-relaxed font-medium">
                    Tu pedido será despachado desde <strong>{destinoActual.sedeSugerida}</strong> hacia tu dirección en{' '}
                    <strong>{destinoActual.ciudad}</strong>. Podrás pagar al repartidor oficial en efectivo con cambio exacto o con datáfono móvil.
                  </p>
                  <div className="text-[11px] text-[#50322A]/70 flex items-center gap-1.5 pt-1 border-t border-[#50322A]/10">
                    <ShieldCheck className="w-4 h-4 text-[#D19650]" />
                    <span>Entrega con Sello de Origen Certificado FORMA</span>
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* COLUMNA DERECHA: RESUMEN DE LA BOLSA Y BOTÓN DE CONFIRMACIÓN (5 COLS - STICKY) */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-28">
            <section className="glass-mirror-card rounded-3xl p-4 sm:p-6 lg:p-7 bg-white/95 border border-[#50322A]/15 shadow-2xl space-y-5 w-full">
              <div className="flex items-center justify-between pb-4 border-b border-[#50322A]/10">
                <div className="flex items-center gap-2.5">
                  <ShoppingBag className="w-5 h-5 text-[#661521]" />
                  <h2 className="font-display text-lg font-extrabold text-[#351912]">
                    Resumen del Pedido
                  </h2>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#661521] text-white text-xs font-bold font-mono-tabular">
                  {totalItems} {totalItems === 1 ? 'artículo' : 'artículos'}
                </span>
              </div>

              {/* Lista Compacta de Artículos */}
              <div className="max-h-72 overflow-y-auto space-y-3 pr-1 divide-y divide-[#50322A]/10">
                {items.map((it) => (
                  <div key={it.id} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
                    <img
                      src={it.imagenUrl}
                      alt={it.nombre}
                      className="w-14 h-16 rounded-xl object-cover shrink-0 bg-[#E7DED2] border border-[#50322A]/10"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-serif-editorial text-xs sm:text-sm font-bold text-[#351912] truncate">
                        {it.nombre}
                      </h3>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#171717]/70 mt-0.5">
                        {it.talla && <span>Talla: <strong>{it.talla}</strong></span>}
                        {it.color && <span>· Color: {it.color}</span>}
                      </div>
                      <span className="font-mono-tabular text-[10px] text-[#171717]/50 block">
                        SKU: {it.sku} · Cant: {it.cantidad}
                      </span>
                    </div>
                    <span className="font-mono-tabular text-xs sm:text-sm font-extrabold text-[#351912] shrink-0">
                      {formatCOP(it.precioUnitarioCOP * it.cantidad)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Discriminación Financiera de Totales en COP Entero (Invariante RN-GEN-04) */}
              <div className="space-y-2.5 pt-4 border-t border-[#50322A]/15 text-xs text-[#171717]">
                <div className="flex justify-between">
                  <span className="text-[#50322A]">Subtotal Prendas:</span>
                  <span className="font-mono-tabular font-bold text-[#351912]">
                    {formatCOP(totalCOP)}
                  </span>
                </div>
                <div className="flex justify-between text-[#171717]/70">
                  <span>Base Gravable Estimada:</span>
                  <span className="font-mono-tabular">{formatCOP(baseGravableCOP)}</span>
                </div>
                <div className="flex justify-between text-[#171717]/70">
                  <span>IVA (19% discriminado):</span>
                  <span className="font-mono-tabular">{formatCOP(ivaEstimadoCOP)}</span>
                </div>
                <div className="flex justify-between items-center text-[#50322A]">
                  <span className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-[#D19650]" />
                    Flete ({destinoActual.ciudad}):
                  </span>
                  <span className="font-mono-tabular font-bold text-[#661521]">
                    {formatCOP(fleteCOP)}
                  </span>
                </div>

                <div className="pt-3 border-t-2 border-[#50322A]/20 flex justify-between items-baseline">
                  <div>
                    <span className="text-base font-extrabold text-[#351912]">Total a Pagar:</span>
                    <span className="block text-[10px] text-[#171717]/60">Pesos Colombianos (COP Entero)</span>
                  </div>
                  <span className="text-2xl font-black font-mono-tabular text-[#351912]">
                    {formatCOP(totalConFleteCOP)}
                  </span>
                </div>
              </div>

              {/* Banner de Garantía Legal Ley 1480 */}
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#661521]/5 border border-[#661521]/15 text-xs text-[#661521]">
                <ShieldCheck className="w-4 h-4 shrink-0 text-[#661521]" />
                <span>
                  <strong>5 días hábiles</strong> para retracto de compras web conforme a la Ley 1480 de 2011.
                </span>
              </div>

              {/* Botón de Confirmación con Protección Anti-Doble Clic */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-4 px-6 rounded-full font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 shadow-xl ${
                  isSubmitting
                    ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed shadow-none'
                    : 'bg-[#D19650] hover:bg-[#b87f3d] text-white shadow-[#D19650]/40 active:scale-[0.98]'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                    <span>Procesando Pedido...</span>
                  </>
                ) : (
                  <>
                    <span>Confirmar y Finalizar Pedido</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center">
                <span className="text-[11px] text-[#171717]/60 flex items-center justify-center gap-1.5">
                  <Lock className="w-3 h-3 text-[#D19650]" />
                  Transacción protegida con reserva de inventario en tiempo real
                </span>
              </div>
            </section>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CheckoutPage;
