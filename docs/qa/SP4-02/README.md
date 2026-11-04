# QA Issue #63 — Certificación PR #50 (SP4-02 Worker Expiración TTL Web)

Rama QA: `qa/SP4-02-certificacion-worker-ttl` (desde `develop`, base `73ef2cd`; el PR #50 ya está fusionado: `15cd66b`).
Responsable QA: @duvancovilla292-prog · Desarrollador: Julio · Criterios: RF-WEB-04, RN-WEB-09, CA-39, CA-42, QA-015
Estado: **revisión estática hecha; ejecución local PENDIENTE**. Dictamen provisional: **NO aplicar `qa-approved` todavía** (hallazgos 2 y 3).

## Qué agrega esta rama (solo QA)
| Archivo | Para qué |
|---|---|
| `backend/src/modules/11-pedidos-web/__tests__/expiracionTTL.qa.test.ts` | 10 pruebas que usan `WebOrderTtlWorker` **directamente** con un Prisma falso. La suite original pasa por el endpoint y su mock de `$queryRaw` hace que el worker caiga al `findMany` de respaldo, así que **la ruta real con `SKIP LOCKED` nunca se ejecutaba en los tests**. Cubren: liberación por línea, filtros SQL de candidatos, cambio de estado entre selección y transacción, borde `<=`, aislamiento de fallos por pedido, reemplazo del temporizador, y 4 `[HALLAZGO]`. |

## Hallazgos
1. **GitFlow:** el PR #50 ya está en `develop` (`15cd66b`). La guía pide hacer checkout de la rama feature, pero se certifica sobre `develop`.
2. **El worker periódico nunca arranca (defecto, CA-39):** `WebOrderTtlWorker.iniciarCron()` existe, pero **`src/server.ts` no lo llama** (ni ningún otro archivo). En producción las reservas vencidas **solo se liberan si un ADMIN llama a mano** a `POST /api/pedidos-web/worker/expirar-reservas`. Mientras tanto, el stock queda apartado indefinidamente y no se puede vender (QA-10). **Corrección:** llamar `WebOrderTtlWorker.iniciarCron(prisma)` en `server.ts`, con apagado limpio con `detenerCron` en SIGTERM.
3. **`FOR UPDATE SKIP LOCKED` no protege nada (defecto, QA-015):** la selección de candidatos se ejecuta con `prisma.$queryRaw` **fuera de cualquier transacción**. PostgreSQL toma y suelta los bloqueos en esa misma sentencia (autocommit). Luego, dentro de la transacción de cada pedido, el pedido se relee con `findUnique` **sin bloqueo**, y el `update` a CANCELADO filtra **solo por `id`**, sin estado ni `version` (QA-6, QA-7). Si otro proceso confirma el pago o mueve el pedido entre la lectura y el `update`, el worker **lo cancela igual y libera su reserva**. Hoy el riesgo es bajo porque aún no existe el flujo de confirmación de pago (ningún código pone `CONFIRMADO`), pero el criterio QA-015 **no se cumple**. **Corrección:** hacer el `SELECT … FOR UPDATE SKIP LOCKED` del pedido **dentro** de la transacción de cada pedido (`tx.$queryRaw`), o `update where { id, estadoPedido: 'RECIBIDO', estadoPago: 'PENDIENTE' }` / `version`.
4. **El respaldo silencia errores reales:** el `catch` alrededor del `$queryRaw` existe "para mocks", pero atrapa **cualquier** error (conexión, sintaxis, permisos), cae a un `findMany` **sin** `SKIP LOCKED` y no registra nada (QA-8). Además, por eso la suite original nunca probó la ruta real.
5. **Ejecuciones solapadas:** `setInterval` con callback `async` no espera a que termine el barrido anterior. Si un barrido tarda más de 60 s, se solapan. Las guardas por pedido evitan dobles liberaciones en el caso normal, pero conviene un flag `enEjecucion`.
6. **Usuario del sistema fijo:** el cron usa `usuarioId = 1` por defecto para Kardex, historial y auditoría. Se asume que el usuario 1 existe y es admin. Mejor un usuario de sistema explícito.
7. **Sin `version` en la actualización:** el resto del módulo incrementa `version`; la cancelación por TTL no.
8. **Lo que está bien:** filtros correctos (solo TRANSFERENCIA + RECIBIDO + PENDIENTE + reserva activa + vencido; CONTRAENTREGA y EN_PREPARACION excluidos). Liberación `LIBERACION_RESERVA_WEB` negativa sobre `RESERVADO_BLANDO` en orden canónico. Historial y auditoría. Un fallo en un pedido no detiene el resto. El endpoint manual es solo ADMIN (401 / 403).

## Revisión por criterio
| Criterio | Evidencia | Resultado |
|---|---|---|
| Vencido → CANCELADO, `tieneReservaActiva=false`, historial y auditoría | test original + QA-1 | ✅ |
| `LIBERACION_RESERVA_WEB` negativa en `RESERVADO_BLANDO` | test original + QA-1 | ✅ |
| No expira vigentes / EN_PREPARACION / CONTRAENTREGA | tests originales + QA-2, QA-3, QA-4 | ✅ |
| SKIP LOCKED: omite filas bloqueadas sin deadlocks | QA-6, QA-7, revisión de código | ❌ hallazgo 3 |
| Endpoint: 401 sin token, 403 CLIENTE/VENDEDOR, 200 ADMIN | tests originales | ✅ |
| Worker **periódico** (RF-WEB-04) | QA-10 | ❌ hallazgo 2 |

## Cómo ejecutar (desde la raíz)
```bash
npm test --prefix backend -- src/modules/11-pedidos-web/__tests__/expiracionTTL.test.ts      # 10/10
npm test --prefix backend -- src/modules/11-pedidos-web/__tests__/expiracionTTL.qa.test.ts   # 10/10
npm test --prefix backend
npm run typecheck --prefix backend
grep -rn "iniciarCron" backend/src --include=*.ts | grep -v __tests__   # evidencia hallazgo 2: solo aparece la definición
```

## Resultados (llenar)
| Comprobación | Esperado | Obtenido |
|---|---|---|
| expiracionTTL.test.ts | 10/10 | |
| Tests QA | 10/10 | |
| Suite backend | verde | |
| Typecheck | 0 errores | |
| `grep iniciarCron` | solo la definición (hallazgo) | |

**Dictamen provisional:** la lógica de expiración, liberación, filtros, auditoría y control de acceso cumple. **No aplicar `qa-approved`** hasta corregir el hallazgo 2 (el cron no arranca) y el 3 (`SKIP LOCKED` fuera de transacción y `update` sin guarda), o hasta que Julio los acepte como pendientes.
