---
id: MOC-00
tags: [indice, arquitectura, moc, grafo, qmd]
---
# Mapa Mental y MOC Central del Sistema POS + Tienda Web (v2.1)

Bienvenido a la biblioteca atómica indexada para **Obsidian** y **QMD MCP**.
Cada nota en este vault está autocontenida (50 a 140 líneas), cuenta con metadatos estructurados en **YAML frontmatter** y enlaces bidireccionales (`[[...]]`) para permitir a los agentes de IA (@Oraculo-Analista, @Forja-Backend, @Vitral-UI, @Sabueso-Hunter, @Juez-Esceptico y @Centinela-QA) consultar únicamente la información quirúrgica necesaria, ahorrando hasta un 96% de tokens.

---

## 0. Oficina de Agentes de IA y Lienzo Visual
- [[00-Oficina-Agentes-MOC]] — Arquitectura completa del escuadrón agéntico, asignación de 20+ skills y roles por departamento.
- [[Oficina-Agentes.canvas]] — Lienzo interactivo 2D (Obsidian Canvas) con el flujo de 5 etapas, agentes y guardrails.
- **Escuadrón de Agentes (`07-Agentes/`):** [[AGE-00-Vigia-Requerimientos]], [[AGE-01-Inquisidor-Dudas]], [[AGE-02-Oraculo-Analista]], [[AGE-03-Arquitecto-Dominio]], [[AGE-04-Forja-Backend]], [[AGE-05-Vitral-UI]], [[AGE-06-Sabueso-Hunter]], [[AGE-07-Juez-Esceptico]], [[AGE-08-Centinela-QA]], [[AGE-09-Arquitecto-UX-Storefront]], [[AGE-10-Vitral-Dashboard]].
- **Skills Operativas (`08-Skills/`):** [[SKI-pos-evaluador-solicitudes]], [[SKI-pos-clarification-interview]], [[SKI-orquestador-pos-rag-audit]], [[SKI-pos-clean-architecture]], [[SKI-pos-kardex-transaction]], [[SKI-pos-postgres-concurrency-optimizer]], [[SKI-pos-ecommerce-checkout-machine]], [[SKI-pos-financial-ledger-audit]], [[SKI-pos-storefront-ui-designer]], [[SKI-pos-ecommerce-ux-law]], [[SKI-pos-dashboard-designer]], [[SKI-pos-sales-ui-design]], [[SKI-react-shadcn-admin]], [[SKI-pos-adversarial-audit]], [[SKI-pos-gitflow-pr-review]], [[SKI-pos-sprint-progress-tracker]].

---

## 1. Reglas de Dominio Inmutables (`01-Reglas-Dominio/`)
- [[RN-GEN-Principios-Inmutables]] — Principios generales inquebrantables (`RN-GEN-01` a `12`). Dinero entero COP, UTC vs America/Bogota, Kardex inmutable, Idempotencia y ACID.
- [[RN-ROL-Usuarios-y-Permisos]] — Roles (`ADMIN`, `VENDEDOR`, `CLIENTE`), matriz de 11 permisos configurables y revocación en tiempo real (`CA-50`).
- [[RN-UBI-CAT-Ubicaciones-Catalogo]] — 1 Bodega Central (Cúcuta) + Puntos de Venta, base de caja $200.000, catálogo sin personalización y cosméticos no reintegrables.
- [[RN-INV-Kardex-y-Saldos]] — Saldos (`fisico`, `reservadoBlando`, `reservadoDuro`, `noVendible`), Kardex único, orden canónico anti-deadlock (`RNF-003`).
- [[RN-COM-TRA-Compras-y-Traslados]] — Compras en Central, traslados en tránsito, estado `RETORNANDO_A_CENTRAL` y resolución de novedades (faltantes/excedentes).
- [[RN-CAJ-VTA-Caja-y-Ventas-POS]] — Sesión única de caja, bloqueo de sesiones de días anteriores (`CA-56`), base contada y preempción física del POS sobre reservas blandas.
- [[RN-DES-Promociones-y-Prorrateo]] — Regla de no acumulación, topes de descuento manual, promociones a $0 y fórmula exacta de prorrateo (`Math.floor` + residuo).
- [[RN-DEV-Devoluciones-y-Cambios]] — Plazo de 5 días anclado a la venta raíz, excepción de iliquidez en caja (`CA-54`), cambios a $0 y regla de mes cerrado.
- [[RN-WEB-ENV-Pedidos-y-Zonas-DANE]] — Asignación determinista por Zonas DANE 1-4, TTL de 24h para transferencias, cuarentena de SKU, custodia en Central y retorno logístico vs devolución comercial.
- [[RN-REP-AUD-Reportes-y-Auditoria]] — Fórmula canónica de Ventas Netas (`RN-REP-01 a 06`), exclusión de fletes/bases, imputación de devoluciones web y bitácora append-only (`RN-AUD-01 a 03`).

---

## 2. Requerimientos Funcionales por Módulo (`02-Modulos-RF/`)
- [[MOD-01-Identidad]] — `RF-USU-01` a `06`: Autenticación, registro, matriz de permisos y bloqueo de reasignación con caja abierta.
- [[MOD-02-Ubicaciones]] — `RF-UBI-01` a `02`: Gestión de Central y Puntos de Venta, validación de 5 condiciones para desactivación.
- [[MOD-03-Catalogo]] — `RF-CAT-01` a `03`: Categorías, productos, variantes con SKU inmutable, precio único entero y cosméticos.
- [[MOD-04-Inventario-Ledger]] — `RF-INV-01` a `04`: Motor `InventoryLedgerService`, ajustes manuales motivados, bajas de no vendible y consultas por alcance.
- [[MOD-05-Compras]] — `RF-COM-01` a `02`: Órdenes de compra a proveedores en Central, cancelación y recepción única idempotente.
- [[MOD-06-Traslados]] — `RF-TRA-01` a `06`: Solicitudes, envíos, despacho a tránsito, cancelación en tránsito y resolución de novedades.
- [[MOD-07-Sesiones-Caja]] — `RF-CAJ-01` a `03`: Apertura con base contada, guardián de vigencia diaria (`America/Bogota`) y arqueo de cierre.
- [[MOD-08-Ventas-POS]] — `RF-POS-01` a `02`: Terminal POS, precios oficiales del backend y confirmación atómica con preempción de reservas web.
- [[MOD-09-Descuentos]] — `RF-DES-01` a `02`: Cupones por código, descuentos manuales autorizados y motor de prorrateo exacto.
- [[MOD-10-Devoluciones-Cambios]] — `RF-DEV-01` a `04`: Anulaciones en el día, devoluciones con plazo raíz, cambios de prendas y devoluciones comerciales web.
- [[MOD-11-Pedidos-Web-DANE]] — `RF-WEB-01` a `07`: Tienda Web, cálculo de flete DANE, algoritmo de asignación, worker TTL 60s y retorno logístico.
- [[MOD-12-Reportes-Auditoria]] — `RF-REP-01` a `02`: Cálculo de Ventas Netas imputadas a la tienda despachadora, centro de alertas y log de auditoría.

---

## 3. Modelo de Datos y Restricciones Físicas (`03-Base-de-Datos/`)
- [[Esquema-Prisma-33-Modelos]] — Catálogo completo de los 33 modelos relacionales y 15 enums con claves foráneas e índices.
- [[Constraints-SQL-e-Indices]] — Script `constraints_post_migrate.sql` con CHECKs nativos (stock no negativo, precios > 0) e índices únicos parciales.

---

## 4. Aseguramiento de Calidad y Parámetros (`04-Calidad-y-Parametros/`)
- [[Matriz-CA-01-a-CA-65]] — Los 65 criterios de aceptación normativos y su correlación con los 25 casos de prueba `QA-001` a `QA-025`.
- [[Parametros-Semilla-y-DV-Cerradas]] — Valores cerrados para `seed.ts` y `ParametroSistema`, y resolución definitiva de las 22 decisiones `DV-001` a `DV-022`.

---

## 5. Control de Ejecución, Roles y Sprints (`05-Estado-Sprints/`)
- [[PLAN-MAESTRO-SPRINTS]] — Desglose de los 6 Sprints (0 al 5) con asignación por integrantes (Julio, Sofía, Duvan, Exneider, Yeimer y Thomas) y protocolo de cambios.
- [[MATRIZ-ROLES-Y-TAREAS]] — Metodología GitFlow, responsabilidades de cada miembro, los 5 issues acotados de Thomas y flujo de QA para Duvan.
- [[PROGRESO-ACTUAL]] — Dashboard y registro cronológico de hitos alcanzados por PR mergeado en `develop`.

---

## 6. Arquitectura Canónica, Patrones y Portales (`06-Arquitectura-y-Patrones/`)
- [[ARQ-01-Estrategia-y-Alcance-MVP]] — Planteamiento del problema, categorías de catálogo terminado y matriz dentro/fuera del MVP (Sección 1).
- [[ARQ-02-Stack-Tecnologico-y-Despliegue]] — Stack base vs evolutivo, frontend con code-splitting y matices del pooler Supabase (Sección 2).
- [[ARQ-03-Patrones-Arquitectura-y-Diseno]] — Monolito modular, vertical slices, puertos hexagonales y patrones Fowler (Sección 3.1 y 3.3).
- [[ARQ-04-Patrones-Concurrencia-y-Base-Datos]] — Los 9 patrones de concurrencia ACID, orden canónico, preempción y SKIP LOCKED (Sección 3.2).
- [[ARQ-05-Estructura-Carpetas-y-Tres-Portales]] — Arquitectura de 3 portales y árbol oficial de directorios Backend/Frontend (Sección 4.1 y 4.2).
- [[ARQ-06-Guia-Diseno-Sistema-Visual]] — Sistema de diseño visual, Liquid Glass UI estilo Apple para Storefront, ergonomía POS y tokens (Sección 2 y 4).
- [[ARQ-07-Ley-Diseno-Ecommerce-Navegacion-UIUX]] — Ley Canónica de Diseño E-Commerce, Navegación Intuitiva, Jerarquía Visual, PDP, Catálogo (Grid/List), Carrito, Checkout y Rendimiento (14 Mandamientos y 13 Figuras Normativas).
- [[ARQ-08-Guia-Maestra-Diseno-Paneles-de-Control-Dashboards]] — Ley Canónica de Diseño de Paneles de Control (Dashboards UI/UX), Metodología Justinmind, Analogía del Automóvil, Pantalla Única, 5-6 Tarjetas Primarias, Visualización de Datos y 37 Modelos de Referencia.

---

## 7. Gobernanza y Estado Vivo

- [[SSOT]] — Fuente única de verdad, precedencia y protocolo de cambio.
- [[PROGRESO-ACTUAL]] — Tablero generado desde `backlog.yaml`; no editar a mano.
- `docs/vault/05-Estado-Sprints/backlog.yaml` — Backlog canónico de 46 tareas con evidencia.
- `docs/qa/AUDITORIA-2026-11/` — Auditoría integral y ejecución de F0 (fuera del vault).
