---
id: ESTADO-SPRINTS
tags: [progreso, sprints, checkpoint, hitos, equipo, gitflow]
---
# Dashboard de Progreso del Proyecto y Registro de Hitos (Live Tracker)

- **Repositorio Oficial:** [`Proyecto-Forma-POS-Pagina-web-IA`](https://github.com/julio7879/Proyecto-Forma-POS-Pagina-web-IA.git)
- **Metodología:** GitFlow (`main`, `develop`, `feature/*`, `bugfix/*`, `release/*`)
- **Documentos de Referencia:** [[PLAN-MAESTRO-SPRINTS]] | [[MATRIZ-ROLES-Y-TAREAS]] | [[Matriz-CA-01-a-CA-65]]
- **Líder del Proyecto:** Julio (@julio7879)
- **Última actualización:** 4 de noviembre de 2026 (13:45 COT)

---

## 1. Equipo de Trabajo y Estado de Carga

| Integrante | Rol en el Proyecto | Estado Actual | Tareas Activas / Asignadas |
| :--- | :--- | :--- | :--- |
| **Julio** | Líder de Proyecto & Backend Senior | **Activo · Sprint 2 y Sprint 4 en Marcha** | **PR #44 (`SP2-03`) FUSIONADO en `develop`** (máquina de estados de traslados, despacho a tránsito y retorno a Central). Issue #37 cerrado. QA Gate en Issue #45.<br>**PR #47 (`SP4-01`):** Algoritmo determinista DANE y checkout web auditado al 100% por el escuadrón multi-agente con 123 tests en verde. QA Gate en Issue #48.<br>**PR #50 (`SP4-02`):** Worker periódico de expiración TTL de reservas web y retorno de stock a góndola implementado con 133 tests en verde. QA Gate en Issue #51. |
| **Thomas** | Junior Backend & Frontend (Tareas Acotadas) | **Completado en Sprint 3 (QA Gate)** | **PR #13 fusionado en `develop`** (`SP1-04`, catálogo semilla por SKU).<br>**PR #26 fusionado en `develop`** (`SP3-05`, plantilla comprobante POS 80 mm y recibo digital Telegram). Issue #22 cerrado. QA Gate en Issue #28. |
| **Duvan** | QA Lead & Auditor de Criterios CA | En Progreso | **Issue #7 (`SP1-07`):** Certificación integral de seguridad y permisos Sprint 1.<br>**Issue #15 (`[QA] PR #13`):** Certificación del catálogo semilla de Thomas.<br>**Issue #16 (`[QA] PR #12`):** Certificación del motor Kardex de Julio.<br>**Issue #24 (`[QA] PR #17`):** Certificación funcional de vistas de login, registro Ley 1581 y Navbar Storefront de Exneider.<br>**Issue #28 (`[QA] PR #26`):** Certificación del Comprobante POS 80 mm y Telegram de Thomas.<br>**Issue #32 (`[QA] PR #29`):** Certificación de la Guía de Diseño y Bento Grid Storefront de Sofía.<br>**Issue #33 (`[QA] PR #30`):** Certificación de la Terminal POS Mostrador CA-53 de Sofía.<br>**Issue #34 (`[QA] PR #27`):** Certificación del Catálogo Storefront, Filtros y Variantes de Exneider.<br>**Issue #35 (`[QA] PR #31`):** Certificación de Sedes y Desactivación Segura de Yeimer.<br>**Issue #41 (`SP2-07`):** Matriz de pruebas de concurrencia y certificación Sprint 2.<br>**Issue #43 (`[QA] PR #42`):** Certificación del Motor Canónico de Descuentos de Julio.<br>**Issue #45 (`[QA] PR #44`):** Certificación de Traslados y Retorno a Central de Julio.<br>**Issue #48 (`[QA] PR #47`):** Certificación de Algoritmo DANE y Checkout Web de Julio.<br>**Issue #51 (`[QA] PR #50`):** Certificación de Worker Expiración TTL de Reservas Web de Julio. |
| **Sofía** | Diseñadora UX/UI & Prototipado | **En Progreso Sprint 2** | **PR #29 (`SP1-08`):** Fusionado en `develop`. Guía de diseño, tokens `docs/design/`, `BentoGridHero` y `CartDrawer`. QA Gate en Issue #32.<br>**PR #30 (`SP1-06`):** Fusionado en `develop`. Terminal POS Mostrador (`CA-53`) con atajos F12/F2/Esc y cálculo de vuelto. QA Gate en Issue #33.<br>**Issue #40 (`SP2-06`):** Prototipos UX/UI de Inventarios, Compras y Recepción con Novedades en diseño. |
| **Exneider** | Frontend Lead (React + Tailwind) | **En Progreso Sprint 2** | **PR #17 (`SP1-05`):** Fusionado en `develop` (Login, Registro Ley 1581, Navbar).<br>**PR #27 (`SP1-09`):** Fusionado en `develop` (Catálogo público, filtros por categoría, selector de variantes, badge cosméticos y stock web `RN-WEB-02`).<br>**Issue #39 (`SP2-05`):** Panel Administrativo de Inventario, Compras y Traslados en `AdminLayout` en desarrollo. |
| **Yeimer** | Backend Junior (Soporte) | **En Progreso Sprint 2** | **PR #31 (`SP1-03`):** Fusionado en `develop` (Gestión de sedes, Bodega Central única y 5 condiciones `RN-UBI-05`). Issue #3 cerrado. QA Gate en Issue #35.<br>**Issue #36 (`SP2-02`):** Módulo de Compras a Proveedor en Bodega Central con Idempotencia en desarrollo. |

---

## 2. Registro Cronológico de Hitos Alcanzados

| Fecha | Hito Superado | Responsable | Aprobado por QA / GitFlow | Estado |
| :--- | :--- | :--- | :--- | :--- |
| **2026-11-02** | **Fase 0 Concluida:** Especificación v2.1, 27 notas atómicas en Obsidian Vault, Indexación QMD y Harness configurado. | Julio | Verificado | **COMPLETADO [x]** |
| **2026-11-02** | **Modelo Híbrido de Identidad:** Soporte para inicio de sesión tradicional y Google OAuth en `schema.prisma`. | Julio | Verificado | **COMPLETADO [x]** |
| **2026-11-02** | **Sprint 0 Concluido:** Base de datos Supabase migrada (35 modelos), constraints SQL nativos y seed DANE base. | Julio / Yeimer | Verificado | **COMPLETADO [x]** |
| **2026-11-02** | **Hito SP1-01:** Middleware Auth JWT + Caché en memoria `UserPermissionCache` en $O(1)$ con revocación instantánea (`CA-50`). 13 tests en verde. | Julio | PR #9 Fusionado en `develop` | **COMPLETADO [x]** |
| **2026-11-02** | **Hito SP1-02:** Endpoints de autenticación híbrida (`/api/auth/login`, `/api/auth/registro-cliente`, `/api/auth/google`, `/api/auth/me`), consentimiento Ley 1581 y bloqueo de 15 min al 5.° fallo (`RF-USU-02`). 17 tests en verde. | Julio | PR #10 Fusionado en `develop` | **COMPLETADO [x]** |
| **2026-11-02** | **Hito SP1-04:** Catálogo semilla por SKU en `prisma/seed.ts` (4 categorías base, cosméticos `reintegrableEnDevolucion: false`, variantes con SKUs únicos y precios enteros COP `RN-CAT-01 a 04`). Probado en vivo contra Supabase. | Thomas | PR #13 Fusionado en `develop` | **COMPLETADO [x]** |
| **2026-11-03** | **Blindaje Hotfix SP1-02:** Incremento atómico en `intentosFallidosLogin` (anti race conditions), protección anti-takeover en Google OAuth para staff (`403 Forbidden`) y JWT HS256 con secret >= 32 chars. 19 tests en verde. | Julio | PR #18 Fusionado en `develop` | **COMPLETADO [x]** |
| **2026-11-03** | **Hito SP2-01 (Adelanto Sprint 2):** Motor Kardex Centralizado (`InventoryLedgerService.ts`), Bloqueo pesimista `SELECT ... FOR UPDATE`, Orden canónico anti-deadlock `varianteId ASC` (`RNF-003`), worker de reservas blindado contra pedidos en custodia (`tieneReservaActiva`) y serialización BigInt JSON. 59 tests en verde. | Julio | PR #12 Fusionado en `develop` | **COMPLETADO [x]** |
| **2026-11-03** | **Hito SP1-05:** PR #17 de Exneider fusionado en `develop`. Vistas de Login, Registro Ley 1581 y Navbar Storefront. Gate de QA creado en Issue #24. | Exneider / Julio | PR #17 Fusionado en `develop` | **COMPLETADO [x]** |
| **2026-11-03** | **Hito SP3-05:** PR #26 de Thomas fusionado en `develop`. Plantilla de comprobante de venta POS 80 mm y recibo digital Telegram con leyenda legal `RN-VTA-10`. Gate de QA creado en Issue #28. | Thomas / Julio | PR #26 Fusionado en `develop` | **COMPLETADO [x]** |
| **2026-11-04** | **Hito SP1-08:** PR #29 de Sofía fusionado en `develop` (commit `5b10a62`). Guía de diseño, tokens en `docs/design/`, `BentoGridHero.tsx`, `CartDrawer.tsx`, 4 tests unitarios. Gate de QA creado en Issue #32. | Sofía / Julio | PR #29 Fusionado en `develop` | **COMPLETADO [x]** |
| **2026-11-04** | **Hito SP1-06:** PR #30 de Sofía fusionado en `develop` (commit `0b2a2a1`). Terminal POS Mostrador ergonómica (`CA-53`) con `h-screen overflow-hidden`, atajos F12/F2/Esc, teclado numérico táctil 3x4, cambio/vuelto destacado y 5 tests unitarios. Gate de QA creado en Issue #33. | Sofía / Julio | PR #30 Fusionado en `develop` | **COMPLETADO [x]** |
| **2026-11-04** | **Hito SP1-09:** PR #27 de Exneider fusionado en `develop` (commit `fa1632e`). Catálogo público Storefront, filtros por categoría `RN-CAT-01`, modal de variantes `RN-CAT-03`, semáforo cualitativo `RN-WEB-02`, alerta de cosméticos `RN-CAT-02` y 6 tests unitarios. Gate de QA creado en Issue #34. | Exneider / Julio | PR #27 Fusionado en `develop` | **COMPLETADO [x]** |
| **2026-11-04** | **Hito SP1-03:** PR #31 de Yeimer fusionado en `develop` (commit `1c28b00`). Endpoints de gestión de sedes físicas, Bodega Central única (`RN-UBI-01`, `03`), blindaje de Zod partial, protección contra degradación de Central y desactivación segura bajo 5 condiciones de `RN-UBI-05` con lock pesimista. 16 tests unitarios. Gate de QA creado en Issue #35. | Yeimer / Julio | PR #31 Fusionado en `develop` | **COMPLETADO [x]** |
| **2026-11-04** | **Hito SP3-03:** PR #42 de Julio fusionado en `develop` (commit `0158264`). Motor canónico de descuentos y prorrateo exacto (`DiscountEngine.ts`, `RN-DES-09`), truncamiento a $0 COP (`RN-DES-07`), control de topes de vendedor (`RN-DES-05`) y 8 tests unitarios. Gate de QA creado en Issue #43. | Julio | PR #42 Fusionado en `develop` | **COMPLETADO [x]** |
| **2026-11-04** | **Hito SP2-03:** PR #44 de Julio FUSIONADO en `develop` (commit `dba8d74`). Máquina de estados de traslados (`SOLICITADO` → `APROBADO` → `ENVIADO`), resta de stock en Central (`InventoryLedgerService`), mercancía en tránsito, cancelación con flujo `RETORNANDO_A_CENTRAL` y confirmación de reingreso físico (`CA-04`, `CA-05`, `CA-09`, `CA-59`, `QA-012`). 17 tests unitarios. Gate de QA creado en Issue #45. | Julio | PR #44 Fusionado en `develop` | **COMPLETADO [x]** |
| **2026-11-04** | **Hito SP4-01:** PR #47 de Julio abierto y auditado en `develop` (commit `e7dbac0`). Motor determinista DANE (`DaneShippingCalculator.ts`), selección canónica de tienda despachadora sin envíos divididos (`OrderAssignmentEngine.ts`, `CA-35`, `CA-36`), checkout atómico con reserva blanda en Kardex (`CA-38`), TTL 24h para transferencias (`CA-39`) e idempotencia (`RN-GEN-08`). 21 tests unitarios dedicados (123 tests totales). Gate de QA creado en Issue #48. | Julio | PR #47 Abierto y Auditado | **LISTO PARA MERGE [x]** |
| **2026-11-04** | **Hito SP4-02:** PR #50 de Julio abierto y verificado (commit `94cdafe`). Worker periódico de expiración TTL de reservas web (`WebOrderTtlWorker.ts`), consulta con `FOR UPDATE SKIP LOCKED` (`CA-39`, `QA-015`), liberación atómica de stock blando en Kardex (`LIBERACION_RESERVA_WEB`), endpoint administrativo y 10 tests unitarios dedicados (133 tests totales). Gate de QA creado en Issue #51. | Julio | PR #50 Abierto y Verificado | **LISTO PARA AUDITORÍA [x]** |

---

## 3. Estado de los Sprints y Porcentajes de Avance

### Sprint 0: Fundación de Base de Datos y Catálogos Base
**Objetivo:** Conexión Supabase, 35 modelos en `schema.prisma`, constraints SQL nativos y catálogos DANE.
- **Progreso del Sprint 0:** `100%` [██████████] (6/6 tareas completadas)

---

### Sprint 1: Identidad, Sedes y Catálogo
**Objetivo:** Autenticación completa, matriz de 11 permisos, gestión de sedes físicas y carga inicial del catálogo con variantes por SKU.

- [x] **SP1-01 (Julio):** Middleware Auth JWT + Caché en memoria `UserPermissionCache` ($O(1)$) y revocación (`CA-50`). *(PR #9 Merged)*
- [x] **SP1-02 (Julio):** Endpoints de Autenticación Híbrida y Bloqueo de Intentos (`RF-USU-01`, `02`, `RN-ROL-06`). *(PR #10 y Hotfix PR #18 Merged)*
- [x] **SP1-03 (Yeimer):** Endpoints de Gestión de Puntos de Venta y Desactivación Segura (`RN-UBI-05`). *(PR #31 Merged - Issue #3 Closed / QA Issue #35)*
- [x] **SP1-04 (Thomas - Issue #T2):** Carga Semilla del Catálogo por SKU (`RN-CAT-01` a `04`). *(PR #13 Merged - Issue #4 Closed / QA Issue #15)*
- [x] **SP1-05 (Exneider):** Vistas de Autenticación, Registro Ley 1581 y Navbar Storefront. *(PR #17 Merged - Issue #24 en manos de Duvan)*
- [x] **SP1-06 (Sofía):** Prototipos UX/UI de la Terminal POS en Pantalla Mostrador (`CA-53`). *(PR #30 Merged - Issue #33 en manos de Duvan)*
- [ ] **SP1-07 (Duvan):** QA Gate Sprint 1: Certificación de Seguridad y Permisos (`QA-001`, `QA-022`). *(Issue #7)*
- [x] **SP1-08 (Sofía):** Guía de Diseño y Sistema Visual Multi-Portal (Apple Liquid Glass UI). *(PR #29 Merged - Issue #32 en manos de Duvan)*
- [x] **SP1-09 (Exneider):** Catálogo Público de Productos, Filtros por Categoría y Selector de Variantes (Storefront). *(PR #27 Merged - Issue #34 en manos de Duvan)*

**Progreso del Sprint 1:** `88.9%` [█████████░] (8/9 tareas de desarrollo completadas en `develop`)

---

### Sprint 2: Inventario, Compras y Traslados
**Objetivo:** Motor de consistencia de stock con Kardex append-only, órdenes canónicas anti-deadlock, compras simplificadas a proveedores y traslados seguros entre sedes.

- [x] **SP2-01 (Julio):** Motor Kardex Centralizado con Bloqueo Pesimista `FOR UPDATE` y Orden Canónico (`RF-INV-01`, `RN-GEN-02`, `RNF-003`). *(PR #12 Merged - Issue #11 Closed / QA Issue #16)*
- [ ] **SP2-02 (Yeimer):** Módulo de Compras a Proveedor en Bodega Central con Idempotencia (`RF-COM-01`, `02`). *(Issue #36)*
- [x] **SP2-03 (Julio):** Traslados entre Ubicaciones y Flujo Retornando a Central (`RF-TRA-01 a 04`). *(PR #44 FUSIONADO en `develop` - Issue #37 Closed / QA Issue #45)*
- [ ] **SP2-04 (Julio):** Recepción de Traslados y Control de Dañados/Novedades (`RF-TRA-05`, `06`). *(Issue #38)*
- [ ] **SP2-05 (Exneider):** Panel Administrativo de Inventario, Compras y Traslados en AdminLayout (`RF-INV-02`). *(Issue #39)*
- [ ] **SP2-06 (Sofía):** Prototipos UX/UI de Inventarios, Compras y Recepción con Novedades (`ARQ-06`). *(Issue #40)*
- [ ] **SP2-07 (Duvan):** QA Gate Sprint 2: Pruebas de Concurrencia, Traslados e Idempotencia (`QA-003`). *(Issue #41)*

**Progreso del Sprint 2:** `28.6%` [███░░░░░░░] (2/7 tareas completadas en `develop`: SP2-01 y SP2-03)

---

### Sprint 3: Caja, Terminal POS, Descuentos y Devoluciones
**Objetivo:** Operación de caja física, comprobantes térmicos, motor canónico de descuentos y terminal de cobro.

- [ ] **SP3-01 (Julio):** Sesiones de Caja, Base Contada, Guardián de Vigencia y Alertas Telegram (`RF-CAJ-01 a 03`).
- [ ] **SP3-02 (Julio):** Confirmación Atómica de Venta POS con Preempción de Reservas Web Blandas (`RF-POS-02`).
- [x] **SP3-03 (Julio):** Motor Canónico de Descuentos y Prorrateo Exacto (`DiscountEngine.ts`, `RN-DES-09`, `CA-19` a `25`). *(PR #42 Merged - Issue #23 Closed / QA Issue #43)*
- [ ] **SP3-04 (Julio):** Anulaciones del Día, Devoluciones con Plazo Raíz y Cambios a $0 (`RF-DEV-01 a 03`).
- [x] **SP3-05 (Thomas):** Plantilla de Comprobante de Venta POS (80 mm) y Recibo Digital Telegram (`RN-VTA-09`, `10`). *(PR #26 Merged - Issue #22 Closed / QA Issue #28)*
- [ ] **SP3-06 (Exneider):** Terminal POS Completa en PosLayout (`RF-POS-01`).
- [ ] **SP3-07 (Sofía):** Prototipos Catálogo Público Web y Checkout 3 Pasos.
- [ ] **SP3-08 (Duvan):** QA Gate Sprint 3: Pruebas de Venta, Preempción, Descuentos y Cortes de Caja.

**Progreso del Sprint 3:** `25.0%` [███░░░░░░░] (2/8 tareas completadas en `develop`: SP3-03 y SP3-05)

---

### Sprint 4: Tienda Web, Envíos DANE, Reservas TTL y Custodia Central
**Objetivo:** E-Commerce público, algoritmo determinista de despacho DANE, worker TTL, cuarentena de SKU y custodia en Central.

- [x] **SP4-01 (Julio):** Algoritmo Determinista DANE y Checkout Atómico de Pedidos Web (`RF-WEB-02`, `RF-WEB-03`, `CA-35 a 39`). *(PR #47 Abierto y Auditado al 100% - Issue #46 / QA Issue #48)*
- [x] **SP4-02 (Julio):** Worker Periódico de Expiración de Reservas TTL por Transferencia Vencida (`RF-WEB-04`, `CA-39`, `QA-015`). *(PR #50 Abierto y Verificado al 100% con 133 tests - Issue #49 / QA Issue #51)*
- [ ] **SP4-03 (Julio):** Flujo «No puedo despachar» con Flag `bloqueadoDespachoWeb` y Custodia Central (`RF-WEB-06`, `CA-43`, `CA-62`).
- [ ] **SP4-04 (Thomas):** Plantilla HTML de Correo Transaccional de Confirmación de Pedido y Seguimiento (`NotificacionPort`).
- [ ] **SP4-05 (Yeimer):** Integración `TelegramNotificationAdapter` y Envío de Alertas Web.
- [ ] **SP4-06 (Julio):** Retorno Logístico vs Devolución Comercial Web (`RF-WEB-07`, `RF-DEV-04`, `CA-64`, `CA-65`).
- [ ] **SP4-07 (Exneider):** Construcción de Tienda Web en `StorefrontLayout` (Checkout DANE y Mis Pedidos).
- [ ] **SP4-08 (Duvan):** QA Gate Sprint 4: Certificación de Reservas Web, Retornos Logísticos y Custodia Central.

**Progreso del Sprint 4:** `25.0%` [███░░░░░░░] (2/8 tareas listas y probadas: SP4-01 y SP4-02)

---

### Sprint 5: Reportes Financieros, Dashboard y Auditoría
**Objetivo:** Reporte inmutable de Ventas Netas, bitácora de auditoría de solo adición, centro de alertas y certificación final.
- **Progreso del Sprint 5:** `0.0%` [░░░░░░░░░░] (0/6 tareas)

---

## 4. Consolidado General del Proyecto
- **Total Entregables Principales:** 44 tareas.
- **Entregables Concluidos / Auditados:** 20 hitos superados.
- **Porcentaje de Avance Global del Proyecto:** `45.5%` [█████░░░░░]
