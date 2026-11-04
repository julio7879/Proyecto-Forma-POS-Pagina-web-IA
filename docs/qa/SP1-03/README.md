# QA Issue #35 — Certificación PR #31 (Módulo 02 Sedes y Desactivación Segura, SP1-03)

Rama QA: `qa/SP1-03-certificacion-sedes` (desde `develop`).
Responsable QA: @duvancovilla292-prog · Desarrollador: Yeimer · Criterios: RN-UBI-01..06, RN-GEN-04, RN-GEN-07, MOD-02
Estado: **revisión estática hecha; ejecución local PENDIENTE**. Dictamen provisional: **certificación condicionada** (hallazgo 3).

## Qué agrega esta rama (solo QA)
| Archivo | Para qué |
|---|---|
| `backend/src/modules/02-ubicaciones/__tests__/ubicaciones.qa.test.ts` | 12 pruebas con el mismo arnés de la suite original. 9 cubren casos del checklist que no se verificaban: stock no vendible, estados de traslado "abiertos", auditoría con motivo, permisos, 404, mensaje del DELETE, PUT con decimales / DANE inválido / base negativa. 3 están marcadas `[HALLAZGO]` y **documentan** huecos de RN-UBI-01 (pasan en verde mientras el defecto exista). |

## Hallazgos
1. **GitFlow:** el PR #31 ya está fusionado en `develop` (`1c28b00`) antes del QA Gate.
2. **Las pruebas son unitarias con Prisma mockeado.** Demuestran la lógica y los códigos HTTP, pero **no** tocan la base de datos real. La unicidad de la Central también está protegida en BD por el índice parcial `uq_unica_bodega_central` (`prisma/constraints_post_migrate.sql`). Si dos POST llegan a la vez, el segundo falla con P2002, que el `errorHandler` traduce a **409**. ✅
3. **RN-UBI-01/03 se puede romper por PUT (hueco real):** el servicio solo impide cambiar el `tipo` de la Central. Un `PUT /api/ubicaciones/:id_central` con `{ "despachaWeb": false, "baseCajaCop": 500000 }` responde **200** y lo guarda. La Central dejaría de despachar web y tendría base de caja. **Sugerencia:** rechazar con 422 cualquier cambio de `despachaWeb`/`baseCajaCop` en la Central (test `[HALLAZGO] QA-10`).
4. **La Central no siempre nace con prioridad 40:** solo se fuerza a 40 si no se envía o si llega 100. Un POST con `prioridadDespacho: 5` crea la Central con 5 (test `[HALLAZGO] QA-11`). El checklist dice "debe nacer con prioridadDespacho: 40".
5. **Sede desactivada editable:** se puede hacer `PUT { "despachaWeb": true }` sobre una sede con `activa: false`. Quedaría marcada para despacho web estando inactiva (test `[HALLAZGO] QA-12`). Tampoco existe un flujo de reactivación.
6. **Concurrencia en la desactivación (observación):** se bloquea la fila de `Ubicacion` (`FOR UPDATE`), pero no las filas de `SaldoStock` ni de traslados. Un movimiento de inventario simultáneo podría entrar justo después de la verificación de stock. El riesgo es bajo, pero vale la pena documentarlo.
7. **Desactivar dos veces:** desactivar una sede ya inactiva vuelve a responder 200 y crea otro registro de auditoría. Es menor.
8. **Conteos desactualizados:** el Issue dice 77/77 en backend; hoy `develop` tiene 123 y con esta rama son **135**. Los 16 tests del módulo se mantienen.
9. **Requisito de entorno:** como en las certificaciones anteriores, en un clon nuevo hacen falta `backend/.env` y `npx prisma generate` antes de `npm test`.

## Revisión por criterio del checklist
| Criterio | Evidencia | Resultado |
|---|---|---|
| Segunda Central → 409 | test 3 + índice único en BD | ✅ |
| Central nace con base 0, despachaWeb true, prioridad 40 | test 13 | ✅ por defecto; ⚠️ hallazgo 4 |
| Degradar Central a PUNTO_VENTA → 422 | test 15 | ✅ |
| Desactivar Central → 422 | test 4 | ✅ |
| DELETE → 400 y orienta a la desactivación | test 10 + QA-6 | ✅ |
| Desactivar con stock físico / no vendible → 422 | test 5 + QA-1 | ✅ |
| Desactivar con traslados abiertos o en tránsito → 422 | test 7 + QA-2 | ✅ |
| Desactivar con pedidos web en curso → 422 | test 8 | ✅ |
| Desactivar con caja ABIERTA → 422 | test 6 | ✅ |
| Desactivación válida: 200, activa false, despachaWeb false, auditoría | test 9 + QA-3 | ✅ |
| PUT solo `nombre` no resetea otros campos (Zod trap) | test 14 | ✅ |
| baseCajaCop con decimales → 400 | test 11 (POST) + QA-7 (PUT) | ✅ |
| DANE no numérico → 400 | test 16 (POST) + QA-8 (PUT) | ✅ |
| Proteger Central contra cambios de base/despacho | QA-10 | ❌ hallazgo 3 |

## Cómo ejecutar (desde la raíz)
```bash
npm test --prefix backend -- src/modules/02-ubicaciones/__tests__/ubicaciones.test.ts      # 16/16
npm test --prefix backend -- src/modules/02-ubicaciones/__tests__/ubicaciones.qa.test.ts   # 12/12
npm test --prefix backend                                                                  # 135/135
npm run typecheck --prefix backend                                                         # 0 errores
```

## Resultados de ejecución (llenar)
| Comprobación | Esperado | Obtenido |
|---|---|---|
| Tests módulo 02 | 16/16 | |
| Tests QA | 12/12 | |
| Suite backend | 135/135 | |
| Typecheck | 0 errores | |

**Dictamen provisional:** las 5 condiciones de RN-UBI-05, el no borrado físico, la unicidad de la Central y las validaciones de dinero/DANE cumplen. **Condicionado** al hallazgo 3 (PUT puede quitarle a la Central `despachaWeb` o darle base de caja). Los hallazgos 4 y 5 son menores.
