# QA Issue #34 — Certificación PR #27 (Catálogo Storefront, Filtros y Selector de Variantes, SP1-09)

Rama QA: `qa/SP1-09-certificacion-catalogo-storefront` (desde `develop`).
Responsable QA: @duvancovilla292-prog · Desarrollador: @ExneiderNava · Criterios: CA-31, CA-35, RN-CAT-01/02/03, RN-WEB-02, RN-GEN-04
Estado: **revisión estática hecha; ejecución local y prueba visual PENDIENTES**. Dictamen provisional: **certificable con observaciones** (no hay bloqueantes en la UI).

## Qué agrega esta rama (solo QA)
| Archivo | Para qué |
|---|---|
| `frontend/src/features/storefront/__tests__/CatalogStorefront.qa.test.tsx` | 17 pruebas que cubren lo que la suite original no verifica: umbrales del semáforo (6/5/1/0), que no aparezcan cifras de stock en la tarjeta ni en el modal, la insignia de cosméticos en Sérum y Labial, la advertencia Ley 1480 del modal, S→M→L con su SKU, `ROP-CAM-BLA-M` agotada con botón deshabilitado, Escape, backdrop, clic interno y formato COP. |

## Hallazgos
1. **GitFlow:** el PR #27 ya está fusionado en `develop` (`fa1632e`) antes del QA Gate.
2. **El catálogo siempre muestra datos de ejemplo (observación importante):** el frontend llama a `GET /api/catalogo/productos`, pero el backend (`modules/03-catalogo`) solo tiene `/health`. La llamada falla y `getProductosCatalogo` devuelve `PRODUCTOS_SEMILLA` **en silencio**. Consecuencias:
   - El banner de error con botón "Reintentar" de `CatalogPage` **nunca aparece**, porque el servicio atrapa el error y nunca lo propaga (código muerto).
   - Si en producción la API falla, el cliente verá productos y precios falsos sin ningún aviso.
3. **RN-WEB-02 a nivel de API (observación de diseño):** la UI no muestra cifras ✅, pero el contrato `VarianteDTO.stockDisponible` es un **número entero** que llega al navegador. Cuando exista el endpoint real, cualquiera podrá ver las unidades exactas en DevTools → Red. Sugerencia: que el backend envíe solo el estado (`DISPONIBLE` / `ULTIMAS` / `AGOTADO`).
4. **Agotado en la tarjeta:** el checklist pide "🔴 Agotado con botón deshabilitado". En la tarjeta la insignia "Agotado" es **gris** (no roja) y el botón "Ver detalles" **nunca se deshabilita**. Solo en el modal el botón queda como "Variante Agotada" deshabilitado. Además, **ningún producto semilla está agotado completo**, así que este caso no se puede ver en el navegador (lo cubre el test QA con stock 0).
5. **"Agregar a la Bolsa" no hace nada:** `CatalogPage` no pasa `onAddToCart` al modal; el botón solo cierra el modal. No está en el checklist, pero un comprador lo notaría.
6. **"Desde $X" usa la primera variante**, no la de menor precio. Hoy da igual porque todas las variantes de cada producto valen lo mismo.
7. **Selector de variantes:** si eliges una talla que no existe en el color actual, cambia el color sin avisar (ej.: Blanco → L pasa a Negro-L). Las combinaciones inexistentes no se marcan.
8. **Accesibilidad del modal (observación):** el foco no se mueve al modal al abrirlo ni queda atrapado dentro, y el scroll del fondo no se bloquea.
9. La imagen de reserva usa `via.placeholder.com`, que es un servicio caído.
10. **Conteo de tests:** el Issue dice 34 globales; con esta rama son **51** (34 + 17 QA).

## Revisión estática por criterio
| Criterio | Resultado |
|---|---|
| RN-CAT-01: píldoras Todas/Ropa/Accesorios/Cosméticos/Artesanías, filtro reactivo sin recarga | ✅ (`useMemo`, `role="tab"`, `aria-selected`) |
| RN-CAT-02 / CA-31: insignia en Sérum y Labial | ✅ |
| RN-CAT-02: advertencia Ley 1480 en el modal | ✅ |
| RN-WEB-02 / CA-35: sin cifras en la UI | ✅ (ver hallazgo 3 a nivel de API) |
| Semáforo >5 / 1–5 / 0 | ✅ |
| Agotado con botón deshabilitado | ⚠️ solo en el modal (hallazgo 4) |
| RN-CAT-03: S→M→L actualiza el SKU | ✅ |
| `ROP-CAM-BLA-M` agotada → "Variante Agotada" deshabilitado | ✅ |
| Escape / backdrop / `stopPropagation` | ✅ |
| RN-GEN-04: COP sin decimales | ✅ (`maximumFractionDigits: 0`) |

## Cómo ejecutar
```bash
npm test --prefix frontend -- src/features/storefront/__tests__/CatalogPage.test.tsx            # 6/6
npm test --prefix frontend -- src/features/storefront/__tests__/CatalogStorefront.qa.test.tsx   # 17/17
npm test --prefix frontend                                                                      # 51/51
npm run build --prefix frontend                                                                 # 0 errores
npm run dev --prefix frontend   # → http://localhost:5173/
```

## Resultados de ejecución (llenar)
| Comprobación | Esperado | Obtenido |
|---|---|---|
| Tests CatalogPage | 6/6 | |
| Tests QA | 17/17 | |
| Suite frontend | 51/51 | |
| Build | 0 errores | |
| Filtros reactivos (5 píldoras) | OK | |
| Insignia en Sérum y Labial | OK | |
| Advertencia Ley 1480 en el modal | OK | |
| Sin cifras de stock en pantalla | OK | |
| Semáforo: Camiseta Disponible, Labial ¡Últimas unidades! | OK | |
| S→M→L SKU | OK | |
| Blanco (M) → Variante Agotada deshabilitado | OK | |
| Escape / backdrop / clic interno | OK | |
| Precios sin decimales | OK | |
| DevTools → Red: `/api/catalogo/productos` | — | 404 / error (hallazgo 2) |

**Dictamen provisional:** la UI cumple el checklist. Se certifica con las observaciones 2 a 5 para backlog (sobre todo 2 y 3, que afectan producción).
