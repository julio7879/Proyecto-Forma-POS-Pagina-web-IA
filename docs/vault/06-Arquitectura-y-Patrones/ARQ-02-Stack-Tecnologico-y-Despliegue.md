---
id: ARQ-02
tags: [arquitectura, stack, supabase, pooler, desplegue, versiones]
---
# Stack Tecnológico, Infraestructura y Conexión Omnicanal

Relacionado con: [[00-Indice-Mapa-Mental-MOC]] | [[ARQ-01-Estrategia-y-Alcance-MVP]]

## 1. Estrategia de Versiones del Stack
Se arranca con un stack base probado y tipado estricto, con evolución validada en CI:
- **Lenguaje:** TypeScript (`strict: true`, `noUncheckedIndexedAccess: true`).
- **Backend:** Node.js LTS + Express + `tsx` + `express-async-errors`.
- **Frontend:** React + Vite + React Router DOM + Tailwind CSS + Lucide Icons + TanStack Query.
- **ORM & BD:** Prisma ORM + PostgreSQL 15+ (Supabase Cloud).
- **Utilidades Clave:** `zod` (validación), `bcryptjs` (hash), `jsonwebtoken` (auth), `date-fns` y `@date-fns/tz` (`America/Bogota`), `vitest` + `supertest` (testing).

## 2. Conexión Omnicanal sin Fricción
La Tienda Web, la Terminal POS y el Panel Admin **no se comunican entre sí**: todos consumen la misma API REST centralizada y operan sobre la misma base de datos en PostgreSQL.
- **Frontend Unificado con Code-Splitting:** Un único proyecto React + Vite con 3 layouts cargados dinámicamente (`React.lazy()`):
  1. `StorefrontLayout`: Tienda Web pública y móvil.
  2. `PosLayout`: Terminal POS de pantalla completa horizontal ($\ge 1024$ px).
  3. `AdminLayout`: Panel de control de bodega, compras, novedades y finanzas.
- **Revocación Instantánea (`CA-50`):** En instancia única se usa `UserPermissionCache` en memoria `O(1)`. Si escala a múltiples instancias, se apoya en invalidación pub/sub (`LISTEN/NOTIFY` de PostgreSQL o Redis) o consulta indexada directa.

## 3. Matices de Conexión a Supabase (Pooler vs. Sesión)
- **`DATABASE_URL` (Runtime):** Conexión vía pooler Supavisor en puerto `6543` (modo transacción) con `?pgbouncer=true&connection_limit=10`.
- **`DIRECT_URL` (Migraciones Prisma):** Conexión directa en puerto `5432` (modo sesión) para soportar DDL sin limitaciones de pooler.
