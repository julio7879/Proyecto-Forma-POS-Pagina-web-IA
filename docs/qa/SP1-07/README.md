# QA · SP1-07 · Certificación de Seguridad del Sprint 1 (Issue #7)

Responsable: Duvan (@duvancovilla292-prog) · QA Lead

```
docs/qa/SP1-07/
├── README.md                                   ← este archivo
├── MATRIZ-PRUEBAS-SP1-07.md                    ← casos Gherkin, matriz QA-002, defectos y QA Gate
├── COMENTARIO-ISSUE-7.md                       ← texto listo para pegar en el Issue #7
├── sql/
│   ├── QA-022-certificacion-constraints.sql    ← pegar en Supabase SQL Editor
│   └── 00-fixture-local-equivalente-seed.sql   ← SOLO para reproducir en Postgres local
├── postman/
│   ├── Forma-SP1-07-QA.postman_collection.json ← 34 peticiones en 5 carpetas
│   └── Forma-Local.postman_environment.json    ← baseUrl http://localhost:3001
└── evidencia/
    └── QA-022-ejecucion-local.txt              ← salida real del script + control negativo
```

## 1. QA-022 en Supabase (5 min)
1. Supabase → proyecto de **desarrollo** → *SQL Editor* → *New query*.
2. Pegar el contenido completo de `sql/QA-022-certificacion-constraints.sql` → **Run**.
3. Todas las filas deben decir `PASA`. Tomar captura de la tabla y adjuntarla al Issue #7.

El script no deja datos: cada intento se revierte. Si alguna fila sale `FALLA (la BD ACEPTÓ...)`, falta aplicar `backend/prisma/constraints_post_migrate.sql`.

## 2. Colección HTTP
1. Postman → *Import* → los dos archivos de `postman/`. En **Thunder Client**: *Collections → ☰ → Import* (colección) y *Env → ☰ → Import* (environment).
2. Seleccionar el environment **Forma · Local (backend :3001)**.
3. Levantar el backend: `cd backend && npm run dev`.
4. *Run collection* → carpetas `00`, `01`, `02` y `04`. **Desmarcar** las peticiones marcadas `[MANUAL]` y `[PENDIENTE]`.
5. Las peticiones `[MANUAL]` de la carpeta 01 se lanzan aparte, siguiendo la descripción de cada una.

Resultado esperado hoy en `develop`: casi todo en verde. Fallan a propósito, porque documentan defectos: QA002-10, QA002-11, QA002-12, SEC01-01, SEC01-02 y QA001-12.

## 3. Reproducir en PostgreSQL local (sin Supabase)
```bash
URL=postgresql://postgres:postgres@localhost:5432/forma_qa
psql "$URL" -f backend/prisma/migrations/20261102193711_init/migration.sql
psql "$URL" -f backend/prisma/migrations/20261102221000_add_movimientos_caja_y_relevos/migration.sql
psql "$URL" -f backend/prisma/constraints_post_migrate.sql
psql "$URL" -f docs/qa/SP1-07/sql/00-fixture-local-equivalente-seed.sql
psql "$URL" -f docs/qa/SP1-07/sql/QA-022-certificacion-constraints.sql
```
