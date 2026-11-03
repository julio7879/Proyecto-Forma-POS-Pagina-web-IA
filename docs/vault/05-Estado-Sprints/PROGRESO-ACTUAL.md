---
id: ESTADO-SPRINTS
tags: [progreso, sprints, checkpoint, hitos, equipo, gitflow]
---
# Dashboard de Progreso del Proyecto y Registro de Hitos (Live Tracker)

- **Repositorio Oficial:** [`Proyecto-Forma-POS-Pagina-web-IA`](https://github.com/julio7879/Proyecto-Forma-POS-Pagina-web-IA.git)
- **Metodología:** GitFlow (`main`, `develop`, `feature/*`, `bugfix/*`, `release/*`)
- **Documentos de Referencia:** [[PLAN-MAESTRO-SPRINTS]] | [[MATRIZ-ROLES-Y-TAREAS]] | [[Matriz-CA-01-a-CA-65]]
- **Líder del Proyecto:** Julio (@julio7879)
- **Última actualización:** 3 de noviembre de 2026 (11:15 COT)

---

## 1. Equipo de Trabajo y Estado de Carga

| Integrante | Rol en el Proyecto | Estado Actual | Tareas Activas / Asignadas |
| :--- | :--- | :--- | :--- |
| **Julio** | Líder de Proyecto & Backend Senior | **Sprint 1 Blindado · Motor Kardex Fusionado** | **PR #18 fusionado en `develop`** (blindaje hotfix SP1-02). **PR #12 fusionado en `develop`** (motor Kardex con orden canónico y bloqueo pesimista). Tarea de QA en Issue #16.<br>**Issue #23 (`SP3-03`):** Asignado para construir el motor canónico de descuentos `DiscountEngine.ts`. |
| **Thomas** | Junior Backend & Frontend (Tareas Acotadas) | **Activo en Fase 3** | **PR #13 fusionado en `develop`** e Issue #4 cerrado (`Done`).<br>**Issue #22 (`SP3-05`):** Asignado para diseñar la plantilla de Comprobante POS 80 mm y recibo digital Telegram. |
| **Duvan** | QA Lead & Auditor de Criterios CA | En Progreso | **Issue #7 (`SP1-07`):** Fase 1 de diseño de matriz de pruebas.<br>**Issue #15 (`[QA] PR #13`):** Certificación del catálogo semilla de Thomas.<br>**Issue #16 (`[QA] PR #12`):** Certificación del motor Kardex de Julio.<br>**Issue #24 (`[QA] PR #17`):** Certificación funcional de vistas de login, registro Ley 1581 y Navbar Storefront. |
| **Sofía** | Diseñadora UX/UI & Prototipado (0% Código) | En Progreso | **Issue #6 (`SP1-06`):** Prototipos POS Mostrador (`CA-53`).<br>**Issue #8 (`SP1-08`):** Guía de diseño y sistema visual multi-portal en Figma. |
| **Exneider** | Frontend Lead (React + Tailwind) | Aprobado (En QA Gate) | **PR #17:** Aprobado técnicamente (`APPROVED`, commit `fc1ca63`) con 27/27 casos resueltos, 8/8 tests en verde y build Tailwind exitoso. Asignado a Duvan en Issue #24.<br>**Issue #5 (`SP1-05`):** Implementación completa en espera de certificación final. |
| **Yeimer** | Backend Junior (Soporte) | Listo para Construcción | **Issue #3 (`SP1-03`):** Enriquecido con contrato DoR completo de `MOD-02`, DTOs de validación Zod y las 5 condiciones de `RN-UBI-05`. |

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
| **2026-11-03** | **Aprobación Técnica SP1-05:** PR #17 de Exneider aprobado (`APPROVED`, commit `fc1ca63`), 27/27 casos resueltos, suite Vitest 8/8 y compilación con Tailwind impecable. Sincronización con `develop` completada sin conflictos. | Exneider / Julio | Aprobado (QA Gate en Issue #24) | **LISTO PARA QA [x]** |

---

## 3. Estado de los Sprints

### Sprint 1: Identidad, Sedes y Catálogo
**Objetivo:** Autenticación completa, matriz de 11 permisos, gestión de sedes físicas y carga inicial del catálogo con variantes por SKU.

- [x] **SP1-01 (Julio):** Middleware Auth JWT + Caché en memoria `UserPermissionCache` ($O(1)$) y revocación (`CA-50`). *(PR #9 Merged)*
- [x] **SP1-02 (Julio):** Endpoints de Autenticación Híbrida y Bloqueo de Intentos (`RF-USU-01`, `02`, `RN-ROL-06`). *(PR #10 y Hotfix PR #18 Merged)*
- [ ] **SP1-03 (Yeimer):** Endpoints de Gestión de Puntos de Venta y Desactivación Segura (`RN-UBI-05`). *(En desarrollo por Yeimer - Issue #3)*
- [x] **SP1-04 (Thomas - Issue #T2):** Carga Semilla del Catálogo por SKU (`RN-CAT-01` a `04`). *(PR #13 Merged - Issue #4 Closed)*
- [ ] **SP1-05 (Exneider):** Vistas de Autenticación, Registro Ley 1581 y Navbar Storefront. *(PR #17 Aprobado técnicamente - Issue #24 en manos de Duvan)*
- [ ] **SP1-06 (Sofía):** Prototipos UX/UI de la Terminal POS en Pantalla Mostrador (`CA-53`). *(Issue #6)*
- [ ] **SP1-07 (Duvan):** QA Gate Sprint 1: Certificación de Seguridad y Permisos (`QA-001`, `QA-022`). *(Issue #7)*
- [ ] **SP1-08 (Sofía):** Guía de Diseño y Sistema Visual Multi-Portal (Apple Liquid Glass UI, Tipografía y Paleta). *(Issue #8)*

**Progreso del Sprint 1:** `38%` [████░░░░░░] (3/8 tareas completadas)

---

### Sprint 2: Inventario, Compras y Traslados (Adelantado)
**Objetivo:** Motor de consistencia de stock con Kardex append-only, órdenes canónicas anti-deadlock, compras simplificadas a proveedores y traslados seguros entre sedes.

- [x] **SP2-01 (Julio):** Motor Kardex Centralizado con Bloqueo Pesimista `FOR UPDATE` y Orden Canónico (`RF-INV-01`, `RN-GEN-02`, `RNF-003`). *(PR #12 Merged - Issue #11 Closed / QA Issue #16)*
- [ ] **SP2-02 (Yeimer):** Módulo de Compras a Proveedor en Bodega Central con Idempotencia (`RF-COM-01`, `02`).
- [ ] **SP2-03 (Julio):** Traslados entre Ubicaciones (Solicitud, Aprobación, Despacho y Novedades de Recepción).
- [ ] **SP2-04 (Julio):** Recepción de Traslados y Control de Dañados/Novedades (`RF-TRA-05`, `06`).
- [ ] **SP2-05 (Exneider):** Módulo de Administración de Inventarios y Alertas de Stock Bajo.
- [ ] **SP2-06 (Sofía):** Prototipo UX/UI del Módulo de Inventarios y Recepción de Mercancía.
- [ ] **SP2-07 (Duvan):** QA Gate Sprint 2: Pruebas de Concurrencia, Simulación de Deadlocks e Idempotencia (`QA-003`).

**Progreso del Sprint 2:** `14%` [█░░░░░░░░░] (1/7 tareas completadas - Motor Kardex y Orden Canónico)

---

### Sprint 3: Caja, Terminal POS, Descuentos y Devoluciones (Apertura Temprana de Tareas Desacopladas)
**Objetivo:** Operación de caja física, comprobantes térmicos, motor canónico de descuentos y terminal de cobro.

- [ ] **SP3-03 (Julio):** Motor Canónico de Descuentos y Prorrateo Exacto (`DiscountEngine.ts`, `RN-DES-09`, `CA-19` a `25`). *(Issue #23)*
- [ ] **SP3-05 (Thomas):** Plantilla de Comprobante de Venta POS (80 mm) y Recibo Digital Telegram (`RN-VTA-09`, `10`). *(Issue #22)*

---

## 4. Próximos Pasos Inmediatos
1. **Duvan:** Certificar el catálogo en el Issue #15 (PR #13 de Thomas) y realizar las pruebas de concurrencia pesimista en el Issue #16 (PR #12 de Julio integrado en `develop`).
2. **Yeimer:** Iniciar desarrollo de la rama `feature/SP1-03-gestion-sedes-segura` para los endpoints de puntos de venta (`RN-UBI-05`) siguiendo el contrato DoR del Issue #3.
3. **Exneider:** Subir los ajustes al PR #17 resolviendo las 27 observaciones técnicas reportadas conforme al contrato DoR del Issue #5.
4. **Sofía:** Finalizar los prototipos de POS Mostrador (`SP1-06`) y la guía de diseño visual (`SP1-08`).
5. **Thomas:** Desarrollar la plantilla de ticket de venta 80 mm en `feature/SP3-05-comprobante-ticket-pos` (Issue #22).
6. **Julio:** Desarrollar el motor canónico de descuentos y pruebas unitarias en `feature/SP3-03-motor-descuentos-prorrateo` (Issue #23).
