---
id: MATRIZ-ROLES-Y-TAREAS
tags: [equipo, roles, gitflow, metodologia, gobernanza]
---
# Matriz Oficial de Roles, Asignación de Tareas y Flujo GitFlow

Este documento rige la metodología de trabajo, asignación de responsabilidades y flujo de colaboración para el equipo del **Sistema POS + Tienda Web Multisede**.

---

## 1. Integrantes del Equipo y Distribución de Responsabilidades

| Integrante | Rol Oficial | Nivel de Especialidad | Responsabilidades Principales | Lo que Tiene Prohibido / Restricciones |
| :--- | :--- | :--- | :--- | :--- |
| **Julio** | **Líder de Proyecto & Backend Lead** | Senior / Lead | Arquitectura transaccional, `InventoryLedgerService`, bloqueos de concurrencia `FOR UPDATE`, caja/ventas, integración general, code review y aprobación final de PRs a `develop` y `main`. | Aprobar PRs que no cumplan la *Definition of Done* o que no tengan el visto bueno de Duvan en QA. |
| **Sofía** | **Diseñadora UX/UI & Prototipado** | Especialista en Diseño | Prototipos navegables en Figma/Lovable, diseño visual de `StorefrontLayout`, `PosLayout` y `AdminLayout`, paleta de colores, tipografías, guía de estilos y tokens visuales. | **Cero código fuente.** No programa backend ni frontend; entrega maquetas, flujos de pantalla y assets listos para Exneider. |
| **Duvan** | **Líder de Aseguramiento de Calidad (QA)** | QA Engineer | Auditor de los 65 criterios `CA-01` a `CA-65` y 25 casos `QA-001` a `QA-025`. Pruebas funcionales de aceptación, verificación de bugs reportados por `@Sabueso-Hunter`, y certificación en cada PR antes del merge a `develop`. | No puede dar por aprobado un PR si `tsc` falla o si algún criterio `CA` del módulo no está cubierto por tests. |
| **Exneider** | **Desarrollador Frontend Principal** | Desarrollador Frontend | Implementación de vistas React + Tailwind CSS + TanStack Query, componentes UI basados en los prototipos de Sofía, manejo de estados en cliente y formularios validados con Zod. | No calcula precios ni stock disponible en el cliente (`RN-GEN-01`). No toca lógica transaccional de `/backend`. |
| **Yeimer** | **Desarrollador Backend Junior (Soporte)** | Junior / En formación | Endpoints CRUD auxiliares, validadores de esquemas Zod en `/backend/src/shared/middlewares`, controladores sencillos con acompañamiento de Julio, y rutas de lectura de auditoría. | No implementa transacciones complejas de stock o dinero (`InventoryLedgerService`) sin supervisión directa de Julio. |
| **Thomas** | **Desarrollador Junior (Tareas Acotadas)** | Junior / En formación | Encargado de **5 Issues concretos, claros y delimitados** a lo largo del proyecto (catálogos DANE, datos semilla, plantillas HTML de comprobantes y correos, y documentación API). | No se le asigna lógica transaccional ni tareas abiertas que generen sobrecarga o riesgo de bloqueo. |

---

## 2. Los 5 Issues Acotados de Thomas (Planificación y Alcance)

Para garantizar que Thomas tenga una participación exitosa sin sobrecarga ni riesgo de bloqueo en la ruta crítica, sus tareas son:

1. **Issue #T1 (Sprint 0): Catálogo Geográfico y Tarifario DANE (`RF-ENV-01 a 04`)**
   - *Alcance:* Crear el script y datos de municipios, departamentos y regiones DANE con las tarifas base de Zonas 1 a 4 para inicializar la base de datos.
   - *Entregable:* `backend/src/shared/seeds/daneCatalog.ts`.
2. **Issue #T2 (Sprint 1): Datos Semilla del Catálogo de Variantes (`RF-CAT-01 a 03`)**
   - *Alcance:* Construir el archivo de datos semilla con las 4 categorías (Ropa, Accesorios, Cosméticos, Artesanías) y productos de muestra con tallas, colores y SKUs.
   - *Entregable:* Inserción de variantes de prueba en `backend/prisma/seed.ts`.
2.1. **Issue #T2.1 (Sprint 2): Modal de Recepción de Traslado y Novedades en Tienda (`RF-TRA-05`)**
   - *Alcance:* Diseñar el modal interactivo de recepción de mercancía para dependientes en tienda, validando que recibidaBuena + recibidaDanada <= enviada (CA-07) y emitiendo el payload de recepción limpia o con novedades.
   - *Entregable:* Componente `frontend/src/features/pos/components/RecepcionTrasladoModal.tsx` (Issue #58).
3. **Issue #T3 (Sprint 3): Plantilla HTML Imprimible del Comprobante POS (`RF-POS-02`)**
   - *Alcance:* Diseñar la vista/plantilla CSS para tickets de caja de 80 mm (comprobante no fiscal con consecutivo, desglose de IVA 0%, medios de pago y leyenda legal).
   - *Entregable:* Componente imprimible `frontend/src/features/pos/components/TicketVentaPOS.tsx`.
3.1. **Issue #T3.1 (Sprint 3): Modal de Cobro Rápido y Teclado Numérico Táctil para Terminal POS (`RF-POS-01`, `CA-51`, `CA-52`)**
   - *Alcance:* Diseñar el modal de cobro para pantalla mostrador, con botones rápidos de billetes colombianos, teclado numérico en pantalla para táctiles y cálculo de cambio en tiempo real.
   - *Entregable:* Componente `frontend/src/features/pos/components/CobroRapidoModal.tsx` (Issue #59).
4. **Issue #T4 (Sprint 4): Plantilla de Correo Transaccional de Pedido Web (`RF-WEB-03`)**
   - *Alcance:* Diseñar la plantilla HTML del correo de confirmación de pedido web con número de guía, estado del envío, tiempo estimado y destino DANE para el puerto `NotificacionPort`.
   - *Entregable:* `backend/src/shared/templates/correoConfirmacionPedido.html` (o componente React Email).
5. **Issue #T5 (Sprint 5): Documentación y Pruebas de Formato de la API REST**
   - *Alcance:* Documentar los endpoints públicos y privados con ejemplos de Request/Response JSON y verificar códigos de estado HTTP tipados.
   - *Entregable:* Colección Postman / Markdown de contratos en `docs/api/`.

---

## 3. Metodología GitFlow Obligatoria

El repositorio opera bajo **GitFlow estricto**:

```
[main] ───────────────────────────────────────────● (v1.0 Producción)
   ▲                                              ▲
   │ (Release PR verificado por Duvan y Julio)    │
[release/vX.X] ───────────────────────────────────┘
   ▲
   │
[develop] ──────●─────────────────●───────────────● (Rama de Integración)
   ▲            ▲                 ▲
   │            │                 │ (Merge PR tras DoD y QA)
   │     [feature/RF-XXX]  [bugfix/CA-XX]
   │     (Julio, Exneider, (Yeimer, Thomas)
   │      Yeimer, Thomas)
```

### Reglas de Ramas:
1. **`main`:** Protegida. Solo contiene código estable puesto en producción. Nadie hace `push` directo.
2. **`develop`:** Rama viva de integración continua. Toda nueva funcionalidad se integra aquí mediante Pull Request.
3. **`feature/RF-XXX-descripcion`:** Ramas de trabajo individuales para requerimientos funcionales (ej. `feature/RF-CAT-01-categorias-cosmeticos`).
4. **`bugfix/CA-XX-descripcion`:** Ramas para corregir fallos reportados en QA o auditorías adversariales.
5. **`release/vX.X`:** Congelamiento de código para certificación integral antes de pasar a `main`.

---

## 4. Flujo Automatizado de QA para Duvan

Cada vez que un desarrollador (Julio, Exneider, Yeimer o Thomas) abre un Pull Request hacia `develop`:

1. El PR debe incluir en la descripción la lista de criterios `CA-*` que afecta.
2. La skill `pos-gitflow-pr-review` detecta los archivos modificados y genera una **Tarea de Verificación de QA para Duvan** en GitHub Issues / Projects con el siguiente formato:
   ```markdown
   ## [QA] Verificación Requerida: PR #XX - [Nombre de la funcionalidad]
   - **Responsable QA:** @Duvan
   - **Desarrollador:** @Autor
   - **Rama:** feature/RF-XXX
   - **Criterios de Aceptación Obligatorios a Certificar:**
     - [ ] CA-XX: [Descripción esperada]
     - [ ] CA-YY: [Descripción esperada]
   - **Checklist de Calidad:**
     - [ ] Pruebas funcionales manuales exitosas.
     - [ ] Sin regresiones en módulos dependientes.
     - [ ] Pruebas automatizadas en verde (`npx vitest run`).
   ```
3. **Bloqueo de Merge:** El PR no puede fusionarse a `develop` sin la aprobación de Duvan (etiqueta `qa-approved` o comentario formal de aprobación).

---

## 5. Protocolo de Adaptabilidad ante Cambios

Un proyecto real experimenta ajustes operativos. Este protocolo permite modificar el plan sin descontrol:

1. **Si un requerimiento cambia:** Se actualiza primero la nota atómica correspondiente en `docs/vault/01-Reglas-Dominio/` o `02-Modulos-RF/`.
2. **Si cambia la asignación:** Julio evalúa el impacto y redistribuye las tareas en `PLAN-MAESTRO-SPRINTS.md`, cuidando siempre de no transferir lógica de alta concurrencia a Yeimer o Thomas.
3. **Si falla una prueba:** Duvan reporta el bug etiquetando el criterio `CA-*` roto, se abre rama `bugfix/` y se revalida.

