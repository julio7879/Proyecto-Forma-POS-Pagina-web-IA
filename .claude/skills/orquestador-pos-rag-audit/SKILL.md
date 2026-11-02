---
name: orquestador-pos-rag-audit
description: Guía y orquesta el desarrollo, implementación y auditoría adversarial del Sistema POS y Tienda Web Multisede (TypeScript, Express, Prisma, PostgreSQL, React). Activar cuando el usuario pida programar un módulo, crear endpoints, diseñar componentes, revisar código o auditar lógica de negocio y seguridad del proyecto POS y Tienda Web.
---
# Orquestador Multi-Agente con RAG Quirúrgico y Auditoría Adversarial (POS + Tienda Web)

Esta skill implementa el flujo de trabajo en 4 fases (RAG Quirúrgico, Implementación con Guardrails, Auditoría Adversarial en 2 etapas estilo Cloudflare y Auto-Verificación) para construir el Sistema POS y Tienda Web sin alucinaciones y con mínimo consumo de tokens.

## Cuándo Usar Esta Skill
- Al planificar o programar cualquiera de los 12 módulos del Sistema POS y Tienda Web.
- Al escribir transacciones de Prisma/PostgreSQL que afecten inventario, caja, ventas, devoluciones, cambios, traslados o pedidos web.
- Al realizar auditorías de seguridad, concurrencia o lógica de negocio sobre código existente del proyecto.

## Paso 1: Consulta Quirúrgica de Reglas (`@Oraculo-Analista`)
- No asumas reglas de negocio ni cargues documentos completos innecesarios.
- Extrae o consulta únicamente las reglas `RN-*`, el requerimiento `RF-*` y los criterios `CA-*` del módulo específico que se va a intervenir desde `docs/vault/`.
- Resume en menos de 30 líneas las invariantes obligatorias antes de escribir código:
  - Tablas de Prisma afectadas.
  - Reglas de estado y permisos (`RN-ROL-05`, alcance de `ubicacionId`).
  - Casos de borde que deben cumplirse (`CA-*`).

## Paso 2: Implementación con Guardrails del Harness (`@Forja-Backend` / `@Vitral-UI`)
Aplica siempre las 7 invariantes inquebrantables del proyecto:
1. **Dinero Entero (`RN-GEN-04`):** Usa exclusivamente enteros en pesos colombianos (`COP`). Aplica prorrateo con función `Math.floor()` y asigna el residuo a la última línea elegible (`RN-DES-09`).
2. **Hora Oficial de Colombia (`RN-GEN-05`):** Persiste fechas en UTC pero evalúa cortes diarios (`YYYY-MM-DD`), cierres mensuales (`YYYY-MM`), sesiones de caja vencidas (`RN-CAJ-11`) y plazos de devolución en `America/Bogota`.
3. **Kardex Inmutable (`RN-GEN-02`, `RN-INV-04`):** Toda modificación de `SaldoStock` debe ocurrir dentro de `InventoryLedgerService` insertando su `MovimientoInventario` en la misma transacción.
4. **Ordenamiento Canónico Anti-Deadlock (`RNF-003`):** Antes de ejecutar `SELECT ... FOR UPDATE` sobre múltiples variantes, ordena las líneas por `varianteId ASC`.
5. **Dos Niveles de Reserva (`RN-VTA-03`, `RN-WEB-16`):** El POS tiene prioridad sobre `reservadoBlando` (`RECIBIDO`/`CONFIRMADO`) y reasigna el pedido web (o lo envía en custodia a Bodega Central si ninguna otra sede tiene stock), pero respeta siempre `reservadoDuro` (`EN_PREPARACION`).
6. **Idempotencia y Consecutivos Diferidos (`RN-GEN-08`, `RN-VTA-09`):** Exige `Idempotency-Key` en creación de documentos y calcula el consecutivo por punto en el último paso antes del `COMMIT`.
7. **Frontend sin Lógica Financiera (`RN-GEN-01`):** En React, nunca confíes en precios o totales calculados en el navegador; usa `@tanstack/react-query` y bloquea botones durante `isPending`.

## Paso 3: Auditoría Adversarial en 2 Etapas (`@Sabueso-Hunter` vs. `@Juez-Esceptico`)
Antes de dar por bueno el código generado, ejecuta una revisión adversarial:
1. **Etapa Cazador (`@Sabueso-Hunter`):** Busca activamente fallos de concurrencia, fugas de alcance entre ubicaciones (`ubicacionId`), manipulación de precios desde el cliente, descuadres de caja por iliquidez (`CA-54`) o distorsión de Ventas Netas en retornos logísticos (`CA-64`).
2. **Etapa Verificador Escéptico (`@Juez-Esceptico`):** Intenta refutar y desmontar cada hallazgo verificando si un middleware, esquema Zod o constraint SQL ya cubría el caso. Descarta falsas alarmas y corrige únicamente los hallazgos confirmados.

## Paso 4: Comprobación Obligatoria (`@Centinela-QA`)
Verifica siempre que el código compile sin errores de tipos (`tsc --noEmit`) y que exista o pase la prueba automatizada correspondiente a los criterios `CA-*` del módulo antes de entregar la respuesta final.
