---
id: PROGRESO-ACTUAL
tags: [estado, sprints, generado, backlog]
generado_por: scripts/gen-progress.mjs
fuente: docs/vault/05-Estado-Sprints/backlog.yaml
fecha_corte: 2026-11-10
commit: 20fd212
---

# Tablero Vivo de Progreso y Estado de Sprints

> **Generado automáticamente. No editar a mano.**
> Fuente única: `docs/vault/05-Estado-Sprints/backlog.yaml`.
> Corte: **2026-11-10** · Commit: `20fd212` · Rama: `test/sandbox-testeo`.
> Operación: **1 persona** · Flujo: `test/sandbox-testeo → main`.

## 1. Resumen global

| Métrica | Valor |
| :--- | ---: |
| Tareas totales | **46** |
| Hechas con evidencia | **27** |
| En curso | **2** |
| Declaradas sin evidencia | **5** |
| Pendientes | **12** |
| Avance verificado | **58.7 %** ██████░░░░ |
| Avance con declaradas | **69.6 %** ███████░░░ |

> `Declarado` significa que el tablero anterior lo daba por certificado, pero no hay PR, commit ni salida de test reproducible. **No cuenta como hecho.**

## 2. Resumen por sprint

| Sprint | Tareas | Hechas | En curso | Declaradas | Pendientes | Avance verificado |
| :--- | ---: | ---: | ---: | ---: | ---: | :--- |
| **Sprint 0** — Fundación, datos y utilidades | 6 | 3 | 0 | 1 | 2 | **50.0 %** █████░░░░░ |
| **Sprint 1** — Identidad, sedes y catálogo | 9 | 7 | 0 | 1 | 1 | **77.8 %** ████████░░ |
| **Sprint 2** — Kardex, compras y traslados | 8 | 5 | 1 | 1 | 1 | **62.5 %** ██████░░░░ |
| **Sprint 3** — Caja, POS, descuentos y devoluciones | 9 | 7 | 0 | 1 | 1 | **77.8 %** ████████░░ |
| **Sprint 4** — Tienda web, DANE y reservas | 8 | 4 | 1 | 0 | 3 | **50.0 %** █████░░░░░ |
| **Sprint 5** — Reportes, dashboard y certificación | 6 | 1 | 0 | 1 | 4 | **16.7 %** ██░░░░░░░░ |

## 3. Detalle por sprint

### Sprint 0 — Fundación, datos y utilidades

| ID | Tarea | Responsable | Estado | Evidencia |
| :--- | :--- | :--- | :---: | :--- |
| **SP0-01** | Conectar Supabase, configurar Prisma y correr migración inicial | Julio | ✅ Hecho | schema.prisma con 35 modelos y 2 migraciones que crean 35 tablas |
| **SP0-02** | Aplicar constraints SQL nativas | Julio | ✅ Hecho | backend/prisma/constraints_post_migrate.sql |
| **SP0-03** | Catálogo DANE y tarifas de Zonas 1 a 4 | Thomas | ⚪ Pendiente | la ruta declarada backend/src/shared/seeds/daneCatalog.ts no existe |
| **SP0-04** | Validar MoneyCOP y ColombiaTime | Yeimer | ✅ Hecho | MoneyCOP.test.ts y ColombiaTime.test.ts en verde |
| **SP0-05** | Wireframes y guía visual de los 3 portales | Sofía | 🟠 Declarado | docs/design y ARQ-06 existen; no hay Figma enlazado |
| **SP0-06** | QA Gate de constraints de base de datos | Duvan | ⚪ Pendiente | sin registro de ejecución |

### Sprint 1 — Identidad, sedes y catálogo

| ID | Tarea | Responsable | Estado | Evidencia |
| :--- | :--- | :--- | :---: | :--- |
| **SP1-01** | Middleware JWT y cache de permisos con invalidación | Julio | ✅ Hecho | authPermission.ts y authPermission.test.ts |
| **SP1-02** | Auth híbrida correo/contrasena y Google OAuth con bloqueo | Julio | ✅ Hecho | authRoutes.test.ts y modulo 01-identidad |
| **SP1-03** | Gestión de sedes y 5 condiciones de desactivación | Yeimer | ✅ Hecho | modulo 02-ubicaciones y PR #31 |
| **SP1-04** | Seed de categorías, productos y variantes | Thomas | ✅ Hecho | backend/prisma/seed.ts y catalogSeedData.ts |
| **SP1-05** | Login, registro Ley 1581 y navbar del storefront | Exneider | ✅ Hecho | LoginForm, RegisterForm y PR #17 |
| **SP1-06** | Prototipo de terminal POS en mostrador | Sofía | 🟠 Declarado | PR #30 citado; no hay prototipo enlazado |
| **SP1-07** | QA Gate Sprint 1 de seguridad y permisos | Duvan | ⚪ Pendiente | Issue #7 sin cierre |
| **SP1-08** | Guia de diseño y sistema visual multi-portal | Sofía | ✅ Hecho | ARQ-06 y docs/design |
| **SP1-09** | Catálogo público del storefront con filtros y variantes | Exneider | ✅ Hecho | CatalogPage y PR #27 |

### Sprint 2 — Kardex, compras y traslados

| ID | Tarea | Responsable | Estado | Evidencia |
| :--- | :--- | :--- | :---: | :--- |
| **SP2-01** | InventoryLedgerService con bloqueo y orden anti-deadlock | Julio | ✅ Hecho | InventoryLedgerService.ts y suite de concurrencia |
| **SP2-02** | Compras a proveedor en Central con idempotencia | Yeimer | ✅ Hecho | PR #66 |
| **SP2-03** | Máquina de estados de traslados y retorno a Central | Julio | ✅ Hecho | PR #44 |
| **SP2-04** | Recepcion de traslados con dañados y novedades | Julio | ✅ Hecho | PR #64 |
| **SP2-05** | Panel admin de inventario, compras y traslados | Exneider | ✅ Hecho | PR #60 |
| **SP2-06** | Prototipos de arqueo de caja y cobro rápido | Sofía | ⚪ Pendiente | Issue #40 sin cierre |
| **SP2-07** | QA Gate Sprint 2 de concurrencia e idempotencia | Duvan | 🟠 Declarado | PR #61 citado; docs/qa/SP2-07 no tiene resultados |
| **SP2-08** | Modal de recepción de traslados en POS | Thomas | 🟡 En curso | Issue #58; componente existe sin certificación |

### Sprint 3 — Caja, POS, descuentos y devoluciones

| ID | Tarea | Responsable | Estado | Evidencia |
| :--- | :--- | :--- | :---: | :--- |
| **SP3-01** | Sesiones de caja, base contada y arqueo ciego | Julio | ✅ Hecho | PR #71 |
| **SP3-02** | Venta POS atomica con preempción de reservas blandas | Julio | ✅ Hecho | backend PR #71; la UI del POS aun opera en localStorage |
| **SP3-03** | Motor de descuentos y prorrateo exacto | Yeimer | ✅ Hecho | PR #42 y DiscountEngine.test.ts |
| **SP3-04** | Devoluciones con plazo raiz y cambios a cero | Julio | ✅ Hecho | PR #71 |
| **SP3-05** | Ticket POS de 80 mm y recibo digital por Telegram | Thomas | ✅ Hecho | PR #26 y TicketVentaPOS.tsx |
| **SP3-06** | Terminal POS completa en PosLayout | Exneider | ✅ Hecho | PosTerminalPage y suites POS en verde |
| **SP3-07** | Prototipos de catálogo público y checkout en 3 pasos | Sofía | ⚪ Pendiente | sin issue ni PR |
| **SP3-08** | QA Gate Sprint 3 de venta, descuentos y caja | Duvan | 🟠 Declarado | el tablero cita 50 tests que no existen en el archivo citado |
| **SP3-09** | Modal de cobro rápido y teclado táctil | Thomas | ✅ Hecho | PR #75 |

### Sprint 4 — Tienda web, DANE y reservas

| ID | Tarea | Responsable | Estado | Evidencia |
| :--- | :--- | :--- | :---: | :--- |
| **SP4-01** | Checkout atomico y algoritmo determinista DANE | Julio | ✅ Hecho | PR #47 |
| **SP4-02** | Worker periódico de expiracion de reservas TTL | Julio | 🟡 En curso | el codigo existe pero no se arranca desde server.ts |
| **SP4-03** | Flujo No puedo despachar y custodia en Central | Julio | ✅ Hecho | PR #53 |
| **SP4-04** | Plantilla HTML de correo transaccional de pedido | Thomas | ⚪ Pendiente | sin issue ni PR |
| **SP4-05** | Adaptador de notificaciones Telegram | Yeimer | ⚪ Pendiente | Issue #74 sin cierre |
| **SP4-06** | Retorno logístico vs devolución comercial web | Julio | ✅ Hecho | PR #56 |
| **SP4-07** | Rediseño canónico del storefront ARQ-07 | Exneider | ✅ Hecho | StorefrontLayout y componentes ARQ-07 |
| **SP4-08** | QA Gate Sprint 4 de reservas y retornos | Duvan | ⚪ Pendiente | sin issue ni PR |

### Sprint 5 — Reportes, dashboard y certificación

| ID | Tarea | Responsable | Estado | Evidencia |
| :--- | :--- | :--- | :---: | :--- |
| **SP5-01** | Reporte de Ventas Netas y exportación Excel | Julio | 🟠 Declarado | el tablero lo certifica pero no hay PR ni salida reproducible |
| **SP5-02** | Centro de alertas operativas | Yeimer | ⚪ Pendiente | sin issue ni PR; el tablero lo confunde con auditoría Kardex |
| **SP5-03** | Documentación de API y errores HTTP | Thomas | ⚪ Pendiente | Issue #T5 sin cierre |
| **SP5-04** | Dashboard ejecutivo con KPIs y auditoría | Exneider | ✅ Hecho | AdminDashboardPage y ARQ-08 |
| **SP5-05** | Revisión WCAG 2.2 AA de los 3 portales | Sofía | ⚪ Pendiente | sin issue ni PR |
| **SP5-06** | QA Gate final de 65 CA y 25 QA | Duvan | ⚪ Pendiente | sin evidencia de ejecución |

## 4. Cómo regenerar

```bash
node scripts/gen-progress.mjs
node scripts/gen-progress.mjs --check
```

El segundo comando falla si este archivo no coincide con `backlog.yaml`; sirve para CI.

_Total: 46 tareas · 27 hechas · 2 en curso · 5 declaradas · 12 pendientes._
