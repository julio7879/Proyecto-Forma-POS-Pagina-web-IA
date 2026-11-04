# QA Issue #15 — Certificación PR #13 (Seed catálogo por SKU, RN-CAT-01 a 04)

Rama QA: `qa/SP1-04-certificacion-seed-catalogo` (desde `develop` @ `878ccc2`).
Estado: **PARCIAL — verificación estática completada; ejecución en vivo PENDIENTE.**

## Verificación estática de `backend/prisma/seed.ts` (hecha)
| CA | Resultado | Evidencia |
|---|---|---|
| CA-CAT-01 | OK (código) | Se siembran Ropa, Accesorios, Cosméticos, Artesanías con `categoria.upsert` por `nombre` (único). |
| CA-CAT-02 | OK (código) | Solo Cosméticos tiene `esCosmeticoUsoPersonal: true`; Sérum Facial y Labial Cremoso con `reintegrableEnDevolucion: false`. |
| CA-CAT-03 | OK (código) | 10 variantes, 10 SKUs únicos, precios `[45000×4, 38000×2, 65000, 28000×2, 140000]` enteros > 0; además `chk_precio_venta_positivo` en `constraints_post_migrate.sql`. |
| CA-CAT-04 | OK (diseño) | Categorías, productos (`slug`) y variantes (`sku`) usan `upsert` sobre claves únicas ⇒ idempotente por diseño. Falta confirmarlo ejecutando 2 veces. |

## Hallazgos
1. **Guía del Issue con nombres incorrectos:** usa `"CategoriaProducto"`, `"VarianteProducto"` y la columna `"codigo"`; en `schema.prisma` son `"Categoria"`, `"Variante"` y no existe `codigo` (las categorías se identifican por `nombre`: «Ropa», «Cosméticos»…, no `ROPA`/`COSMETICOS`). Consultas corregidas en `sql/verificacion-seed-catalogo.sql`.
2. **Comando del Issue:** `npm run typecheck --prefix backend` / `npm test --prefix backend` es válido (scripts existen); `npx prisma db seed` debe correrse desde `backend/` (o con `--prefix`/`cd backend`).
3. **El seed no es solo de catálogo:** también siembra tarifas, DANE, ubicaciones y el usuario `admin@forma.com` (`Admin2026*`) con `update: {}`; no es un fallo, pero conviene no ejecutarlo contra producción.
4. El Issue indica «59/59 tests»: no pude contrastarlo (ver pendientes).

## Pendiente de ejecutar en tu máquina (requiere `.env` + BD)
```bash
cd backend && npm ci
npx tsc --noEmit && npx vitest run      # CA técnicas
npx prisma db seed                       # 1ª vez
npx prisma db seed                       # 2ª vez (idempotencia)
# luego ejecutar docs/qa/SP1-04/sql/verificacion-seed-catalogo.sql
```
Esperado: 4 categorías · 5 productos · 10 variantes, mismos conteos tras la 2ª corrida.

**Dictamen provisional:** sin bloqueantes en código; certificar (marcar CA-CAT-01..04 y cerrar) solo tras los resultados reales de los comandos de arriba.
