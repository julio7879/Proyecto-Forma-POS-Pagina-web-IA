# QA Issue #57 — Certificación PR #56 (SP4-06 Retorno Logístico y Devolución Comercial Web)

Rama QA: `qa/SP4-06-certificacion-retorno-devolucion-web` (desde `develop`, base `73ef2cd`).
Responsable QA: @duvancovilla292-prog · Desarrollador: Julio · Criterios: RF-WEB-07, RF-DEV-04, RN-WEB-23, RN-DEV-14, RN-REP-01..04, CA-64, CA-65, QA-020, QA-021
Estado: **revisión estática hecha; ejecución local PENDIENTE**. Dictamen provisional: **NO aplicar `qa-approved` todavía** (hallazgos 2 y 3).

## Qué agrega esta rama (solo QA)
| Archivo | Para qué |
|---|---|
| `backend/src/modules/11-pedidos-web/__tests__/retornoLogisticoYDevolucionWeb.qa.test.ts` | 12 pruebas. **HTTP con Prisma mockeado (9):** retorno total sin `DevolucionComercialWeb`, retorno averiado → NO_VENDIBLE, imputación 2 vs reingreso 1, reembolso parcial con descuento y sin flete ($45.000), devolución total exacta ($175.000) con cosmético forzado a NO_VENDIBLE y REEMBOLSADO, fuera de plazo sin motivo → 422, CLIENTE → 403, y 2 `[HALLAZGO]`. **Dominio puro (3):** plazo de 5 días hábiles con fin de semana, festivo real y entrega a las 23:30 hora Colombia. |

## Hallazgos
1. **GitFlow:** el PR #56 ya está en `develop` (`1fa386c`); el Issue lo indica.
2. **La tabla de festivos está vacía (defecto con impacto legal, RN-DEV-14):** el plazo de 5 días hábiles lee `FestivoColombia`, pero **`prisma/seed.ts` no carga ningún festivo** y ningún otro código los inserta. En una BD real la lista llega vacía y **los festivos se cuentan como días hábiles**. Un cliente que devuelve dentro del plazo legal en una semana con festivo (por ejemplo, el lunes 16-nov-2026) es **rechazado con 422**. La función `ColombiaTime` está bien (QA-11 lo demuestra con y sin festivo); falta el dato. **Corrección:** sembrar los festivos de Colombia 2026-2027 en el seed o en una migración.
3. **Doble reembolso o doble reingreso con peticiones simultáneas (defecto):** los comentarios dicen "Obtener y bloquear el pedido", pero `tx.pedidoWeb.findUnique` **no usa `FOR UPDATE`** y los `update` no filtran por `version`.
   - **Devolución comercial:** dos solicitudes simultáneas de la misma línea leen `cantidadDevueltaAcum = 0`, pasan la validación y **las dos reembolsan**. Como el acumulado usa `increment`, puede quedar `cantidadDevueltaAcum > cantidad` (no hay `CHECK` en BD).
   - **Retorno logístico:** dos solicitudes simultáneas ven `ENVIADO` y **reingresan el stock dos veces**.
   La idempotencia no lo evita, porque son claves distintas (por ejemplo, dos admins o un doble clic con clave nueva). **Corrección:** `SELECT … FROM "PedidoWeb" WHERE id = $1 FOR UPDATE` al inicio, o `update where { id, version }`.
4. **Retorno parcial pierde unidades sin rastro:** si `lineas` trae menos unidades de las enviadas, el pedido igual pasa a NO_ENTREGADO y las unidades no devueltas **desaparecen** sin movimiento ni novedad (QA-3). En un rechazo en puerta toda la mercancía debería volver, o registrarse la pérdida.
5. **Devolución comercial sobre pedido ENVIADO:** se acepta un pedido `ENVIADO` + `PAGADO` (aún no entregado), y el plazo se cuenta desde `fechaEnvio` o incluso `fechaCreacion` si no hay `fechaEntrega` (QA-9). La guía dice que aplica a **ENTREGADO + PAGADO**; RN-DEV-14 cuenta "desde la entrega".
6. **Guía con estado inexistente:** la guía menciona "ENVIADO o DESPACHADO". `DESPACHADO` no existe en `EstadoPedidoWeb` (el código correctamente solo acepta `ENVIADO`). Es el mismo origen del defecto reportado en SP4-03 (#54).
7. **`autorizadoFueraPlazo` se guarda aunque no hiciera falta:** si el admin lo envía estando dentro del plazo, queda registrado como "autorizado fuera de plazo". Es menor, pero afecta los reportes de excepciones.
8. **Lo que está bien:** la bifurcación contable es correcta (el retorno no crea `DevolucionComercialWeb` y anula el cobro). La imputación a la sede despachadora con `ubicacionDespachoReconocidoId ?? ubicacionAsignadaId` funciona. El flete nunca se reembolsa. El reembolso parcial usa el neto con descuento y la última unidad absorbe el residuo. Los cosméticos van forzosamente a NO_VENDIBLE. El acceso es solo ADMIN (middleware + servicio).

## Revisión por criterio
| Criterio | Evidencia | Resultado |
|---|---|---|
| Retorno: solo CONTRAENTREGA + ENVIADO → NO_ENTREGADO / ANULADO | tests originales + QA-1 | ✅ |
| Retorno: sin `DevolucionComercialWeb` (RN-REP-01) | QA-1 | ✅ |
| Retorno: VENDIBLE / NO_VENDIBLE en el Kardex | QA-1, QA-2 | ✅ (ver hallazgo 4) |
| Devolución: imputación 2 / reingreso 1 (CA-65) | test original + QA-4 | ✅ |
| Flete excluido (RN-REP-02) | QA-5, QA-6 | ✅ |
| Descuento prorrateado respetado (CA-26) | QA-5 | ✅ |
| Cosméticos → NO_VENDIBLE (RN-CAT-02) | test original + QA-6 | ✅ |
| Plazo 5 días hábiles con festivos (RN-DEV-14) | QA-10..12 | ⚠️ lógica ✅, **datos ❌** (hallazgo 2) |
| Fuera de plazo exige autorización **y** motivo | tests originales + QA-7 | ✅ |
| Solo ADMIN (403 al resto) | tests originales + QA-8 | ✅ |
| Concurrencia (doble reembolso o reingreso) | revisión de código | ❌ hallazgo 3 |

## Cómo ejecutar (desde la raíz)
```bash
npm test --prefix backend -- src/modules/11-pedidos-web/__tests__/retornoLogisticoYDevolucionWeb.test.ts      # 17/17
npm test --prefix backend -- src/modules/11-pedidos-web/__tests__/retornoLogisticoYDevolucionWeb.qa.test.ts   # 12/12
npm test --prefix backend
npm run typecheck --prefix backend
grep -n -i festivo backend/prisma/seed.ts     # evidencia hallazgo 2 (no imprime nada)
```

## Resultados (llenar)
| Comprobación | Esperado | Obtenido |
|---|---|---|
| retornoLogisticoYDevolucionWeb.test.ts | 17/17 | |
| Tests QA | 12/12 | |
| Suite backend | verde | |
| Typecheck | 0 errores | |
| `grep festivo seed.ts` | vacío (hallazgo) | |

**Dictamen provisional:** la bifurcación contable, la imputación a origen, la exclusión del flete, el prorrateo, los cosméticos y el control de acceso cumplen. **No aplicar `qa-approved`** hasta corregir el hallazgo 2 (festivos sin cargar) y el 3 (doble reembolso o reingreso concurrente), o hasta que Julio los acepte como pendientes.
