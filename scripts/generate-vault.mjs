/**
 * scripts/generate-vault.mjs
 * Generador automático y reproducible del Obsidian Vault (/docs/vault/)
 * para el Sistema POS + Tienda Web Multisede (Documento Maestro v2.1).
 *
 * Ejecución: node scripts/generate-vault.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const VAULT_DIR = path.join(ROOT_DIR, 'docs', 'vault');

// Directorios requeridos dentro del Vault
const DIRS = [
  path.join(VAULT_DIR, '01-Reglas-Dominio'),
  path.join(VAULT_DIR, '02-Modulos-RF'),
  path.join(VAULT_DIR, '03-Base-de-Datos'),
  path.join(VAULT_DIR, '04-Calidad-y-Parametros'),
  path.join(VAULT_DIR, '05-Estado-Sprints')
];

// Archivos compuestos obsoletos que deben eliminarse
const OBSOLETE_FILES = [
  path.join(VAULT_DIR, '01-Reglas-Dominio', 'RN-CAJ-VTA-DES-DEV-Caja-POS-Descuentos-Devoluciones.md'),
  path.join(VAULT_DIR, '01-Reglas-Dominio', 'RN-INV-COM-TRA-Inventario-Compras-Traslados.md'),
  path.join(VAULT_DIR, '01-Reglas-Dominio', 'RN-ROL-UBI-CAT-Usuarios-Ubicaciones-Catalogo.md'),
  path.join(VAULT_DIR, '01-Reglas-Dominio', 'RN-WEB-ENV-REP-Pedidos-Web-Zonas-DANE-Reportes.md'),
  path.join(VAULT_DIR, '04-Calidad-y-Parametros', 'Parametros-Oficiales-y-Semillas.md')
];

console.log('--- Iniciando generación de Obsidian Vault (/docs/vault/) ---');

// 1. Asegurar directorios
for (const dir of DIRS) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`[DIR CREADO] ${path.relative(ROOT_DIR, dir)}`);
  }
}

// 2. Eliminar archivos obsoletos
for (const file of OBSOLETE_FILES) {
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
    console.log(`[ELIMINADO OBSOLETO] ${path.relative(ROOT_DIR, file)}`);
  }
}

const files = {};

// ==========================================
// 00-Indice-Mapa-Mental-MOC.md
// ==========================================
files['00-Indice-Mapa-Mental-MOC.md'] = `---
id: MOC-00
tags: [indice, arquitectura, moc, grafo, qmd]
---
# Mapa Mental y MOC Central del Sistema POS + Tienda Web (v2.1)

Bienvenido a la biblioteca atómica indexada para **Obsidian** y **QMD MCP**.
Cada nota en este vault está autocontenida (50 a 140 líneas), cuenta con metadatos estructurados en **YAML frontmatter** y enlaces bidireccionales (\`[[...]]\`) para permitir a los agentes de IA (@Oraculo-Analista, @Forja-Backend, @Vitral-UI, @Sabueso-Hunter, @Juez-Esceptico y @Centinela-QA) consultar únicamente la información quirúrgica necesaria, ahorrando hasta un 96% de tokens.

---

## 1. Reglas de Dominio Inmutables (\`01-Reglas-Dominio/\`)
- [[RN-GEN-Principios-Inmutables]] — Principios generales inquebrantables (\`RN-GEN-01\` a \`12\`). Dinero entero COP, UTC vs America/Bogota, Kardex inmutable, Idempotencia y ACID.
- [[RN-ROL-Usuarios-y-Permisos]] — Roles (\`ADMIN\`, \`VENDEDOR\`, \`CLIENTE\`), matriz de 11 permisos configurables y revocación en tiempo real (\`CA-50\`).
- [[RN-UBI-CAT-Ubicaciones-Catalogo]] — 1 Bodega Central (Cúcuta) + Puntos de Venta, base de caja $200.000, catálogo sin personalización y cosméticos no reintegrables.
- [[RN-INV-Kardex-y-Saldos]] — Saldos (\`fisico\`, \`reservadoBlando\`, \`reservadoDuro\`, \`noVendible\`), Kardex único, orden canónico anti-deadlock (\`RNF-003\`).
- [[RN-COM-TRA-Compras-y-Traslados]] — Compras en Central, traslados en tránsito, estado \`RETORNANDO_A_CENTRAL\` y resolución de novedades (faltantes/excedentes).
- [[RN-CAJ-VTA-Caja-y-Ventas-POS]] — Sesión única de caja, bloqueo de sesiones de días anteriores (\`CA-56\`), base contada y preempción física del POS sobre reservas blandas.
- [[RN-DES-Promociones-y-Prorrateo]] — Regla de no acumulación, topes de descuento manual, promociones a $0 y fórmula exacta de prorrateo (\`Math.floor\` + residuo).
- [[RN-DEV-Devoluciones-y-Cambios]] — Plazo de 5 días anclado a la venta raíz, excepción de iliquidez en caja (\`CA-54\`), cambios a $0 y regla de mes cerrado.
- [[RN-WEB-ENV-Pedidos-y-Zonas-DANE]] — Asignación determinista por Zonas DANE 1-4, TTL de 24h para transferencias, cuarentena de SKU, custodia en Central y retorno logístico vs devolución comercial.

---

## 2. Requerimientos Funcionales por Módulo (\`02-Modulos-RF/\`)
- [[MOD-01-Identidad]] — \`RF-USU-01\` a \`06\`: Autenticación, registro, matriz de permisos y bloqueo de reasignación con caja abierta.
- [[MOD-02-Ubicaciones]] — \`RF-UBI-01\` a \`02\`: Gestión de Central y Puntos de Venta, validación de 5 condiciones para desactivación.
- [[MOD-03-Catalogo]] — \`RF-CAT-01\` a \`03\`: Categorías, productos, variantes con SKU inmutable, precio único entero y cosméticos.
- [[MOD-04-Inventario-Ledger]] — \`RF-INV-01\` a \`04\`: Motor \`InventoryLedgerService\`, ajustes manuales motivados, bajas de no vendible y consultas por alcance.
- [[MOD-05-Compras]] — \`RF-COM-01\` a \`02\`: Órdenes de compra a proveedores en Central, cancelación y recepción única idempotente.
- [[MOD-06-Traslados]] — \`RF-TRA-01\` a \`06\`: Solicitudes, envíos, despacho a tránsito, cancelación en tránsito y resolución de novedades.
- [[MOD-07-Sesiones-Caja]] — \`RF-CAJ-01\` a \`03\`: Apertura con base contada, guardián de vigencia diaria (\`America/Bogota\`) y arqueo de cierre.
- [[MOD-08-Ventas-POS]] — \`RF-POS-01\` a \`02\`: Terminal POS, precios oficiales del backend y confirmación atómica con preempción de reservas web.
- [[MOD-09-Descuentos]] — \`RF-DES-01\` a \`02\`: Cupones por código, descuentos manuales autorizados y motor de prorrateo exacto.
- [[MOD-10-Devoluciones-Cambios]] — \`RF-DEV-01\` a \`04\`: Anulaciones en el día, devoluciones con plazo raíz, cambios de prendas y devoluciones comerciales web.
- [[MOD-11-Pedidos-Web-DANE]] — \`RF-WEB-01\` a \`07\`: Tienda Web, cálculo de flete DANE, algoritmo de asignación, worker TTL 60s y retorno logístico.
- [[MOD-12-Reportes-Auditoria]] — \`RF-REP-01\` a \`02\`: Cálculo de Ventas Netas imputadas a la tienda despachadora, centro de alertas y log de auditoría.

---

## 3. Modelo de Datos y Restricciones Físicas (\`03-Base-de-Datos/\`)
- [[Esquema-Prisma-33-Modelos]] — Catálogo completo de los 33 modelos relacionales y 15 enums con claves foráneas e índices.
- [[Constraints-SQL-e-Indices]] — Script \`constraints_post_migrate.sql\` con CHECKs nativos (stock no negativo, precios > 0) e índices únicos parciales.

---

## 4. Aseguramiento de Calidad y Parámetros (\`04-Calidad-y-Parametros/\`)
- [[Matriz-CA-01-a-CA-65]] — Los 65 criterios de aceptación normativos y su correlación con los 25 casos de prueba \`QA-001\` a \`QA-025\`.
- [[Parametros-Semilla-y-DV-Cerradas]] — Valores cerrados para \`seed.ts\` y \`ParametroSistema\`, y resolución definitiva de las 22 decisiones \`DV-001\` a \`DV-022\`.

---

## 5. Control de Ejecución (\`05-Estado-Sprints/\`)
- [[PROGRESO-ACTUAL]] — Estado vivo de construcción por Sprint, tareas completadas, en curso y pendientes.
`;

// ==========================================
// 01-Reglas-Dominio/RN-GEN-Principios-Inmutables.md
// ==========================================
files['01-Reglas-Dominio/RN-GEN-Principios-Inmutables.md'] = `---
id: RN-GEN
tags: [principios, dinero, cop, timezone, bogota, idempotencia, acid, kardex, seguridad]
criterios_ca: [CA-08, CA-16, CA-17, CA-18, CA-51, CA-52]
modelos_prisma: [RegistroAuditoria, RegistroIdempotencia]
---
# Principios Generales Inquebrantables (RN-GEN-01 a RN-GEN-12)

Relacionado con: [[00-Indice-Mapa-Mental-MOC]] | [[MOD-04-Inventario-Ledger]] | [[Esquema-Prisma-33-Modelos]]

Estas 12 reglas constituyen las invariantes no negociables de la arquitectura del sistema:

- **RN-GEN-01 [D] (Backend Única Fuente de Verdad):** Precios, descuentos, tarifas de envío, disponibilidad de stock y permisos se calculan y validan exclusivamente en el backend. El cliente web (POS, Tienda Web o Panel Admin) jamás calcula totales definitivos ni stock disponible por su cuenta.
- **RN-GEN-02 [D] (Kardex Único e Inmutable):** El stock de una variante solo cambia mediante movimientos inmutables registrados en \`InventoryLedgerService\`. Queda terminantemente prohibido ejecutar \`prisma.saldoStock.update()\` o \`updateMany()\` fuera de este servicio.
- **RN-GEN-03 [D] (Inmutabilidad Histórica):** Ventas, devoluciones, traslados, pagos, sesiones de caja cerradas y movimientos de stock no se editan ni se borran físicamente. Los errores se corrigen mediante documentos inversos o de ajuste motivados.
- **RN-GEN-04 [D] (Dinero Entero COP):** Todo dinero se almacena y calcula en pesos colombianos enteros (\`number\` entero / \`INT\` de PostgreSQL), sin centavos ni números de punto flotante. Prohibido usar flotantes; usar siempre \`MoneyCOP.ts\`.
- **RN-GEN-05 [D] (Zona Horaria Oficial):** Las marcas temporales se persisten en base de datos en UTC (\`timestamptz\`). Los cortes de día (\`YYYY-MM-DD\`), meses (\`YYYY-MM\`), sesiones de caja vencidas (\`RN-CAJ-11\`) y plazos de devolución se miden en hora legal de Colombia (\`America/Bogota\`, UTC-5) usando \`ColombiaTime.ts\`.
- **RN-GEN-06 [D] (Snapshots de Condiciones):** Cada documento (línea de venta, pedido web, devolución) guarda una copia inmutable (*snapshot*) de los precios, costos, descuentos y tarifas vigentes en el momento de la transacción. Modificaciones posteriores en el catálogo no alteran el histórico.
- **RN-GEN-07 [D] (Borrado Lógico):** Todo registro maestro con historial (usuarios, puntos de venta, productos, variantes, promociones) se desactiva (\`activa = false\`), nunca se borra físicamente.
- **RN-GEN-08 [D] (Idempotencia Transaccional):** Toda mutación transaccional (\`POST\` de ventas, pedidos, pagos, recepciones) exige el header \`Idempotency-Key\` para evitar duplicidades por doble clic o reintentos de red.
- **RN-GEN-09 [D] (Atomicidad ACID):** Toda operación que involucre inventario o dinero se ejecuta dentro de \`prisma.$transaction\` interactiva: se completa al 100% o se realiza un \`ROLLBACK\` absoluto.
- **RN-GEN-10 [D] (Autorización por Solicitud):** Cada endpoint valida rol, permisos granulares y ámbito geográfico (\`ubicacionId\`) en cada petición mediante \`authPermission.ts\`.
- **RN-GEN-11 [D] (Desacoplamiento Logístico-Financiero):** El estado logístico de un pedido web (\`EstadoPedidoWeb\`) y el estado financiero de su pago (\`EstadoPagoWeb\`) operan como dos máquinas de estado separadas.
- **RN-GEN-12 [D] (Auditoría Append-Only):** Toda acción sensible (cambios de permisos, ajustes de stock, anulaciones, desbloqueos web) se registra de forma obligatoria en la tabla inmutable \`RegistroAuditoria\`.
`;

// ==========================================
// 01-Reglas-Dominio/RN-ROL-Usuarios-y-Permisos.md
// ==========================================
files['01-Reglas-Dominio/RN-ROL-Usuarios-y-Permisos.md'] = `---
id: RN-ROL
tags: [usuarios, roles, permisos, seguridad, auth, cache]
criterios_ca: [CA-03, CA-41, CA-49, CA-50]
modelos_prisma: [Usuario, Ubicacion, RegistroAuditoria]
---
# Reglas de Usuarios, Roles y Permisos (RN-ROL-01 a RN-ROL-08)

Relacionado con: [[MOD-01-Identidad]] | [[RN-GEN-Principios-Inmutables]] | [[Matriz-CA-01-a-CA-65]]

## 1. Definición de Roles (\`RN-ROL-01\`)
El sistema cuenta exclusivamente con tres roles (\`enum RolUsuario\`):
1. **\`ADMIN\` (Administrador):** Control total del sistema, configuración global, todas las sedes, auditoría y resolución de novedades.
2. **\`VENDEDOR\` (Vendedor / Cajero):** Operador físico asignado a un único punto de venta presencial. Sus capacidades dependen de 11 permisos booleanos configurables.
3. **\`CLIENTE\` (Comprador Web):** Usuario final que compra en la Tienda Web. Solo tiene acceso a su perfil y sus propios pedidos.

## 2. Invariantes de Seguridad y Asignación
- **RN-ROL-02 [D]:** El Administrador define los 11 permisos y el tope porcentual de descuento manual (\`topeDescuentoPorc\`, 0% a 100%) de cada vendedor.
- **RN-ROL-03 [D]:** El Administrador tiene todos los permisos activos por diseño. El sistema prohíbe desactivar al último Administrador activo (\`RF-USU-05\`).
- **RN-ROL-04 [D]:** Un vendedor pertenece a un único punto de venta a la vez y solo puede operar con datos de su \`ubicacionId\`. Solo el Admin puede reasignarlo, y **únicamente si el punto actual no tiene una sesión de caja \`ABIERTA\`**.
- **RN-ROL-05 [D] (Revocación Instantánea, \`CA-50\`):** Todo cambio en los permisos o desactivación de un vendedor invalida inmediatamente su entrada en la caché local (\`UserPermissionCache\`), surtiendo efecto en la siguiente petición (\`403 Forbidden\`) sin necesidad de esperar a que expire el token JWT.
- **RN-ROL-06 [D]:** Para comprar en la web es obligatorio registrarse con correo y contraseña o mediante inicio de sesión social con Google OAuth (almacenando `googleId` con `passwordHash` opcional). Un cliente jamás puede consultar datos de otros clientes.
- **RN-ROL-07 [D]:** Prohibido el borrado físico de usuarios. Un vendedor con sesión de caja abierta en su tienda no puede ser desactivado.
- **RN-ROL-08 [D]:** Las contraseñas se almacenan con hash seguro \`bcrypt\`. Al 5.º intento fallido consecutivo de login, la cuenta se bloquea por 15 minutos (\`RF-USU-02\`).

## 3. Matriz Oficial de los 11 Permisos del Vendedor
| Código Permiso | Nombre Funcional | Valor Semilla por Defecto | Alcance Operativo |
| :--- | :--- | :--- | :--- |
| \`permVender\` | Cobrar en Terminal POS | \`true\` | Permite emitir ventas presenciales en su sede. |
| \`permCaja\` | Abrir y cerrar sesión de caja | \`true\` | Permite registrar base contada y arqueo de cierre. |
| \`permDescuentoManual\` | Aplicar descuentos manuales | \`false\` | Habilita aplicar hasta su \`topeDescuentoPorc\` en POS. |
| \`permAnularVentas\` | Anular ventas del día | \`false\` | Solo en la sesión abierta del día actual. |
| \`permDevoluciones\` | Procesar devoluciones y cambios | \`false\` | Requiere sesión abierta y respetar los 5 días raíz. |
| \`permVerInventario\` | Consultar stock de su sede | \`true\` | Visualiza saldos físico, reservado y disponible. |
| \`permSolicitarTraslado\` | Solicitar mercancía a Central | \`true\` | Crea documentos de traslado en estado \`SOLICITADO\`. |
| \`permRecibirTraslado\` | Recibir traslados en el punto | \`true\` | Registra conteo físico de mercancía recibida. |
| \`permVerOtrosPuntos\` | Ver inventario de otras sedes | \`false\` | Si es \`false\`, consultar otra sede da \`403\`. |
| \`permPedidosWeb\` | Preparar y despachar pedidos web | \`false\` | Solo en puntos con \`despachaWeb = true\`. |
| \`permVerVentasPunto\` | Ver reporte de ventas de su punto | \`true\` | Restringido exclusivamente a su propia sede. |
`;

// ==========================================
// 01-Reglas-Dominio/RN-UBI-CAT-Ubicaciones-Catalogo.md
// ==========================================
files['01-Reglas-Dominio/RN-UBI-CAT-Ubicaciones-Catalogo.md'] = `---
id: RN-UBI-CAT
tags: [ubicaciones, central, tiendas, catalogo, variantes, sku, cosmeticos]
criterios_ca: [CA-31, CA-51, QA-001, QA-002, QA-016]
modelos_prisma: [Ubicacion, Categoria, Producto, Variante]
---
# Reglas de Ubicaciones y Catálogo de Productos (RN-UBI y RN-CAT)

Relacionado con: [[MOD-02-Ubicaciones]] | [[MOD-03-Catalogo]] | [[RN-GEN-Principios-Inmutables]]

## 1. Ubicaciones Físicas y Cobertura (\`RN-UBI-01\` a \`RN-UBI-06\`)
- **RN-UBI-01 [D] (Bodega Central Única):** Existe una única Bodega Central (\`tipo = CENTRAL\`), garantizada por el índice único parcial \`uq_unica_bodega_central\`. Ubicada en Cúcuta (DANE \`54001\`). No opera cajas ni tiene vendedores asignados; despacha a clientes web y traslada a tiendas.
- **RN-UBI-02 [D] (Puntos de Venta):** Cada tienda física (\`tipo = PUNTO_VENTA\`) posee su propia caja registradora (\`baseCajaCop\` objetivo de $200.000 COP) y puede tener activo el flag \`despachaWeb\`.
- **RN-UBI-03 [D] (Prioridad de Despacho):** Cada ubicación tiene un entero \`prioridadDespacho\` (menor número = mayor prioridad de despacho web: Centro: 10, Ocaña: 20, Bucaramanga: 30, Central: 40).
- **RN-UBI-04 [D] (Custodia en Central):** Si un pedido web no puede ser atendido por ninguna tienda por falta de stock o avería, pasa en custodia a Bodega Central con \`tieneIncidenciaStock = true\` (\`RN-WEB-16\`).
- **RN-UBI-05 [D] (Condiciones de Desactivación):** Para desactivar un punto de venta (\`activa = false\`), se deben cumplir en transacción las 5 condiciones:
  1) \`SUM(fisico) == 0\` y \`SUM(noVendible) == 0\`.
  2) Cero traslados abiertos donde sea origen o destino.
  3) Cero pedidos web asignados en curso.
  4) Cero sesiones de caja en estado \`ABIERTA\`.
- **RN-UBI-06 [D]:** Todo registro histórico de una tienda desactivada permanece accesible para reportes y arqueos pasados.

## 2. Catálogo de Mercancía Estándar (\`RN-CAT-01\` a \`RN-CAT-08\`)
- **RN-CAT-01 [D] (Mercancía Física Estándar):** El sistema comercializa exclusivamente referencias físicas terminadas sin personalización:
  - **Ropa y Camisetas:** Variantes por talla (\`XS, S, M, L, XL\`) y color.
  - **Accesorios:** Gorras, bolsos, cinturones, gafas (talla única o medidas).
  - **Cosméticos y Cuidado Personal:** Cremas, sérums, labiales (por presentación/tono).
  - **Artesanías:** Piezas decorativas terminadas.
- **RN-CAT-02 [D] (Cosméticos y No Reintegrables, \`CA-31\`, \`QA-016\`):** Los productos de categorías con \`esCosmeticoUsoPersonal = true\` o artículos de higiene/aretes nacen con \`reintegrableEnDevolucion = false\`. Toda devolución autorizada de estos productos entra obligatoriamente a saldo \`noVendible\`.
- **RN-CAT-03 [D] (Inmutabilidad de SKU):** Cada variante tiene un \`sku\` alfanumérico único en el sistema. Una vez que la variante tiene su primer movimiento en Kardex (\`tieneMovimientos = true\`), su SKU es estrictamente inmutable.
- **RN-CAT-04 [D] (Precio Único Positivo Entero, \`CA-51\`):** \`precioVentaCop\` es un entero mayor a cero (\`CHECK ("precioVentaCop" > 0)\`) y es **único a nivel nacional** para esa variante (no hay precios distintos entre sedes).
- **RN-CAT-05 [D] (Cambios de Precio y Ventas Futuras):** Cambiar el precio de una variante solo rige para operaciones futuras; las ventas pasadas y pedidos web ya creados mantienen su snapshot original (\`QA-002\`).
- **RN-CAT-06 [D] (Desactivación de Catálogo):** Un producto o variante desactivado no aparece en búsquedas web ni POS, pero sus pedidos en curso se completan.
- **RN-CAT-07 [D] (Categorías del Sistema):** Categorías editables por el Administrador. Si una categoría se desactiva, sus productos existentes siguen operando pero no se pueden crear nuevos en ella.
- **RN-CAT-08 [D]:** No se admite venta fraccionada ni decimales de cantidad.
`;

// ==========================================
// 01-Reglas-Dominio/RN-INV-Kardex-y-Saldos.md
// ==========================================
files['01-Reglas-Dominio/RN-INV-Kardex-y-Saldos.md'] = `---
id: RN-INV
tags: [inventario, kardex, saldos, ledger, reservas, deadlock, bloqueo-canonico]
criterios_ca: [CA-01, CA-02, CA-03, QA-003]
modelos_prisma: [SaldoStock, MovimientoInventario, Variante, Ubicacion]
---
# Reglas de Inventario y Kardex Ledger (RN-INV-01 a RN-INV-09)

Relacionado con: [[MOD-04-Inventario-Ledger]] | [[RN-GEN-Principios-Inmutables]] | [[Constraints-SQL-e-Indices]]

## 1. Saldo Cuádruple por Ubicación y Variante (\`RN-INV-01\`)
En la tabla \`SaldoStock\` cada registro mantiene 4 valores enteros (\`>= 0\`):
1. **\`fisico\`:** Conteo real existente dentro de la sede física.
2. **\`reservadoBlando\`:** Unidades comprometidas en pedidos web en estado \`RECIBIDO\` o \`CONFIRMADO\`.
3. **\`reservadoDuro\`:** Unidades empacadas en pedidos web en estado \`EN_PREPARACION\`.
4. **\`noVendible\`:** Mercancía averiada, defectuosa o devuelta no apta para venta comercial.

### Fórmulas Oficiales:
- **Disponible General (Web y Traslados):**
  \`\`\`text
  disponible = fisico - reservadoBlando - reservadoDuro
  \`\`\`
- **Restricción PostgreSQL (\`chk_saldo_stock_no_negativo\`):**
  \`\`\`sql
  CHECK (fisico >= 0 AND reservadoBlando >= 0 AND reservadoDuro >= 0 AND noVendible >= 0
         AND fisico >= (reservadoBlando + reservadoDuro))
  \`\`\`

## 2. Invariantes del Motor Ledger (\`InventoryLedgerService\`)
- **RN-INV-02 [D] (Ajustes Manuales):** Solo el Administrador puede ajustar saldos directamente, indicando siempre motivo estandarizado y cantidad con signo. Genera registro en \`MovimientoInventario\` y \`RegistroAuditoria\` (\`CA-03\`).
- **RN-INV-03 [D] (Ordenamiento Canónico Anti-Deadlock, \`RNF-003\`):** Antes de adquirir bloqueos con \`SELECT ... FOR UPDATE\` en \`prisma.$transaction\`, el arreglo de líneas se ordena siempre en memoria por \`varianteId ASC\`:
  \`\`\`typescript
  const lineasOrdenadas = [...lineas].sort((a, b) => a.varianteId - b.varianteId);
  \`\`\`
- **RN-INV-04 [D] (Centralización Absoluta):** Ningún controlador o servicio puede alterar \`SaldoStock\` directamente. Toda mutación pasa por \`InventoryLedgerService.registrarMovimiento()\`.
- **RN-INV-05 [D] (Concurrencia Estricta, \`CA-02\`, \`QA-003\`):** Si dos transacciones intentan adquirir la última unidad disponible, una se procesa y la otra falla con error de stock insuficiente (\`409 Conflict\`), manteniendo el stock en 0 y jamás negativo.
- **RN-INV-06 [D] (Carga Inicial):** La carga inicial de inventario se registra con tipo de movimiento \`AJUSTE_POSITIVO_VENDIBLE\` con motivo "Inventario inicial".
- **RN-INV-07 [D] (Alerta de Stock Bajo):** Cuando \`disponible <= umbralStockBajo\` (3 unidades por defecto), el sistema dispara alerta en el panel de inventario.
- **RN-INV-08 [D] (Bajas de No Vendible):** Las unidades defectuosas solo salen de \`noVendible\` mediante baja motivada (\`BAJA_NO_VENDIBLE\`) o reincorporación motivada.
- **RN-INV-09 [D] (26 Tipos Granulares en \`TipoMovimientoStock\`):** Cada inserción en Kardex tipifica el movimiento distinguiendo signo y condición física (\`VENTA_POS_SALIDA\`, \`TRASLADO_SALIDA\`, \`COMPRA_INGRESO\`, \`DEVOLUCION_INGRESO_VENDIBLE\`, \`DEVOLUCION_INGRESO_NO_VENDIBLE\`, etc.).
`;

// ==========================================
// 01-Reglas-Dominio/RN-COM-TRA-Compras-y-Traslados.md
// ==========================================
files['01-Reglas-Dominio/RN-COM-TRA-Compras-y-Traslados.md'] = `---
id: RN-COM-TRA
tags: [compras, proveedores, traslados, transito, novedades, faltantes, excedentes, retornando]
criterios_ca: [CA-04, CA-05, CA-06, CA-07, CA-08, CA-09, CA-10, CA-11, CA-57, CA-58, CA-59, QA-010, QA-011, QA-012]
modelos_prisma: [CompraProveedor, LineaCompra, Traslado, LineaTraslado, ResolucionNovedadTraslado]
---
# Reglas de Compras y Traslados entre Sedes (RN-COM y RN-TRA)

Relacionado con: [[MOD-05-Compras]] | [[MOD-06-Traslados]] | [[RN-INV-Kardex-y-Saldos]]

## 1. Compras a Proveedor en Bodega Central (\`RN-COM-01\` a \`RN-COM-07\`)
- **RN-COM-01 [D]:** Toda compra a proveedor ingresa exclusivamente a **Bodega Central**.
- **RN-COM-02 [D]:** Estados: \`PEDIDA -> RECIBIDA\` o \`CANCELADA\`. Mientras esté en \`PEDIDA\` no altera stock.
- **RN-COM-03 [D] (Recepción Única e Idempotente, \`CA-08\`):** La recepción se efectúa una sola vez por las unidades realmente recibidas (\`cantidadRecibida\`), sumando a \`fisico\` en Central (\`COMPRA_RECIBIDA\`). Reintentos no duplican stock.
- **RN-COM-04 [D]:** Costo unitario (\`costoUnitarioCop\`) opcional en MVP.
- **RN-COM-05 [D]:** Una compra en \`RECIBIDA\` o \`CANCELADA\` es inmutable.

## 2. Ciclo de Vida de Traslados y Novedades (\`RN-TRA-01\` a \`RN-TRA-19\`)
- **RN-TRA-01 [D]:** Solicitud desde punto inicia en \`SOLICITADO\`. Envío directo de Central inicia en \`APROBADO\`.
- **RN-TRA-03 [D] (Despacho y Tránsito, \`CA-04\`, \`CA-05\`):** Al pasar a \`ENVIADO\`, resta \`cantidadEnviada\` del \`fisico\` de Central. La mercancía queda **en tránsito**; ninguna sede puede venderla.
- **RN-TRA-04 [D]:** \`cantidadAprobada\` no puede superar \`cantidadSolicitada\` (\`CA-11\`).
- **RN-TRA-07 [D] (Recepción en Destino, \`CA-07\`):** El punto registra \`recibidaBuena\` y \`recibidaDanada\`. Se valida:
  \`\`\`text
  recibidaBuena + recibidaDanada <= enviada
  \`\`\`
- **RN-TRA-08 [D] (Recepción Directa sin Novedad, \`CA-57\`, \`QA-010\`):**
  Si \`recibidaBuena + recibidaDanada == enviada\` y \`excedenteReportado == 0\`:
  - Suma buenas a \`fisico\` del punto.
  - Suma dañadas a \`noVendible\` del punto (con observación obligatoria si \`dañadas > 0\`).
  - Pasa directamente al estado final **\`RECIBIDO\`**.
- **RN-TRA-09 [D] (Novedades por Faltante o Excedente, \`CA-06\`, \`CA-58\`, \`QA-011\`):**
  Si hay faltantes (\`recibidaBuena + recibidaDanada < enviada\`) o se marca check de excedente (\`excedenteReportado > 0\`):
  - El traslado pasa a **\`RECIBIDO_CON_NOVEDAD\`** con observación obligatoria.
- **RN-TRA-10 [D] (Resolución por Administrador, \`CA-10\`):**
  Solo el Admin puede resolver novedades:
  - **Faltantes:** Tipificados como *Llegó después* (+ \`fisico\`), *Retornó a Central* (+ \`fisico\` Central), o *Pérdida/Merma* (baja).
  - **Excedentes:** *Incorporar* (- \`fisico\` Central, + \`fisico\` punto) o *Descartar/Devolver*.
  - Al resolverse el 100% de unidades pendientes, el traslado pasa a **\`CERRADO\`**.
- **RN-TRA-12 [D] (Flujo «Retornando a Central», \`CA-09\`, \`CA-59\`, \`QA-012\`):**
  Si el Admin cancela un traslado en estado \`ENVIADO\`:
  1) Pasa al estado intermedio **\`RETORNANDO_A_CENTRAL\`** (las unidades continúan en tránsito y el punto destino queda bloqueado para recibirlo).
  2) Cuando el paquete llega físicamente de vuelta a Bodega Central, el Admin confirma el reingreso físico: suma al \`fisico\` de Central y transiciona a **\`CANCELADO\`**.
- **RN-TRA-15 [D]:** Alerta automática si un traslado lleva más de 48 horas en tránsito sin recepción.
`;

// ==========================================
// 01-Reglas-Dominio/RN-CAJ-VTA-Caja-y-Ventas-POS.md
// ==========================================
files['01-Reglas-Dominio/RN-CAJ-VTA-Caja-y-Ventas-POS.md'] = `---
id: RN-CAJ-VTA
tags: [caja, sesiones, arqueo, pos, ventas, preempcion, efectivo, bogota]
criterios_ca: [CA-12, CA-13, CA-14, CA-15, CA-16, CA-17, CA-18, CA-55, CA-56, CA-60, CA-61, QA-004, QA-005, QA-006, QA-007, QA-008, QA-009]
modelos_prisma: [SesionCaja, VentaPOS, LineaVentaPOS, PagoVentaPOS, ConsecutivoUbicacion]
---
# Reglas de Caja y Terminal Punto de Venta (RN-CAJ y RN-VTA)

Relacionado con: [[MOD-07-Sesiones-Caja]] | [[MOD-08-Ventas-POS]] | [[RN-INV-Kardex-y-Saldos]]

## 1. Sesiones de Caja y Arqueo (\`RN-CAJ-01\` a \`RN-CAJ-12\`)
- **RN-CAJ-01 [D]:** Máximo **una sola sesión \`ABIERTA\`** por punto de venta a la vez, garantizado por el índice único parcial \`uq_unica_sesion_caja_abierta_por_punto\` (\`QA-007\`).
- **RN-CAJ-02 [D] (Apertura con Base Contada):** El cajero ingresa \`baseContadaCop\`. Si difiere de los $200.000 COP configurados, exige observación.
- **RN-CAJ-05 [D] (Vigencia Diaria en Colombia, \`CA-56\`, \`QA-009\`):**
  La sesión guarda \`fechaNegocioColombia = hoy_bogota()\`. Si \`fechaNegocioColombia < hoy_bogota()\`, la sesión se considera **vencida**:
  - **Bloquea rotundamente:** Emitir ventas POS, registrar devoluciones, procesar cambios o anular ventas.
  - **Única acción permitida:** Ejecutar su arqueo de cierre.
- **RN-CAJ-06 [D] (Fórmula de Efectivo Esperado, \`CA-15\`, \`CA-55\`, \`QA-008\`):**
  \`\`\`text
  efectivoEsperado = baseContadaCop + ventasEfectivoSesion - reembolsosEfectivoSesion
  diferencia = efectivoContadoCierreCop - efectivoEsperado
  \`\`\`
  El cálculo parte siempre de la \`baseContadaCop\` real de apertura del día, evitando arrastrar descuadres de días anteriores (\`CA-55\`).
- **RN-CAJ-10 [D] (Efectivo a Entregar al Cierre):**
  \`\`\`text
  efectivoAEntregar = max(0, efectivoContadoCierreCop - baseConfiguradaCop)
  \`\`\`
  Jamás genera un valor negativo.

## 2. Ventas POS y Preempción Física (\`RN-VTA-01\` a \`RN-VTA-15\`)
- **RN-VTA-01 [D]:** Venta exige sesión de caja abierta y vigente en ese punto.
- **RN-VTA-02 [D]:** Métodos de pago permitidos en POS: \`EFECTIVO\` y \`TRANSFERENCIA\` (exige referencia bancaria, no suma a efectivo esperado, \`CA-14\`).
- **RN-VTA-03 [D] (Preempción Física POS sobre Reservas Web, \`CA-60\`, \`CA-61\`):**
  - Si un cliente presencial está en mostrador con el producto físico en mano:
    - Se verifica: \`fisico - reservadoDuro >= cantidad\`.
    - **Si toma unidades de \`reservadoBlando\` (\`RECIBIDO\` o \`CONFIRMADO\`):** La venta POS procede con éxito; en la misma transacción atómica se reduce \`reservadoBlando\` y se dispara la reasignación del pedido web a otra sede o a custodia en Central (\`CA-60\`, \`QA-004\`).
    - **Excepción Inviolable (\`reservadoDuro\`, \`CA-61\`, \`QA-005\`):** Si la prenda está en un pedido web \`EN_PREPARACION\`, la unidad está empacada físicamente: el POS no puede venderla y la transacción se aborta con error explicativo.
- **RN-VTA-09 [D] (Consecutivo Diferido por Punto):** El consecutivo oficial (\`P01-000001\`) se genera e incrementa sobre \`ConsecutivoUbicacion\` como la última instrucción antes del \`COMMIT\`, garantizando numeración secuencial sin huecos.
- **RN-VTA-10 [D]:** Todo comprobante POS muestra datos de la empresa, sede, consecutivo, detalle y leyenda legal de comprobante interno (MVP sin DIAN, \`DV-014\`).
`;

// ==========================================
// 01-Reglas-Dominio/RN-DES-Promociones-y-Prorrateo.md
// ==========================================
files['01-Reglas-Dominio/RN-DES-Promociones-y-Prorrateo.md'] = `---
id: RN-DES
tags: [descuentos, promociones, prorrateo, math-floor, residuo, cupones]
criterios_ca: [CA-19, CA-20, CA-21, CA-22, CA-23, CA-24, CA-25]
modelos_prisma: [Promocion, LineaVentaPOS, LineaPedidoWeb]
---
# Reglas de Descuentos, Promociones y Prorrateo (RN-DES-01 a RN-DES-14)

Relacionado con: [[MOD-09-Descuentos]] | [[RN-GEN-Principios-Inmutables]] | [[RN-DEV-Devoluciones-y-Cambios]]

## 1. Reglas de Descuento
- **RN-DES-01 [D]:** El motor opera en POS y Tienda Web.
- **RN-DES-02 [D]:** Tipos de promoción: \`PORCENTAJE\` (entero 1 a 100) y \`VALOR_FIJO\` (entero en COP).
- **RN-DES-04 [D] (No Acumulación Estricta, \`CA-22\`):** Máximo **un solo descuento por operación**. Prohibido combinar un cupón con otro cupón, o un cupón con descuento manual.
- **RN-DES-05 [D] (Descuento Manual en POS, \`CA-23\`):**
  Un vendedor con \`permDescuentoManual = true\` puede aplicar descuento manual (en porcentaje entero o monto fijo) con motivo obligatorio. El descuento máximo admisible es:
  \`\`\`typescript
  topeMaximoCop = Math.round((subtotalElegible * vendedor.topeDescuentoPorc) / 100);
  \`\`\`
  El Administrador no tiene tope.
- **RN-DES-07 [D] (Promoción Mayor al Subtotal, \`CA-25\`):**
  Si una promoción de valor fijo supera el subtotal elegible, el descuento se trunca exactamente al subtotal (\`descuento = subtotalElegible\`), dejando los productos en **\`$0 COP\`** (jamás negativo). El flete web no se descuenta.

## 2. Algoritmo Canónico de Prorrateo (\`RN-DES-09\`, \`CA-20\`)
Todo descuento global \`D\` aplicado a un conjunto de líneas elegibles con subtotales \`L_1, L_2, ..., L_n\` y base total \`B = SUM(L_i)\` se distribuye de la siguiente forma:

1. **Parte Entera por Línea:**
   \`\`\`typescript
   parte_i = Math.floor((D * L_i) / B);
   \`\`\`
2. **Residuo a la Última Línea Elegible:**
   \`\`\`typescript
   sumaPartes = SUM(parte_i);
   residuo = D - sumaPartes;
   parte_n = parte_n + residuo;
   \`\`\`
3. **Precio Neto Guardado en Snapshot:**
   Cada línea persiste \`precioUnitarioBaseCop\`, \`descuentoProrrateadoCop\` y \`precioNetoTotalCop\`, garantizando que la suma de los netos sea idéntica al total pagado.

### Ejemplo Oficial (\`CA-20\`):
Descuento fijo de $1.000 COP sobre 3 líneas de $10.000 COP:
- Línea 1: \`floor(1000 * 10000 / 30000) = 333\`
- Línea 2: \`floor(1000 * 10000 / 30000) = 333\`
- Línea 3: \`333 + (1000 - 666) = 334\`
- Total descontado: \`333 + 333 + 334 = 1.000 COP\` exactos.
`;

// ==========================================
// 01-Reglas-Dominio/RN-DEV-Devoluciones-y-Cambios.md
// ==========================================
files['01-Reglas-Dominio/RN-DEV-Devoluciones-y-Cambios.md'] = `---
id: RN-DEV
tags: [devoluciones, cambios, reembolsos, iliquidez, caja, venta-raiz, plazos]
criterios_ca: [CA-26, CA-27, CA-28, CA-29, CA-30, CA-31, CA-32, CA-33, CA-34, CA-54, CA-63, QA-016, QA-017, QA-018, QA-019]
modelos_prisma: [DevolucionPOS, LineaDevolucionPOS, VentaPOS, SesionCaja]
---
# Reglas de Devoluciones, Cambios y Anulaciones (RN-DEV-01 a RN-DEV-16)

Relacionado con: [[MOD-10-Devoluciones-Cambios]] | [[RN-CAJ-VTA-Caja-y-Ventas-POS]] | [[RN-DES-Promociones-y-Prorrateo]]

## 1. Plazos y Condiciones en POS
- **RN-DEV-01 [D]:** Una devolución en POS debe realizarse en el **mismo punto de venta** donde se emitió la compra original, con una sesión de caja \`ABIERTA\` hoy (\`CA-29\`).
- **RN-DEV-02 [D] (Excepción por Iliquidez en Caja, \`CA-54\`, \`QA-019\`):**
  Si una devolución de una compra pagada en efectivo supera el \`efectivoEsperado\` actual de la sesión de caja:
  - El sistema **habilita reembolsar por \`TRANSFERENCIA\`** (con código de referencia y observación obligatorios).
  - Este reembolso no descuenta del efectivo esperado de la caja, evitando dejar el saldo en negativo.
- **RN-DEV-03 [D] (Plazo Anclado a la Venta Raíz, \`CA-63\`):**
  El plazo en mostrador POS es de **5 días calendario** contados estrictamente desde la **fecha de la venta original (raíz)**. Realizar un cambio de prenda **NO reinicia el plazo** (\`CA-63\`). Vencidos los 5 días, solo el Administrador puede autorizar la operación (\`CA-27\`).
- **RN-DEV-06 [D] (Reembolso sobre Neto Prorrateado, \`CA-26\`):**
  El monto a devolver por cada unidad es exactamente su precio neto unitario pagado (\`precioNetoTotalCop / cantidad\`), nunca el precio de lista. Si el artículo tenía 100% de descuento ($0 COP), el reembolso es de $0 COP.

## 2. Operación de Cambios en POS (\`RN-DEV-11\`, \`CA-30\`)
Un cambio es una operación atómica que vincula una devolución y una nueva venta:
- **Caso A (Mismo Producto, Talla/Color Distinto, \`QA-017\`):** El nuevo artículo conserva el precio neto pagado por la prenda devuelta. La diferencia es estrictamente **\`$0 COP\`**.
- **Caso B (Producto Distinto de Mayor Valor, \`QA-018\`):** El nuevo artículo se factura a su precio de lista vigente sin descuentos. El cliente paga el excedente.
- **Caso C (Producto Distinto de Menor Valor):** Se liquida la diferencia a favor del cliente en efectivo o transferencia.
- **Caso D (Devolución Posterior de Cambio Mixto):** Si el cliente pagó parte en efectivo y parte con saldo a favor, el cajero decide en cuál de los dos medios reembolsa si hay liquidez.

## 3. Invariantes de Destino Físico y Contable
- **RN-DEV-09 [D] (No Vendible por Defecto, \`CA-31\`):** Cosméticos, ropa interior y aretes entran siempre a saldo \`noVendible\`. En ropa y calzado, el cajero selecciona si entra a \`fisico\` (vendible) o a \`noVendible\` (prenda con imperfectos).
- **RN-DEV-10 [D] (Regla de Mes Cerrado, \`CA-34\`):** Una devolución jamás modifica registros ni reportes de meses anteriores. La devolución resta en las Ventas Netas del mes y día en que se procesa.
- **RN-DEV-12 [D] (Anulaciones en el Día, \`CA-33\`):** Solo se anulan ventas de la sesión de caja abierta actual que no tengan devoluciones previas.
`;

// ==========================================
// 01-Reglas-Dominio/RN-WEB-ENV-Pedidos-y-Zonas-DANE.md
// ==========================================
files['01-Reglas-Dominio/RN-WEB-ENV-Pedidos-y-Zonas-DANE.md'] = `---
id: RN-WEB-ENV
tags: [web, ecommerce, dane, envios, reservas, ttl, cuarentena, custodia, retornos, devoluciones-web]
criterios_ca: [CA-35, CA-36, CA-37, CA-38, CA-39, CA-40, CA-41, CA-42, CA-43, CA-44, CA-45, CA-46, CA-62, CA-64, CA-65, QA-013, QA-014, QA-015, QA-020, QA-021, QA-022]
modelos_prisma: [PedidoWeb, LineaPedidoWeb, HistorialEstadoPedidoWeb, DevolucionComercialWeb, TarifaZonaEnvio, ExcepcionTarifaEnvio, MunicipioDane]
---
# Reglas de Pedidos Web, Envíos DANE y Retornos (RN-WEB y RN-ENV)

Relacionado con: [[MOD-11-Pedidos-Web-DANE]] | [[RN-INV-Kardex-y-Saldos]] | [[MOD-12-Reportes-Auditoria]]

## 1. Zonas de Envío DANE y Fletes (\`RN-ENV-01\` a \`RN-ENV-07\`)
El flete se liquida comparando el municipio DANE de la sede que despacha con el municipio DANE destino:
- **Excepción:** Si existe un registro en \`ExcepcionTarifaEnvio\` para ese par origen-destino, se aplica su tarifa y días.
- **Zonas Estándar:**
  - **Zona 1 (Mismo Municipio):** $8.000 COP · 1 a 2 días hábiles.
  - **Zona 2 (Mismo Departamento):** $12.000 COP · 2 a 3 días hábiles.
  - **Zona 3 (Misma Región Geográfica):** $16.000 COP · 3 a 4 días hábiles.
  - **Zona 4 (Diferente Región):** $22.000 COP · 4 a 6 días hábiles.
- Solo se despacha a municipios con \`atendidoWeb = true\` (\`CA-37\`).

## 2. Asignación Determinista de Sede (\`RN-WEB-05\`, \`CA-35\`, \`CA-36\`)
Para todo el carrito web (sin envíos divididos):
1. **Filtro de Sedes Candidatas:** Sedes activas con \`despachaWeb = true\`, \`bloqueadoDespachoWeb = false\` para todos los SKUs del carrito, y \`disponible >= cantidad\` en **todas** las líneas.
2. **Criterio de Desempate Estricto:**
   1. Menor \`tarifaCop\` calculada hacia el destino.
   2. Menor \`prioridadDespacho\` (Centro: 10, Ocaña: 20, Bucaramanga: 30, Central: 40).
   3. Menor \`id\` numérico de ubicación.
3. Se incrementa \`reservadoBlando\` en la sede seleccionada.

## 3. TTL de Reservas, Cuarentena y Custodia en Central
- **RN-WEB-09 [D] (Worker TTL 24h, \`CA-39\`, \`QA-015\`):**
  Un pedido con pago \`TRANSFERENCIA\` en estado \`RECIBIDO\` tiene un TTL de 24 horas (\`reservaExpiraEn\`). Un worker periódico (cada 60 segundos) busca pedidos expirados usando \`SELECT ... FOR UPDATE SKIP LOCKED\`, libera \`reservadoBlando\` y pasa el pedido a \`CANCELADO\` sin colisionar con el Admin.
- **RN-WEB-15 [D] (Paso a «En Preparación», \`CA-42\`):**
  Mueve el stock de \`reservadoBlando\` a **\`reservadoDuro\`**. A partir de este hito, el POS no puede tomar el stock (\`CA-61\`) y el Admin no puede reasignar la tienda manualmente.
- **RN-WEB-16 [D] («No puedo despachar», Cuarentena y Custodia en Central, \`CA-43\`, \`CA-62\`, \`QA-013\`):**
  Si una sede asignada reporta «No puedo despachar»:
  1) Se activa \`bloqueadoDespachoWeb = true\` para esos SKUs en esa sede específica (cuarentena de SKU).
  2) Se libera la reserva blanda en esa sede y se reasigna a la siguiente tienda candidata.
  3) **Si ninguna otra sede tiene stock completo:** Se asigna en custodia a **Bodega Central** con \`tieneIncidenciaStock = true\` y \`tieneReservaActiva = false\`, emitiendo alerta al Administrador. El pedido jamás queda con ubicación \`NULL\` ni rebota en bucle infinito.

## 4. Retorno Logístico vs. Devolución Comercial Web
- **Retorno Logístico (Contraentrega No Entregado, \`RN-WEB-23\`, \`CA-64\`, \`QA-020\`):**
  Aplica a pedidos \`CONTRAENTREGA\` que nunca estuvieron en \`PAGADO\` (no son venta reconocida). Si pasa a \`NO_ENTREGADO\`, la mercancía reingresa a stock y el cobro se anula, **sin restar de Ventas Netas ni computar como devolución financiera**.
- **Devolución Comercial Web (\`RN-DEV-14\`, \`CA-65\`, \`QA-021\`):**
  Aplica a pedidos que ya fueron \`PAGADOS\` y \`ENVIADOS\` (ventas reconocidas). Plazo: **5 días hábiles** desde la entrega. La prenda puede reingresar físicamente en cualquier sede (incluso Central), pero la deducción financiera de la devolución se imputa **siempre a la ubicación que despachó y reconoció la venta originalmente** (\`ubicacionImputacionVentaId\`).
`;

// ==========================================
// 02-Modulos-RF/MOD-01-Identidad.md
// ==========================================
files['02-Modulos-RF/MOD-01-Identidad.md'] = `---
id: MOD-01
modulo: 01-identidad-usuarios-roles
tags: [usuarios, roles, permisos, auth, bcrypt, jwt]
rf_codes: [RF-USU-01, RF-USU-02, RF-USU-03, RF-USU-04, RF-USU-05, RF-USU-06]
modelos_prisma: [Usuario, Ubicacion, RegistroAuditoria]
criterios_ca: [CA-03, CA-41, CA-49, CA-50]
---
# Módulo 01: Identidad, Usuarios, Roles y Permisos Dinámicos (RF-USU)

Relacionado con: [[RN-ROL-Usuarios-y-Permisos]] | [[RN-GEN-Principios-Inmutables]] | [[Esquema-Prisma-33-Modelos]]

## 1. Alcance Funcional
Gestiona la autenticación, autorización y ciclo de vida de los usuarios del sistema (\`ADMIN\`, \`VENDEDOR\` y \`CLIENTE\`), el control de intentos fallidos y la matriz dinámica de 11 permisos con revocación en tiempo real.

## 2. Requerimientos Funcionales Detallados

| Código RF | Nombre | Actores | Reglas | Entrada → Proceso → Salida | Criterios de Aceptación |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-USU-01** | Registro de cuenta de cliente web con consentimiento Ley 1581 | Cliente | \`RN-ROL-01\`, \`RN-ROL-06\`, \`RN-ROL-08\`, \`RN-WEB-01\` | **E:** Nombre, correo, clave, teléfono, dirección, municipio DANE y check privacidad.<br>**P:** Valida con Zod, genera hash \`bcrypt\`, guarda \`rol = CLIENTE\` y \`aceptoPrivacidadEn = NOW()\`.<br>**S:** Token JWT y sesión iniciada. | Rechazo si el correo ya existe o falta aceptar la política de privacidad. |
| **RF-USU-02** | Login con control de intentos fallidos | Admin, Vendedor, Cliente | \`RN-ROL-08\`, \`RN-SEG-03\` | **E:** Correo y contraseña.<br>**P:** Verifica que \`activo == true\` y \`bloqueadoHasta < NOW()\`. Compara hash \`bcrypt\`. Al 5.º intento fallido bloquea la cuenta 15 minutos.<br>**S:** JWT con claims de rol, permisos y \`ubicacionId\`. | Cuenta inactiva o bloqueada recibe \`401/403\`. |
| **RF-USU-03** | Matriz de permisos de vendedor y revocación instantánea | Administrador | \`RN-ROL-02\`, \`RN-ROL-04\`, \`RN-ROL-05\`, \`RN-AUD-02\` | **E:** \`usuarioId\`, \`topeDescuentoPorc\` (0-100) y los 11 booleanos.<br>**P:** Actualiza \`Usuario\`, registra en \`RegistroAuditoria\` e **invalida \`UserPermissionCache\`** de inmediato.<br>**S:** Permisos actualizados en caliente. | **CA-50:** Desactivar un permiso surte efecto en el siguiente request (\`403\`) sin desloguear. |
| **RF-USU-04** | Reasignación de punto de venta de un vendedor | Administrador | \`RN-ROL-04\`, \`RN-AUD-02\` | **E:** \`vendedorId\` y \`nuevaUbicacionId\` activa.<br>**P:** Verifica que NO exista una \`SesionCaja\` en \`ABIERTA\` en la sede actual. Si existe, aborta. Si está cerrada, actualiza sede e invalida caché.<br>**S:** Vendedor asignado al nuevo punto. | Se rechaza reasignar vendedor si su punto actual tiene caja abierta. |
| **RF-USU-05** | Desactivación segura de usuarios | Administrador | \`RN-ROL-03\`, \`RN-ROL-07\`, \`RN-GEN-07\` | **E:** \`usuarioId\` a desactivar.<br>**P:** Prohibido \`DELETE\`. Si es \`ADMIN\`, valida que quede al menos otro activo. Si es \`VENDEDOR\`, valida que su sede no tenga caja abierta. Marca \`activo = false\` e invalida caché.<br>**S:** Usuario desactivado con historial intacto. | Prohibido desactivar al último Admin o a un vendedor con caja abierta. |
| **RF-USU-06** | Recuperación de clave y notificaciones simuladas | Cliente, Vendedor, Admin | \`RN-SEG-05\` | **E:** Solicitud de reset de clave.<br>**P:** En MVP desacoplado detrás de \`NotificacionPort\`, registra en bandeja de notificaciones simuladas del Admin.<br>**S:** Hash actualizado de contraseña. | Funciona en local sin SMTP externo. |
`;

// ==========================================
// 02-Modulos-RF/MOD-02-Ubicaciones.md
// ==========================================
files['02-Modulos-RF/MOD-02-Ubicaciones.md'] = `---
id: MOD-02
modulo: 02-ubicaciones-cobertura
tags: [ubicaciones, central, tiendas, dane, cobertura]
rf_codes: [RF-UBI-01, RF-UBI-02]
modelos_prisma: [Ubicacion, MunicipioDane, DepartamentoDane, RegionEnvio]
criterios_ca: [CA-35, CA-37]
---
# Módulo 02: Gestión de Ubicaciones y Cobertura Geográfica (RF-UBI)

Relacionado con: [[RN-UBI-CAT-Ubicaciones-Catalogo]] | [[Constraints-SQL-e-Indices]] | [[MOD-11-Pedidos-Web-DANE]]

## 1. Alcance Funcional
Administra la Bodega Central y los Puntos de Venta físicos, su vinculación con la división político-administrativa DANE de Colombia, sus prioridades de despacho web y las condiciones para su desactivación segura.

## 2. Requerimientos Funcionales Detallados

| Código RF | Nombre | Actores | Reglas | Entrada → Proceso → Salida | Criterios de Aceptación |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-UBI-01** | Configuración de Bodega Central y Puntos de Venta | Administrador | \`RN-UBI-01\` a \`RN-UBI-04\` | **E:** Nombre, \`tipo\` (\`CENTRAL\` / \`PUNTO_VENTA\`), \`municipioDaneId\`, dirección, \`despachaWeb\`, \`prioridadDespacho\` y \`baseCajaCop\` ($200.000 COP).<br>**P:** Garantiza que solo exista una Central (\`uq_unica_bodega_central\`). Central no tiene caja ni vendedores.<br>**S:** Ubicación creada o editada. | Se rechaza crear una segunda Central o asignar caja/vendedor a Central. |
| **RF-UBI-02** | Desactivación validada de un Punto de Venta | Administrador | \`RN-UBI-05\`, \`RN-UBI-06\`, \`RN-GEN-07\` | **E:** \`ubicacionId\` a desactivar.<br>**P:** Verifica en transacción las 5 condiciones: 1) \`fisico == 0\` y \`noVendible == 0\`; 2) cero traslados abiertos; 3) cero pedidos web en curso; 4) cero cajas \`ABIERTA\`. Marca \`activa = false\` y audita.<br>**S:** Sede desactivada. | Falla si tiene stock, traslados, pedidos pendientes o caja abierta. |
`;

// ==========================================
// 02-Modulos-RF/MOD-03-Catalogo.md
// ==========================================
files['02-Modulos-RF/MOD-03-Catalogo.md'] = `---
id: MOD-03
modulo: 03-catalogo-productos-variantes
tags: [catalogo, productos, variantes, sku, precios, cosmeticos]
rf_codes: [RF-CAT-01, RF-CAT-02, RF-CAT-03]
modelos_prisma: [Categoria, Producto, Variante]
criterios_ca: [CA-31, CA-51, QA-001, QA-002, QA-016]
---
# Módulo 03: Catálogo de Productos, Variantes y Precios (RF-CAT)

Relacionado con: [[RN-UBI-CAT-Ubicaciones-Catalogo]] | [[Constraints-SQL-e-Indices]] | [[MOD-04-Inventario-Ledger]]

## 1. Alcance Funcional
Gestiona las categorías, productos físicos estándar (ropa, accesorios, cosméticos y artesanías) y sus variantes por SKU, con precios en enteros positivos y reglas de no reintegrabilidad para cosméticos e higiene.

## 2. Requerimientos Funcionales Detallados

| Código RF | Nombre | Actores | Reglas | Entrada → Proceso → Salida | Criterios de Aceptación |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-CAT-01** | Categorías con regla de cosméticos | Administrador | \`RN-CAT-02\`, \`RN-CAT-07\` | **E:** Nombre categoría y flag \`esCosmeticoUsoPersonal\`.<br>**P:** Crea o edita categoría. Al crear productos en cosméticos, marca \`reintegrableEnDevolucion = false\` por defecto.<br>**S:** Categoría configurada. | **CA-31, QA-016:** Cosméticos nacen no reintegrables (van siempre a no vendible). |
| **RF-CAT-02** | Creación y edición de variantes con precio único | Administrador | \`RN-CAT-01\` a \`RN-CAT-05\` | **E:** Datos producto y variantes (\`sku\` único, talla, color, \`precioVentaCop\` entero > 0).<br>**P:** Valida unicidad de SKU. Si \`tieneMovimientos == true\`, bloquea cambiar el SKU. Valida precio > 0 (\`chk_precio_venta_positivo\`). Si cambia el precio, audita.<br>**S:** Variante lista. | **CA-51, QA-001, QA-002:** Precios enteros > 0. SKU inmutable tras su primer movimiento. |
| **RF-CAT-03** | Desactivación de variantes con historial | Administrador | \`RN-CAT-06\`, \`RN-GEN-07\` | **E:** \`varianteId\` a desactivar.<br>**P:** Marca \`activa = false\`. Deja de figurar en ventas POS y tienda web; pedidos y traslados en curso continúan con normalidad.<br>**S:** Variante desactivada. | Prohibido borrado físico (\`DELETE\`). Conserva historial completo. |
`;

// ==========================================
// 02-Modulos-RF/MOD-04-Inventario-Ledger.md
// ==========================================
files['02-Modulos-RF/MOD-04-Inventario-Ledger.md'] = `---
id: MOD-04
modulo: 04-inventario-kardex-ledger
tags: [inventario, kardex, saldos, ledger, bloqueos, deadlock, ajustes]
rf_codes: [RF-INV-01, RF-INV-02, RF-INV-03, RF-INV-04]
modelos_prisma: [SaldoStock, MovimientoInventario, Variante, Ubicacion]
criterios_ca: [CA-01, CA-02, CA-03, QA-003]
---
# Módulo 04: Inventario Multisede, Kardex Inmutable y Ajustes (RF-INV)

Relacionado con: [[RN-INV-Kardex-y-Saldos]] | [[RN-GEN-Principios-Inmutables]] | [[Constraints-SQL-e-Indices]]

## 1. Alcance Funcional
Proporciona el motor central de consistencia de stock (\`InventoryLedgerService\`) para todas las transacciones del sistema, garantizando control de concurrencia, bloqueo ordenado anti-deadlock e historial append-only.

## 2. Requerimientos Funcionales Detallados

| Código RF | Nombre | Actores | Reglas | Entrada → Proceso → Salida | Criterios de Aceptación |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-INV-01** | Motor transaccional de Kardex con bloqueo canónico | Sistema | \`RN-GEN-02\`, \`RN-GEN-09\`, \`RN-INV-01\` a \`05\` | **E:** Comandos de movimiento \`(ubicacionId, varianteId, tipo, cantidadConSigno, documentoTipo, documentoId, motivo)\`.<br>**P:** 1) Ordena por \`varianteId ASC\`. 2) Bloquea con \`SELECT ... FOR UPDATE\`. 3) Verifica que ningún saldo quede negativo ni reservas > físico (\`chk_saldo_stock_no_negativo\`). 4) Actualiza \`SaldoStock\`, marca \`tieneMovimientos = true\` e inserta en \`MovimientoInventario\` inmutable.<br>**S:** Saldos actualizados atómicamente. | **CA-01, CA-02, QA-003:** Stock insuficiente provoca ROLLBACK. Concurrencia de la última unidad procesa una y rechaza la otra (stock en 0, jamás negativo). |
| **RF-INV-02** | Carga inicial y Ajustes manuales motivados | Administrador | \`RN-INV-02\`, \`RN-INV-06\`, \`RN-INV-08\` | **E:** \`ubicacionId\`, \`varianteId\`, cantidad entera con signo y motivo obligatorio.<br>**P:** Valida rol \`ADMIN\`. Invoca \`InventoryLedgerService\`. Si tenía \`bloqueadoDespachoWeb == true\`, permite rehabilitar despacho web. Audita.<br>**S:** Ajuste asentado en Kardex. | **CA-03:** Vendedores reciben \`403 Forbidden\` al intentar hacer ajustes. |
| **RF-INV-03** | Bajas de saldo «No vendible» | Administrador | \`RN-INV-08\`, \`RN-AUD-02\` | **E:** \`ubicacionId\`, \`varianteId\`, cantidad y motivo de merma/destrucción.<br>**P:** Descuenta de \`noVendible\` con tipo \`BAJA_NO_VENDIBLE\`. Audita.<br>**S:** Saldo defectuoso depurado. | Unidades no vendibles nunca suman a disponible ni se trasladan. |
| **RF-INV-04** | Consulta de inventario por alcance de rol | Admin, Vendedor | \`RN-INV-07\`, \`RN-INV-09\`, \`RN-ROL-05\` | **E:** Filtros por sede, categoría o SKU.<br>**P:** Vendedor requiere \`permVerInventario\` (su sede) o \`permVerOtrosPuntos\` (otras sedes). Muestra físico, reservado blando, reservado duro, disponible y alertas.<br>**S:** Tabla de inventario. | Vendedor sin permiso para otros puntos recibe \`403\`. |
`;

// ==========================================
// 02-Modulos-RF/MOD-05-Compras.md
// ==========================================
files['02-Modulos-RF/MOD-05-Compras.md'] = `---
id: MOD-05
modulo: 05-compras-proveedores
tags: [compras, proveedores, central, recepcion, idempotencia]
rf_codes: [RF-COM-01, RF-COM-02]
modelos_prisma: [CompraProveedor, LineaCompra, SaldoStock, MovimientoInventario]
criterios_ca: [CA-08]
---
# Módulo 05: Compras a Proveedores en Bodega Central (RF-COM)

Relacionado con: [[RN-COM-TRA-Compras-y-Traslados]] | [[MOD-04-Inventario-Ledger]] | [[RN-GEN-Principios-Inmutables]]

## 1. Alcance Funcional
Gestiona la adquisición de mercancía a proveedores ingresando exclusivamente por Bodega Central, con soporte para cancelación previa y recepción única e idempotente.

## 2. Requerimientos Funcionales Detallados

| Código RF | Nombre | Actores | Reglas | Entrada → Proceso → Salida | Criterios de Aceptación |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-COM-01** | Creación y cancelación de orden de compra | Administrador | \`RN-COM-01\`, \`RN-COM-02\`, \`RN-COM-05\` a \`07\` | **E:** Proveedor, contacto, notas y líneas (\`varianteId\`, \`cantidadPedida > 0\`, costo opcional).<br>**P:** Crea compra en \`PEDIDA\` sin tocar stock. Permite pasar a \`CANCELADA\` sin efecto en inventario.<br>**S:** Orden registrada. | En \`PEDIDA\` o \`CANCELADA\` no altera saldos de Central. |
| **RF-COM-02** | Recepción única de compra e ingreso a Central | Administrador | \`RN-COM-03\`, \`RN-COM-04\`, \`RN-GEN-08\` | **E:** \`compraId\`, \`Idempotency-Key\` y \`cantidadRecibida >= 0\` por línea.<br>**P:** En \`prisma.$transaction\`, valida estado \`PEDIDA\`. Suma \`+ cantidadRecibida\` al físico de Central vía \`InventoryLedgerService\` (\`COMPRA_RECIBIDA\`) y pasa a \`RECIBIDA\` inmutable.<br>**S:** Stock ingresado en Central. | **CA-08:** Recepción idempotente. Reintentos no duplican stock. |
`;

// ==========================================
// 02-Modulos-RF/MOD-06-Traslados.md
// ==========================================
files['02-Modulos-RF/MOD-06-Traslados.md'] = `---
id: MOD-06
modulo: 06-traslados-novedades
tags: [traslados, transito, novedades, faltantes, excedentes, retornando]
rf_codes: [RF-TRA-01, RF-TRA-02, RF-TRA-03, RF-TRA-04, RF-TRA-05, RF-TRA-06]
modelos_prisma: [Traslado, LineaTraslado, ResolucionNovedadTraslado, SaldoStock, MovimientoInventario]
criterios_ca: [CA-04, CA-05, CA-06, CA-07, CA-08, CA-09, CA-10, CA-11, CA-57, CA-58, CA-59, QA-010, QA-011, QA-012]
---
# Módulo 06: Traslados entre Sedes, Recepción y Novedades (RF-TRA)

Relacionado con: [[RN-COM-TRA-Compras-y-Traslados]] | [[MOD-04-Inventario-Ledger]] | [[RN-INV-Kardex-y-Saldos]]

## 1. Alcance Funcional
Gestiona el flujo logístico de mercancía entre Bodega Central y los Puntos de Venta, control de mercancía en tránsito, cancelación con retorno físico y conciliación de faltantes/excedentes.

## 2. Requerimientos Funcionales Detallados

| Código RF | Nombre | Actores | Reglas | Entrada → Proceso → Salida | Criterios de Aceptación |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-TRA-01** | Solicitud de punto o Envío directo de Central | Vendedor (\`permSolicitarTraslado\`), Admin | \`RN-TRA-01\`, \`RN-TRA-02\`, \`RN-TRA-05\` | **E:** Líneas \`(varianteId, cantidad > 0)\`.<br>**P:** Solicitud inicia en \`SOLICITADO\`. Envío directo de Central inicia en \`APROBADO\`. Sin movimiento de stock.<br>**S:** Documento \`Traslado\` creado. | Puntos solo crean y consultan traslados donde son destino. |
| **RF-TRA-02** | Aprobación total/parcial o rechazo en Central | Administrador | \`RN-TRA-04\`, \`RN-TRA-05\` | **E:** \`trasladoId\`, acción (\`APROBAR\` con \`aprobada <= solicitada\` o \`RECHAZAR\`).<br>**P:** Transiciona a \`APROBADO\` o \`RECHAZADO\`. No reserva stock aún.<br>**S:** Traslado evaluado. | **CA-11:** Cantidad aprobada nunca excede la solicitada. |
| **RF-TRA-03** | Despacho desde Central a Tránsito | Administrador | \`RN-TRA-03\`, \`RN-TRA-14\` | **E:** \`trasladoId\` en \`APROBADO\`, \`cantidadEnviada <= aprobada\`.<br>**P:** Valida \`disponible >= cantidadEnviada\`. Resta de físico en Central (\`TRASLADO_SALIDA\`) y pasa a \`ENVIADO\` (en tránsito).<br>**S:** Stock en tránsito. | **CA-04, CA-05:** Central baja, tránsito sube. Ningún punto puede vender en tránsito. |
| **RF-TRA-04** | Cancelación y flujo «Retornando a Central» | Admin | \`RN-TRA-12\`, \`RN-AUD-02\` | **E:** \`trasladoId\` y motivo.<br>**P:** En \`ENVIADO\` pasa a \`RETORNANDO_A_CENTRAL\` (sigue en tránsito, punto bloqueado). Cuando regresa físicamente a Central, Admin confirma reingreso (+ físico Central) y pasa a \`CANCELADO\`.<br>**S:** Reingreso verificado. | **CA-09, CA-59, QA-012:** Solo se repone stock en Central cuando Admin confirma reingreso físico. |
| **RF-TRA-05** | Recepción en punto (Completa, Dañados o Novedad) | Vendedor (\`permRecibirTraslado\`), Admin | \`RN-TRA-07\` a \`11\`, \`RN-TRA-17\` | **E:** \`trasladoId\`, \`Idempotency-Key\`, \`recibidaBuena\`, \`recibidaDanada\`, \`excedenteReportado\` y nota.<br>**P:** Valida \`recibidaBuena + recibidaDanada <= enviada\` (\`CA-07\`). Suma buenas a físico y dañadas a no vendible. Si \`faltantes == 0\` y \`excedente == 0\`: pasa a \`RECIBIDO\` (\`CA-57\`). Si hay faltantes o excedente: pasa a \`RECIBIDO_CON_NOVEDAD\` (\`CA-58\`).<br>**S:** Traslado recibido o en novedad. | **CA-06, CA-07, CA-08, CA-57, CA-58, QA-010, QA-011:** Dañadas van a no vendible. Faltantes/excedentes abren novedad. |
| **RF-TRA-06** | Resolución administrativa de novedades | Administrador | \`RN-TRA-11\`, \`RN-TRA-18\`, \`RN-TRA-19\` | **E:** \`trasladoId\`, resolución por línea (\`LLEGO\`, \`RETORNO\`, \`PERDIDA\`, \`INCORPORAR_EXCEDENTE\`).<br>**P:** Aplica ajustes de Kardex correspondientes. Al resolver el 100% de unidades pendientes pasa a \`CERRADO\`.<br>**S:** Novedad cerrada. | **CA-10:** Solo Admin resuelve novedades. |
`;

// ==========================================
// 02-Modulos-RF/MOD-07-Sesiones-Caja.md
// ==========================================
files['02-Modulos-RF/MOD-07-Sesiones-Caja.md'] = `---
id: MOD-07
modulo: 07-sesiones-caja-arqueo
tags: [caja, arqueo, sesiones, efectivo, base-contada, bogota]
rf_codes: [RF-CAJ-01, RF-CAJ-02, RF-CAJ-03]
modelos_prisma: [SesionCaja, Ubicacion, Usuario]
criterios_ca: [CA-12, CA-15, CA-55, CA-56, QA-007, QA-008, QA-009]
---
# Módulo 07: Sesiones de Caja, Base Contada y Arqueo (RF-CAJ)

Relacionado con: [[RN-CAJ-VTA-Caja-y-Ventas-POS]] | [[Constraints-SQL-e-Indices]] | [[MOD-08-Ventas-POS]]

## 1. Alcance Funcional
Administra la apertura, vigencia diaria y cierre de cajas en puntos físicos, asegurando que cada punto tenga una sola caja abierta y que las sesiones de días anteriores bloqueen operaciones comerciales.

## 2. Requerimientos Funcionales Detallados

| Código RF | Nombre | Actores | Reglas | Entrada → Proceso → Salida | Criterios de Aceptación |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-CAJ-01** | Apertura de caja con base contada | Vendedor (\`permCaja\`), Admin | \`RN-CAJ-01\` a \`04\` | **E:** \`ubicacionId\`, \`baseContadaCop\` y observación si difiere de $200.000 COP.<br>**P:** Valida que no exista otra caja abierta en ese punto (\`uq_unica_sesion_caja_abierta_por_punto\`). Guarda \`fechaNegocioColombia = hoy_bogota()\`.<br>**S:** Sesión \`ABIERTA\`. | **QA-007:** Dos aperturas simultáneas en el mismo punto permiten solo una y rechazan la otra. |
| **RF-CAJ-02** | Guardián de vigencia diaria de sesión | Sistema (Middleware POS) | \`RN-CAJ-05\`, \`RN-CAJ-11\` | **E:** Intento de venta POS, devolución, cambio o anulación.<br>**P:** Verifica que la sesión abierta pertenezca a \`hoy_bogota()\`. Si es de un día anterior, bloquea la acción exigiendo su cierre inmediato.<br>**S:** Autorización concedida o \`400 Bad Request\`. | **CA-12, CA-56, QA-009:** Una caja olvidada de ayer bloquea ventas/devoluciones y solo permite cerrarla. |
| **RF-CAJ-03** | Arqueo y cierre inmutable de caja | Vendedor (\`permCaja\`), Admin | \`RN-CAJ-06\` a \`10\` | **E:** \`sesionCajaId\`, \`efectivoContadoCierreCop\` y nota.<br>**P:** Calcula \`esperado = baseContadaCop + ventasEfectivo - reembolsosEfectivo\`, diferencia y \`efectivoAEntregar = max(0, contado - baseConfiguradaCop)\`. Pasa a \`CERRADA\` inmutable.<br>**S:** Arqueo cerrado. | **CA-15, CA-55, QA-008:** Arqueo parte de la base contada real. Efectivo a entregar nunca es negativo. |
`;

// ==========================================
// 02-Modulos-RF/MOD-08-Ventas-POS.md
// ==========================================
files['02-Modulos-RF/MOD-08-Ventas-POS.md'] = `---
id: MOD-08
modulo: 08-ventas-pos-terminal
tags: [pos, terminal, ventas, preempcion, efectivo, transferencia, consecutivo]
rf_codes: [RF-POS-01, RF-POS-02]
modelos_prisma: [VentaPOS, LineaVentaPOS, PagoVentaPOS, ConsecutivoUbicacion, SaldoStock]
criterios_ca: [CA-13, CA-14, CA-16, CA-17, CA-18, CA-60, CA-61, QA-004, QA-005, QA-006]
---
# Módulo 08: Terminal Punto de Venta (POS) y Prioridad Física (RF-POS)

Relacionado con: [[RN-CAJ-VTA-Caja-y-Ventas-POS]] | [[MOD-04-Inventario-Ledger]] | [[MOD-09-Descuentos]]

## 1. Alcance Funcional
Gestiona el carrito de ventas en mostrador, precios oficiales validados en servidor, preempción de stock sobre pedidos web blandos, protección de reservas duras y facturación con consecutivos diferidos.

## 2. Requerimientos Funcionales Detallados

| Código RF | Nombre | Actores | Reglas | Entrada → Proceso → Salida | Criterios de Aceptación |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-POS-01** | Búsqueda de catálogo en terminal POS | Vendedor (\`permVender\`), Admin | \`RN-VTA-03\`, \`CA-16\` | **E:** Búsqueda por SKU, nombre o categoría en terminal.<br>**P:** Muestra variantes activas en la sede con su precio oficial vigente en BD y stock físico/disponible.<br>**S:** Variante añadida al carrito POS. | **CA-16:** El backend ignora precios del frontend y usa \`variante.precioVentaCop\`. |
| **RF-POS-02** | Confirmación atómica de Venta POS con Preempción | Vendedor (\`permVender\`), Admin | \`RN-VTA-01\` a \`10\`, \`RN-WEB-16\`, \`RN-GEN-08\` | **E:** \`Idempotency-Key\`, líneas, descuento opcional y pagos (\`EFECTIVO\` / \`TRANSFERENCIA\`).<br>**P:** En \`prisma.$transaction\`: 1) Valida caja abierta hoy. 2) Ordena líneas \`varianteId ASC\` y bloquea con \`FOR UPDATE\`. 3) Verifica \`fisico - reservadoDuro >= cantidad\`. Si toma unidades de \`reservadoBlando\`, procede y reasigna los pedidos web afectados (\`CA-60\`). Si están en \`reservadoDuro\` (\`EN_PREPARACION\`), aborta (\`CA-61\`). 4) Descuenta stock, genera consecutivo diferido y guarda venta.<br>**S:** Venta \`COMPLETADA\` y comprobante impreso. | **CA-13, CA-14, CA-17, CA-18, CA-60, CA-61, QA-004 a 006:** Venta atómica e idempotente. Prioridad sobre reserva blanda, protege reserva dura. |
`;

// ==========================================
// 02-Modulos-RF/MOD-09-Descuentos.md
// ==========================================
files['02-Modulos-RF/MOD-09-Descuentos.md'] = `---
id: MOD-09
modulo: 09-promociones-descuentos
tags: [descuentos, promociones, cupones, prorrateo, topes]
rf_codes: [RF-DES-01, RF-DES-02]
modelos_prisma: [Promocion, LineaVentaPOS, LineaPedidoWeb]
criterios_ca: [CA-19, CA-20, CA-21, CA-22, CA-23, CA-24, CA-25]
---
# Módulo 09: Motor de Promociones, Descuentos y Prorrateo (RF-DES)

Relacionado con: [[RN-DES-Promociones-y-Prorrateo]] | [[MOD-08-Ventas-POS]] | [[MOD-11-Pedidos-Web-DANE]]

## 1. Alcance Funcional
Administra los cupones de promoción por código, los descuentos manuales autorizados para vendedores en mostrador y el motor de prorrateo exacto por línea con asignación de residuos.

## 2. Requerimientos Funcionales Detallados

| Código RF | Nombre | Actores | Reglas | Entrada → Proceso → Salida | Criterios de Aceptación |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-DES-01** | Gestión de promociones por código | Administrador | \`RN-DES-02\`, \`RN-DES-03\`, \`RN-DES-13\` | **E:** Código, tipo (\`PORCENTAJE\` / \`VALOR_FIJO\`), canal, fechas y mínimo de compra.<br>**P:** Guarda promoción. Si ya fue usada, prohíbe eliminarla y solo permite desactivarla.<br>**S:** Promoción guardada. | **CA-24:** Modificar o desactivar cupones usados no altera ventas pasadas. |
| **RF-DES-02** | Cálculo y prorrateo de descuentos | Sistema (POS y Web) | \`RN-DES-01\`, \`RN-DES-04\` a \`12\` | **E:** Líneas del carrito y cupón o descuento manual.<br>**P:** 1) Prohíbe acumular descuentos (\`CA-22\`). 2) Promoción mayor a base se limita a la base dejando productos en $0 (\`CA-25\`). 3) Descuento manual POS valida \`permDescuentoManual\` y \`topeDescuentoPorc\` (\`CA-23\`). 4) Aplica \`Math.floor(D * L_i / B)\` y asigna residuo a la última línea (\`CA-20\`).<br>**S:** Descuentos y netos guardados en snapshot. | **CA-19 a CA-23, CA-25:** Prorrateo exacto sin pérdida de centavos ($1.000 entre 3 da 333, 333 y 334). |
`;

// ==========================================
// 02-Modulos-RF/MOD-10-Devoluciones-Cambios.md
// ==========================================
files['02-Modulos-RF/MOD-10-Devoluciones-Cambios.md'] = `---
id: MOD-10
modulo: 10-devoluciones-cambios
tags: [devoluciones, cambios, anulaciones, reembolsos, iliquidez, venta-raiz]
rf_codes: [RF-DEV-01, RF-DEV-02, RF-DEV-03, RF-DEV-04]
modelos_prisma: [DevolucionPOS, LineaDevolucionPOS, VentaPOS, DevolucionComercialWeb, SaldoStock]
criterios_ca: [CA-26, CA-27, CA-28, CA-29, CA-30, CA-31, CA-32, CA-33, CA-34, CA-54, CA-63, CA-65, QA-016, QA-017, QA-018, QA-019, QA-021]
---
# Módulo 10: Anulaciones, Devoluciones y Cambios (RF-DEV)

Relacionado con: [[RN-DEV-Devoluciones-y-Cambios]] | [[MOD-07-Sesiones-Caja]] | [[MOD-04-Inventario-Ledger]]

## 1. Alcance Funcional
Gestiona la reversión de operaciones de venta, devoluciones por dinero o saldo a favor en POS y web, cambios de prendas y control de iliquidez en caja registradora.

## 2. Requerimientos Funcionales Detallados

| Código RF | Nombre | Actores | Reglas | Entrada → Proceso → Salida | Criterios de Aceptación |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-DEV-01** | Anulación de venta de la sesión de caja de hoy | Vendedor (\`permAnularVentas\`), Admin | \`RN-DEV-12\`, \`RN-CAJ-11\` | **E:** \`ventaId\` y motivo.<br>**P:** Valida que sea de la caja \`ABIERTA\` de hoy y sin devoluciones previas. Repone stock, anula venta y descuenta del esperado de caja.<br>**S:** Venta \`ANULADA\`. | **CA-33:** Bloqueado si la caja está cerrada o es de días anteriores. |
| **RF-DEV-02** | Devolución en POS con plazo raíz y liquidez | Vendedor (\`permDevoluciones\`), Admin | \`RN-DEV-01\` a \`10\`, \`CA-54\` | **E:** Venta original, líneas, condición física y medio de reembolso.<br>**P:** 1) Misma tienda y caja abierta hoy (\`CA-29\`). 2) Plazo de **5 días calendario desde venta raíz** (\`CA-63\`). 3) Reembolso sobre neto prorrateado (\`CA-26\`). 4) Cosméticos van forzosos a no vendible (\`CA-31\`). 5) Si falta efectivo en caja, autoriza transferencia con ref/nota sin dejar la caja negativa (\`CA-54\`).<br>**S:** Comprobante \`DevolucionPOS\`. | **CA-26 a 29, CA-31, CA-34, CA-54, CA-63, QA-019:** Plazo raíz estricto y excepción de iliquidez funcional. |
| **RF-DEV-03** | Operación atómica de Cambio en POS | Vendedor (\`permDevoluciones\`), Admin | \`RN-DEV-11\`, \`CA-30\`, \`CA-63\` | **E:** Líneas devueltas + líneas nuevas.<br>**P:** 1) Mismo producto (talla/color) conserva precio neto: **diferencia $0 COP** (\`QA-017\`). 2) Producto distinto factura a precio lista vigente (\`QA-018\`). 3) Nueva venta preserva la fecha y venta raíz original (\`CA-63\`).<br>**S:** Devolución y venta enlazadas en una transacción. | **CA-30, CA-63, QA-017, QA-018:** Cambio de talla a $0 no renueva los 5 días de garantía. |
| **RF-DEV-04** | Devolución Comercial Web imputada a origen | Administrador | \`RN-DEV-14\` a \`16\`, \`CA-65\` | **E:** Pedido web pagado/enviado, líneas, sede de reingreso físico y transferencia.<br>**P:** Valida 5 días hábiles desde entrega. Ingresa stock en la sede receptora, pero resta financieramente de las Ventas Netas del **punto que despachó el pedido** (\`CA-65\`).<br>**S:** Devolución comercial registrada. | **CA-65, QA-021:** La tienda que despachó asume la resta financiera en reportes. |
`;

// ==========================================
// 02-Modulos-RF/MOD-11-Pedidos-Web-DANE.md
// ==========================================
files['02-Modulos-RF/MOD-11-Pedidos-Web-DANE.md'] = `---
id: MOD-11
modulo: 11-pedidos-web-dane-envios
tags: [web, ecommerce, dane, reservas, worker, ttl, custodia, retorno-logistico]
rf_codes: [RF-WEB-01, RF-WEB-02, RF-WEB-03, RF-WEB-04, RF-WEB-05, RF-WEB-06, RF-WEB-07]
modelos_prisma: [PedidoWeb, LineaPedidoWeb, HistorialEstadoPedidoWeb, TarifaZonaEnvio, SaldoStock]
criterios_ca: [CA-35, CA-36, CA-37, CA-38, CA-39, CA-40, CA-41, CA-42, CA-43, CA-44, CA-45, CA-46, CA-62, CA-64, QA-013, QA-014, QA-015, QA-020]
---
# Módulo 11: Tienda Web, Despacho Geográfico DANE y Pedidos (RF-WEB)

Relacionado con: [[RN-WEB-ENV-Pedidos-y-Zonas-DANE]] | [[MOD-04-Inventario-Ledger]] | [[RN-INV-Kardex-y-Saldos]]

## 1. Alcance Funcional
Gestiona la vitrina web pública, liquidación de fletes DANE, algoritmo determinista de asignación de sede, worker de reservas con expiración a 24 horas, cuarentena de SKU, custodia en Bodega Central y retorno logístico.

## 2. Requerimientos Funcionales Detallados

| Código RF | Nombre | Actores | Reglas | Entrada → Proceso → Salida | Criterios de Aceptación |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-WEB-01** | Catálogo con semáforo de disponibilidad | Público, Cliente | \`RN-WEB-02\`, \`RN-CAT-06\` | **E:** Navegación en tienda online.<br>**P:** Calcula disponible web agregado en sedes habilitadas. Muestra «Disponible», «Últimas unidades» (\`<= 5\`) o «Agotado».<br>**S:** Catálogo seguro sin exponer unidades numéricas. | Oculta stock real al público. |
| **RF-WEB-02** | Flete por Zonas DANE 1 a 4 | Cliente, Admin | \`RN-ENV-01\` a \`06\` | **E:** Municipio origen y municipio destino DANE.<br>**P:** Valida \`atendidoWeb == true\`. Asigna Zona 1 ($8k), 2 ($12k), 3 ($16k) o 4 ($22k) o excepción.<br>**S:** Flete entero COP y días hábiles. | **CA-37:** Destino sin cobertura bloquea el checkout. |
| **RF-WEB-03** | Asignación determinista de sede y reserva blanda | Cliente Autenticado | \`RN-WEB-03\` a \`08\`, \`CA-35\`, \`CA-36\` | **E:** Carrito completo, destino DANE y pago (\`TRANSFERENCIA\` / \`CONTRAENTREGA\`).<br>**P:** Busca sedes con stock completo para todo el pedido. Desempata por: 1) menor flete; 2) menor \`prioridadDespacho\`; 3) menor ID. Bloquea con \`FOR UPDATE\` e incrementa \`reservadoBlando\`.<br>**S:** Pedido \`RECIBIDO\` asignado. | **CA-35, CA-36, CA-38:** Sin envíos divididos. Concurrencia de última unidad resuelta sin sobreventa. |
| **RF-WEB-04** | Worker periódico de expiración TTL (60s) | Sistema (Worker) | \`RN-WEB-09\`, \`CA-39\` | **E:** Ejecución cada 60 segundos.<br>**P:** Busca pedidos por transferencia vencidos (\`> 24h\`) usando \`FOR UPDATE SKIP LOCKED\`. Libera reserva blanda y cancela el pedido.<br>**S:** Stock devuelto automáticamente. | **CA-39, QA-015:** Cancela transferencias impagas sin bloquear pedidos en revisión. |
| **RF-WEB-05** | Preparación, Despacho y Reconocimiento de Venta | Admin, Vendedor (\`permPedidosWeb\`) | \`RN-WEB-10\` a \`12\`, \`RN-WEB-22\` | **E:** Cambio de estado del pedido web.<br>**P:** \`CONFIRMADO -> EN_PREPARACION\` mueve de reserva blanda a reserva dura (\`CA-42\`). \`ENVIADO\` resta físico y reserva dura. Reconoce venta cuando se cumple \`PAGADO\` y \`ENVIADO\` (\`CA-40\`, \`CA-45\`).<br>**S:** Pedido actualizado y venta registrada. | **CA-40, CA-42, CA-45:** Contraentrega reconoce venta al registrar cobro y entrega. |
| **RF-WEB-06** | «No puedo despachar», Cuarentena y Custodia en Central | Vendedor, Admin | \`RN-WEB-15\`, \`RN-WEB-16\`, \`CA-43\`, \`CA-62\` | **E:** \`pedidoId\`, SKUs con problema y nota.<br>**P:** Libera reserva, marca \`bloqueadoDespachoWeb = true\` para ese SKU en ese punto y reasigna. Si ninguna otra tienda tiene stock, asigna en custodia a **Bodega Central** con \`tieneIncidenciaStock = true\` y alerta al Admin.<br>**S:** Pedido reasignado o en custodia Central. | **CA-43, CA-62, QA-013:** Cero pedidos huérfanos sin ubicación; sin bucle infinito. |
| **RF-WEB-07** | Retorno Logístico sin distorsión de Ventas Netas | Administrador | \`RN-WEB-23\`, \`CA-64\` | **E:** Pedido contraentrega \`ENVIADO\` que pasa a \`NO_ENTREGADO\`.<br>**P:** Repone stock y anula cobro **sin restar de Ventas Netas ni computar como devolución comercial**.<br>**S:** Retorno asentado con precisión financiera. | **CA-64, QA-020:** Contraentrega fallido no resta ventas ficticias. |
`;

// ==========================================
// 02-Modulos-RF/MOD-12-Reportes-Auditoria.md
// ==========================================
files['02-Modulos-RF/MOD-12-Reportes-Auditoria.md'] = `---
id: MOD-12
modulo: 12-reportes-auditoria-dashboard
tags: [reportes, dashboard, auditoria, ventas-netas, alertas]
rf_codes: [RF-REP-01, RF-REP-02]
modelos_prisma: [RegistroAuditoria, VentaPOS, PedidoWeb, DevolucionPOS, DevolucionComercialWeb]
criterios_ca: [CA-47, CA-48, CA-49, QA-023]
---
# Módulo 12: Reportes Financieros, Dashboard y Auditoría (RF-REP)

Relacionado con: [[RN-GEN-Principios-Inmutables]] | [[MOD-08-Ventas-POS]] | [[MOD-11-Pedidos-Web-DANE]]

## 1. Alcance Funcional
Proporciona el cálculo inmutable de Ventas Netas por sede, canal y método de pago, el centro de alertas operativas en tiempo real y la bitácora de auditoría append-only para trazabilidad forense.

## 2. Requerimientos Funcionales Detallados

| Código RF | Nombre | Actores | Reglas | Entrada → Proceso → Salida | Criterios de Aceptación |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-REP-01** | Reporte de Ventas Netas con imputación geográfica | Admin, Vendedor (\`permVerVentasPunto\`) | \`RN-REP-01\` a \`06\`, \`RN-WEB-24\` | **E:** Rango de fechas en \`America/Bogota\` y sede.<br>**P:** Formula oficial: \`Ventas Netas = (Ventas POS + Ventas Web Reconocidas) - (Devoluciones POS + Devoluciones Web imputadas)\`. Excluye fletes, bases y retornos logísticos. Vendedor solo ve su sede; Admin ve consolidado.<br>**S:** Cuadro de mando financiero. | **CA-47 a CA-49:** Restricción de alcance por rol; mes cerrado inmutable. |
| **RF-REP-02** | Centro de alertas y log de auditoría inmutable | Administrador | \`RN-AUD-01\`, \`RN-AUD-02\`, \`RN-WEB-16\` | **E:** Consulta de eventos sensibles y alertas.<br>**P:** Consulta \`RegistroAuditoria\` append-only. Filtra pedidos con incidencia en Central, cajas vencidas, traslados retrasados y SKUs en cuarentena.<br>**S:** Panel de control gerencial. | **QA-023:** Prohibido modificar o borrar registros de auditoría. |
`;

// ==========================================
// 03-Base-de-Datos/Esquema-Prisma-33-Modelos.md
// ==========================================
files['03-Base-de-Datos/Esquema-Prisma-33-Modelos.md'] = `---
id: DB-PRISMA
tags: [base-de-datos, prisma, modelos, tablas, enums, postgresql]
modelos_prisma: [RegionEnvio, DepartamentoDane, MunicipioDane, TarifaZonaEnvio, ExcepcionTarifaEnvio, Ubicacion, Usuario, Categoria, Producto, Variante, SaldoStock, MovimientoInventario, CompraProveedor, LineaCompra, Traslado, LineaTraslado, ResolucionNovedadTraslado, SesionCaja, ConsecutivoUbicacion, Promocion, VentaPOS, LineaVentaPOS, PagoVentaPOS, DevolucionPOS, LineaDevolucionPOS, PedidoWeb, LineaPedidoWeb, HistorialEstadoPedidoWeb, DevolucionComercialWeb, FestivoColombia, ParametroSistema, RegistroIdempotencia, RegistroAuditoria]
---
# Estructura Física de Base de Datos: 33 Modelos y 15 Enums

Relacionado con: [[Constraints-SQL-e-Indices]] | [[00-Indice-Mapa-Mental-MOC]] | [[MOD-04-Inventario-Ledger]]

El esquema oficial de base de datos se implementa en PostgreSQL (Supabase Cloud) mediante Prisma ORM (\`backend/prisma/schema.prisma\`), constando de **33 modelos relacionales** y **15 enumeraciones**:

## 1. Catálogo de los 15 Enums
1. **\`RolUsuario\`:** \`ADMIN\`, \`VENDEDOR\`, \`CLIENTE\`.
2. **\`TipoUbicacion\`:** \`CENTRAL\`, \`PUNTO_VENTA\`.
3. **\`TipoMovimientoStock\` (26 tipos granulares):** \`CARGA_INICIAL_VENDIBLE\`, \`VENTA_POS_SALIDA\`, \`VENTA_POS_ANULADA_REINGRESO\`, \`DESPACHO_WEB_SALIDA\`, \`TRASLADO_SALIDA\`, \`TRASLADO_ENTRADA_BUENO\`, \`TRASLADO_ENTRADA_DANADO\`, \`TRASLADO_CANCELADO_REINGRESO\`, \`COMPRA_INGRESO\`, \`AJUSTE_POSITIVO_VENDIBLE\`, \`AJUSTE_NEGATIVO_VENDIBLE\`, \`AJUSTE_POSITIVO_NO_VENDIBLE\`, \`AJUSTE_NEGATIVO_NO_VENDIBLE\`, \`BAJA_NO_VENDIBLE\`, \`DEVOLUCION_POS_INGRESO_VENDIBLE\`, \`DEVOLUCION_POS_INGRESO_NO_VENDIBLE\`, \`DEVOLUCION_WEB_INGRESO_VENDIBLE\`, \`DEVOLUCION_WEB_INGRESO_NO_VENDIBLE\`, \`RETORNO_LOGISTICO_WEB_VENDIBLE\`, \`RETORNO_LOGISTICO_WEB_NO_VENDIBLE\`, \`RESERVA_BLANDA_INCREMENTAR\`, \`RESERVA_BLANDA_LIBERAR\`, \`RESERVA_BLANDA_A_DURA\`, \`RESERVA_DURA_LIBERAR\`, \`RESOLUCION_NOVEDAD_FALTANTE_REINGRESO\`, \`RESOLUCION_NOVEDAD_EXCEDENTE_INGRESO\`.
4. **\`EstadoCompra\`:** \`PEDIDA\`, \`RECIBIDA\`, \`CANCELADA\`.
5. **\`EstadoTraslado\`:** \`SOLICITADO\`, \`APROBADO\`, \`RECHAZADO\`, \`ENVIADO\`, \`RETORNANDO_A_CENTRAL\`, \`RECIBIDO\`, \`RECIBIDO_CON_NOVEDAD\`, \`CERRADO\`, \`CANCELADO\`.
6. **\`TipoResolucionNovedad\`:** \`LLEGO_DESPUES\`, \`RETORNO_A_CENTRAL\`, \`PERDIDA_ASUMIDA\`, \`INCORPORAR_A_PUNTO\`, \`DESCARTAR_EXCEDENTE\`.
7. **\`EstadoSesionCaja\`:** \`ABIERTA\`, \`CERRADA\`.
8. **\`EstadoVentaPOS\`:** \`COMPLETADA\`, \`ANULADA\`.
9. **\`MetodoPago\`:** \`EFECTIVO\`, \`TRANSFERENCIA\`.
10. **\`TipoDescuento\`:** \`PORCENTAJE\`, \`VALOR_FIJO\`.
11. **\`AlcancePromocion\`:** \`GLOBAL_ORDEN\`, \`CATEGORIA\`, \`PRODUCTO\`.
12. **\`CanalVenta\`:** \`POS\`, \`WEB\`, \`OMNICANAL\`.
13. **\`CondicionFisicaDevolucion\`:** \`VENDIBLE\`, \`NO_VENDIBLE\`.
14. **\`EstadoPedidoWeb\`:** \`RECIBIDO\`, \`CONFIRMADO\`, \`EN_PREPARACION\`, \`ENVIADO\`, \`ENTREGADO\`, \`NO_ENTREGADO\`, \`CANCELADO\`.
15. **\`EstadoPagoWeb\`:** \`PENDIENTE\`, \`PAGADO\`, \`RECHAZADO\`, \`REEMBOLSADO\`, \`ANULADO\`.

## 2. Mapa Estructurado de los 33 Modelos Relacionales

### A. Geografía, DANE y Envíos (5 Modelos)
- **\`RegionEnvio\`:** Regiones agrupadoras para fletes.
- **\`DepartamentoDane\`:** Departamentos según codificación oficial DANE.
- **\`MunicipioDane\`:** Municipios de Colombia con flag \`atendidoWeb\`.
- **\`TarifaZonaEnvio\`:** Tarifas base para Zonas 1 a 4 con días estimados.
- **\`ExcepcionTarifaEnvio\`:** Tarifas particulares para pares origen-destino.

### B. Organización y Usuarios (2 Modelos)
- **\`Ubicacion\`:** Central y tiendas físicas, con prioridad, base de caja y flag \`despachaWeb\`.
- **\`Usuario\`:** Clientes, vendedores y admins, con los 11 permisos, tope de descuento y soporte híbrido para contraseña local o Google OAuth (\`googleId\`, \`authProvider\`, \`passwordHash?\`).

### C. Catálogo e Inventario Ledger (5 Modelos)
- **\`Categoria\`:** Categorías del catálogo con flag \`esCosmeticoUsoPersonal\`.
- **\`Producto\`:** Artículos estándar con política \`reintegrableEnDevolucion\`.
- **\`Variante\`:** SKUs físicos únicos con talla, color y precio entero COP.
- **\`SaldoStock\`:** Saldos cuádruples (\`fisico\`, \`reservadoBlando\`, \`reservadoDuro\`, \`noVendible\`).
- **\`MovimientoInventario\`:** Bitácora inmutable de Kardex (*append-only*).

### D. Compras y Traslados (5 Modelos)
- **\`CompraProveedor\`:** Cabecera de compras a proveedores en Central.
- **\`LineaCompra\`:** Detalle de compras con cantidades pedidas y recibidas.
- **\`Traslado\`:** Cabecera de traslados inter-sede con control de tránsito.
- **\`LineaTraslado\`:** Detalle de traslados con conteos de buenas y dañadas.
- **\`ResolucionNovedadTraslado\`:** Resoluciones administrativas de faltantes y excedentes.

### E. Caja y Ventas POS (6 Modelos)
- **\`SesionCaja\`:** Sesiones de caja con apertura contada, arqueo y vigencia Bogotá.
- **\`ConsecutivoUbicacion\`:** Control secuencial atómico de comprobantes por sede.
- **\`Promocion\`:** Cupones de descuento configurables.
- **\`VentaPOS\`:** Cabecera de ventas presenciales en mostrador.
- **\`LineaVentaPOS\`:** Detalle de venta con snapshots de precios y descuentos.
- **\`PagoVentaPOS\`:** Registros de pago por efectivo y transferencia.

### F. Devoluciones POS y Cambios (2 Modelos)
- **\`DevolucionPOS\`:** Cabecera de devoluciones en tienda física.
- **\`LineaDevolucionPOS\`:** Detalle de devolución y destino físico (vendible/no vendible).

### G. Comercio Electrónico y Web (4 Modelos)
- **\`PedidoWeb\`:** Pedidos web con asignación determinista, TTL y estados duales.
- **\`LineaPedidoWeb\`:** Detalle de pedidos con snapshots.
- **\`HistorialEstadoPedidoWeb\`:** Trazabilidad de cambios de estado del pedido.
- **\`DevolucionComercialWeb\`:** Devoluciones de pedidos web imputadas a la sede despachadora.

### H. Gobernanza y Soporte del Sistema (4 Modelos)
- **\`FestivoColombia\`:** Calendario de festivos para cálculo de días hábiles.
- **\`ParametroSistema\`:** Parámetros operativos clave-valor.
- **\`RegistroIdempotencia\`:** Cache de claves de idempotencia para evitar duplicados.
- **\`RegistroAuditoria\`:** Registro inmutable de acciones administrativas sensibles.
`;

// ==========================================
// 03-Base-de-Datos/Constraints-SQL-e-Indices.md
// ==========================================
files['03-Base-de-Datos/Constraints-SQL-e-Indices.md'] = `---
id: DB-SQL-CONSTRAINTS
tags: [sql, postgresql, check, indices-unicos, supabase, integridad]
criterios_ca: [CA-01, CA-02, CA-12, CA-51, QA-007]
---
# Restricciones Nativas SQL e Índices Únicos Parciales

Relacionado con: [[Esquema-Prisma-33-Modelos]] | [[RN-INV-Kardex-y-Saldos]] | [[RN-CAJ-VTA-Caja-y-Ventas-POS]]

Para blindar la integridad del sistema más allá del ORM Prisma, se ejecuta el script oficial \`backend/prisma/constraints_post_migrate.sql\` inmediatamente después de la primera migración de Prisma (\`RNF-002\`):

\`\`\`sql
-- backend/prisma/constraints_post_migrate.sql
-- Ejecutar inmediatamente después de la primera migración de Prisma (RNF-002)

-- 1. Prohibición absoluta de saldos negativos o reservas superiores al stock físico (RN-INV-01, RN-VTA-03)
ALTER TABLE "SaldoStock"
  ADD CONSTRAINT chk_saldo_stock_no_negativo
  CHECK (
    "fisico" >= 0
    AND "reservadoBlando" >= 0
    AND "reservadoDuro" >= 0
    AND "noVendible" >= 0
    AND "fisico" >= ("reservadoBlando" + "reservadoDuro")
  );

-- 2. Garantizar que exista máximo UNA Bodega Central en todo el sistema (RN-UBI-01)
CREATE UNIQUE INDEX IF NOT EXISTS uq_unica_bodega_central
  ON "Ubicacion" ("tipo")
  WHERE "tipo" = 'CENTRAL';

-- 3. Garantizar que exista máximo UNA sesión de caja ABIERTA por cada punto de venta (RN-CAJ-03, QA-007)
CREATE UNIQUE INDEX IF NOT EXISTS uq_unica_sesion_caja_abierta_por_punto
  ON "SesionCaja" ("ubicacionId")
  WHERE "estado" = 'ABIERTA';

-- 4. Prohibir precios de venta menores o iguales a cero (RN-CAT-04)
ALTER TABLE "Variante"
  ADD CONSTRAINT chk_precio_venta_positivo
  CHECK ("precioVentaCop" > 0);
\`\`\`

## Justificación Técnica de los Guardrails SQL
1. **\`chk_saldo_stock_no_negativo\`:** Impide físicamente en el motor de base de datos que una condición de carrera o un bug en el código deje stock en negativo o que las reservas excedan el físico.
2. **\`uq_unica_bodega_central\`:** Asegura que a nivel físico no pueda crearse más de una Bodega Central mediante un índice único parcial condicionado a \`tipo = 'CENTRAL'\`.
3. **\`uq_unica_sesion_caja_abierta_por_punto\`:** Previene aperturas simultáneas en el mismo punto de venta (\`QA-007\`), garantizando que un cajero no opere sobre dos cajas paralelas.
4. **\`chk_precio_venta_positivo\`:** Garantiza que ninguna variante nazca con precio negativo o cero (\`CA-51\`).
`;

// ==========================================
// 04-Calidad-y-Parametros/Matriz-CA-01-a-CA-65.md
// ==========================================
files['04-Calidad-y-Parametros/Matriz-CA-01-a-CA-65.md'] = `---
id: MATRIZ-CA
tags: [calidad, criterios, ca, qa, testing, vitest]
---
# Matriz Completa de Criterios de Aceptación (CA-01 a CA-65) y Casos QA

Relacionado con: [[00-Indice-Mapa-Mental-MOC]] | [[PROGRESO-ACTUAL]] | [[RN-GEN-Principios-Inmutables]]

Esta matriz define los 65 criterios de aceptación normativos y los 25 casos de prueba cruzados (\`QA-001\` a \`QA-025\`) que deben verificarse en verde antes de dar por terminado cualquier módulo:

## A. Inventario, Catálogo y Traslados
| ID | Escenario Verificable | Resultado Esperado Exacto |
| :--- | :--- | :--- |
| **CA-01** | Un punto tiene 2 unidades disponibles y se intenta vender 3 | Se rechaza con «stock insuficiente» y el stock no cambia. |
| **CA-02 / QA-003** | Queda 1 unidad y dos ventas POS (o pedidos web) la confirman simultáneamente | Una se completa, la otra falla con conflicto (\`409\`); stock final \`0\`, jamás negativo. |
| **CA-03** | Un vendedor intenta realizar un ajuste manual de inventario | El backend lo rechaza (\`403\`). Solo el Administrador puede, con motivo obligatorio. |
| **CA-04** | Central con 30 unidades envía 30 a un punto | Central queda en \`0\` y tránsito en \`30\`. Al recibir buenas, el punto queda con \`30\`. |
| **CA-05** | Hay 30 unidades en estado \`ENVIADO\` (en tránsito) | Ni Central ni el punto destino pueden venderlas. |
| **CA-06** | Se envían 30 y el punto recibe 27 buenas | Con observación obligatoria suma 27 a físico y pasa a \`RECIBIDO_CON_NOVEDAD\`. |
| **CA-07** | Se intenta digitar \`recibidaBuena + recibidaDanada = 31\` sobre 30 enviadas | Se rechaza; la suma no puede superar lo enviado. |
| **CA-08** | La misma confirmación de recepción de traslado se envía dos veces | Respuesta idempotente; el stock jamás se duplica. |
| **CA-09 / CA-59 / QA-012** | Cancelar traslado en estado \`ENVIADO\` | Pasa a \`RETORNANDO_A_CENTRAL\`. Solo al confirmar reingreso físico en Central pasa a \`CANCELADO\` y repone stock. |
| **CA-10** | Vendedor intenta resolver novedad de traslado | Se rechaza (\`403\`). Solo el Admin resuelve novedades pasando el traslado a \`CERRADO\`. |
| **CA-11** | Solicitado 30, aprobado 20, se intenta enviar 25 | Se rechaza: lo enviado no puede superar lo aprobado. |
| **CA-57 / QA-010** | Se envían 30 y llegan 28 buenas y 2 dañadas | Con observación, suma 28 a físico, 2 a no vendible y pasa directo a \`RECIBIDO\`. |
| **CA-58 / QA-011** | Llegan 31 de 30 y se marca novedad por excedente | Pasa a \`RECIBIDO_CON_NOVEDAD\`. Admin resuelve incorporando o descartando. |
| **QA-001 / QA-002** | Crear variante con SKU propio y cambiar precio tras venta | Cada talla maneja stock independiente. Cambiar precio no altera snapshots pasados. |

## B. Ventas POS y Sesiones de Caja
| ID | Escenario Verificable | Resultado Esperado Exacto |
| :--- | :--- | :--- |
| **CA-12** | Venta POS sin sesión de caja abierta en el punto | Se rechaza. |
| **CA-13** | Venta en efectivo de $117.000 con billete de $120.000 | Vuelto $3.000; efectivo esperado de la caja sube exactamente $117.000. |
| **CA-14** | Venta POS por transferencia sin referencia | Se rechaza. Con referencia: no suma al efectivo esperado de la caja. |
| **CA-15 / QA-008** | Cierre de caja con conteo de dinero | \`esperado = baseContada + ventasEfectivo - reembolsosEfectivo\`. \`efectivoAEntregar = max(0, contado - baseConfigurada)\`. |
| **CA-16** | Petición manipulada desde el cliente envía un precio alterado | Backend ignora el precio del cliente y aplica \`precioVentaCop\` vigente en BD. |
| **CA-17** | Falla el descuento de inventario durante la venta | ROLLBACK total: no queda venta, ni pago, ni salto de consecutivo. |
| **CA-18 / QA-006 / QA-025** | Reintento con misma \`Idempotency-Key\` en venta POS | Se devuelve la venta original; jamás se descuenta doble stock. |
| **CA-55** | Caja abre con base contada menor a la configurada | Efectivo esperado parte de la base contada real sin arrastrar faltantes falsos. |
| **CA-56 / QA-009** | Sesión de caja abierta de un día anterior en Colombia | Bloquea ventas, devoluciones, cambios y anulaciones; solo admite cierre. |
| **CA-60 / QA-004** | POS compra prenda que tiene reserva web blanda (\`RECIBIDO\`) | Venta POS procede con prioridad; el pedido web se reasigna a otra sede o Central. |
| **CA-61 / QA-005** | POS intenta vender prenda con reserva web dura (\`EN_PREPARACION\`) | Venta POS se bloquea: la prenda empacada está blindada. |
| **QA-007** | Dos aperturas simultáneas de caja en el mismo punto | Solo una procede; la otra se rechaza por índice único parcial. |

## C. Descuentos y Promociones
| ID | Escenario Verificable | Resultado Esperado Exacto |
| :--- | :--- | :--- |
| **CA-19** | Promoción del 10% sobre subtotal elegible | Descuento del 10% prorrateado exactamente por línea. |
| **CA-20** | Descuento fijo de $1.000 sobre 3 líneas de $10.000 | Partes: $333, $333 y $334 (residuo asignado a la última línea). Suma $1.000. |
| **CA-21** | Cupón vencido o sin monto mínimo | Se rechaza con mensaje explicativo. |
| **CA-22** | Intentar combinar dos promociones o promoción con descuento manual | Se rechaza por regla de no acumulación. |
| **CA-23** | Vendedor intenta superar su tope de descuento manual | Se rechaza. Solo el Admin puede aplicar descuentos mayores. |
| **CA-24** | Editar cupón usado previamente | No altera ventas ni pedidos históricos. |
| **CA-25** | Promoción fija mayor al subtotal de productos | Descuento se limita al subtotal dejando productos en $0 COP. Flete se cobra aparte. |

## D. Devoluciones, Cambios y Anulaciones
| ID | Escenario Verificable | Resultado Esperado Exacto |
| :--- | :--- | :--- |
| **CA-26** | Devolver 1 prenda de una venta con descuento | Reembolsa el neto unitario prorrateado efectivamente pagado, no el precio lista. |
| **CA-27** | Devolución en POS el día 6 | Vendedor es bloqueado; solo el Admin puede autorizarla motivadamente. |
| **CA-28** | Devolver más unidades de las compradas | Se rechaza. |
| **CA-29** | Devolver en Tienda B una compra de Tienda A | Se rechaza (\`RN-DEV-01\`). |
| **CA-30 / QA-017 / QA-018** | Cambio de prenda en mostrador | Misma prenda (talla/color) diferencia $0 COP. Prenda distinta factura a precio lista vigente. |
| **CA-31 / QA-016** | Devolución de cosméticos o artículos no reintegrables | Entran obligatoriamente a saldo \`noVendible\`. |
| **CA-32** | Reembolso en efectivo en POS | Resta del efectivo esperado de la caja actual. |
| **CA-33** | Anular venta de hoy vs venta de sesión cerrada | Permitido solo en la sesión abierta de hoy; cerrada se rechaza. |
| **CA-34** | Devolución en diciembre de venta de noviembre | Noviembre no cambia; resta en Ventas Netas de diciembre. |
| **CA-54 / QA-019** | Iliquidez de efectivo en caja al devolver | Habilita reembolso por transferencia sin dejar la caja negativa. |
| **CA-63** | Cambio en Día 4 e intento de devolución en Día 7 | Bloqueado: los 5 días se cuentan siempre desde la venta raíz (Día 1). |

## E. Pedidos Web, Envíos DANE y Reportes
| ID | Escenario Verificable | Resultado Esperado Exacto |
| :--- | :--- | :--- |
| **CA-35** | Desempate entre sedes con stock completo | Menor flete DANE, luego menor prioridad de despacho, luego menor ID. |
| **CA-36** | Ninguna sede individual tiene todo el carrito | Checkout bloqueado (no se dividen pedidos). |
| **CA-37** | Municipio destino sin cobertura web | Checkout bloqueado indicando falta de cobertura. |
| **CA-38** | Dos clientes web confirman última unidad a la vez | Uno completa y reserva; el otro recibe aviso de agotado. |
| **CA-39 / QA-015** | Transferencia web impaga vence 24h | Worker cancela pedido y libera reserva blanda con \`SKIP LOCKED\`. |
| **CA-40** | Pedido contraentrega entregado con pago pendiente | No suma a ventas reconocidas hasta que el Admin registra \`PAGADO\`. |
| **CA-41** | Vendedor de otra sede intenta despachar pedido | Rechazado (\`403 Forbidden\`). |
| **CA-42** | Reasignar pedido en estado \`EN_PREPARACION\` | Se rechaza: reserva dura está blindada. |
| **CA-43 / CA-62 / QA-013** | Tienda marca «No puedo despachar» | Cuarentena de SKU en esa tienda (\`bloqueadoDespachoWeb = true\`) y reasignación; si nadie tiene stock va a custodia en Central con incidencia. |
| **CA-44 / QA-022** | Cliente consulta pedidos de otro cliente | \`403/404 Forbidden\`. |
| **CA-45** | Pedido pagado el 30-Nov y enviado el 02-Dic | Venta web se reconoce el 02-Dic (fecha del último hito). |
| **CA-46** | Cliente intenta cancelar pedido \`EN_PREPARACION\` | Bloqueado: debe tramitarlo con soporte. |
| **CA-47 a CA-53** | Reportes por sede, persistencia y responsive | Cumplen invariantes de permisos, dinero entero y diseño adaptativo. |
| **CA-64 / QA-020** | Contraentrega no entregado pasa a \`NO_ENTREGADO\` | Retorno logístico: repone stock sin restar de Ventas Netas. |
| **CA-65 / QA-021** | Devolución comercial web de prenda en Central | Prenda reingresa a Central pero la resta de Ventas Netas se imputa al punto que despachó. |
`;

// ==========================================
// 04-Calidad-y-Parametros/Parametros-Semilla-y-DV-Cerradas.md
// ==========================================
files['04-Calidad-y-Parametros/Parametros-Semilla-y-DV-Cerradas.md'] = `---
id: PARAM-DV
tags: [parametros, semillas, seed, decisiones, dv, configuracion]
---
# Parámetros Oficiales del Sistema y Cierre de Decisiones (DV-001 a DV-022)

Relacionado con: [[00-Indice-Mapa-Mental-MOC]] | [[MOD-02-Ubicaciones]] | [[MOD-11-Pedidos-Web-DANE]]

## 1. Tabla Oficial de Parámetros Configurables Cerrados (\`seed.ts\` y \`ParametroSistema\`)

| Parámetro del Sistema | Configuración | Valor Oficial Aprobado (\`[D]\`) | Regla |
| :--- | :--- | :--- | :--- |
| **Bodega Central** | Semilla Inicial | Cúcuta (DANE \`54001\`), Prioridad \`40\`, \`despachaWeb = true\`. | \`RN-UBI-01\` |
| **Punto Centro** | Semilla Inicial | Cúcuta (DANE \`54001\`), Prioridad \`10\`, Base \`$200.000\`, \`despachaWeb = true\`. | \`RN-UBI-02\` |
| **Punto Ocaña** | Semilla Inicial | Norte de Santander (DANE \`54498\`), Prioridad \`20\`, Base \`$200.000\`, \`despachaWeb = true\`. | \`RN-UBI-02\` |
| **Punto Bucaramanga** | Semilla Inicial | Santander (DANE \`68001\`), Prioridad \`30\`, Base \`$200.000\`, \`despachaWeb = true\`. | \`RN-UBI-02\` |
| **Base de Caja Objetivo** | Por Punto de Venta | **\`$200.000 COP\`** | \`RN-CAJ-02\` |
| **Plazo Devolución POS** | \`ParametroSistema\` | **\`5 días calendario\`** contados desde la venta raíz. | \`RN-DEV-03\` |
| **Plazo Devolución Web** | \`ParametroSistema\` | **\`5 días hábiles\`** desde la entrega (\`FestivoColombia\`). | \`RN-DEV-14\` |
| **Tope Descuento Vendedor** | Por Usuario | **\`0%\`** por defecto al crear uno nuevo; **\`10%\`** en datos semilla autorizados. | \`RN-DES-05\` |
| **Umbral Stock Bajo Interno** | Sistema / Variante | **\`3 unidades\`** o menos disponibles. | \`RN-INV-07\` |
| **Umbral Últimas Unidades Web** | \`ParametroSistema\` | **\`5 unidades\`** o menos disponibles. | \`RN-WEB-02\` |
| **TTL Reserva Transferencia Web** | \`ParametroSistema\` | **\`1.440 minutos\` (24 horas)** en estado \`RECIBIDO\`. | \`RN-WEB-09\` |
| **Alerta Preparación Web** | \`ParametroSistema\` | **\`24 horas\`** en \`CONFIRMADO\` sin pasar a preparación. | \`RN-WEB-17\` |
| **Tiempo Máx Tránsito Traslado** | \`ParametroSistema\` | **\`48 horas\`** en \`ENVIADO\` sin recepción. | \`RN-TRA-15\` |
| **Tarifa Envío Zona 1** | \`TarifaZonaEnvio\` | **\`$8.000 COP\`** · 1 a 2 días hábiles (Mismo municipio). | \`RN-ENV-02\` |
| **Tarifa Envío Zona 2** | \`TarifaZonaEnvio\` | **\`$12.000 COP\`** · 2 a 3 días hábiles (Mismo depto). | \`RN-ENV-02\` |
| **Tarifa Envío Zona 3** | \`TarifaZonaEnvio\` | **\`$16.000 COP\`** · 3 a 4 días hábiles (Misma región). | \`RN-ENV-02\` |
| **Tarifa Envío Zona 4** | \`TarifaZonaEnvio\` | **\`$22.000 COP\`** · 4 a 6 días hábiles (Otra región). | \`RN-ENV-02\` |
| **Cosméticos y Aretes** | \`Categoria\` / \`Producto\` | **\`reintegrableEnDevolucion = false\`** (van forzosos a no vendible). | \`RN-CAT-02\` |

---

## 2. Cierre Definitivo de las 22 Decisiones de Dominio (DV-001 a DV-022)

| ID | Decisión | Resolución Oficial Cerrada (\`[D]\`) en Documento Maestro v2.1 |
| :--- | :--- | :--- |
| **DV-001** | Ubicaciones reales y Central | 1 Bodega Central (Cúcuta \`54001\`) + 3 Tiendas: Punto Centro, Punto Ocaña y Punto Bucaramanga. |
| **DV-002** | Atributos de variantes | SKU único + Talla + Color/Presentación. Sin personalización. |
| **DV-003** | Precio base vs descuentos | \`precioVentaCop\` único e inmutable en variante; descuentos se aplican en la transacción. |
| **DV-004** | Reserva disponible web | \`disponibleWeb = fisico - reservadoBlando - reservadoDuro\` en sedes habilitadas. |
| **DV-005** | TTL reserva transferencia | 24 horas exactas con worker cada 60s con \`SKIP LOCKED\`. |
| **DV-006** | Métodos de pago | POS: \`EFECTIVO\` y \`TRANSFERENCIA\`. Web: \`TRANSFERENCIA\` y \`CONTRAENTREGA\`. |
| **DV-007** | Validación de transferencia | Registro obligatorio de referencia y confirmación manual por Admin. |
| **DV-008** | Tarifas y zonas DANE | Zonas 1 a 4 con tarifas de $8k, $12k, $16k y $22k más tabla de excepciones. |
| **DV-009** | Desempate de sedes | 1.º Menor flete DANE, 2.º Menor prioridad de despacho, 3.º Menor ID. |
| **DV-010** | Cosméticos no reintegrables | Cosméticos, ropa interior y aretes van siempre a \`noVendible\` en devoluciones. |
| **DV-011** | Condiciones de devolución | Clasificación obligatoria entre \`VENDIBLE\` y \`NO_VENDIBLE\` por el operador. |
| **DV-012** | Devoluciones fuera de plazo | Excedidos los 5 días, solo el Administrador puede autorizar con motivo. |
| **DV-013** | Venta reconocida | POS: venta completada. Web: cuando cumple ambos (\`PAGADO\` y \`ENVIADO\`). |
| **DV-014** | Facturación electrónica | Excluida del MVP; desacoplada en \`FacturacionPort\` con comprobante interno. |
| **DV-015** | Datos de checkout web | Nombre, correo, clave, teléfono, dirección, municipio DANE y consentimiento Ley 1581. |
| **DV-016** | Roles y permisos | \`ADMIN\`, \`VENDEDOR\` (11 permisos configurables) y \`CLIENTE\`. |
| **DV-017** | Compras a proveedor | Ingreso exclusivo a Central en \`PEDIDA -> RECIBIDA/CANCELADA\`. |
| **DV-018** | Formato de comprobante | Comprobante imprimible por navegador con consecutivo diferido. |
| **DV-019 / 020** | Pooler y Supabase | Supabase PostgreSQL con \`DATABASE_URL\` (pooler) y \`DIRECT_URL\` (migraciones). |
| **DV-021 / 022** | Dispositivos y conectividad | POS web para pantallas \`>= 1024px\`. Sin modo offline; protección por \`Idempotency-Key\`. |
`;

// ==========================================
// 05-Estado-Sprints/PROGRESO-ACTUAL.md
// ==========================================
files['05-Estado-Sprints/PROGRESO-ACTUAL.md'] = `---
id: ESTADO-SPRINTS
tags: [progreso, sprints, checkpoint, harness]
---
# Estado de Construcción del Proyecto (Checkpoint de Memoria para Agentes)

Última actualización: 2 de noviembre de 2026

## 1. Hitos Completados
- [x] **Fase 0: Especificación y Harness Agéntico v2.1**
  - Documento Maestro v2.1 unificado y cerrado (\`[D]\`).
  - Harness de control (\`AGENTS.md\` / \`CLAUDE.md\`) con las 7 invariantes inquebrantables.
  - Memoria muscular: Skills (\`pos-kardex-transaction\`, \`pos-adversarial-audit\`, \`orquestador-pos-rag-audit\`) activas en \`.agent/skills/\` y \`.claude/skills/\`.
  - Obsidian Vault atómico (\`/docs/vault/\`) con 26 notas operativas con YAML frontmatter y \`[[wikilinks]]\`.
  - Script generador reproducible (\`scripts/generate-vault.mjs\`).
  - Dominio base implementado y verificado en tests unitarios: \`MoneyCOP.ts\` y \`ColombiaTime.ts\`.

---

## 2. Plan de Sprints Técnicos

### Sprint 0: Fundación de Base de Datos y Runtime (Próximo a Iniciar)
- [ ] Configurar \`package.json\` raíz y scripts de ejecución.
- [ ] Conectar Supabase (\`DATABASE_URL\` / \`DIRECT_URL\`).
- [ ] Ejecutar primera migración Prisma con los 33 modelos y 15 enums.
- [ ] Aplicar script nativo \`backend/prisma/constraints_post_migrate.sql\` (\`chk_saldo_stock_no_negativo\`, etc.).
- [ ] Implementar seed inicial (\`prisma/seed.ts\`) con Central, 3 puntos, tarifas DANE y admin inicial.

### Sprint 1: Identidad, Sedes y Catálogo
- [ ] Módulo 01: Identidad, Roles, Matriz de 11 Permisos y \`UserPermissionCache\` (\`RF-USU-01\` a \`06\`).
- [ ] Módulo 02: Ubicaciones DANE, Central y Puntos (\`RF-UBI-01\` a \`02\`).
- [ ] Módulo 03: Catálogo, Variantes, SKU inmutable y Cosméticos (\`RF-CAT-01\` a \`03\`).

### Sprint 2: Motor Ledger, Compras y Traslados
- [ ] Módulo 04: \`InventoryLedgerService\` con orden canónico anti-deadlock (\`RF-INV-01\` a \`04\`).
- [ ] Módulo 05: Compras a Proveedor en Central (\`RF-COM-01\` a \`02\`).
- [ ] Módulo 06: Traslados, Tránsito, Retornando a Central y Novedades (\`RF-TRA-01\` a \`06\`).

### Sprint 3: Caja, Terminal POS, Descuentos y Devoluciones
- [ ] Módulo 07: Sesiones de Caja, Base Contada y Vigencia Bogotá (\`RF-CAJ-01\` a \`03\`).
- [ ] Módulo 08: Terminal POS y Preempción sobre reservas blandas (\`RF-POS-01\` a \`02\`).
- [ ] Módulo 09: Promociones y Prorrateo exacto (\`RF-DES-01\` a \`02\`).
- [ ] Módulo 10: Devoluciones POS con plazo raíz, Iliquidez y Cambios a $0 (\`RF-DEV-01\` a \`04\`).

### Sprint 4: Tienda Web, Envíos DANE y Retornos
- [ ] Módulo 11: Tienda Web, Fletes DANE, Worker TTL 60s, Cuarentena SKU y Custodia en Central (\`RF-WEB-01\` a \`07\`).

### Sprint 5: Reportes Financieros, Dashboard y Certificación QA
- [ ] Módulo 12: Ventas Netas imputadas a la sede despachadora, Auditoría inmutable (\`RF-REP-01\` a \`02\`).
- [ ] Suite de pruebas de integración validando los 65 criterios (\`CA-01\` a \`CA-65\`).
`;

// Helper para guardar archivos
function saveFile(relPath, content) {
  const fullPath = path.join(VAULT_DIR, relPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log(`[GENERADO] ${relPath}`);
}

// Guardar todos los archivos
for (const [relPath, content] of Object.entries(files)) {
  saveFile(relPath, content);
}

console.log(`--- Obsidian Vault generado exitosamente (${Object.keys(files).length} notas atómicas) ---`);
