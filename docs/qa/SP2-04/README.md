# QA Issue #65 — Certificación PR #64 (SP2-04 Recepción de Traslados y Novedades)

Rama QA: `qa/SP2-04-certificacion-recepcion-traslados` (desde `develop`, base `0ac6777`; el PR #64 ya está fusionado: `ae6ac3d`).
Responsable QA: @duvancovilla292-prog · Desarrollador: Julio · Criterios: RF-TRA-05, RF-TRA-06, RN-TRA-07..11, CA-06, CA-07, CA-08, CA-10, CA-57, CA-58, QA-010, QA-011, QA-014
Estado: **revisión estática hecha; ejecución local PENDIENTE**. Dictamen provisional: **NO aplicar `qa-approved` todavía** (hallazgo 2).

## Qué agrega esta rama (solo QA)
| Archivo | Para qué |
|---|---|
| `backend/src/modules/06-traslados/__tests__/trasladosRecepcion.qa.test.ts` | 13 pruebas con el mismo arnés que la suite original. La suite original **sustituye** `registrarMovimientosBatch` y en varios casos no revisa **qué** movimientos se generan. Estas sí lo hacen: BUENO→FISICO y DANADO→NO_VENDIBLE en destino, multi-línea con faltante y excedente, observación opcional u obligatoria, línea omitida o ajena, ADMIN recibiendo, resolución parcial, resolución mixta que cierra, repetir una línea sin superar lo pendiente, resolver sobre un traslado sin novedad, y 2 `[HALLAZGO]`. |

## Hallazgos
1. **GitFlow:** el PR #64 ya está en `develop` (`ae6ac3d`). La guía pide hacer checkout de la rama feature, pero se certifica sobre `develop`.
2. **Excedente incorporado infla el inventario (defecto, RN-TRA-10):** la regla de dominio (`docs/vault/01-Reglas-Dominio/RN-COM-TRA-Compras-y-Traslados.md`, RN-TRA-10) dice: *Excedentes → Incorporar (**− `fisico` Central, + `fisico` punto**)*. El código de `EXCEDENTE_INCORPORADO_DESDE_CENTRAL` solo genera `NOVEDAD_EXCEDENTE_INCORPORADO` **+N en el punto** y **no descuenta de Central** (QA-12). Las unidades sobrantes siguen contadas en Central (de donde salieron sin registrarse) **y** en el punto: el inventario global queda **duplicado**. **Corrección:** agregar en el mismo batch un movimiento negativo en `ubicacionOrigenId` (por ejemplo `AJUSTE_NEGATIVO_FISICO` o un tipo específico), validando que Central tenga esas unidades.
3. **Carrera de versión responde 404 en vez de 409 (QA-014):** el control optimista funciona en dos niveles. Si el cliente envía `version` vieja, responde **409** ✅. Pero si la carrera ocurre dentro de la transacción (dos recepciones o resoluciones simultáneas), el `update where { id, version }` falla con **P2025** y el `errorHandler` lo traduce a **404 "registro no encontrado"** (QA-13). La transacción sí se revierte (no hay doble ingreso) ✅, pero el código HTTP confunde al cliente. **Corrección:** capturar P2025 en esos `update` y lanzar `AppError.conflict`.
4. **Pérdida sin rastro en Kardex:** `PERDIDA_AJUSTE` solo crea `ResolucionNovedadTraslado`. Contablemente es correcto que no mueva stock (las unidades ya salieron de Central al despachar), pero el tipo `NOVEDAD_PERDIDA` existe en el enum y **no se usa**. El Kardex de la variante no muestra la merma; solo se ve en la tabla de resoluciones.
5. **Resolución sin idempotencia:** `/recibir` exige `Idempotency-Key`, pero `/resolver-novedad` **no**. Un doble envío sin `version` lo frena el control optimista del `update` (con el 404 del hallazgo 3), pero conviene alinearlo con RN-GEN-08.
6. **Lo que está bien:** CA-07 (buenas + dañadas > enviadas → 400). Conforme → RECIBIDO con `fechaRecepcion` y `fechaCierre`. Dañadas → NO_VENDIBLE con observación obligatoria. Faltante o excedente → RECIBIDO_CON_NOVEDAD con pendientes por línea. Hay que reportar todas las líneas. Aislamiento de sede y `permRecibirTraslado` (403). Solo ADMIN resuelve. LLEGO_A_PUNTO suma al destino, RETORNO_A_CENTRAL suma a Central, PERDIDA no mueve stock. Cierre automático en CERRADO al quedar todo resuelto. Orden canónico anti-deadlock.

## Revisión por criterio
| Criterio | Evidencia | Resultado |
|---|---|---|
| CA-57 / QA-010 conforme → RECIBIDO, BUENO a FISICO | test original + QA-1, QA-2 | ✅ |
| CA-06 dañadas → NO_VENDIBLE + observación obligatoria | test original + QA-1, QA-3 | ✅ |
| CA-07 suma > enviada → 400 | test original | ✅ |
| CA-58 / QA-011 faltante o excedente → RECIBIDO_CON_NOVEDAD + pendientes | tests originales + QA-4 | ✅ |
| RN-ROL-04 otra sede / sin permiso → 403 | tests originales | ✅ |
| CA-10 solo ADMIN resuelve | test original | ✅ |
| LLEGO_A_PUNTO / RETORNO_A_CENTRAL / PERDIDA_AJUSTE | tests originales + QA-8, QA-9, QA-10 | ✅ (ver hallazgo 4) |
| EXCEDENTE_INCORPORADO (− Central, + punto) | QA-12 | ❌ hallazgo 2 |
| Cierre automático en CERRADO | test original + QA-9 | ✅ |
| QA-014 versión desactualizada → 409 | test original (version en el body) + QA-13 (carrera) | ⚠️ hallazgo 3 |

## Cómo ejecutar (desde la raíz)
```bash
npm test --prefix backend -- src/modules/06-traslados/__tests__/trasladosRecepcion.test.ts      # 14/14
npm test --prefix backend -- src/modules/06-traslados/__tests__/trasladosRecepcion.qa.test.ts   # 13/13
npm test --prefix backend
npm run typecheck --prefix backend
grep -n "Incorporar" docs/vault/01-Reglas-Dominio/RN-COM-TRA-Compras-y-Traslados.md   # evidencia hallazgo 2
```

## Resultados (llenar)
| Comprobación | Esperado | Obtenido |
|---|---|---|
| trasladosRecepcion.test.ts | 14/14 | |
| Tests QA | 13/13 | |
| Suite backend | verde | |
| Typecheck | 0 errores | |

**Dictamen provisional:** recepción conforme, dañadas, validación CA-07, novedades, aislamiento, resolución de faltantes y cierre cumplen. **No aplicar `qa-approved`** hasta corregir el hallazgo 2 (excedente incorporado sin descontar de Central), o hasta que Julio lo acepte como pendiente. El hallazgo 3 es menor (código HTTP).
