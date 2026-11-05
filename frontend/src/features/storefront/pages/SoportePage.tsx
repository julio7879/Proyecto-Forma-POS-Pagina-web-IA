import React, { useState, useEffect, useId, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Truck,
  ShieldCheck,
  QrCode,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ChevronDown,
  PackageCheck,
  Building2,
  Phone,
  ArrowRight,
  Lock,
  RefreshCw,
  FileCheck2,
  Copy,
  Check,
  User,
  ShoppingBag,
  ExternalLink,
  X,
  Info,
} from 'lucide-react';

export type EstadoPedidoWeb =
  | 'RECIBIDO'
  | 'CONFIRMADO'
  | 'EN_PREPARACION'
  | 'LISTO_DESPACHO'
  | 'DESPACHADO'
  | 'EN_ENTREGA'
  | 'ENTREGADO';

export type TipoReservaKardex =
  | 'RESERVA BLANDA (24h TTL)'
  | 'RESERVA DURA (PROTEGIDA)'
  | 'KARDEX DESCONTADO';

export interface PasoEstadoInfo {
  estado: EstadoPedidoWeb;
  etiqueta: string;
  descripcion: string;
  tipoReserva: TipoReservaKardex;
  explicacionKardex: string;
}

export const FLUJO_SIETE_ESTADOS: PasoEstadoInfo[] = [
  {
    estado: 'RECIBIDO',
    etiqueta: '1. Recibido',
    descripcion: 'Orden registrada con Idempotency-Key. Espera confirmación de pasarela o pago QR (TTL 24h).',
    tipoReserva: 'RESERVA BLANDA (24h TTL)',
    explicacionKardex:
      'Reserva Blanda 24h (CA-39): El stock está apartado provisionalmente. Si un comprador presencial adquiere la prenda en mostrador, el POS tiene prioridad y el pedido web se reasigna a otra sede o Bodega Central (RN-VTA-03).',
  },
  {
    estado: 'CONFIRMADO',
    etiqueta: '2. Confirmado',
    descripcion: 'Pago verificado por webhook/tesorería. Sede con stock completo asignada automáticamente.',
    tipoReserva: 'RESERVA BLANDA (24h TTL)',
    explicacionKardex:
      'Reserva Blanda Confirmada: Pago 100% verificado. La sede óptima con disponibilidad íntegra fue bloqueada sin envíos divididos (CA-35 / CA-36).',
  },
  {
    estado: 'EN_PREPARACION',
    etiqueta: '3. En Preparación',
    descripcion: 'Picking y control de calidad en bodega de la sede. La reserva pasa a DURA (intocable por POS).',
    tipoReserva: 'RESERVA DURA (PROTEGIDA)',
    explicacionKardex:
      'Reserva Dura Activa (RN-VTA-03 / RN-WEB-16): Las prendas están en alistamiento físico en la sede. Ningún vendedor de tienda física ni cajero POS puede vender estas unidades.',
  },
  {
    estado: 'LISTO_DESPACHO',
    etiqueta: '4. Listo Despacho',
    descripcion: 'Empaque de lujo sellado con certificado artesanal y etiqueta de transporte DANE impresa.',
    tipoReserva: 'RESERVA DURA (PROTEGIDA)',
    explicacionKardex:
      'Reserva Dura Empacada: Paquete sellado e inspeccionado con control de calidad. Espera recolección por transportadora aliada.',
  },
  {
    estado: 'DESPACHADO',
    etiqueta: '5. Despachado',
    descripcion: 'Entregado a transportadora aliada. Salida definitiva registrada en el Kardex único.',
    tipoReserva: 'KARDEX DESCONTADO',
    explicacionKardex:
      'Kardex Descontado (RN-GEN-02): Salida definitiva del inventario físico asentada en el libro mayor único. La custodia pasa a la transportadora formal con número de guía.',
  },
  {
    estado: 'EN_ENTREGA',
    etiqueta: '6. En Entrega',
    descripcion: 'Unidad de mensajería en reparto urbano hacia la dirección del cliente en el municipio DANE.',
    tipoReserva: 'KARDEX DESCONTADO',
    explicacionKardex:
      'Kardex Descontado en Tránsito: Mensajero local o troncal nacional en ruta de última milla hacia el domicilio especificado.',
  },
  {
    estado: 'ENTREGADO',
    etiqueta: '7. Entregado',
    descripcion: 'Recibido a conformidad por el cliente. Inicia ventana oficial de 5 días hábiles de retracto.',
    tipoReserva: 'KARDEX DESCONTADO',
    explicacionKardex:
      'Entrega a Conformidad (Ley 1480): Pedido cerrado exitosamente. Inicia ventana de 5 días hábiles en America/Bogota para retracto de compras web (Art. 47).',
  },
];

export interface ProductoEnPedido {
  id: string;
  nombre: string;
  sku: string;
  talla: string;
  color: string;
  cantidad: number;
  precioUnitarioCOP: number;
  imagenUrl: string;
  sedeDespacho: string;
}

export interface PedidoRastreo {
  codigo: string;
  cliente: string;
  emailCliente: string;
  ciudadDestino: string;
  codigoDaneDestino: string;
  sedeAsignada: string;
  codigoDaneSede: string;
  estadoActual: EstadoPedidoWeb;
  indiceEstado: number;
  guiaTransportadora: string;
  transportadora: string;
  metodoPago: string;
  fechaCreacionBogota: string;
  fechaActualizacionBogota: string;
  totalFormateadoCOP: string;
  totalCOP: number;
  notaReserva: string;
  productos: ProductoEnPedido[];
  timelineFechas?: Record<EstadoPedidoWeb, string>;
}

export type PedidoDemo = PedidoRastreo;

const PEDIDOS_DEMOSTRACION_BASE: Record<string, PedidoRastreo> = {
  'PED-2026-849201': {
    codigo: 'PED-2026-849201',
    cliente: 'Valeria Mendoza',
    emailCliente: 'valeria.mendoza@forma.co',
    ciudadDestino: 'Bucaramanga, Santander',
    codigoDaneDestino: '68001',
    sedeAsignada: 'Punto Bucaramanga (Hub Oriente · DANE 68001)',
    codigoDaneSede: '68001',
    estadoActual: 'EN_PREPARACION',
    indiceEstado: 2,
    guiaTransportadora: 'GUIA-TCC-68001-90412',
    transportadora: 'TCC Courrier Prioritario DANE',
    metodoPago: 'Pasarela Wompi (Tarjeta Crédito terminada en 4481)',
    fechaCreacionBogota: '04 Nov 2026, 09:10 a.m. (America/Bogota)',
    fechaActualizacionBogota: 'Hoy, 11:42 a.m. (America/Bogota)',
    totalCOP: 348000,
    totalFormateadoCOP: '$348.000 COP',
    notaReserva:
      'Reserva Dura Activa (RN-VTA-03): Tus piezas están siendo empacadas en Punto Bucaramanga y están blindadas frente a ventas de mostrador en tiendas físicas.',
    productos: [
      {
        id: 'prod-item-849201-1',
        nombre: 'Chaqueta Denim Artesanal',
        sku: 'ROP-DNM-001-M',
        talla: 'M',
        color: 'Azul Índigo',
        cantidad: 1,
        precioUnitarioCOP: 189000,
        imagenUrl:
          'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80',
        sedeDespacho: 'Punto Bucaramanga (Hub Oriente DANE 68001)',
      },
      {
        id: 'prod-item-849201-2',
        nombre: 'Bolso Cuero Graso Unisex',
        sku: 'ACC-BOL-003-UNI',
        talla: 'Única',
        color: 'Miel Natural',
        cantidad: 1,
        precioUnitarioCOP: 159000,
        imagenUrl:
          'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80',
        sedeDespacho: 'Punto Bucaramanga (Hub Oriente DANE 68001)',
      },
    ],
    timelineFechas: {
      RECIBIDO: '04 Nov 2026, 09:10 a.m.',
      CONFIRMADO: '04 Nov 2026, 09:22 a.m.',
      EN_PREPARACION: 'Hoy, 11:42 a.m.',
      LISTO_DESPACHO: 'Estimado Hoy, 03:30 p.m.',
      DESPACHADO: 'Estimado Hoy, 05:45 p.m.',
      EN_ENTREGA: 'Estimado Mañana, 08:30 a.m.',
      ENTREGADO: 'Estimado Mañana, 01:00 p.m.',
    },
  },
  'PED-2026-510394': {
    codigo: 'PED-2026-510394',
    cliente: 'Sebastián Peñaranda',
    emailCliente: 'sebastian.penaranda@forma.co',
    ciudadDestino: 'Cúcuta, Norte de Santander',
    codigoDaneDestino: '54001',
    sedeAsignada: 'Punto Centro (Cúcuta Flagship · DANE 54001)',
    codigoDaneSede: '54001',
    estadoActual: 'RECIBIDO',
    indiceEstado: 0,
    guiaTransportadora: 'Pendiente de confirmación comprobante QR',
    transportadora: 'Mensajería Urbana FORMA Express',
    metodoPago: 'Transferencia QR Bancolombia / Nequi (CA-39)',
    fechaCreacionBogota: 'Hoy, 09:15 a.m. (America/Bogota)',
    fechaActualizacionBogota: 'Hoy, 09:15 a.m. (America/Bogota)',
    totalCOP: 215000,
    totalFormateadoCOP: '$215.000 COP',
    notaReserva:
      'Reserva Blanda 24h TTL (CA-39): El stock está separado por 24 horas mientras se valida tu comprobante QR. Recuerda que en estado RECIBIDO una venta presencial en tienda tiene prioridad (RN-VTA-03).',
    productos: [
      {
        id: 'prod-item-510394-1',
        nombre: 'Mochila Tejeduría Ancestral',
        sku: 'ART-MOC-005-STD',
        talla: 'Estándar',
        color: 'Tierra / Crudo',
        cantidad: 1,
        precioUnitarioCOP: 135000,
        imagenUrl:
          'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80',
        sedeDespacho: 'Punto Centro (Cúcuta Flagship DANE 54001)',
      },
      {
        id: 'prod-item-510394-2',
        nombre: 'Camiseta Básica Algodón Pima',
        sku: 'ROP-CAM-002-M',
        talla: 'M',
        color: 'Blanco Hueso',
        cantidad: 1,
        precioUnitarioCOP: 80000,
        imagenUrl:
          'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
        sedeDespacho: 'Punto Centro (Cúcuta Flagship DANE 54001)',
      },
    ],
    timelineFechas: {
      RECIBIDO: 'Hoy, 09:15 a.m.',
      CONFIRMADO: 'Pendiente de validación QR',
      EN_PREPARACION: 'Próximo paso tras confirmación',
      LISTO_DESPACHO: 'En espera',
      DESPACHADO: 'En espera',
      EN_ENTREGA: 'En espera',
      ENTREGADO: 'En espera',
    },
  },
  'PED-2026-992014': {
    codigo: 'PED-2026-992014',
    cliente: 'Camila Cote',
    emailCliente: 'camila.cote@forma.co',
    ciudadDestino: 'Ocaña, Norte de Santander',
    codigoDaneDestino: '54498',
    sedeAsignada: 'Punto Ocaña (Centro Regional · DANE 54498)',
    codigoDaneSede: '54498',
    estadoActual: 'EN_ENTREGA',
    indiceEstado: 5,
    guiaTransportadora: 'GUIA-SERVI-54498-77310',
    transportadora: 'Servientrega Premier DANE',
    metodoPago: 'PSE Débito Interbancario Directo',
    fechaCreacionBogota: '03 Nov 2026, 02:20 p.m. (America/Bogota)',
    fechaActualizacionBogota: 'Hoy, 02:20 p.m. (America/Bogota)',
    totalCOP: 420000,
    totalFormateadoCOP: '$420.000 COP',
    notaReserva:
      'Sede con 100% de stock asignada sin envíos divididos (CA-35 / CA-36). La unidad de mensajería está en ruta hacia tu dirección en Ocaña.',
    productos: [
      {
        id: 'prod-item-992014-1',
        nombre: 'Conjunto Lino Orgánico Barichara',
        sku: 'ROP-LIN-007-S',
        talla: 'S',
        color: 'Arena Natural',
        cantidad: 1,
        precioUnitarioCOP: 290000,
        imagenUrl:
          'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80',
        sedeDespacho: 'Punto Ocaña (Centro Regional DANE 54498)',
      },
      {
        id: 'prod-item-992014-2',
        nombre: 'Crema Hidratante Botánica 100ml',
        sku: 'COS-CRM-004-100ML',
        talla: '100ml',
        color: 'Natural',
        cantidad: 2,
        precioUnitarioCOP: 65000,
        imagenUrl:
          'https://images.unsplash.com/photo-1608248597359-5633454b5683?auto=format&fit=crop&w=800&q=80',
        sedeDespacho: 'Punto Ocaña (Centro Regional DANE 54498)',
      },
    ],
    timelineFechas: {
      RECIBIDO: '03 Nov 2026, 02:20 p.m.',
      CONFIRMADO: '03 Nov 2026, 02:35 p.m.',
      EN_PREPARACION: '04 Nov 2026, 09:00 a.m.',
      LISTO_DESPACHO: '04 Nov 2026, 03:40 p.m.',
      DESPACHADO: '04 Nov 2026, 06:15 p.m.',
      EN_ENTREGA: 'Hoy, 02:20 p.m.',
      ENTREGADO: 'Estimado Hoy antes de 06:00 p.m.',
    },
  },
};

interface CiudadDaneSimulador {
  codigoDane: string;
  municipio: string;
  departamento: string;
  sedeOptimaAsignada: string;
  sedeRespaldo: string;
  tarifaFijaFormateadaCOP: string;
  tiempoEstimado: string;
  tipoCobertura: string;
  explicacionRuta: string;
}

const CIUDADES_SIMULADOR_DANE: CiudadDaneSimulador[] = [
  {
    codigoDane: '54001',
    municipio: 'Cúcuta',
    departamento: 'Norte de Santander',
    sedeOptimaAsignada: 'Punto Centro (54001) o Punto Caobos (54001)',
    sedeRespaldo: 'Bodega Central Cúcuta (54001)',
    tarifaFijaFormateadaCOP: '$8.000 COP',
    tiempoEstimado: 'Mismo día (3 a 6 horas hábiles)',
    tipoCobertura: 'Cobertura Urbana Directa (Doble Nodo Local)',
    explicacionRuta:
      'El motor evalúa primero Punto Centro y luego Punto Caobos buscando el 100% del carrito en una sola tienda para evitar envíos divididos (CA-35).',
  },
  {
    codigoDane: '54498',
    municipio: 'Ocaña',
    departamento: 'Norte de Santander',
    sedeOptimaAsignada: 'Punto Ocaña (54498)',
    sedeRespaldo: 'Punto Centro Cúcuta (54001)',
    tarifaFijaFormateadaCOP: '$9.500 COP',
    tiempoEstimado: 'Mismo día o 24 horas hábiles',
    tipoCobertura: 'Cobertura Subregional Directa en Sede Ocaña',
    explicacionRuta:
      'Si Punto Ocaña cuenta con todas las unidades del pedido, despacha localmente en minutos. Si falta una referencia, reasigna el pedido completo a Cúcuta (CA-36).',
  },
  {
    codigoDane: '68001',
    municipio: 'Bucaramanga',
    departamento: 'Santander',
    sedeOptimaAsignada: 'Punto Bucaramanga (68001)',
    sedeRespaldo: 'Punto Centro Cúcuta (54001)',
    tarifaFijaFormateadaCOP: '$10.000 COP',
    tiempoEstimado: '24 horas hábiles (Área Metropolitana)',
    tipoCobertura: 'Hub Logístico Oriente Colombiano',
    explicacionRuta:
      'Atendido prioritariamente por nuestra boutique de Cabecera del Llano (DANE 68001) con inventario sincronizado en tiempo real.',
  },
  {
    codigoDane: '11001',
    municipio: 'Bogotá D.C.',
    departamento: 'Cundinamarca / Distrito Capital',
    sedeOptimaAsignada: 'Punto Bucaramanga (68001)',
    sedeRespaldo: 'Punto Centro Cúcuta (54001)',
    tarifaFijaFormateadaCOP: '$16.500 COP',
    tiempoEstimado: '24 a 48 horas hábiles vía aérea/troncal',
    tipoCobertura: 'Despacho Nacional Prioritario sin Fraccionamiento',
    explicacionRuta:
      'Por cercanía logística hacia el centro del país, el algoritmo prioriza el Hub Bucaramanga (68001) siempre que posea el stock íntegro de la orden.',
  },
  {
    codigoDane: '05001',
    municipio: 'Medellín',
    departamento: 'Antioquia',
    sedeOptimaAsignada: 'Punto Bucaramanga (68001) o Punto Ocaña (54498)',
    sedeRespaldo: 'Bodega Central Cúcuta (54001)',
    tarifaFijaFormateadaCOP: '$18.000 COP',
    tiempoEstimado: '2 a 3 días hábiles DANE',
    tipoCobertura: 'Cobertura Nacional Consolidada',
    explicacionRuta:
      'Selecciona la sede con disponibilidad completa más próxima a la Troncal del Magdalena para entregar todo tu pedido en una sola caja sellada.',
  },
];

interface PreguntaFrecuente {
  id: string;
  pregunta: string;
  respuesta: string;
  reglaAsociada: string;
}

const PREGUNTAS_FRECUENTES: PreguntaFrecuente[] = [
  {
    id: 'faq-envios-divididos',
    pregunta: '¿Por qué FORMA nunca envía mi pedido fraccionado en varios paquetes?',
    respuesta:
      'Por nuestra regla de integridad logística (CA-35 y CA-36), el sistema busca automáticamente entre nuestras 4 sedes físicas (Cúcuta Centro, Cúcuta Caobos, Ocaña y Bucaramanga) aquella que tenga el 100% de las prendas de tu carrito. Así recibes una única caja editorial, reduces la huella de carbono y pagas una sola tarifa DANE.',
    reglaAsociada: 'CA-35 · CA-36',
  },
  {
    id: 'faq-reserva-blanda-dura',
    pregunta: '¿Qué diferencia hay entre Reserva Blanda y Reserva Dura en mi compra web?',
    respuesta:
      'Cuando creas tu pedido (RECIBIDO / CONFIRMADO), el inventario queda en Reserva Blanda (con un tiempo de vida de 24 horas para pagos por QR según CA-39). Si un cliente en tienda física compra la última unidad antes de que tu pedido entre a bodega, el POS tiene prioridad (RN-VTA-03) y tu pedido se reasigna automáticamente a otra sede con stock o a custodia en la Bodega Central de Cúcuta. Una vez tu pedido pasa a EN PREPARACIÓN, se activa la Reserva Dura y nadie puede tocar tus prendas.',
    reglaAsociada: 'RN-VTA-03 · RN-WEB-16 · CA-39',
  },
  {
    id: 'faq-qr-saldo-favor',
    pregunta: '¿Cómo funciona el Código QR de Saldo a Favor para cambios en tienda física?',
    respuesta:
      'En FORMA no entregamos efectivo por devoluciones para proteger la seguridad y trazabilidad contable de caja. Al aprobarse un cambio o devolución dentro del plazo legal, emitimos un Bono Digital con Código QR único en pesos enteros COP, el cual puedes presentar en cualquiera de nuestras 4 tiendas físicas para redimirlo en nuevas piezas.',
    reglaAsociada: 'RN-DEV-04 · Ley 1480',
  },
  {
    id: 'faq-excepcion-cosmeticos',
    pregunta: '¿Puedo cambiar o retractarme de un producto de Cosmética Botánica?',
    respuesta:
      'Conforme al Estatuto del Consumidor (Ley 1480 de 2011) y nuestra regla de bioseguridad RN-CAT-02, los artículos de uso personal, cosméticos, aceites faciales y jabones botánicos están excluidos de cambio o retracto una vez roto su sello de higiene original, salvo que presenten un defecto de fabricación o calidad comprobado.',
    reglaAsociada: 'RN-CAT-02 · INVIMA',
  },
];

const formatCOP = (val: number): string =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(val) + ' COP';

interface UsuarioSesion {
  id?: number;
  rol?: string;
  nombreCompleto?: string;
  correo?: string;
  email?: string;
}

export const SoportePage: React.FC = () => {
  const searchInputId = useId();

  // 1. Estado de Sesión Multi-Cuenta
  const [usuarioSesion, setUsuarioSesion] = useState<UsuarioSesion | null>(null);
  const [pedidosCuenta, setPedidosCuenta] = useState<PedidoRastreo[]>([]);

  // 2. Estados del Rastreador de Pedidos
  const [codigoInput, setCodigoInput] = useState<string>('PED-2026-849201');
  const [pedidoConsultado, setPedidoConsultado] = useState<PedidoRastreo | null>(
    PEDIDOS_DEMOSTRACION_BASE['PED-2026-849201']
  );
  const [indiceEstadoSimulado, setIndiceEstadoSimulado] = useState<number>(
    PEDIDOS_DEMOSTRACION_BASE['PED-2026-849201'].indiceEstado
  );
  const [mensajeErrorBusqueda, setMensajeErrorBusqueda] = useState<string | null>(null);

  // 3. Estado del Modal de Estado Detallado del Pedido
  const [modalAbierto, setModalAbierto] = useState<boolean>(false);
  const [productoModalSeleccionado, setProductoModalSeleccionado] = useState<ProductoEnPedido | null>(null);
  const [indiceEstadoModal, setIndiceEstadoModal] = useState<number>(0);
  const [guiaCopiada, setGuiaCopiada] = useState<boolean>(false);

  // 4. Estado del Simulador DANE
  const [daneSeleccionado, setDaneSeleccionado] = useState<string>('54001');

  // 5. Estado del Acordeón FAQ
  const [faqAbiertaId, setFaqAbiertaId] = useState<string>(PREGUNTAS_FRECUENTES[0].id);

  // Carga inicial y reactiva de usuario logueado en localStorage('usuario')
  useEffect(() => {
    const cargarUsuarioYPedidos = () => {
      try {
        const rawUser = localStorage.getItem('usuario');
        if (rawUser) {
          const userObj = JSON.parse(rawUser) as UsuarioSesion;
          setUsuarioSesion(userObj);

          const emailOId = userObj.email || userObj.correo || (userObj.id ? `user_${userObj.id}` : 'cliente');
          const storageKey = `forma_pedidos_${emailOId}`;
          const rawPedidos = localStorage.getItem(storageKey);

          if (rawPedidos) {
            try {
              const parsed = JSON.parse(rawPedidos) as PedidoRastreo[];
              if (Array.isArray(parsed) && parsed.length > 0) {
                setPedidosCuenta(parsed);
                // Si aún no hemos seleccionado un pedido personalizado, tomamos el primero
                setPedidoConsultado(parsed[0]);
                setIndiceEstadoSimulado(parsed[0].indiceEstado);
                setCodigoInput(parsed[0].codigo);
                return;
              }
            } catch {
              // Silencioso: fallback a pedidos demo personalizados
            }
          }

          // Fallback inteligente para la cuenta autenticada: generamos sus pedidos vinculados
          const pedidosPersonalizados: PedidoRastreo[] = [
            {
              ...PEDIDOS_DEMOSTRACION_BASE['PED-2026-849201'],
              cliente: userObj.nombreCompleto || 'Cliente FORMA Autenticado',
              emailCliente: userObj.email || userObj.correo || 'cliente@forma.co',
            },
            {
              ...PEDIDOS_DEMOSTRACION_BASE['PED-2026-510394'],
              cliente: userObj.nombreCompleto || 'Cliente FORMA Autenticado',
              emailCliente: userObj.email || userObj.correo || 'cliente@forma.co',
            },
          ];
          setPedidosCuenta(pedidosPersonalizados);
          try {
            localStorage.setItem(storageKey, JSON.stringify(pedidosPersonalizados));
          } catch {
            // storage quota fallback
          }
          setPedidoConsultado(pedidosPersonalizados[0]);
          setIndiceEstadoSimulado(pedidosPersonalizados[0].indiceEstado);
          setCodigoInput(pedidosPersonalizados[0].codigo);
        } else {
          // No autenticado / modo invitado
          setUsuarioSesion(null);
          const demoList = Object.values(PEDIDOS_DEMOSTRACION_BASE);
          setPedidosCuenta(demoList);
          setPedidoConsultado(PEDIDOS_DEMOSTRACION_BASE['PED-2026-849201']);
          setIndiceEstadoSimulado(PEDIDOS_DEMOSTRACION_BASE['PED-2026-849201'].indiceEstado);
        }
      } catch {
        setUsuarioSesion(null);
      }
    };

    cargarUsuarioYPedidos();
    window.addEventListener('storage', cargarUsuarioYPedidos);
    return () => window.removeEventListener('storage', cargarUsuarioYPedidos);
  }, []);

  // Control de scroll y tecla ESC para el Modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modalAbierto) {
        setModalAbierto(false);
      }
    };
    if (modalAbierto) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [modalAbierto]);

  const ciudadActualDane =
    CIUDADES_SIMULADOR_DANE.find((c) => c.codigoDane === daneSeleccionado) ||
    CIUDADES_SIMULADOR_DANE[0];

  const handleBuscarPedido = (e: React.FormEvent) => {
    e.preventDefault();
    const limpio = codigoInput.trim().toUpperCase();
    if (!limpio) {
      setMensajeErrorBusqueda('Por favor ingresa un código de pedido válido (ej. PED-2026-849201).');
      return;
    }

    // Primero busca en los pedidos de la cuenta o base demo
    const enCuenta = pedidosCuenta.find((p) => p.codigo === limpio);
    const enBaseDemo = PEDIDOS_DEMOSTRACION_BASE[limpio];
    const encontrado = enCuenta || enBaseDemo;

    if (encontrado) {
      setPedidoConsultado(encontrado);
      setIndiceEstadoSimulado(encontrado.indiceEstado);
      setMensajeErrorBusqueda(null);
    } else {
      // Si ingresa un código nuevo, generamos un pedido realista con productos completos
      setMensajeErrorBusqueda(null);
      const nuevoPedido: PedidoRastreo = {
        codigo: limpio,
        cliente: usuarioSesion?.nombreCompleto || 'Cliente Verificado FORMA',
        emailCliente: usuarioSesion?.email || usuarioSesion?.correo || 'cliente@forma.co',
        ciudadDestino: 'Cúcuta, Norte de Santander',
        codigoDaneDestino: '54001',
        sedeAsignada: 'Punto Centro (Cúcuta Flagship · DANE 54001)',
        codigoDaneSede: '54001',
        estadoActual: 'CONFIRMADO',
        indiceEstado: 1,
        guiaTransportadora: `GUIA-FORMA-54001-${Math.floor(10000 + Math.random() * 90000)}`,
        transportadora: 'Logística Omnicanal FORMA',
        metodoPago: 'Pago Electrónico Verificado (Idempotente)',
        fechaCreacionBogota: 'Hoy, 08:30 a.m. (America/Bogota)',
        fechaActualizacionBogota: 'Actualizado hace 15 min (America/Bogota)',
        totalCOP: 189000,
        totalFormateadoCOP: '$189.000 COP',
        notaReserva:
          'Pedido validado con stock completo en Punto Centro Cúcuta. Próximo paso: Alistamiento físico con Reserva Dura.',
        productos: [
          {
            id: `prod-${limpio}-1`,
            nombre: 'Chaqueta Denim Artesanal Edición Colección',
            sku: 'ROP-DNM-001-L',
            talla: 'L',
            color: 'Azul Índigo Profundo',
            cantidad: 1,
            precioUnitarioCOP: 189000,
            imagenUrl:
              'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80',
            sedeDespacho: 'Punto Centro (Cúcuta Flagship DANE 54001)',
          },
        ],
        timelineFechas: {
          RECIBIDO: 'Hoy, 08:30 a.m.',
          CONFIRMADO: 'Hoy, 08:45 a.m.',
          EN_PREPARACION: 'Próximo paso',
          LISTO_DESPACHO: 'En espera',
          DESPACHADO: 'En espera',
          EN_ENTREGA: 'En espera',
          ENTREGADO: 'En espera',
        },
      };

      setPedidoConsultado(nuevoPedido);
      setIndiceEstadoSimulado(1);

      // Si hay usuario logueado, lo agregamos a sus pedidos guardados en localStorage
      if (usuarioSesion) {
        const emailOId = usuarioSesion.email || usuarioSesion.correo || (usuarioSesion.id ? `user_${usuarioSesion.id}` : 'cliente');
        const key = `forma_pedidos_${emailOId}`;
        const nuevaLista = [nuevoPedido, ...pedidosCuenta.filter((p) => p.codigo !== nuevoPedido.codigo)];
        setPedidosCuenta(nuevaLista);
        try {
          localStorage.setItem(key, JSON.stringify(nuevaLista));
        } catch {
          // ignore
        }
      }
    }
  };

  const handleCargarDemoEnUnClic = (codigoDemo: string) => {
    const demo = pedidosCuenta.find((p) => p.codigo === codigoDemo) || PEDIDOS_DEMOSTRACION_BASE[codigoDemo];
    if (!demo) return;
    setCodigoInput(demo.codigo);
    setPedidoConsultado(demo);
    setIndiceEstadoSimulado(demo.indiceEstado);
    setMensajeErrorBusqueda(null);
  };

  const handleAbrirModalDetalle = (producto?: ProductoEnPedido) => {
    if (!pedidoConsultado) return;
    setProductoModalSeleccionado(producto || pedidoConsultado.productos[0] || null);
    setIndiceEstadoModal(indiceEstadoSimulado);
    setGuiaCopiada(false);
    setModalAbierto(true);
  };

  const handleCopiarGuia = useCallback((guia: string) => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(guia);
    setGuiaCopiada(true);
    setTimeout(() => setGuiaCopiada(false), 2500);
  }, []);

  const pasoActualInfo = FLUJO_SIETE_ESTADOS[indiceEstadoSimulado] || FLUJO_SIETE_ESTADOS[0];
  const pasoModalInfo = FLUJO_SIETE_ESTADOS[indiceEstadoModal] || FLUJO_SIETE_ESTADOS[0];

  return (
    <div className="space-y-16 relative">
      {/* =====================================================================
          1. ENCABEZADO EDITORIAL DEL CENTRO DE SOPORTE & EXPERIENCIA
          ===================================================================== */}
      <section aria-labelledby="soporte-hero-heading">
        <div className="glass-mirror-card rounded-[2.5rem] p-6 sm:p-10 lg:p-12">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#661521] text-white text-xs font-bold tracking-[0.18em] uppercase shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#D19650]" aria-hidden="true" />
              <span>Centro de Soporte & Transparencia Logística</span>
            </div>

            <h1
              id="soporte-hero-heading"
              className="text-3xl sm:text-5xl font-serif-editorial font-medium text-[#50322A] leading-tight"
            >
              Rastreo de Pedidos, Tarifas DANE & Garantía Legal
            </h1>

            <p className="text-base sm:text-lg text-[#171717] leading-relaxed">
              Consulta en tiempo real la trazabilidad de los{' '}
              <strong className="text-[#50322A] font-bold">7 estados de tu pedido web</strong>, simula la
              asignación inteligente de sede sin envíos divididos (
              <span className="font-mono-tabular font-bold text-[#661521]">CA-35 / CA-36</span>) y
              conoce tus derechos bajo el Estatuto del Consumidor (
              <strong className="text-[#50322A] font-bold">Ley 1480</strong>).
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================================
          2. RASTREADOR INTERACTIVO DE PEDIDOS WEB MULTI-CUENTA (7 ESTADOS)
          ===================================================================== */}
      <section aria-labelledby="tracker-heading" className="space-y-6">
        <div className="glass-mirror-card rounded-[2.25rem] p-6 sm:p-8 lg:p-10 space-y-8">
          {/* Header del Rastreador y Estado de Sesión */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-[#50322A]/15 pb-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#661521] block">
                  Máquina de Estados Omnicanal · Hora Oficial America/Bogota
                </span>
                {usuarioSesion ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                    <User className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>
                      Cuenta: {usuarioSesion.nombreCompleto || usuarioSesion.email || 'Autenticado'}
                    </span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D19650]/20 text-[#50322A] text-xs font-bold">
                    <Info className="w-3.5 h-3.5 text-[#661521]" aria-hidden="true" />
                    <span>Modo Consulta Libre / Invitado</span>
                  </span>
                )}
              </div>
              <h2
                id="tracker-heading"
                className="text-2xl sm:text-3xl font-serif-editorial font-medium text-[#50322A]"
              >
                Rastreador Interactivo de Pedidos Web y Envíos DANE
              </h2>
            </div>

            {/* Accesos rápidos de pedidos (Multi-cuenta o Demos) */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#50322A] block">
                {usuarioSesion ? 'Tus Pedidos Registrados:' : 'Probar pedidos de demostración:'}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {pedidosCuenta.map((ped) => (
                  <button
                    key={ped.codigo}
                    type="button"
                    onClick={() => handleCargarDemoEnUnClic(ped.codigo)}
                    className={`min-h-[48px] px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${
                      pedidoConsultado?.codigo === ped.codigo
                        ? 'bg-[#661521] text-white shadow-md'
                        : 'glass-mirror-pill text-[#50322A] hover:border-[#D19650]'
                    }`}
                  >
                    <PackageCheck className="w-4 h-4 text-[#D19650]" aria-hidden="true" />
                    <span>{ped.codigo}</span>
                    <span className="opacity-80 font-mono-tabular">({ped.estadoActual})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Formulario de Búsqueda por Código */}
          <form onSubmit={handleBuscarPedido} className="space-y-3">
            <label htmlFor={searchInputId} className="text-xs font-bold text-[#50322A] block">
              Ingresa cualquier código de pedido para consultar su expediente logístico:
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search
                  className="w-5 h-5 text-[#50322A]/70 absolute left-4 top-1/2 -translate-y-1/2"
                  aria-hidden="true"
                />
                <input
                  id={searchInputId}
                  type="text"
                  value={codigoInput}
                  onChange={(e) => setCodigoInput(e.target.value)}
                  placeholder="Ej. PED-2026-849201"
                  className="w-full pl-12 pr-4 py-3.5 min-h-[48px] rounded-full capsule-mirror-input text-sm font-mono-tabular font-bold text-[#171717] placeholder:text-[#50322A]/50"
                />
              </div>
              <button
                type="submit"
                className="min-h-[48px] px-8 py-3.5 rounded-full bg-[#661521] hover:bg-[#4A0E17] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-[#661521]/20 shrink-0 flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4 text-[#D19650]" aria-hidden="true" />
                <span>Consultar Estado DANE</span>
              </button>
            </div>
          </form>

          {mensajeErrorBusqueda && (
            <p className="text-xs font-bold text-[#661521] bg-[#661521]/10 px-4 py-3 rounded-2xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{mensajeErrorBusqueda}</span>
            </p>
          )}

          {/* Contenido del Pedido Consultado */}
          {pedidoConsultado && (
            <div className="space-y-8 pt-2">
              {/* Tarjetas Informativas Superiores */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white/80 border border-[#50322A]/15 shadow-sm space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#50322A]/80 block">
                    Código & Total COP
                  </span>
                  <p className="font-mono-tabular text-sm font-bold text-[#661521]">
                    {pedidoConsultado.codigo}
                  </p>
                  <p className="font-mono-tabular text-sm font-bold text-[#171717]">
                    {pedidoConsultado.totalFormateadoCOP}
                  </p>
                  <p className="text-xs text-[#50322A]">
                    Cliente: <strong>{pedidoConsultado.cliente}</strong>
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/80 border border-[#50322A]/15 shadow-sm space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#50322A]/80 block">
                    Sede Asignada (Stock 100%)
                  </span>
                  <p className="text-xs font-bold text-[#171717]">{pedidoConsultado.sedeAsignada}</p>
                  <p className="font-mono-tabular text-xs text-[#50322A]">
                    Nodo DANE Origen: {pedidoConsultado.codigoDaneSede}
                  </p>
                  <span className="inline-block text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Cero envíos divididos (CA-35)
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-white/80 border border-[#50322A]/15 shadow-sm space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#50322A]/80 block">
                    Destino & Guía de Transporte
                  </span>
                  <p className="text-xs font-bold text-[#171717]">
                    {pedidoConsultado.ciudadDestino} ({pedidoConsultado.codigoDaneDestino})
                  </p>
                  <div className="flex items-center gap-2 pt-0.5">
                    <p className="font-mono-tabular text-xs text-[#661521] font-bold truncate">
                      {pedidoConsultado.guiaTransportadora}
                    </p>
                    {pedidoConsultado.guiaTransportadora.startsWith('GUIA') && (
                      <button
                        type="button"
                        onClick={() => handleCopiarGuia(pedidoConsultado.guiaTransportadora)}
                        className="p-1 rounded-md text-[#50322A] hover:bg-[#D19650]/20 transition-colors"
                        title="Copiar número de guía"
                      >
                        {guiaCopiada ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-[#50322A]">{pedidoConsultado.transportadora}</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#50322A] text-[#E7DED2] shadow-sm space-y-1 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#D19650] block">
                      Nivel de Reserva en Kardex
                    </span>
                    <p className="text-xs font-bold text-white mt-1">{pasoActualInfo.tipoReserva}</p>
                    <p className="text-xs text-[#E7DED2]/90 mt-1">
                      {pedidoConsultado.fechaActualizacionBogota}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAbrirModalDetalle()}
                    className="min-h-[44px] w-full mt-2 px-3 py-2 rounded-xl bg-[#D19650] hover:bg-[#b87f3d] text-[#171717] text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Ver Modal de Estado</span>
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* LISTADO DE PRODUCTOS DEL PEDIDO (Requisito 1) */}
              <div className="p-6 rounded-3xl bg-white/70 border border-white/90 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#50322A]/10 pb-3">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-[#661521] block">
                      Composición del Envío
                    </span>
                    <h3 className="text-lg font-serif-editorial font-bold text-[#50322A]">
                      Piezas y Artículos en este Pedido ({pedidoConsultado.productos.length})
                    </h3>
                  </div>
                  <p className="text-xs text-[#50322A]/80">
                    Haz clic en cualquier pieza para abrir su expediente de trazabilidad en Kardex
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pedidoConsultado.productos.map((prod) => (
                    <div
                      key={prod.id}
                      className="p-4 rounded-2xl bg-white border border-[#50322A]/15 hover:border-[#D19650] transition-all flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between group shadow-sm"
                    >
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <img
                          src={prod.imagenUrl}
                          alt={prod.nombre}
                          className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl border border-[#D19650]/30 shrink-0"
                          loading="lazy"
                        />
                        <div className="space-y-1 min-w-0">
                          <h4 className="text-sm font-bold text-[#171717] group-hover:text-[#661521] transition-colors line-clamp-1">
                            {prod.nombre}
                          </h4>
                          <div className="flex flex-wrap items-center gap-1.5 text-xs">
                            <span className="font-mono-tabular px-2 py-0.5 rounded bg-[#E7DED2]/80 text-[#50322A] font-bold">
                              {prod.sku}
                            </span>
                            <span className="text-[#50322A] font-medium">
                              Talla: <strong>{prod.talla}</strong> · Color: <strong>{prod.color}</strong>
                            </span>
                          </div>
                          <p className="text-xs text-[#171717]">
                            Cantidad: <strong>{prod.cantidad}</strong> ×{' '}
                            <span className="font-mono-tabular font-bold text-[#661521]">
                              {formatCOP(prod.precioUnitarioCOP)}
                            </span>
                          </p>
                          <p className="text-xs text-[#50322A] flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-[#D19650]" aria-hidden="true" />
                            <span>{prod.sedeDespacho}</span>
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAbrirModalDetalle(prod)}
                        className="w-full sm:w-auto min-h-[48px] px-4 py-2.5 rounded-full bg-[#E7DED2] hover:bg-[#661521] text-[#50322A] hover:text-white text-xs font-bold transition-all shrink-0 flex items-center justify-center gap-2"
                      >
                        <span>Ver Trazabilidad</span>
                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* LÍNEA DE TIEMPO INTERACTIVA DE 7 ESTADOS (En página principal) */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white/70 border border-white/90 space-y-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-[#50322A]">
                      Línea de Tiempo Oficial de 7 Estados del Pedido Web
                    </h3>
                    <p className="text-xs text-[#171717]/80">
                      Haz clic en cualquier etapa para simular e inspeccionar el comportamiento de la reserva en el Kardex:
                    </p>
                  </div>
                  <span className="font-mono-tabular text-xs font-bold px-3 py-1.5 rounded-full bg-[#661521] text-white shadow-sm">
                    Estado Actual: {pasoActualInfo.estado}
                  </span>
                </div>

                {/* Grilla responsiva de los 7 estados */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2.5">
                  {FLUJO_SIETE_ESTADOS.map((paso, idx) => {
                    const completado = idx <= indiceEstadoSimulado;
                    const esActual = idx === indiceEstadoSimulado;
                    return (
                      <button
                        key={paso.estado}
                        type="button"
                        onClick={() => setIndiceEstadoSimulado(idx)}
                        className={`text-left p-3.5 rounded-2xl border transition-all flex flex-col justify-between min-h-[72px] ${
                          esActual
                            ? 'bg-[#661521] text-white border-[#661521] shadow-lg scale-[1.02]'
                            : completado
                            ? 'bg-[#D19650]/20 text-[#50322A] border-[#D19650]/60'
                            : 'bg-white/80 text-[#171717]/70 border-[#50322A]/10 hover:border-[#D19650]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-2">
                          <span className="font-mono-tabular text-xs font-bold uppercase">
                            {paso.estado}
                          </span>
                          <CheckCircle2
                            className={`w-4 h-4 shrink-0 ${
                              esActual
                                ? 'text-[#D19650]'
                                : completado
                                ? 'text-[#661521]'
                                : 'text-[#50322A]/30'
                            }`}
                            aria-hidden="true"
                          />
                        </div>
                        <p className="text-xs font-bold leading-snug">{paso.etiqueta}</p>
                      </button>
                    );
                  })}
                </div>

                {/* Explicación Técnica de la Etapa Seleccionada */}
                <div className="p-4 rounded-2xl bg-[#E7DED2]/80 border border-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <PackageCheck className="w-5 h-5 text-[#661521]" aria-hidden="true" />
                      <strong className="text-xs uppercase tracking-wider text-[#50322A]">
                        Etapa Inspeccionada: {pasoActualInfo.estado} ({pasoActualInfo.tipoReserva})
                      </strong>
                    </div>
                    <p className="text-xs sm:text-sm text-[#171717] leading-relaxed">
                      {pasoActualInfo.descripcion}
                    </p>
                    <p className="text-xs text-[#50322A] pt-1">
                      <strong>Regla Kardex:</strong> {pasoActualInfo.explicacionKardex}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAbrirModalDetalle()}
                    className="shrink-0 min-h-[48px] px-4 py-2.5 rounded-xl bg-[#661521] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#4A0E17] transition-all flex items-center justify-center gap-2"
                  >
                    <span>Abrir Trazabilidad Completa</span>
                    <ExternalLink className="w-4 h-4 text-[#D19650]" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* =====================================================================
          MODAL DE ESTADO DETALLADO DEL PEDIDO (Requisito 2)
          ===================================================================== */}
      {modalAbierto && pedidoConsultado && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-[#171717]/65 backdrop-blur-sm animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-pedido-title"
        >
          <div className="bg-[#FAF7F2] border-2 border-[#D19650]/40 rounded-[2rem] shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-8 space-y-6 relative flex flex-col">
            {/* Botón de Cierre */}
            <button
              type="button"
              onClick={() => setModalAbierto(false)}
              className="absolute top-5 right-5 w-12 h-12 rounded-full glass-mirror-pill text-[#50322A] hover:bg-[#661521] hover:text-white transition-all flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#661521]"
              aria-label="Cerrar modal de estado detallado"
            >
              <X className="w-6 h-6" aria-hidden="true" />
            </button>

            {/* Cabecera del Modal */}
            <div className="pr-12 space-y-2 border-b border-[#50322A]/15 pb-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono-tabular text-xs font-bold px-3 py-1 rounded-full bg-[#661521] text-white">
                  {pedidoConsultado.codigo}
                </span>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full ${
                    pasoModalInfo.tipoReserva === 'KARDEX DESCONTADO'
                      ? 'bg-[#50322A] text-white'
                      : pasoModalInfo.tipoReserva === 'RESERVA DURA (PROTEGIDA)'
                      ? 'bg-emerald-800 text-white'
                      : 'bg-[#D19650] text-[#171717]'
                  }`}
                >
                  {pasoModalInfo.tipoReserva}
                </span>
                <span className="text-xs text-[#50322A] font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#661521]" aria-hidden="true" />
                  <span>America/Bogota: {pedidoConsultado.fechaActualizacionBogota}</span>
                </span>
              </div>

              <h2
                id="modal-pedido-title"
                className="text-2xl sm:text-3xl font-serif-editorial font-bold text-[#50322A]"
              >
                Expediente de Estado Detallado del Pedido
              </h2>
              <p className="text-xs sm:text-sm text-[#171717]/85">
                Destinatario: <strong>{pedidoConsultado.cliente}</strong> · Destino:{' '}
                <strong>
                  {pedidoConsultado.ciudadDestino} (DANE {pedidoConsultado.codigoDaneDestino})
                </strong>
              </p>
            </div>

            {/* Ficha del Producto Seleccionado en el Pedido */}
            {productoModalSeleccionado && (
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#50322A]/15 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#661521] flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-[#D19650]" aria-hidden="true" />
                    <span>Artículo en Tránsito Logístico</span>
                  </span>
                  <span className="text-xs text-[#50322A] font-bold">
                    Total Pedido: {pedidoConsultado.totalFormateadoCOP}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <img
                    src={productoModalSeleccionado.imagenUrl}
                    alt={productoModalSeleccionado.nombre}
                    className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-2xl border border-[#D19650]/40 shrink-0 shadow-sm"
                  />
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-bold text-[#171717]">
                      {productoModalSeleccionado.nombre}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-mono-tabular px-2.5 py-0.5 rounded-full bg-[#E7DED2] text-[#50322A] font-bold">
                        SKU: {productoModalSeleccionado.sku}
                      </span>
                      <span className="text-[#50322A]">
                        Talla: <strong>{productoModalSeleccionado.talla}</strong>
                      </span>
                      <span className="text-[#50322A]">
                        Color: <strong>{productoModalSeleccionado.color}</strong>
                      </span>
                      <span className="text-[#171717] font-bold">
                        Cant: {productoModalSeleccionado.cantidad} unit.
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-[#661521] font-mono-tabular font-bold">
                      Precio Unitario:{' '}
                      {formatCOP(productoModalSeleccionado.precioUnitarioCOP)}
                    </p>
                    <p className="text-xs text-[#50322A] flex items-center gap-1.5 pt-0.5">
                      <Building2 className="w-4 h-4 text-[#661521]" aria-hidden="true" />
                      <span>
                        Sede de Alistamiento: <strong>{productoModalSeleccionado.sedeDespacho}</strong>
                      </span>
                    </p>
                  </div>
                </div>

                {/* Selector rápido si hay más de 1 producto en el pedido */}
                {pedidoConsultado.productos.length > 1 && (
                  <div className="pt-2 border-t border-[#50322A]/10 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-[#50322A]">Otras piezas en este pedido:</span>
                    {pedidoConsultado.productos.map((otro) => (
                      <button
                        key={otro.id}
                        type="button"
                        onClick={() => setProductoModalSeleccionado(otro)}
                        className={`text-xs px-3 py-1 rounded-full font-bold transition-all ${
                          productoModalSeleccionado.id === otro.id
                            ? 'bg-[#661521] text-white'
                            : 'bg-[#E7DED2] text-[#50322A] hover:bg-[#D19650]/30'
                        }`}
                      >
                        {otro.nombre} ({otro.talla})
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Línea de Tiempo Visual Interactiva de los 7 Estados */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-[#50322A] uppercase tracking-wider">
                  Trazabilidad de los 7 Estados del Pedido:
                </h4>
                <span className="text-xs text-[#50322A] font-medium">
                  Paso {indiceEstadoModal + 1} de 7
                </span>
              </div>

              {/* Stepper visual interactivo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-2">
                {FLUJO_SIETE_ESTADOS.map((p, idx) => {
                  const completado = idx <= indiceEstadoModal;
                  const esActual = idx === indiceEstadoModal;
                  return (
                    <button
                      key={p.estado}
                      type="button"
                      onClick={() => setIndiceEstadoModal(idx)}
                      className={`min-h-[56px] p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                        esActual
                          ? 'bg-[#661521] text-white border-[#661521] shadow-md scale-[1.02]'
                          : completado
                          ? 'bg-emerald-50 text-[#50322A] border-emerald-300'
                          : 'bg-white/90 text-[#171717]/60 border-[#50322A]/15 hover:border-[#D19650]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] font-bold font-mono-tabular">
                          0{idx + 1}
                        </span>
                        <CheckCircle2
                          className={`w-3.5 h-3.5 ${
                            esActual
                              ? 'text-[#D19650]'
                              : completado
                              ? 'text-emerald-700'
                              : 'text-[#50322A]/25'
                          }`}
                          aria-hidden="true"
                        />
                      </div>
                      <span className="text-xs font-bold leading-tight truncate">
                        {p.estado}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Tarjeta de Detalle del Estado Seleccionado */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border-2 border-[#D19650]/40 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono-tabular text-xs font-bold text-[#661521]">
                    ESTADO: {pasoModalInfo.estado}
                  </span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#50322A] text-white">
                    {pasoModalInfo.tipoReserva}
                  </span>
                </div>
                <p className="text-sm font-bold text-[#50322A]">{pasoModalInfo.etiqueta}</p>
                <p className="text-xs sm:text-sm text-[#171717] leading-relaxed">
                  {pasoModalInfo.descripcion}
                </p>
                <p className="text-xs text-[#50322A] bg-[#E7DED2]/50 p-2.5 rounded-xl border border-[#D19650]/30 leading-relaxed">
                  <strong>Impacto en Kardex:</strong> {pasoModalInfo.explicacionKardex}
                </p>
                {pedidoConsultado.timelineFechas?.[pasoModalInfo.estado] && (
                  <p className="text-xs text-[#661521] font-mono-tabular font-bold pt-1">
                    Registro de Marca Temporal:{' '}
                    {pedidoConsultado.timelineFechas[pasoModalInfo.estado]} (America/Bogota)
                  </p>
                )}
              </div>
            </div>

            {/* Información de Transporte y Guía */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white/90 border border-[#50322A]/15 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#50322A] flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#661521]" aria-hidden="true" />
                <span>Logística de Transporte y Despacho DANE</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#E7DED2]/60 border border-white">
                  <span className="text-xs text-[#50322A]/80 block mb-0.5">Transportadora Aliada</span>
                  <strong className="text-sm text-[#171717] block">
                    {pedidoConsultado.transportadora}
                  </strong>
                  <span className="text-xs text-[#50322A]">
                    Nodo Despacho: {pedidoConsultado.sedeAsignada}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#E7DED2]/60 border border-white space-y-1">
                  <span className="text-xs text-[#50322A]/80 block">Número de Guía Oficial</span>
                  <div className="flex items-center justify-between gap-2">
                    <strong className="font-mono-tabular text-sm text-[#661521] truncate">
                      {pedidoConsultado.guiaTransportadora}
                    </strong>
                    {pedidoConsultado.guiaTransportadora.startsWith('GUIA') && (
                      <button
                        type="button"
                        onClick={() => handleCopiarGuia(pedidoConsultado.guiaTransportadora)}
                        className="min-h-[40px] px-3 py-1 rounded-lg bg-[#661521] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-[#4A0E17] transition-all shrink-0"
                      >
                        {guiaCopiada ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#D19650]" />
                            <span>¡Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar Guía</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Botón de Cierre Inferior */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                className="w-full sm:w-auto min-h-[48px] px-8 py-3 rounded-full bg-[#661521] hover:bg-[#4A0E17] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md"
              >
                Cerrar Expediente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          3. SIMULADOR DE COBERTURA Y TARIFAS DE ENVÍO DANE (CA-35, CA-36, CA-39)
          ===================================================================== */}
      <section aria-labelledby="simulador-dane-heading" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Panel Izquierdo: Selector de Municipio DANE */}
          <div className="lg:col-span-7 glass-mirror-card rounded-[2.25rem] p-6 sm:p-8 space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#661521] block mb-1">
                Tabulador Oficial DANE · Cero Envíos Divididos
              </span>
              <h2
                id="simulador-dane-heading"
                className="text-2xl sm:text-3xl font-serif-editorial font-medium text-[#50322A]"
              >
                Simulador de Cobertura y Tarifas de Envío DANE
              </h2>
              <p className="text-xs sm:text-sm text-[#171717] mt-1 leading-relaxed">
                Selecciona tu ciudad destino para consultar la tarifa entera en COP y conocer qué sede física despachará tu orden completa.
              </p>
            </div>

            {/* Botones de Ciudad Destino */}
            <div className="flex flex-wrap gap-2" role="group" aria-label="Ciudades destino DANE">
              {CIUDADES_SIMULADOR_DANE.map((ciudad) => {
                const activa = ciudad.codigoDane === ciudadActualDane.codigoDane;
                return (
                  <button
                    key={ciudad.codigoDane}
                    type="button"
                    onClick={() => setDaneSeleccionado(ciudad.codigoDane)}
                    className={`min-h-[48px] px-4 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${
                      activa
                        ? 'bg-[#661521] text-white shadow-md shadow-[#661521]/25'
                        : 'glass-mirror-pill text-[#50322A] hover:border-[#D19650]'
                    }`}
                  >
                    <MapPin className="w-4 h-4 text-[#D19650]" aria-hidden="true" />
                    <span>{ciudad.municipio}</span>
                    <span className="font-mono-tabular opacity-85">({ciudad.codigoDane})</span>
                  </button>
                );
              })}
            </div>

            {/* Resultado de la Simulación DANE */}
            <div className="p-6 rounded-3xl bg-white/80 border border-white/95 space-y-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#50322A]/15 pb-4">
                <div>
                  <span className="font-mono-tabular text-xs font-bold text-[#661521]">
                    CÓDIGO DANE {ciudadActualDane.codigoDane} · {ciudadActualDane.departamento}
                  </span>
                  <h3 className="text-2xl font-serif-editorial font-bold text-[#50322A]">
                    Destino: {ciudadActualDane.municipio}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#50322A]/80 block">
                    Tarifa Única DANE
                  </span>
                  <span className="text-2xl font-mono-tabular font-bold text-[#661521]">
                    {ciudadActualDane.tarifaFijaFormateadaCOP}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-[#E7DED2]/70 border border-white space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#50322A] block">
                    1ª Opción (Sede Más Cercana con Stock)
                  </span>
                  <strong className="text-[#50322A] block text-sm">
                    {ciudadActualDane.sedeOptimaAsignada}
                  </strong>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#E7DED2]/70 border border-white space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#50322A] block">
                    Tiempo Estimado & Respaldo
                  </span>
                  <strong className="text-[#171717] block text-sm">
                    {ciudadActualDane.tiempoEstimado}
                  </strong>
                  <span className="text-xs text-[#50322A]">
                    Respaldo: {ciudadActualDane.sedeRespaldo}
                  </span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-[#171717] leading-relaxed bg-white/90 p-4 rounded-2xl border border-[#D19650]/30">
                <strong className="text-[#661521]">Regla de Asignación (CA-35 / CA-36):</strong>{' '}
                {ciudadActualDane.explicacionRuta}
              </p>
            </div>
          </div>

          {/* Panel Derecho: Explicación de Reglas de Inventario Web (CA-35, CA-36, CA-39) */}
          <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
            <div className="glass-mirror-card rounded-3xl p-6 space-y-3">
              <div className="flex items-center gap-2.5 text-[#661521]">
                <Truck className="w-5 h-5 text-[#D19650]" aria-hidden="true" />
                <h3 className="text-base font-bold text-[#50322A] font-sans">
                  Sin Envíos Divididos (CA-35 & CA-36)
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-[#171717] leading-relaxed">
                Nuestro motor nunca fracciona tu pedido en múltiples guías. Al confirmar tu compra, el algoritmo evalúa qué sede física más cercana a tu municipio DANE cuenta con el{' '}
                <strong className="text-[#50322A]">100% de las unidades solicitadas</strong>. Si una tienda local tiene stock parcial, la orden completa se asigna a la siguiente sede que pueda despacharla íntegra.
              </p>
            </div>

            <div className="glass-mirror-card rounded-3xl p-6 space-y-3">
              <div className="flex items-center gap-2.5 text-[#661521]">
                <Clock className="w-5 h-5 text-[#D19650]" aria-hidden="true" />
                <h3 className="text-base font-bold text-[#50322A] font-sans">
                  Reserva Blanda de 24h TTL para Pagos QR (CA-39)
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-[#171717] leading-relaxed">
                Si eliges pagar mediante código QR (Bancolombia / Nequi), el sistema activa una{' '}
                <strong className="text-[#50322A]">Reserva Blanda con vigencia de 24 horas (TTL)</strong> en hora oficial{' '}
                <code className="font-mono-tabular text-xs bg-white/90 px-1.5 py-0.5 rounded font-bold">America/Bogota</code>. Si el pago no se confirma en ese lapso, el job automático libera el stock de vuelta al catálogo sin afectar el Kardex.
              </p>
            </div>

            <div className="rounded-3xl bg-[#50322A] text-[#E7DED2] p-6 space-y-2 border border-[#D19650]/40">
              <div className="flex items-center gap-2 text-[#D19650] text-xs font-bold uppercase tracking-wider">
                <Lock className="w-4 h-4" aria-hidden="true" />
                <span>Prioridad POS & Custodia Central (RN-VTA-03)</span>
              </div>
              <p className="text-xs sm:text-sm text-[#E7DED2] leading-relaxed">
                Mientras un pedido web esté en reserva blanda, un cliente presencial en tienda física tiene prioridad de compra. Si eso ocurre, tu pedido web se reasigna en milisegundos a otra sede o pasa a custodia prioritaria en la{' '}
                <strong className="text-white">Bodega Central de Cúcuta</strong>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          4. GARANTÍAS, CAMBIOS Y DERECHO DE RETRACTO (LEY 1480 & RN-CAT-02)
          ===================================================================== */}
      <section aria-labelledby="garantias-heading" className="space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#661521] block mb-1">
            Estatuto del Consumidor en Colombia · Ley 1480 de 2011
          </span>
          <h2
            id="garantias-heading"
            className="text-3xl sm:text-4xl font-serif-editorial font-medium text-[#50322A]"
          >
            Garantías, Cambios y Derecho de Retracto
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: 5 Días Hábiles de Retracto Web */}
          <div className="glass-mirror-card rounded-3xl p-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#661521]/10 border border-[#661521]/20 flex items-center justify-center text-[#661521]">
                <RefreshCw className="w-6 h-6" aria-hidden="true" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#661521] block">
                Art. 47 · Ley 1480 de 2011
              </span>
              <h3 className="text-lg font-bold text-[#50322A] font-sans">
                5 Días Hábiles de Retracto Web
              </h3>
              <p className="text-xs sm:text-sm text-[#171717] leading-relaxed">
                Para todas las compras realizadas en nuestra Tienda Web tienes{' '}
                <strong className="text-[#50322A]">5 días hábiles</strong> contados desde la entrega para ejercer el derecho de retracto, siempre que la prenda conserve sus etiquetas originales y no haya sido usada.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#50322A]/15 text-xs font-mono-tabular font-bold text-[#50322A]">
              Plazo medido en America/Bogota
            </div>
          </div>

          {/* Card 2: 30 Días de Garantía por Defectos de Fábrica */}
          <div className="glass-mirror-card rounded-3xl p-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#D19650]/20 border border-[#D19650]/40 flex items-center justify-center text-[#50322A]">
                <ShieldCheck className="w-6 h-6 text-[#661521]" aria-hidden="true" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#D19650] block">
                Respaldo de Atelier & Artesanía
              </span>
              <h3 className="text-lg font-bold text-[#50322A] font-sans">
                30 Días de Garantía Legal
              </h3>
              <p className="text-xs sm:text-sm text-[#171717] leading-relaxed">
                Todas nuestras piezas de ropa, calzado, marroquinería y filigrana cuentan con{' '}
                <strong className="text-[#50322A]">30 días calendario de garantía</strong> por defectos de fabricación, costuras, herrajes o desprendimiento artesanal.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#50322A]/15 text-xs font-bold text-[#661521]">
              Reparación, cambio o bono QR 100%
            </div>
          </div>

          {/* Card 3: Código QR de Saldo a Favor para Cambios */}
          <div className="glass-mirror-card rounded-3xl p-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#50322A]/10 border border-[#50322A]/20 flex items-center justify-center text-[#50322A]">
                <QrCode className="w-6 h-6 text-[#661521]" aria-hidden="true" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#50322A] block">
                Billetera Omnicanal · RN-DEV-04
              </span>
              <h3 className="text-lg font-bold text-[#50322A] font-sans">
                Código QR de Saldo a Favor
              </h3>
              <p className="text-xs sm:text-sm text-[#171717] leading-relaxed">
                Para tus cambios en tienda física (Cúcuta Centro, Caobos, Ocaña o Bucaramanga), generamos un{' '}
                <strong className="text-[#50322A]">Bono QR cifrado de Saldo a Favor</strong> por el valor exacto pagado (con prorrateo justo de descuentos{' '}
                <code className="font-mono-tabular font-bold">RN-DES-09</code>).
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#50322A]/15 text-xs font-bold text-[#50322A]">
              Redimible en las 4 Sedes Físicas
            </div>
          </div>

          {/* Card 4: Excepción Legal de Higiene para Cosméticos (RN-CAT-02) */}
          <div className="glass-mirror-card rounded-3xl p-6 flex flex-col justify-between border-[#661521]/30">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#661521] text-white flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-[#D19650]" aria-hidden="true" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#661521] block">
                Excepción Sanitaria · RN-CAT-02
              </span>
              <h3 className="text-lg font-bold text-[#661521] font-sans">
                Higiene en Cosmética Botánica
              </h3>
              <p className="text-xs sm:text-sm text-[#171717] leading-relaxed">
                Por disposición sanitaria{' '}
                <strong className="text-[#50322A]">INVIMA y regla de negocio RN-CAT-02</strong>, los productos de uso personal y cosmética botánica{' '}
                <strong className="text-[#661521]">no admiten cambio ni derecho de retracto</strong> si su sello termoencogible de seguridad ha sido abierto o manipulado.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#661521]/20 text-xs font-bold text-[#661521]">
              Protección de Bioseguridad al Cliente
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          5. PREGUNTAS FRECUENTES (ACORDEÓN) & CANALES DE ATENCIÓN POR SEDE
          ===================================================================== */}
      <section aria-labelledby="faq-heading" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Columna Izquierda: Acordeón Interactivo FAQ */}
        <div className="lg:col-span-7 space-y-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#661521] block mb-1">
              Resolución de Dudas en 1 Clic
            </span>
            <h2
              id="faq-heading"
              className="text-2xl sm:text-3xl font-serif-editorial font-medium text-[#50322A]"
            >
              Preguntas Frecuentes
            </h2>
          </div>

          <div className="space-y-3">
            {PREGUNTAS_FRECUENTES.map((item) => {
              const abierta = item.id === faqAbiertaId;
              return (
                <div
                  key={item.id}
                  className="glass-mirror-card rounded-3xl overflow-hidden transition-all shadow-sm"
                >
                  <button
                    type="button"
                    aria-expanded={abierta}
                    onClick={() => setFaqAbiertaId(abierta ? '' : item.id)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 min-h-[56px]"
                  >
                    <div className="space-y-1">
                      <span className="font-mono-tabular text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#D19650]/25 text-[#50322A]">
                        {item.reglaAsociada}
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-[#50322A] font-sans">
                        {item.pregunta}
                      </h3>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-[#661521] shrink-0 transition-transform duration-300 ${
                        abierta ? 'rotate-180' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>

                  {abierta && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[#171717] leading-relaxed border-t border-[#50322A]/10">
                      {item.respuesta}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Columna Derecha: Directorio de Atención Directa por Sede */}
        <div className="lg:col-span-5 space-y-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#661521] block mb-1">
              Atención Presencial & Telefónica
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif-editorial font-medium text-[#50322A]">
              Canales Directos por Sede
            </h2>
          </div>

          <div className="glass-mirror-card rounded-[2rem] p-6 space-y-4 shadow-sm">
            {[
              {
                sede: 'Punto Centro (Cúcuta — DANE 54001)',
                tipo: 'Flagship Store & Cambios QR',
                contacto: '+57 (607) 571 8400 · Av. 5 # 11-42',
              },
              {
                sede: 'Punto Caobos (Cúcuta — DANE 54001)',
                tipo: 'Boutique Exclusiva & Click & Collect',
                contacto: '+57 (607) 572 9120 · Calle 15 # 1E-88',
              },
              {
                sede: 'Punto Ocaña (N. de Santander — DANE 54498)',
                tipo: 'Centro de Experiencia Regional',
                contacto: '+57 (607) 562 4310 · Calle 11 # 12-18',
              },
              {
                sede: 'Punto Bucaramanga (Santander — DANE 68001)',
                tipo: 'Hub de Moda & Despacho Oriente',
                contacto: '+57 (607) 643 7890 · Cra. 35A # 48-62',
              },
            ].map((canal) => (
              <div
                key={canal.sede}
                className="p-4 rounded-2xl bg-white/80 border border-white/95 space-y-1 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-xs text-[#50322A] flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-[#661521]" aria-hidden="true" />
                    <span>{canal.sede}</span>
                  </strong>
                </div>
                <p className="text-xs font-bold text-[#D19650]">{canal.tipo}</p>
                <p className="text-xs text-[#171717] flex items-center gap-1.5 pt-0.5">
                  <Phone className="w-4 h-4 text-[#50322A]" aria-hidden="true" />
                  <span>{canal.contacto}</span>
                </p>
              </div>
            ))}

            <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
              <Link
                to="/nosotros"
                className="min-h-[48px] inline-flex items-center gap-2 text-xs font-bold text-[#661521] hover:text-[#50322A] transition-colors"
              >
                <FileCheck2 className="w-4 h-4 text-[#D19650]" aria-hidden="true" />
                <span>Ver Sello de Origen y Bodega Central</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>

              <Link
                to="/"
                className="min-h-[48px] inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#661521] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#4A0E17] transition-all shadow-md"
              >
                <span>Volver al Catálogo</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SoportePage;
