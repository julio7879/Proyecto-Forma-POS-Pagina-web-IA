# Tablero Vivo de Progreso y Estado de Sprints: Sistema POS + Tienda Web Forma

> **Estado Actual del Proyecto:** `EN DESARROLLO ACTIVO (FASE 3 CORE POS IMPLEMENTADA EN PR #71, FASE 2 Y 4 EN QA GATE)`  
> **Última Actualización Oficial:** `4 de Noviembre de 2026 - 18:40 COT`  
> **Hito Reciente:** Implementación completa y certificación de la tríada de Sprint 3 (PR #71: `SP3-01` Sesiones de Caja, `SP3-02` Venta POS Atómica con Preempción y `SP3-04` Devoluciones/Cambios) con 202 tests backend y 34 tests frontend en verde. Correcciones de Exneider en PR #60 (`SP2-05`) aprobadas y compuerta QA #73 abierta. Issue #74 (`SP4-05`) asignada a Yeimer.  
> **Documentos de Referencia:** [[PLAN-MAESTRO-SPRINTS]] | [[MATRIZ-ROLES-Y-TAREAS]] | [[Matriz-CA-01-a-CA-65]]

---

## 1. Resumen Ejecutivo de Avance Global

| Sprint / Fase | Objetivo Central | Tareas Totales | En Develop (Merged) | En PR / QA Gate | Estado Semáforo |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Fase 1 (Sprint 1)** | Identidad, Seguridad Híbrida, Sedes y Catálogo | 9 | 8 | 1 | 🟢 Estable (88.9% en develop) |
| **Fase 2 (Sprint 2)** | Kardex Centralizado, Compras y Traslados | 8 | 5 | 2 | 🟢 Avanzado (62.5% merged, 87.5% desarrollado) |
| **Fase 3 (Sprint 3)** | Caja, Terminal POS, Descuentos y Tickets | 9 | 2 | 4 | 🟡 En Desarrollo (55.6% desarrollado / en PR) |
| **Fase 4 (Sprint 4)** | E-Commerce, Despachos DANE, Worker TTL y Devoluciones | 8 | 5 | 1 | 🟢 Avanzado (62.5% merged) |
| **Fase 5 (Sprint 5)** | Reportes Financieros, Dashboard y Auditoría Final | 6 | 0 | 0 | ⚪ Planificado (0.0%) |
| **TOTAL** | **Sistema POS + Tienda Web Multisede** | **46** | **20** | **8** | **60.9% AVANCE GLOBAL** |

---

## 2. Mapa de Tareas por Responsable

```mermaid
pie title Distribución de Carga y Tareas Concluidas/En Proceso
    "Julio (Tech Lead / Backend)" : 15
    "Yeimer (Backend Dev)" : 6
    "Exneider (Frontend Lead)" : 8
    "Sofía (UI/UX Designer)" : 6
    "Thomas (Frontend / POS)" : 6
    "Duvan (QA Lead / Gate)" : 6
```

---

## 3. Detalle de Tareas por Sprint

### Sprint 1: Arquitectura Base, Identidad y Sedes
**Objetivo:** Autenticación híbrida, RBAC territorial, gestión de sedes con blindaje y catálogo base.

- [x] **SP1-01 (Julio):** Esquema Canónico de Base de Datos PostgreSQL / Prisma (`RN-GEN-01 a 08`, `RNF-001 a 009`). *(PR #2 Merged)*
- [x] **SP1-02 (Julio):** Módulo de Autenticación Híbrida y Protección contra Fuerza Bruta (`RF-USU-01`, `RF-USU-02`, `RN-ROL-06 a 08`). *(PR #4 Merged)*
- [x] **SP1-03 (Yeimer):** Módulo de Sedes y Bodega Central con 5 Condiciones de Desactivación (`RN-UBI-01 a 05`). *(PR #31 Merged)*
- [x] **SP1-04 (Julio):** Middleware de Autorización RBAC con Caché en Memoria e Invalidador Instantáneo (`RN-ROL-01 a 05`, `CA-50`). *(PR #10 Merged)*
- [x] **SP1-05 (Exneider):** Vistas de Autenticación Storefront en StorefrontLayout (`ARQ-05`). *(PR #17 Merged - Issue #15 en manos de Duvan)*
- [x] **SP1-06 (Sofía):** Prototipos UX/UI de la Terminal POS en Pantalla Mostrador (`CA-53`). *(PR #30 Merged - Issue #33 en manos de Duvan)*
- [ ] **SP1-07 (Duvan):** QA Gate Sprint 1: Certificación de Seguridad y Permisos (`QA-001`, `QA-022`). *(Issue #7)*
- [x] **SP1-08 (Sofía):** Guía de Diseño y Sistema Visual Multi-Portal (Apple Liquid Glass UI). *(PR #29 Merged - Issue #32 en manos de Duvan)*
- [x] **SP1-09 (Exneider):** Catálogo Público de Productos, Filtros por Categoría y Selector de Variantes (Storefront). *(PR #27 Merged - Issue #34 en manos de Duvan)*

**Progreso del Sprint 1:** `88.9%` [█████████░] (8/9 tareas de desarrollo completadas en `develop`)

---

### Sprint 2: Inventario, Compras y Traslados
**Objetivo:** Motor de consistencia de stock con Kardex append-only, órdenes canónicas anti-deadlock, compras simplificadas a proveedores y traslados seguros entre sedes.

- [x] **SP2-01 (Julio):** Motor Kardex Centralizado con Bloqueo Pesimista `FOR UPDATE` y Orden Canónico (`RF-INV-01`, `RN-GEN-02`, `RNF-003`). *(PR #12 Merged - Issue #11 Closed)*
- [x] **SP2-02 (Yeimer):** Módulo de Compras a Proveedor en Bodega Central con Idempotencia (`RF-COM-01`, `02`). *(PR #66 Abierto - Auditado 🟢 - QA Gate Issue #67)*
- [x] **SP2-03 (Julio):** Traslados entre Ubicaciones y Flujo Retornando a Central (`RF-TRA-01 a 04`). *(PR #44 FUSIONADO en `develop` - Issue #37 Closed)*
- [x] **SP2-04 (Julio):** Recepción de Traslados y Control de Dañados/Novedades (`RF-TRA-05`, `06`). *(PR #64 FUSIONADO en `develop` - Issue #38 Closed)*
- [x] **SP2-05 (Exneider):** Panel Administrativo de Inventario, Compras y Traslados en AdminLayout (`RF-INV-02`). *(PR #60 Abierto - Correcciones Aprobadas 🟢 - QA Gate Issue #73)*
- [ ] **SP2-06 (Sofía):** Prototipos UX/UI de Inventarios, Compras y Recepción con Novedades (`ARQ-06`). *(Issue #40)*
- [x] **SP2-07 (Duvan):** QA Gate Sprint 2: Matriz de Concurrencia, Traslados e Idempotencia (`QA-003`). *(PR #61 FUSIONADO en `develop` - Issue #41)*
- [ ] **SP2-08 (Thomas):** Interfaz y Modal de Recepción de Traslados en Punto de Venta con Checklist de Novedades y Dañados (`RF-TRA-05`, `CA-07`, `CA-08`). *(Issue #58)*

**Progreso del Sprint 2:** `62.5%` merged en `develop` (5/8) y `87.5%` con PR en QA Gate (7/8).

---

### Sprint 3: Caja, Terminal POS, Descuentos y Devoluciones
**Objetivo:** Operación de caja física, comprobantes térmicos, motor canónico de descuentos, preempción física y terminal de cobro.

- [x] **SP3-01 (Julio):** Sesiones de Caja, Base Contada, Movimientos Manuales y Cierre Ciego con Fórmula Integral (`RF-CAJ-01 a 03`, `CA-15`, `CA-55`, `CA-56`, `QA-008`). *(PR #71 Abierto - QA Gate Issue #72)*
- [x] **SP3-02 (Julio):** Confirmación Atómica de Venta POS con Preempción de Reservas Web Blandas y Protección de Reserva Dura (`RF-POS-02`, `CA-60`, `CA-61`, `QA-004`, `QA-005`). *(PR #71 Abierto - QA Gate Issue #72)*
- [x] **SP3-03 (Julio):** Motor Canónico de Descuentos y Prorrateo Exacto (`DiscountEngine.ts`, `RN-DES-09`, `CA-19` a `25`). *(PR #42 Merged - Issue #23 Closed)*
- [x] **SP3-04 (Julio):** Devoluciones con Plazo Raíz de 5 Días, Sobreescritura PIN Admin, Cuarentena No Vendible, Excepción Iliquidez y Cambios Atómicos (`RF-DEV-01 a 03`, `CA-26`, `CA-27`, `CA-30`, `CA-31`, `CA-54`, `CA-63`, `QA-017`, `QA-019`). *(PR #71 Abierto - QA Gate Issue #72)*
- [x] **SP3-05 (Thomas):** Plantilla de Comprobante de Venta POS (80 mm) y Recibo Digital Telegram (`RN-VTA-09`, `10`). *(PR #26 Merged - Issue #22 Closed)*
- [ ] **SP3-06 (Exneider):** Terminal POS Completa en PosLayout con Integración de Cobro y Comprobante (`RF-POS-01`). *(Issue #62 Asignado)*
- [ ] **SP3-07 (Sofía):** Prototipos Catálogo Público Web y Checkout 3 Pasos.
- [ ] **SP3-08 (Duvan):** QA Gate Sprint 3: Pruebas de Venta, Preempción, Descuentos y Cortes de Caja.
- [ ] **SP3-09 (Thomas):** Modal de Cobro Rápido y Teclado Numérico Táctil con Cálculo de Cambio para Terminal POS (`RF-POS-01`, `CA-51`, `CA-52`). *(Issue #59 Asignado)*

**Progreso del Sprint 3:** `22.2%` merged en `develop` (2/9) y `55.6%` desarrollado / en PR (5/9: SP3-01, SP3-02, SP3-03, SP3-04, SP3-05).

---

### Sprint 4: Tienda Web, Envíos DANE, Reservas TTL y Custodia Central
**Objetivo:** E-Commerce público, algoritmo determinista de despacho DANE, worker TTL, cuarentena de SKU, custodia en Central y retornos logísticos.

- [x] **SP4-01 (Julio):** Algoritmo Determinista DANE y Checkout Atómico de Pedidos Web (`RF-WEB-02`, `RF-WEB-03`, `CA-35 a 39`). *(PR #47 Merged en `develop` - Issue #46)*
- [x] **SP4-02 (Julio):** Worker Periódico de Expiración de Reservas TTL por Transferencia Vencida (`RF-WEB-04`, `CA-39`, `QA-015`). *(PR #50 FUSIONADO en `develop` - Issue #49 Closed)*
- [x] **SP4-03 (Julio):** Flujo «No puedo despachar» con Flag `bloqueadoDespachoWeb` y Custodia Central (`RF-WEB-06`, `CA-43`, `CA-62`). *(PR #53 FUSIONADO en `develop` - Issue #52 Closed)*
- [ ] **SP4-04 (Thomas):** Plantilla HTML de Correo Transaccional de Confirmación de Pedido y Seguimiento (`NotificacionPort`).
- [ ] **SP4-05 (Yeimer):** Integración `TelegramNotificationAdapter` y Envío de Alertas Web (`NotificacionPort`). *(Issue #74 Asignado)*
- [x] **SP4-06 (Julio):** Retorno Logístico vs Devolución Comercial Web (`RF-WEB-07`, `RF-DEV-04`, `CA-64`, `CA-65`, `QA-020`, `QA-021`). *(PR #56 FUSIONADO en `develop` - Issue #55 Closed)*
- [ ] **SP4-07 (Exneider):** Construcción de Tienda Web en `StorefrontLayout` (Checkout DANE y Mis Pedidos).
- [ ] **SP4-08 (Duvan):** QA Gate Sprint 4: Certificación de Reservas Web, Retornos Logísticos y Custodia Central.

**Progreso del Sprint 4:** `62.5%` [██████░░░░] (5/8 tareas completadas y fusionadas en `develop`)

---

### Sprint 5: Reportes Financieros, Dashboard y Auditoría
**Objetivo:** Reporte inmutable de Ventas Netas, bitácora de auditoría de solo adición, centro de alertas y certificación final.
- **Progreso del Sprint 5:** `0.0%` [░░░░░░░░░░] (0/6 tareas planificadas)

---

## 4. Consolidado General del Proyecto
- **Total Entregables Principales:** 46 tareas.
- **Entregables Concluidos en `develop`:** 20 hitos fusionados.
- **Entregables con PR / en QA Gate Activo:** 8 tareas (`SP1-07`, `SP2-02`, `SP2-05`, `SP3-01`, `SP3-02`, `SP3-04`, `SP3-06`, `SP3-09`).
- **Total Tests Automatizados:** **236 tests** (202 backend + 34 frontend) en verde.
- **Porcentaje de Avance Global del Proyecto:** `60.9%` [██████░░░░]
