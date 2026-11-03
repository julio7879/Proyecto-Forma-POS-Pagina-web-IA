# Harness de Ingeniería Agéntica: Sistema POS + Tienda Web Multisede (v2.1)

## 1. Regla de Oro de Ahorro de Tokens y Cero Suposiciones (RAG Quirúrgico y Consulta Obligatoria)
- **PROHIBIDO adivinar o suponer reglas de negocio, estados, fórmulas o alcance.**
- Antes de planificar o editar código de cualquier módulo, consulta únicamente la nota atómica correspondiente dentro de `docs/vault/` (vía el servidor MCP `qmd-pos-vault` o leyendo el archivo puntual de `docs/vault/01-Reglas-Dominio/`).
- Nunca cargues todos los archivos de documentación al mismo tiempo en el contexto.
- **Protocolo de Parada y Consulta ante la Duda:** Si cualquier agente o skill no sabe algo, no encuentra la regla en el Vault, detecta ambigüedad en el requerimiento o no está 100% seguro de una decisión técnica o de negocio, **DEBE DETENERSE INMEDIATAMENTE**. Debe formular de 1 a 3 preguntas claras al usuario (usando `ask_question` para opciones interactivas o pregunta directa) y **PROSEGUIR ÚNICAMENTE TRAS RECIBIR LA RESPUESTA O CONFIRMACIÓN DEL USUARIO**. Queda terminantemente prohibido rellenar vacíos con suposiciones.

## 2. Escuadrón de Agentes y Flujo Obligatorio por Tarea
Toda funcionalidad, tarea o requerimiento nuevo sigue estrictamente este flujo de 5 etapas:
0. **`@Vigía-Requerimientos` (Auditoría Pre-Vuelo de Solicitudes - Skill `pos-evaluador-solicitudes`):** Evalúa la solicitud del usuario antes de ejecutarla. Detecta dependencias temporales de equipo (evita pedir entregables sobre cimientos inexistentes), valida la compatibilidad con las 7 invariantes y previene ambigüedades.
1. **`@Oraculo-Analista` (Planificación RAG):** Lee en `docs/vault/` solo las reglas `RN-*` y criterios `CA-*` del módulo actual y emite un contrato de máximo 30 líneas (tablas afectadas, validaciones y casos de borde). No edita código.
2. **`@Forja-Backend` / `@Vitral-UI` (Construcción con Guardrails):**
   - `@Forja-Backend` programa en `/backend` aplicando las 7 invariantes inquebrantables de abajo.
   - `@Vitral-UI` programa en `/frontend` (`StorefrontLayout`, `PosLayout`, `AdminLayout`) sin calcular precios ni stock en el navegador (`RN-GEN-01`).
3. **`@Sabueso-Hunter` + `@Juez-Esceptico` (Auditoría Adversarial en 2 Etapas):**
   - `@Sabueso-Hunter` busca cómo romper la lógica de negocio, permisos o concurrencia del código recién escrito.
   - `@Juez-Esceptico` intenta desmontar cada sospecha verificando middlewares, Zod y constraints SQL para descartar falsas alarmas y reportar solo bugs reales.
4. **`@Centinela-QA` (Auto-Comprobación Obligatoria):** Ejecuta `npx tsc --noEmit` y `npx vitest run` antes de marcar la tarea como completada en `docs/vault/05-Estado-Sprints/PROGRESO-ACTUAL.md`.

## 3. Las 7 Invariantes Inquebrantables de Código (Guardrails)
1. **Dinero Entero (`RN-GEN-04`):** Todo importe en `COP` es entero (`INT`). Usa siempre `backend/src/shared/domain/MoneyCOP.ts` (prorrateo con `Math.floor()` y residuo a la última línea elegible, `RN-DES-09`).
2. **Hora Oficial de Colombia (`RN-GEN-05`):** Guarda fechas en UTC pero evalúa días (`YYYY-MM-DD`), meses (`YYYY-MM`), sesiones de caja vencidas (`RN-CAJ-11`) y plazos de devolución en `America/Bogota` usando `ColombiaTime.ts`.
3. **Kardex Único (`RN-GEN-02`):** Prohibido ejecutar `prisma.saldoStock.update()` fuera de `InventoryLedgerService.ts`.
4. **Orden Canónico Anti-Deadlock (`RNF-003`):** Antes de hacer `SELECT ... FOR UPDATE` sobre múltiples variantes, ordena las líneas por `varianteId ASC`.
5. **Dos Niveles de Reserva (`RN-VTA-03`, `RN-WEB-16`):** El POS tiene prioridad sobre `reservadoBlando` (`RECIBIDO`/`CONFIRMADO`) y reasigna el pedido web (o lo envía en custodia a Bodega Central si ninguna otra sede tiene stock), pero protege siempre `reservadoDuro` (`EN_PREPARACION`).
6. **Idempotencia y Consecutivos Diferidos (`RN-GEN-08`, `RN-VTA-09`):** Exige `Idempotency-Key` en endpoints `POST` transaccionales y calcula el consecutivo por punto en el último paso antes del `COMMIT`.
7. **Inmutabilidad y Seguridad (`RN-GEN-03`, `RN-ROL-05`):** Prohibido borrar físicamente registros con historial. Pide confirmación humana antes de modificar `schema.prisma`, borrar archivos o ejecutar migraciones destructivas.

## 4. Matriz de Skills Especializadas por Agente (Invocación Quirúrgica)
Para mantener el consumo de tokens al mínimo, cada skill se consulta **únicamente** cuando se activa su disparador:

| Agente Responsable | Skill Especializada (.agent/skills/) | Origen / Inspiración GitHub | Cuándo Invocar |
| :--- | :--- | :--- | :--- |
| **`@Vigía-Requerimientos`** | `pos-evaluador-solicitudes` | Harness v2.1 | Pre-vuelo obligatorio (Paso 0). Audita solicitudes, dependencias de equipo y DoR. |
| **`@Inquisidor-Dudas`** | `pos-clarification-interview` | `mattpocock/skills` (`/grill-me`) | **OBLIGATORIA ante la duda.** Interroga al usuario con opciones interactivas (`ask_question`). |
| **`@Oraculo-Analista`** | `orquestador-pos-rag-audit` | RAG Quirúrgico + QMD | Extrae contratos de 30 líneas de `docs/vault/` sin cargar el vault entero. |
| **`@Forja-Backend`** | `pos-postgres-concurrency-optimizer` | `microsoft/postgres-skills` | Alta concurrencia, `SELECT ... FOR UPDATE`, locks a nivel de fila y transacciones ACID. |
| **`@Forja-Backend`** | `pos-kardex-transaction` | Guardrails POS | Toda mutación de inventario (`InventoryLedgerService`) o sesiones de caja. |
| **`@Vitral-UI`** | `pos-storefront-ui-designer` | `anthropics/skills` + `tailwind-design-system` | Vistas React, Tailwind CSS, Apple Liquid Glass UI, estados vacíos/error y accesibilidad WCAG. |
| **`@Sabueso-Hunter`** | `pos-adversarial-audit` / `security-audit` | Cloudflare Adversarial Review | Búsqueda exhaustiva de fallos de lógica, concurrencia, precios y fugas multisede. |
| **`@Juez-Esceptico`** | `pos-adversarial-audit` | Cloudflare Adversarial Review | Desmonta falsas alarmas verificando constraints SQL, Zod y middlewares. |
| **`@Centinela-QA`** | `pos-gitflow-pr-review` / `pos-sprint-progress-tracker` | GitFlow Gates | Revisión de PRs, verificación `tsc` + `vitest` y actualización del progreso en el vault. |
