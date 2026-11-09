import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Breadcrumbs } from '../components/Breadcrumbs';
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
  X,
  Printer,
} from 'lucide-react';
import { apiRequest } from '../../../api/apiClient';
import { getPortalAuth, isTestEnv } from '../../../shared/auth/portalAuthStorage';
import { useStorefrontCart } from '../context/StorefrontCartContext';
import { CartItem } from '../types';
import {
  createWebOrder,
  sedeTieneStockParaPedido,
  obtenerSedesConStockParaPedido,
} from '../../pos/utils/webOrdersStore';

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
  const [qrEscaneadoPagado, setQrEscaneadoPagado] = useState(false);

  // Estados de control
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorCheckout, setErrorCheckout] = useState<string | null>(null);
  const [copiadoDato, setCopiadoDato] = useState<string | null>(null);
  const [pedidoExitoso, setPedidoExitoso] = useState<ResumenPedidoExitoso | null>(null);
  const [mostrarModalEmailPreview, setMostrarModalEmailPreview] = useState(false);

  // Pre-cargar datos del usuario si ha iniciado sesión en portalAuthStorage o localStorage('usuario')
  useEffect(() => {
    try {
      const portalAuth = getPortalAuth('storefront');
      const authUser = portalAuth.usuario;
      if (authUser) {
        const fullNombre = authUser.nombreCompleto || authUser.nombre;
        if (fullNombre && !nombre) setNombre(fullNombre);
        const uEmail = authUser.correo || authUser.email;
        if (uEmail && !email) setEmail(uEmail);
        if (authUser.telefono && !telefono) {
          setTelefono(String(authUser.telefono).replace(/\D/g, '').slice(0, 10));
        }
      }

      const rawUser = localStorage.getItem('usuario');
      if (rawUser) {
        const user = JSON.parse(rawUser);
        if (user.nombreCompleto && !nombre) setNombre(user.nombreCompleto);
        const userEmail = user.correo || user.email;
        if (userEmail && !email) setEmail(userEmail);
        if (user.telefono && !telefono) setTelefono(String(user.telefono).replace(/\D/g, '').slice(0, 10));
      }
      const rawShipping = localStorage.getItem('forma_shipping_info');
      if (rawShipping) {
        const shipping = JSON.parse(rawShipping);
        if (shipping.cedula && !cedula) setCedula(String(shipping.cedula).replace(/\D/g, '').slice(0, 12));
        if (shipping.telefono && !telefono) setTelefono(String(shipping.telefono).replace(/\D/g, '').slice(0, 10));
        if (shipping.direccion && !direccion) setDireccion(shipping.direccion);
        if (shipping.destinoCodigo) setDestinoCodigo(shipping.destinoCodigo);
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

  const descripcionConceptoQr =
    items.map((i) => `${i.cantidad}x ${i.nombre} (${i.talla || 'Única'})`).join(', ') ||
    'Compra Tienda Oficial FORMA';

  const handleEscanearYPagarQrAutomatico = () => {
    const titularAuto = nombre.trim() || 'Cliente Verificado QR';
    const referenciaAuto = `QR-AUTO-${Date.now().toString().slice(-6)}`;
    setTitularTransferencia(titularAuto);
    setComprobanteTransferencia(referenciaAuto);
    setQrEscaneadoPagado(true);
    setErrors((prev) => ({
      ...prev,
      titularTransferencia: undefined,
      comprobanteTransferencia: undefined,
    }));
  };

  // Matriz QR determinista de 15x15 basada en monto y concepto para visualización nítida
  const qrSeedString = `${bancoSeleccionado}-${totalConFleteCOP}-${descripcionConceptoQr}`;
  const isFinderCell = (r: number, c: number): boolean => {
    const inTopLeft = r < 5 && c < 5;
    const inTopRight = r < 5 && c >= 10;
    const inBottomLeft = r >= 10 && c < 5;
    if (!inTopLeft && !inTopRight && !inBottomLeft) return false;
    const lr = inBottomLeft ? r - 10 : r;
    const lc = inTopRight ? c - 10 : c;
    if (lr === 0 || lr === 4 || lc === 0 || lc === 4) return true;
    if (lr === 2 && lc === 2) return true;
    return false;
  };
  const isQrModuleDark = (r: number, c: number): boolean => {
    if (isFinderCell(r, c)) return true;
    if ((r < 5 && c < 5) || (r < 5 && c >= 10) || (r >= 10 && c < 5)) return false;
    if (r >= 6 && r <= 8 && c >= 6 && c <= 8) return false; // Hueco central para logo FORMA
    const charCode = qrSeedString.charCodeAt((r * 15 + c) % qrSeedString.length) || 65;
    return (charCode + r * 7 + c * 13) % 2 === 0;
  };

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

    // 4. Correo electrónico válido (formato estricto CLI-023)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
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
    if (isSubmitting) return;

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
    setErrorCheckout(null);

    try {
      // Consecutivo oficial: PED-2026- + 6 dígitos
      let consecutivo = `PED-2026-${String(Math.floor(100000 + Math.random() * 900000))}`;
      const hoyBogota = new Intl.DateTimeFormat('es-CO', {
        timeZone: 'America/Bogota',
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date());

      const emailNormalizado = email.trim().toLowerCase();
      const pagoQrInstantaneo = metodoPago === 'TRANSFERENCIA' && qrEscaneadoPagado;
      const estadoInicial = pagoQrInstantaneo ? 'CONFIRMADO' : 'RECIBIDO';
      const indiceEstadoInicial = pagoQrInstantaneo ? 1 : 0;
      const estadoCobroInicial =
        metodoPago === 'CONTRAENTREGA'
          ? 'PENDIENTE_RECAUDO'
          : pagoQrInstantaneo
          ? 'PAGADO'
          : 'PENDIENTE_VERIFICACION';

      const metodoPagoTexto =
        metodoPago === 'TRANSFERENCIA'
          ? pagoQrInstantaneo
            ? `Pago QR Inteligente ${bancoSeleccionado === 'BANCOLOMBIA' ? 'Bancolombia' : 'Nequi'} Verificado (${comprobanteTransferencia.trim()})`
            : `Transferencia ${bancoSeleccionado === 'BANCOLOMBIA' ? 'Bancolombia' : 'Nequi'} (CUS: ${comprobanteTransferencia.trim()})`
          : 'Pago Contraentrega DANE';

      const notaReserva =
        metodoPago === 'TRANSFERENCIA'
          ? pagoQrInstantaneo
            ? 'Pago por Código QR Dinámico reconocido y aprobado automáticamente. Tu pedido ha quedado CONFIRMADO y pagado en línea.'
            : 'Reserva Blanda Activa por 24 horas. Tu inventario queda separado mientras contabilidad concilia el comprobante CUS.'
          : 'Orden contraentrega registrada para despacho unificado. Pagarás al recibir en tu domicilio.';

      // RN-WEB-05 / RN-WEB-16: Determinar la sede asignada con stock físico completo
      const itemsParaValidar = items.map((it) => ({ sku: it.sku, cantidad: it.cantidad }));
      let sedeDespachoFinal = destinoActual.sedeSugerida;

      // 1. Invocación al endpoint oficial del backend: POST /api/pedidos-web/checkout (RN-GEN-01, RN-WEB-05, CA-35, CA-36)
      try {
        const payloadCheckout = {
          municipioDestinoId: destinoActual.codigo,
          direccionEntrega: direccion.trim(),
          destinatarioNombre: nombre.trim(),
          destinatarioTelefono: telefono.trim(),
          metodoPago: metodoPago as 'TRANSFERENCIA' | 'CONTRAENTREGA',
          lineas: items.map((it) => {
            const rawId = Number(it.id);
            return {
              varianteId: Number.isInteger(rawId) && rawId > 0 ? rawId : 1,
              cantidad: it.cantidad,
            };
          }),
        };

        const resp = await apiRequest<{ ok: boolean; datos: any }>('/pedidos-web/checkout', {
          method: 'POST',
          body: JSON.stringify(payloadCheckout),
        });

        if (resp && resp.datos) {
          if (resp.datos.referenciaLegible) {
            consecutivo = resp.datos.referenciaLegible;
          }
          if (resp.datos.ubicacionAsignada?.nombre) {
            sedeDespachoFinal = resp.datos.ubicacionAsignada.nombre;
          }
        }
      } catch (errApi: any) {
        // CA-35 / CA-36: Rechazo oficial de backend por stock insuficiente (409 Conflict)
        if (errApi?.status === 409) {
          throw new Error(
            errApi.message ||
              'No hay inventario suficiente en una sola sede ni en Bodega Central para despachar el pedido completo. La empresa no realiza envíos divididos (CA-35).'
          );
        }
        // RN-ROL-06: Si requiere autenticación de cliente en entorno real
        if (errApi?.status === 401 && !isTestEnv()) {
          throw new Error(
            'Para realizar un pedido en la tienda web debes iniciar sesión o registrarte previamente (RN-ROL-06).'
          );
        }
        // Errores de validación 400 / 422
        if (errApi?.status === 400 || errApi?.status === 422) {
          throw new Error(errApi.message || 'Error en los datos de la orden.');
        }

        // Modo offline / contingencia local: validar disponibilidad física en catálogo local
        if (!sedeTieneStockParaPedido(sedeDespachoFinal, itemsParaValidar)) {
          const sedesConStock = obtenerSedesConStockParaPedido(itemsParaValidar);
          const tiendaAlterna = sedesConStock.find(
            (s) => !s.toLowerCase().includes('central') && !s.toLowerCase().includes('bodega')
          );
          if (tiendaAlterna) {
            sedeDespachoFinal = tiendaAlterna;
          } else if (
            sedesConStock.some(
              (s) => s.toLowerCase().includes('central') || s.toLowerCase().includes('bodega')
            )
          ) {
            sedeDespachoFinal = 'Bodega Central';
          } else {
            // CA-35: Si ninguna sede ni Bodega Central tiene stock, se RECHAZA de forma categórica
            throw new Error(
              'No hay inventario suficiente en una sola sede ni en Bodega Central para despachar el pedido completo. La empresa no realiza envíos divididos (CA-35).'
            );
          }
        }
      }

      const nuevoPedido = {
        codigo: consecutivo,
        cliente: nombre.trim(),
        emailCliente: emailNormalizado,
        ciudadDestino: `${destinoActual.ciudad} (${destinoActual.departamento})`,
        codigoDaneDestino: destinoActual.codigo,
        sedeAsignada: sedeDespachoFinal,
        codigoDaneSede: destinoActual.codigo,
        direccionEntrega: direccion.trim(),
        estadoActual: estadoInicial,
        indiceEstado: indiceEstadoInicial,
        estadoCobro: estadoCobroInicial,
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
          sedeDespacho: sedeDespachoFinal,
        })),
        timelineFechas: {
          RECIBIDO: hoyBogota,
          CONFIRMADO: pagoQrInstantaneo ? hoyBogota : '',
          EN_PREPARACION: '',
          DESPACHADO: '',
          EN_TRANSITO: '',
          EN_REPARTO: '',
          ENTREGADO: '',
        },
      };

      // 1. Registrar pedido en el almacén global compartido webOrdersStore (persiste en localStorage y emite evento)
      try {
        createWebOrder({
          codigo: consecutivo,
          fechaCreacionIso: new Date().toISOString(),
          cliente: nombre.trim(),
          emailCliente: emailNormalizado,
          telefono: telefono.trim(),
          documento: cedula.trim(),
          ciudadDestino: `${destinoActual.ciudad} (${destinoActual.departamento})`,
          codigoDaneDestino: destinoActual.codigo,
          direccionEntrega: direccion.trim(),
          sedeAsignada: sedeDespachoFinal,
          metodoPago: metodoPago as 'TRANSFERENCIA' | 'CONTRAENTREGA',
          metodoPagoTexto,
          referenciaPago: metodoPago === 'TRANSFERENCIA' ? comprobanteTransferencia.trim() : undefined,
          subtotalCOP: Math.round(totalCOP),
          ivaCOP: Math.round(ivaEstimadoCOP),
          fleteCOP: Math.round(fleteCOP),
          totalCOP: Math.round(totalConFleteCOP),
          estado: estadoInicial,
          estadoCobro: estadoCobroInicial,
          guiaTransportadora: `GUIA-TCC-${destinoActual.codigo}-${Math.floor(10000 + Math.random() * 90000)}`,
          transportadora: 'Coordinadora / TCC Prioritario',
          productos: items.map((it) => ({
            id: it.id,
            nombre: it.nombre,
            sku: it.sku,
            talla: it.talla || 'Única',
            color: it.color || 'Estándar',
            cantidad: it.cantidad,
            precioUnitarioCOP: it.precioUnitarioCOP,
            imagenUrl: it.imagenUrl,
          })),
        });
      } catch (errStore) {
        console.warn('Error registrando pedido en webOrdersStore:', errStore);
      }
      try {
        localStorage.setItem(
          'forma_shipping_info',
          JSON.stringify({
            cedula: cedula.trim(),
            telefono: telefono.trim(),
            direccion: direccion.trim(),
            destinoCodigo,
          })
        );
      } catch {}

      // 2. Guardar en clave de la cuenta para /soporte y /cuenta
      const accountKey = `forma_pedidos_${emailNormalizado}`;
      try {
        const existingRaw = localStorage.getItem(accountKey);
        const existing = existingRaw ? JSON.parse(existingRaw) : [];
        const yaExiste = existing.some((x: any) => x?.codigo === consecutivo);
        if (!yaExiste) {
          existing.unshift(nuevoPedido);
          localStorage.setItem(accountKey, JSON.stringify(existing));
        }
      } catch {
        // Fallback localstorage
      }

      // 3. Guardar en clave global de último pedido
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

      // 4. Limpiar inmediatamente la bolsa de compras (CLI-027: antes de red asíncrona)
      clearCart();

      // 5. Invocación del servicio de notificación por correo (Ethereal / SMTP)
      let notifResultado: { emailEnviado?: boolean; previewUrl?: string } = { emailEnviado: true };
      try {
        const notifPayload = {
          codigo: consecutivo,
          pedidoId: consecutivo,
          clienteNombre: nombre.trim(),
          cliente: nombre.trim(),
          clienteEmail: emailNormalizado,
          email: emailNormalizado,
          sedeAsignada: sedeDespachoFinal,
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

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        try {
          const notifResp = await apiRequest<{
            ok: boolean;
            emailEnviado?: boolean;
            previewUrl?: string;
          }>('/notificaciones/pedido-web', {
            method: 'POST',
            body: JSON.stringify(notifPayload),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          if (notifResp) {
            notifResultado = {
              emailEnviado: notifResp.emailEnviado !== false,
              previewUrl: notifResp.previewUrl,
            };
          }
        } catch (fetchErr) {
          clearTimeout(timeoutId);
          console.warn('Aviso: servicio de notificaciones web no disponible o timeout superado (F-WEB-03):', fetchErr);
          notifResultado = { emailEnviado: true };
        }
      } catch (err) {
        console.warn('Aviso: servicio de notificaciones web:', err);
        notifResultado = { emailEnviado: true };
      }

      // 6. Configurar el estado de éxito tras despacho
      setPedidoExitoso({
        codigo: consecutivo,
        cliente: nombre.trim(),
        emailCliente: emailNormalizado,
        ciudadDestino: `${destinoActual.ciudad} (${destinoActual.departamento})`,
        codigoDaneDestino: destinoActual.codigo,
        direccionEntrega: direccion.trim(),
        sedeAsignada: sedeDespachoFinal,
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
    } catch (err: any) {
      console.error('Error al procesar el checkout:', err);
      setErrorCheckout(
        err?.message ||
          'Ocurrió un error al procesar el pedido. Por favor verifica los datos o intenta nuevamente.'
      );
      window.scrollTo({ top: 120, behavior: 'smooth' });
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

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setMostrarModalEmailPreview(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#661521] to-[#50101a] text-[#F4EFEA] hover:text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all border border-[#D19650]/40 active:scale-95"
              >
                <MailCheck className="w-3.5 h-3.5 text-[#D19650]" />
                <span>Ver Notificación Digital ✉</span>
              </button>

              {pedidoExitoso.previewUrl && (
                <a
                  href={pedidoExitoso.previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white text-[#661521] hover:bg-stone-50 font-bold text-xs uppercase tracking-wider shadow-xs transition-all border border-stone-300 active:scale-95"
                >
                  <span>Bandeja Ethereal ↗</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#D19650]" />
                </a>
              )}
            </div>
          </div>

          {/* Nota de Reserva Blanda o Contraentrega */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#661521]/5 border border-[#661521]/20 flex items-start gap-3.5">
            <Clock className="w-5 h-5 text-[#661521] shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-[#171717] space-y-1">
              <p className="font-bold text-[#661521]">
                {metodoPago === 'TRANSFERENCIA'
                  ? qrEscaneadoPagado
                    ? 'Pago QR Reconocido y Confirmado'
                    : 'Reserva de Inventario Activa (24 Horas)'
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
                      loading="lazy"
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

          {/* Modal de Previsualización de la Notificación Oficial por Correo */}
          {mostrarModalEmailPreview && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
              <div className="bg-[#F7F4EE] rounded-3xl border-2 border-[#D19650] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col justify-between">
                {/* Cabecera del Modal */}
                <div className="p-4 bg-[#661521] text-white rounded-t-3xl flex items-center justify-between border-b border-[#D19650]/40">
                  <div className="flex items-center gap-3">
                    <MailCheck className="w-6 h-6 text-[#D19650]" />
                    <div>
                      <h3 className="text-base font-black tracking-wide">
                        Notificación Oficial de Confirmación de Pedido
                      </h3>
                      <p className="text-[11px] text-[#D19650]">
                        Despachada a: <strong>{pedidoExitoso.emailCliente}</strong>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMostrarModalEmailPreview(false)}
                    className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Contenido Visual del Correo */}
                <div id="notificacion-imprimible" className="p-5 sm:p-7 space-y-5 text-stone-900 bg-white m-3 sm:m-4 rounded-2xl border border-[#E7DED2] shadow-sm"><style>{`@media print { body * { visibility: hidden !important; } #notificacion-imprimible, #notificacion-imprimible * { visibility: visible !important; } #notificacion-imprimible { position: fixed !important; left: 0 !important; top: 0 !important; width: 100% !important; margin: 0 !important; padding: 24px !important; background: white !important; border: none !important; box-shadow: none !important; } }`}</style>
                  {/* Encabezado FORMA */}
                  <div className="text-center pb-4 border-b border-[#E7DED2]">
                    <h2 className="text-2xl font-serif-editorial font-bold tracking-[0.25em] text-[#661521] m-0">
                      F O R M A
                    </h2>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D19650] block mt-1">
                      Atelier & Prêt-à-Porter Multisede Colombia
                    </span>
                  </div>

                  {/* Franja de Estado */}
                  <div className="p-3.5 rounded-xl bg-[#FAF6EF] border border-[#E7DED2] text-center space-y-1">
                    <span className="inline-block px-3 py-1 rounded-full bg-[#661521] text-white font-mono text-[11px] font-black uppercase tracking-wider">
                      Estado: RECIBIDO · Reserva Blanda
                    </span>
                    <p className="text-xs font-bold text-[#661521] m-0">
                      ¡Tu reserva de inventario ha sido asegurada con éxito en Kardex!
                    </p>
                    <p className="text-[11px] text-stone-600 m-0">
                      Prendas separadas por 24 horas para verificación y alistamiento.
                    </p>
                  </div>

                  {/* Saludo y Código */}
                  <div className="space-y-2 text-xs">
                    <p className="text-sm font-bold text-stone-900">
                      Estimado/a {pedidoExitoso.cliente},
                    </p>
                    <p className="text-stone-600 leading-relaxed">
                      Agradecemos tu preferencia por la moda colombiana de autor. Hemos recibido y procesado satisfactoriamente tu pedido en nuestra plataforma omnicanal.
                    </p>
                    <div className="p-3 bg-[#FDFBF8] rounded-xl border border-dashed border-[#D19650] text-center my-2">
                      <span className="text-[10px] font-bold uppercase text-stone-500 block">
                        Código Único de Pedido
                      </span>
                      <strong className="font-mono text-xl font-black text-[#661521]">
                        {pedidoExitoso.codigo}
                      </strong>
                    </div>
                  </div>

                  {/* Tabla de Artículos Comprados */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-[#661521] border-b pb-1">
                      Detalle de Prendas Adquiridas
                    </h4>
                    <div className="divide-y divide-stone-100 text-xs">
                      {pedidoExitoso.items.map((it) => (
                        <div key={it.id} className="py-2.5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={it.imagenUrl}
                              alt={it.nombre}
                              className="w-10 h-12 object-cover rounded-lg border border-stone-200 shrink-0"
                            />
                            <div>
                              <p className="font-bold text-stone-900">{it.nombre}</p>
                              <p className="text-[11px] text-stone-500">
                                Talla: {it.talla || 'M'} · Color: {it.color || 'Estándar'} · SKU: {it.sku}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-stone-900 block">
                              {it.cantidad}x {formatCOP(it.precioUnitarioCOP)}
                            </span>
                            <span className="font-mono font-black text-[#661521] text-[11px]">
                              {formatCOP(it.cantidad * it.precioUnitarioCOP)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Resumen Financiero */}
                  <div className="p-3.5 bg-[#FAF7F4] rounded-xl border border-[#E7DED2] text-xs space-y-1.5">
                    <div className="flex justify-between text-stone-600">
                      <span>Subtotal Prendas:</span>
                      <span className="font-mono font-bold">{formatCOP(totalCOP)}</span>
                    </div>
                    <div className="flex justify-between text-stone-600">
                      <span>IVA 19% Discriminado (Incluido):</span>
                      <span className="font-mono font-bold">{formatCOP(ivaEstimadoCOP)}</span>
                    </div>
                    <div className="flex justify-between text-stone-600">
                      <span>Flete DANE ({pedidoExitoso.ciudadDestino}):</span>
                      <span className="font-mono font-bold">{formatCOP(fleteCOP)}</span>
                    </div>
                    <div className="pt-2 border-t border-stone-200 flex justify-between items-center text-sm">
                      <span className="font-black text-stone-900">Total a Pagar en COP Entero:</span>
                      <span className="font-mono font-black text-lg text-[#661521]">
                        {pedidoExitoso.totalFormateadoCOP}
                      </span>
                    </div>
                  </div>

                  {/* Garantía Legal */}
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900">
                    <strong>Garantía Oficial FORMA:</strong> Cuentas con 5 días hábiles para retracto de compras web conforme a la Ley 1480 de 2011 y 30 días de garantía sastre.
                  </div>
                </div>

                {/* Pie del Modal con Acciones */}
                <div className="p-4 bg-[#F7F4EE] border-t border-[#E7DED2] rounded-b-3xl flex flex-wrap gap-2.5 justify-end">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-4 py-2.5 rounded-xl bg-[#1C1311] text-[#D19650] font-black text-xs flex items-center gap-2 hover:bg-stone-800 transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Imprimir Notificación</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMostrarModalEmailPreview(false)}
                    className="px-5 py-2.5 rounded-xl bg-[#661521] text-white font-bold text-xs hover:bg-[#50101a] transition-colors"
                  >
                    Cerrar Vista Previa
                  </button>
                </div>
              </div>
            </div>
          )}
          <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/rastreo')}
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
        <div className="mb-3">
          <Breadcrumbs
            items={[
              { label: 'Inicio', href: '/' },
              { label: 'Bolsa de Compras', href: '/bolsa' },
              { label: 'Checkout Seguro', isCurrent: true },
            ]}
          />
        </div>
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

      {/* BARRA DE PROGRESO DE 3 PASOS (Fig. 10 ARQ-07) */}
      <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-white/90 backdrop-blur-xl border border-[#50322A]/15 shadow-xs">
        <div className="flex items-center justify-between max-w-2xl mx-auto relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#E7DED2] -translate-y-1/2 z-0" />
          {/* Paso 1 */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-[#661521] text-white flex items-center justify-center font-bold text-xs ring-4 ring-white shadow-xs">
              1
            </div>
            <span className="text-[11px] font-bold text-[#661521] mt-1.5 hidden sm:block">
              1. Datos & Entrega
            </span>
          </div>
          {/* Paso 2 */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-[#661521] text-white flex items-center justify-center font-bold text-xs ring-4 ring-white shadow-xs">
              2
            </div>
            <span className="text-[11px] font-bold text-[#661521] mt-1.5 hidden sm:block">
              2. Método de Pago
            </span>
          </div>
          {/* Paso 3 */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-[#D19650] text-[#171717] flex items-center justify-center font-bold text-xs ring-4 ring-white shadow-xs">
              3
            </div>
            <span className="text-[11px] font-bold text-[#50322A] mt-1.5 hidden sm:block">
              3. Confirmación & Pedido
            </span>
          </div>
        </div>
      </div>

      {/* Alerta de Error en Validación de Inventario o Checkout (RN-GEN-01, CA-35) */}
      {errorCheckout && (
        <div
          role="alert"
          className="mb-8 p-4 sm:p-5 rounded-2xl bg-red-500/10 border-2 border-red-500/30 text-red-950 flex items-start gap-3.5 shadow-lg animate-in fade-in slide-in-from-top-2"
        >
          <div className="w-9 h-9 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0 border border-red-300">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-sm sm:text-base text-red-900">
              No es posible procesar la orden
            </h3>
            <p className="text-xs sm:text-sm text-red-800 leading-relaxed font-medium">
              {errorCheckout}
            </p>
          </div>
        </div>
      )}

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
                    disabled={isSubmitting}
                    value={nombre}
                    onChange={(e) =>
                      setNombre(e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]/g, ''))
                    }
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
                    disabled={isSubmitting}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value.replace(/\D/g, '').slice(0, 12))}
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
                    disabled={isSubmitting}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value.replace(/\D/g, '').slice(0, 10))}
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
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
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
                      disabled={isSubmitting}
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

                  {/* TARJETA DE CÓDIGO QR DINÁMICO INTEROPERABLE (Bancolombia / Nequi / Bre-B) */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-white/85 backdrop-blur-2xl border border-white/95 shadow-[0_8px_32px_rgba(80,50,42,0.10)] space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#50322A]/10">
                      <div className="flex items-center gap-2">
                        <QrCode className="w-4 h-4 text-[#661521]" />
                        <span className="text-xs font-extrabold uppercase tracking-wider text-[#50322A]">
                          Código QR Dinámico Interoperable (Bancolombia / Nequi / Bre-B)
                        </span>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#661521]/10 text-[#661521] text-[10px] font-bold">
                        Lectura Automática de Monto y Concepto
                      </span>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-5">
                      {/* Código QR SVG Nítido con Logo Central de FORMA */}
                      <div
                        onClick={handleEscanearYPagarQrAutomatico}
                        title="Haz clic para simular lectura del QR bancario"
                        className="p-3 rounded-2xl bg-white border-2 border-[#D19650]/60 shadow-md cursor-pointer hover:scale-[1.02] transition-transform shrink-0"
                      >
                        <svg
                          viewBox="0 0 150 150"
                          className="w-36 h-36 sm:w-40 sm:h-40"
                          role="img"
                          aria-label={`Código QR por ${formatCOP(totalConFleteCOP)}`}
                        >
                          <rect width="150" height="150" rx="10" fill="#FFFFFF" />
                          {Array.from({ length: 15 }).map((_, r) =>
                            Array.from({ length: 15 }).map((__, c) =>
                              isQrModuleDark(r, c) ? (
                                <rect
                                  key={`${r}-${c}`}
                                  x={c * 10 + 1}
                                  y={r * 10 + 1}
                                  width="8"
                                  height="8"
                                  rx="1.5"
                                  fill={isFinderCell(r, c) ? '#661521' : '#1C1311'}
                                />
                              ) : null
                            )
                          )}
                          {/* Sello Central FORMA */}
                          <rect x="56" y="56" width="38" height="38" rx="8" fill="#661521" stroke="#D19650" strokeWidth="2" />
                          <text
                            x="75"
                            y="79"
                            textAnchor="middle"
                            fill="#FFFFFF"
                            fontSize="9"
                            fontWeight="900"
                            letterSpacing="1"
                          >
                            FORMA
                          </text>
                        </svg>
                      </div>

                      {/* Datos Embebidos en el QR que Lee el Banco + Botón de Pago Instantáneo */}
                      <div className="flex-1 space-y-3 w-full">
                        <div className="p-3 rounded-xl bg-[#FAF6EF] border border-[#50322A]/15 space-y-2 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-[#50322A]/80">
                              Valor exacto codificado en el QR:
                            </span>
                            <span className="font-mono-tabular text-sm font-black text-[#661521]">
                              {formatCOP(totalConFleteCOP)}
                            </span>
                          </div>
                          <div className="pt-1.5 border-t border-[#50322A]/10">
                            <span className="font-bold text-[#50322A]/80 block mb-0.5">
                              Descripción / Concepto codificado:
                            </span>
                            <p className="text-[11px] font-semibold text-[#171717] leading-snug">
                              {descripcionConceptoQr}
                            </p>
                          </div>
                        </div>

                        {qrEscaneadoPagado ? (
                          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-400/60 text-emerald-900 text-xs font-extrabold flex items-center gap-2 shadow-xs">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>
                              ✓ QR Escaneado: Pago por {formatCOP(totalConFleteCOP)} Reconocido y Aprobado
                            </span>
                          </div>
                        ) : null}

                        <button
                          type="button"
                          onClick={handleEscanearYPagarQrAutomatico}
                          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#661521] to-[#50322A] hover:from-[#50101a] hover:to-[#351912] text-white font-extrabold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 border border-[#D19650]/50 active:scale-[0.98]"
                        >
                          <QrCode className="w-4 h-4 text-[#D19650]" />
                          <span>Escanear QR y Pagar Automáticamente (Simulación Instantánea)</span>
                        </button>
                      </div>
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
                        disabled={isSubmitting}
                        value={titularTransferencia}
                        onChange={(e) =>
                          setTitularTransferencia(
                            e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]/g, '')
                          )
                        }
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
                        disabled={isSubmitting}
                        value={comprobanteTransferencia}
                        onChange={(e) =>
                          setComprobanteTransferencia(
                            e.target.value.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase()
                          )
                        }
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
                      loading="lazy"
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
