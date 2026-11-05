# QA Issue #83 — Certificación PR #75 (SP3-09 Modal de Cobro Rápido y Teclado Táctil POS)

Rama QA: `qa/SP3-09-certificacion-cobro-rapido` (desde `develop`, base `ff7dce5`; el PR #75 ya está fusionado: `79946d4`).
Responsable QA: @duvancovilla292-prog · Desarrollador: @andreycasadiego05-netizen (Thomas) · Criterios: RN-GEN-04, CA-51, CA-52, CA-53, RN-CAJ-06
Estado: **revisión estática hecha; ejecución local PENDIENTE**. Dictamen provisional: **NO certificable todavía** (hallazgos H-1 y H-2).

## Qué agrega esta rama (solo QA)
| Archivo | Para qué |
|---|---|
| `frontend/src/features/pos/__tests__/CobroRapidoModal.qa.test.tsx` | 17 pruebas: **TC-01 a TC-11 de la matriz del Issue** (una o más por caso), el borde de total $0 y 3 `[HALLAZGO]`. Prueban el teclado aislado con estado controlado (`00` sobre 0, `⌫` sobre 0, tope exacto 999.999.999), billetes que **asignan** (no suman), colores de las cajas Cambio y Falta, payloads exactos y altura táctil por clase `min-h`. |

## Resultado por caso de la matriz
| Caso | Resultado | Evidencia |
|---|---|---|
| TC-01 Dinero entero | ✅ | TC-01 (con enteros; ver observación 5) |
| TC-02 Dígitos y `00` | ✅ | TC-02 |
| TC-03 `C` y `⌫` | ✅ | TC-03 |
| TC-04 Tope anti-overflow | ✅ | TC-04 |
| TC-05 Billetes y Exacto | ✅ | TC-05 |
| TC-06 Cambio $25.000 en esmeralda con check | ✅ | TC-06 |
| TC-07 Falta $25.000 en rosa, botón deshabilitado | ✅ | TC-07 |
| TC-08 Transferencia: vuelto 0 y referencia obligatoria | ✅ | TC-08 |
| TC-09 Escape | ✅ | TC-09 |
| TC-10 Enter | ⚠️ funciona, pero permite **doble cobro** | TC-10 + H-2 |
| TC-11 Ergonomía táctil 46-52 px | ⚠️ cumple en teclado, billetes, métodos y Confirmar; **no** en Cancelar ni en la X | TC-11 + TC-11b |

## Hallazgos
1. **H-1 — Violación de las reglas de hooks (defecto, rompe la UI):** en `CobroRapidoModal.tsx` el `useEffect` de atajos (línea ~73) está **después** de `if (!isOpen) return null;` (línea ~41). Si el componente se monta cerrado y luego se abre, React lanza *"Rendered more hooks than during the previous render"* y **la pantalla del POS se cae**. Solo funciona si el padre lo monta ya abierto. Hoy el modal **no está integrado** en `PosTerminalPage`, así que el fallo aparecerá en cuanto se integre de la forma habitual (`<CobroRapidoModal isOpen={mostrar} … />`). **Corrección:** mover el `useEffect` (y `handleConfirmar` / `useCallback`) **antes** del `return null`.
2. **H-2 — Doble cobro con Enter (defecto, riesgo de dinero):** `handleConfirmar` no tiene bloqueo propio. Depende de que el padre cambie `isSubmitting`, y eso ocurre de forma asíncrona. Dos Enter seguidos (o Enter + clic) antes del siguiente render llaman `onConfirmarCobro` **dos veces**: dos ventas o dos cobros. **Corrección:** un `useRef`/`useState` local `enviando` que se active al primer intento.
3. **TC-11 parcial:** "Cancelar" (`py-2.5`, unos 40 px) y la "X" de cerrar (`p-2`, unos 36 px) no llegan al mínimo táctil de 46-52 px.
4. **Componente sin integrar:** `CobroRapidoModal` no se importa en ninguna pantalla; `PosTerminalPage` sigue usando su propio modal de cobro (el de SP1-06, con los defectos reportados en #33). El checklist no se puede probar en el flujo real, solo aislado.
5. **Sin protección de decimales en el total:** `formatCOP` usa `toLocaleString('es-CO')`; si `totalVentaCop` llegara con decimales, se mostrarían. Depende del backend (que sí valida enteros).
6. **Sin teclado físico:** el teclado en pantalla no responde a las teclas numéricas del teclado físico. Es opcional, pero útil en un mostrador con teclado.
7. **Lo que está bien:** el teclado (concatenación, `00`, `C`, `⌫` con `Math.floor`, tope de 999.999.999 sin romper). Los billetes asignan y Exacto pone el total. El cambio y la falta se calculan en tiempo real con los colores pedidos. El botón se deshabilita con efectivo insuficiente o total $0. La transferencia exige una referencia sin espacios vacíos, con vuelto 0 y monto igual al total. Escape está bloqueado mientras se procesa.

## Cómo ejecutar (desde la raíz)
```bash
npm test --prefix frontend -- src/features/pos/__tests__/CobroRapidoModal.test.tsx      # 7/7 (suite del PR)
npm test --prefix frontend -- src/features/pos/__tests__/CobroRapidoModal.qa.test.tsx   # 17/17
npm test --prefix frontend
npm run build --prefix frontend
```

## Resultados (llenar)
| Comprobación | Esperado | Obtenido |
|---|---|---|
| CobroRapidoModal.test.tsx | 7/7 | |
| Tests QA | 17/17 | |
| Suite frontend | verde | |
| Build | 0 errores | |

**Dictamen provisional:** TC-01 a TC-09 cumplen; TC-10 y TC-11 parcialmente. **No habilitar** como "aprobado" hasta corregir **H-1** (hooks condicionales: la UI se cae al abrir el modal) y **H-2** (doble cobro con Enter), o hasta que Julio lo acepte como pendiente de la integración.
