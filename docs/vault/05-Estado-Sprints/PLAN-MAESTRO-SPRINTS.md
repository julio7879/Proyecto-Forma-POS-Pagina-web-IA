---
id: PLAN-MAESTRO-SPRINTS
tags: [sprints, plan, cronograma, tareas, equipo]
---
# Plan Maestro de Sprints y Asignación de Tareas por Rol

Este plan desglosa la construcción del **Sistema POS + Tienda Web Multisede** en 6 Sprints técnicos adaptables, distribuyendo la carga de trabajo según las capacidades y roles de **Julio, Sofía, Duvan, Exneider, Yeimer y Thomas**.

---

## Resumen de Capacidad y Asignación por Miembro

- **Julio (Líder / Backend Senior):** 40% de la carga técnica crítica (Kardex, locks pesimistas, concurrencia, caja, pagos, arquitectura).
- **Exneider (Frontend Lead):** 35% de la carga técnica (Vistas y lógica de UI para Web, POS y Admin en React + Tailwind).
- **Yeimer (Backend Junior):** 12% de la carga (Endpoints auxiliares, esquemas Zod de entrada, filtros de reportes con guía de Julio).
- **Thomas (Junior / Soporte):** 8% de la carga acotada (**5 Issues clave y sencillos** a lo largo del proyecto, sin riesgo de cuello de botella).
- **Sofía (UX/UI):** Prototipado en Figma/Lovable, diseño visual de layouts y componentes. **0% código**.
- **Duvan (QA Lead):** Certificación obligatoria de cada PR y verificación de los criterios `CA-01` a `CA-65`.

---

## Sprint 0: Fundación de Base de Datos, Runtime y Catálogos Base (Semana 1)
**Objetivo del Sprint:** Tener el entorno backend conectado a PostgreSQL en Supabase, primera migración aplicada con restricciones SQL nativas, utilidades de dinero/fechas y catálogos geográficos.

| ID Tarea | Descripción de la Tarea | Asignado | Rol | Criterios / Dependencias |
| :--- | :--- | :--- | :--- | :--- |
| **SP0-01** | Conectar Supabase (`DATABASE_URL` y `DIRECT_URL`), configurar Prisma y correr migración inicial de 33 modelos. | **Julio** | Backend Lead | `schema.prisma` verificado. |
| **SP0-02** | Aplicar script SQL de restricciones nativas (`constraints_post_migrate.sql` con `chk_saldo_stock_no_negativo`, etc.). | **Julio** | Backend Lead | Restricciones de PostgreSQL. |
| **SP0-03** | **Issue #T1 de Thomas:** Construir catálogo oficial de Municipios y Departamentos DANE con tarifas de Zonas 1 a 4. | **Thomas** | Junior Backend | `RF-ENV-01 a 04`, archivo `daneCatalog.ts`. |
| **SP0-04** | Validar utilidades de dominio: `MoneyCOP.ts` (prorrateo) y `ColombiaTime.ts` (fechas Bogotá). | **Yeimer** | Junior Backend | Tests unitarios en verde. |
| **SP0-05** | Diseñar wireframes y guía de estilos del Storefront, POS y Admin en Figma/Lovable. | **Sofía** | UX/UI | Paleta, tipografía, componentes visuales. |
| **SP0-06** | **QA Gate:** Verificar que la base de datos rechace saldos negativos e inserción de dos Bodegas Centrales por SQL directo. | **Duvan** | QA Tester | `QA-007`, `RN-INV-01`, `RN-UBI-01`. |

---

## Sprint 1: Identidad, Sedes y Catálogo de Productos por SKU (Semana 2)
**Objetivo del Sprint:** Registro/login (JWT + Google OAuth), matriz de 11 permisos con revocación instantánea (`CA-50`), y catálogo de ropa, accesorios, cosméticos y artesanías.

| ID Tarea | Descripción de la Tarea | Asignado | Rol | Criterios / Dependencias |
| :--- | :--- | :--- | :--- | :--- |
| **SP1-01** | Middleware de autenticación JWT + caché de permisos en memoria `UserPermissionCache` con invalidación instantánea. | **Julio** | Backend Lead | `RF-USU-02`, `RF-USU-03`, `CA-50`. |
| **SP1-02** | Endpoint de autenticación híbrida: tradicional (correo/contraseña) y Google OAuth (`POST /api/auth/google`). | **Julio** | Backend Lead | `RF-USU-01`, `RN-ROL-06`, `RN-SEG-04`. |
| **SP1-03** | Endpoints de gestión de Puntos de Venta y reglas de desactivación con 5 condiciones. | **Yeimer** | Junior Backend | `RF-UBI-01`, `RF-UBI-02`, `RN-UBI-05`. |
| **SP1-04** | **Issue #T2 de Thomas:** Cargar datos semilla (`seed.ts`) de categorías estándar y productos iniciales con variantes/SKU. | **Thomas** | Junior Backend | `RN-CAT-01 a 04`, cosméticos `no reintegrables`. |
| **SP1-05** | Maquetación del Login, Registro con Ley 1581 y Navbar de navegación en `StorefrontLayout`. | **Exneider** | Frontend | Basado en prototipo de Sofía. |
| **SP1-06** | Prototipar flujo visual de la Terminal POS (buscador rápido, carrito de compra, teclado numérico). | **Sofía** | UX/UI | Prototipo para tablet/PC (`>= 1024px`). |
| **SP1-07** | **QA Gate:** Probar intento de inicio de sesión tras 5 fallos, revocación inmediata de permisos de vendedor y bloqueo de doble Bodega Central. | **Duvan** | QA Tester | `CA-50`, `QA-001`, `QA-002`, `QA-022`. |
| **SP1-08** | Guía de Diseño y Sistema Visual Multi-Portal (`ARQ-06`): tokens Tailwind, paleta y estados UI (Loading, Empty, Error, Success). | **Sofía** | UX/UI | `ARQ-06`, `CA-53`, componentes base. |

---

## Sprint 2: Motor Kardex (`InventoryLedger`), Compras y Traslados (Semanas 3 y 4)
**Objetivo del Sprint:** Núcleo transaccional de inventario con orden canónico anti-deadlock, recepción de compras en Central, y traslados con mercancía en tránsito, `Retornando a Central` y novedades.

| ID Tarea | Descripción de la Tarea | Asignado | Rol | Criterios / Dependencias |
| :--- | :--- | :--- | :--- | :--- |
| **SP2-01** | `InventoryLedgerService.ts`: servicio único autorizado para modificar `SaldoStock` con bloqueo `varianteId ASC FOR UPDATE`. | **Julio** | Backend Lead | `RN-GEN-02`, `RN-INV-04`, `RNF-003`, `CA-01`, `CA-02`. |
| **SP2-02** | Módulo de Compras a Proveedor en Bodega Central (`PEDIDA` → `RECIBIDA` / `CANCELADA`) con idempotencia. | **Yeimer** | Junior Backend | `RF-COM-01`, `RF-COM-02`, `RN-COM-03`. |
| **SP2-03** | Máquina de estados de Traslados: `SOLICITADO` → `APROBADO` → `ENVIADO` (stock en tránsito) y flujo `RETORNANDO_A_CENTRAL`. | **Julio** | Backend Lead | `RF-TRA-01 a 04`, `CA-04`, `CA-05`, `CA-09`, `CA-59`. |
| **SP2-04** | Recepción de traslados con control de dañados (`RECIBIDO`), faltantes o excedentes (`RECIBIDO_CON_NOVEDAD`) y resolución Admin. | **Julio** | Backend Lead | `RF-TRA-05`, `RF-TRA-06`, `CA-06 a 08`, `CA-57`, `CA-58`. |
| **SP2-05** | Vistas de Inventario Admin, creación de compras y gestión de traslados en `AdminLayout`. | **Exneider** | Frontend | Conexión con TanStack Query. |
| **SP2-06** | Prototipar vistas de arqueo de caja y pantalla de cobro rápido para POS. | **Sofía** | UX/UI | Prototipos de flujos de caja y venta. |
| **SP2-07** | **QA Gate:** Pruebas concurrentes con `Promise.all` sobre la última unidad disponible, simulación de traslados con faltantes/dañados y cancelación en tránsito. | **Duvan** | QA Tester | `CA-01 a CA-11`, `CA-57 a 59`, `QA-003`, `QA-010 a 012`. |
| **SP2-08** | **Issue #T2.1 de Thomas:** Interfaz y Modal de Recepción de Traslados en Punto de Venta con Checklist de Novedades y Dañados (`RecepcionTrasladoModal.tsx`). | **Thomas** | Junior Frontend | `RF-TRA-05`, `CA-07`, `CA-08`, `CA-57`, `CA-58`. |

---

## Sprint 3: Caja, Terminal POS, Descuentos y Devoluciones/Cambios (Semanas 5 y 6)
**Objetivo del Sprint:** Operación completa de caja física (apertura con base contada, bloqueo de sesiones de ayer), venta POS atómica con preempción de reservas web blandas, motor de prorrateo exacto, devoluciones con plazo raíz y cambios a $0.

| ID Tarea | Descripción de la Tarea | Asignado | Rol | Criterios / Dependencias |
| :--- | :--- | :--- | :--- | :--- |
| **SP3-01** | Sesiones de Caja: Apertura con `baseContadaCop`, guardián de vigencia Bogotá (`CA-56`), arqueo, cálculo de `efectivoAEntregar` y **alerta automática a Telegram ante descuadres**. | **Julio** | Backend Lead | `RF-CAJ-01 a 03`, `CA-12`, `CA-15`, `CA-55`, `CA-56`, Telegram Bot API. |
| **SP3-02** | Confirmación atómica de Venta POS con preempción sobre reservas blandas y protección de reservas duras (`EN_PREPARACION`). | **Julio** | Backend Lead | `RF-POS-02`, `RN-VTA-03`, `CA-13 a 18`, `CA-60`, `CA-61`. |
| **SP3-03** | Motor de descuentos y promociones con prorrateo exacto (`Math.floor` + residuo a última línea elegible). | **Yeimer** | Junior Backend | `RF-DES-01 a 02`, `CA-19 a 25`. |
| **SP3-04** | Anulaciones del día, Devoluciones en POS con plazo de 5 días raíz, excepción de iliquidez en caja y Cambios mano a mano ($0). | **Julio** | Backend Lead | `RF-DEV-01 a 03`, `CA-26 a 34`, `CA-54`, `CA-63`. |
| **SP3-05** | **Issue #T3 de Thomas:** Diseñar la vista imprimible del Comprobante Interno de Venta POS (80 mm para ticket térmico) y formato de recibo digital por Telegram. | **Thomas** | Junior Frontend | `RN-VTA-09`, ticket de venta presencial (sin WhatsApp). |
| **SP3-06** | Implementación completa de la Terminal POS en `PosLayout` (buscador rápido, teclado en pantalla, modal de cobro y cambios). | **Exneider** | Frontend | React + Tailwind + estado anti-doble clic. |
| **SP3-07** | Prototipar catálogo público web con semáforo de disponibilidad y checkout en 3 pasos. | **Sofía** | UX/UI | Mobile-first para compradores web. |
| **SP3-08** | **QA Gate:** Pruebas de venta con preempción de reserva web, devolución de producto con descuento prorrateado, cambio de talla a $0 y corte de caja vencida. | **Duvan** | QA Tester | `CA-12 a 34`, `CA-54 a 56`, `CA-60`, `CA-61`, `CA-63`. |
| **SP3-09** | **Issue #T3.1 de Thomas:** Modal de Cobro Rápido y Teclado Numérico Táctil con Cálculo de Cambio para Terminal POS (`CobroRapidoModal.tsx`). | **Thomas** | Junior Frontend | `RF-POS-01`, `CA-51`, `CA-52`. |

---

## Sprint 4: Tienda Web, Envíos DANE, Reservas TTL y Custodia Central (Semanas 7 y 8)
**Objetivo del Sprint:** E-Commerce público con semáforo de disponibilidad, algoritmo determinista de despacho DANE, worker TTL con `SKIP LOCKED`, cuarentena de SKU por «No puedo despachar», custodia en Bodega Central y envío de correo de confirmación.

| ID Tarea | Descripción de la Tarea | Asignado | Rol | Criterios / Dependencias |
| :--- | :--- | :--- | :--- | :--- |
| **SP4-01** | Algoritmo determinista de asignación de sede por menor tarifa DANE y prioridad (`RN-WEB-05`) y checkout atómico. | **Julio** | Backend Lead | `RF-WEB-02`, `RF-WEB-03`, `CA-35`, `CA-36`, `CA-38`. |
| **SP4-02** | Worker periódico de expiración de reservas TTL por transferencia vencida con `FOR UPDATE SKIP LOCKED`. | **Julio** | Backend Lead | `RF-WEB-04`, `CA-39`, `QA-015`. |
| **SP4-03** | Flujo «No puedo despachar» con flag `bloqueadoDespachoWeb` por SKU y custodia automática en Bodega Central si no hay stock. | **Julio** | Backend Lead | `RF-WEB-06`, `CA-43`, `CA-62`, `QA-013`. |
| **SP4-04** | **Issue #T4 de Thomas:** Diseñar plantilla HTML del correo transaccional de confirmación de pedido con número de guía y flujo de seguimiento. | **Thomas** | Junior Backend/HTML | `NotificacionPort`, plantilla de correo. |
| **SP4-05** | Integrar `TelegramNotificationAdapter` (alertas a `@FormaNotifier_bot` ante nuevos pedidos web e incidencias) y servicio de correos transaccionales. | **Yeimer** | Junior Backend | `NotificacionPort`, Telegram Bot API (sin WhatsApp). |
| **SP4-06** | Separación estricta entre Retorno Logístico (contraentrega rechazada) y Devolución Comercial Web imputada a la tienda despachadora. | **Julio** | Backend Lead | `RF-WEB-07`, `RF-DEV-04`, `CA-64`, `CA-65`. |
| **SP4-07** | Construcción de la Tienda Web en `StorefrontLayout` (catálogo con semáforo, carrito, checkout por zonas DANE y Mis Pedidos). | **Exneider** | Frontend | Mobile-First en React. |
| **SP4-08** | **QA Gate:** Pruebas de expiración automática de reservas web, compra concurrente del último stock web, cuarentena de SKU y retorno logístico sin alterar ventas netas. | **Duvan** | QA Tester | `CA-35 a 46`, `CA-62`, `CA-64`, `CA-65`, `QA-013 a 021`. |

---

## Sprint 5: Reportes Financieros, Dashboard, Auditoría y Certificación Final (Semana 9)
**Objetivo del Sprint:** Reporte inmutable de Ventas Netas por punto y canal, bitácora de auditoría de solo adición, centro de alertas, suite integral de 65 criterios CA y ensayo de backup restaurado en staging.

| ID Tarea | Descripción de la Tarea | Asignado | Rol | Criterios / Dependencias |
| :--- | :--- | :--- | :--- | :--- |
| **SP5-01** | Reporte oficial de Ventas Netas en `America/Bogota` (excluyendo bases de caja, envíos y retornos logísticos) con histórico mensual. | **Julio** | Backend Lead | `RF-REP-01`, `CA-47 a 49`. |
| **SP5-02** | Centro de Alertas operativas (pedidos con incidencia en Central, SKUs en cuarentena, cajas desfasadas, stock bajo). | **Yeimer** | Junior Backend | `RF-REP-02`. |
| **SP5-03** | **Issue #T5 de Thomas:** Colección de pruebas de integración de endpoints de API REST y documentación de formatos de error HTTP. | **Thomas** | Junior QA/Docs | Documentación de API y códigos de error. |
| **SP5-04** | Dashboard interactivo con gráficos de ventas, indicadores clave y visor de auditoría inmutable en `AdminLayout`. | **Exneider** | Frontend | `@tanstack/react-query` + Tailwind. |
| **SP5-05** | Revisión estética final de contrastes WCAG 2.2 AA y consistencia visual de los 3 portales. | **Sofía** | UX/UI | Guía visual y feedback de diseño. |
| **SP5-06** | **QA Gate Final:** Ejecución completa de la suite de 65 criterios `CA-01` a `CA-65` y 25 casos `QA-001` a `QA-025` en verde, y simulación de backup restaurado en Supabase. | **Duvan** | QA Tester | `CA-01 a CA-65`, `QA-001 a QA-025`, `RNF-009`. |

---

## Protocolo de Gestión de Cambios e Imprevistos

Para mantener el plan vivo y flexible:
1. **Re-estimación Ágil:** Si un integrante se atrasa o una tarea resulta más compleja de lo previsto, Julio puede mover tareas de baja criticidad de Yeimer o Thomas al siguiente sprint, manteniendo intactas las invariantes de inventario y concurrencia.
2. **Issues Emergentes:** Cualquier incidencia detectada por Duvan se registra como `bugfix/CA-XX` y se prioriza sobre nuevos features.
3. **Registro de Hitos:** Cada hito superado se documenta de inmediato en `PROGRESO-ACTUAL.md` usando la skill `pos-sprint-progress-tracker`.

