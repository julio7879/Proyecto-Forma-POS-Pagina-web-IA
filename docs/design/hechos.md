# HECHOS INALTERABLES DEL SISTEMA (v2.1)
*Base Canónica de Datos y Reglas de Negocio para Diseño de Interfaz y Prototipado*

---

## 1. Topología de Sedes del Negocio
- **Bodega Central (Cúcuta):**
  - Rol: Almacén y Centro de Distribución Central (`ES_CENTRAL: true`).
  - Atención: No atiende ventas de mostrador al público directo. Custodia y abastece inventario.
- **Sede Principal (Medellín):**
  - Rol: Tienda física comercial con terminales POS y despacho local/web.
- **Sede Norte (Bogotá):**
  - Rol: Tienda física comercial con terminales POS y despacho local/web.

---

## 2. Moneda, Finanzas e Impuestos
- **Moneda Oficial:** Pesos Colombianos (`COP`).
- **Formato Numérico Invariante (`RN-GEN-04`):**
  - Todos los importes monetarios son **enteros estrictos sin decimales** (Ejemplo: `$50.000 COP`, `$120.000 COP`).
  - Prohibido el uso de centavos o comas decimales (`50000.00` es inválido).
- **Cero Lógica en Cliente (`RN-GEN-01`):**
  - El frontend **nunca calcula subtotales, IVA ni descuentos**. Todo valor monetario y discriminación tributaria proviene pre-calculado del backend (`MoneyCOP.ts`).
- **Impuestos (IVA):**
  - Precios de venta al público mostrados siempre con IVA (19%) incluido pero discriminado en el desglose final generado por el servidor.

---

## 3. Políticas Comerciales, Devoluciones y Garantías
- **Devoluciones Tienda Web (`RN-DEV-01`, `CA-25`):**
  - Plazo máximo legal: **5 días hábiles** tras la entrega del pedido para solicitar derecho de retracto.
- **Garantía Legal:**
  - **30 días calendario** por defectos de fabricación o calidad de prenda.
- **Devoluciones en Tienda Física (POS):**
  - Cambio por talla/color o emisión de vale/nota crédito en tienda; no reintegro en efectivo salvo falla objetiva comprobada del producto.

---

## 4. Identidad, Seguridad y Habeas Data
- **Roles del Sistema:**
  - `ADMIN`: Control total gerencial, traslados y auditoría multi-sede.
  - `VENDEDOR`: Operación de caja, venta POS, inventario de su sede asignada.
  - `CLIENTE`: Comprador en tienda web e-commerce.
- **Políticas de Autenticación (`RF-USU-02`, `CA-08`):**
  - Bloqueo temporal preventivo de **15 minutos** al acumular el **5to intento fallido** consecutivo de inicio de sesión.
  - Soporte de acceso dual: Email + Contraseña y Google OAuth.
- **Cumplimiento Legal Habeas Data (Colombia):**
  - Todo formulario de registro debe contener una casilla de verificación obligatoria (**desmarcada por defecto**) para la autorización expresa del tratamiento de datos personales conforme a la **Ley 1581 de 2012** y el **Decreto 1377 de 2013**, con enlace accesible a la Política de Privacidad.

---

## 5. Arquitectura de Portales y Experiencia de Usuario (`ARQ-05`, `ARQ-06`)
- **Portal 1: Tienda Web (`StorefrontLayout`):**
  - Público: Clientes online.
  - Paradigma: Marketing Inmersivo, estilo **Apple Liquid Glass**, Bento Grid de productos, enfoque *mobile-first* (375px a 1440px).
- **Portal 2: Terminal POS (`PosLayout`):**
  - Público: Cajeros y vendedores de mostrador.
  - Paradigma: **Ergonomía táctil de alta densidad** para pantallas táctiles de mostrador ($\ge 1024$px, 15" a 21").
  - Botones de acción táctiles de mínimo $48 \times 48\text{px}$.
  - Soporte de teclado físico y atajos rápidos: `F2` (Buscar producto/SKU), `Enter` (Confirmar/Añadir), `Esc` (Cancelar/Limpiar modal).
  - Venta continua en una sola vista sin scroll vertical (`CA-53`).
- **Portal 3: Panel Admin (`AdminLayout`):**
  - Público: Gerencia y supervisores de sede.
  - Paradigma: Dashboard analítico SaaS de alta densidad tabular, métricas multi-sede y trazabilidad de Kardex.
