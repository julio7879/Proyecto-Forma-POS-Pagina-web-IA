---
id: QA-SP1-07
tags: [qa, sprint-1, seguridad, gherkin, qa-gate, constraints]
issue: "#7"
responsable: Duvan (@duvancovilla292-prog)
estado: Fase 1 completada · Fase 2 a la espera de PRs
---
# SP1-07 · Matriz de Pruebas y Certificación de Seguridad del Sprint 1

Relacionado con: [[RN-ROL-Usuarios-y-Permisos]] | [[RN-INV-Kardex-y-Saldos]] | [[Matriz-CA-01-a-CA-65]] | [[MOD-01-Identidad]]

| Dato | Valor |
| :--- | :--- |
| Rama base evaluada | `develop` @ `7954b60` |
| Código bajo prueba | `backend/src/modules/01-identidad/*`, `shared/middlewares/authPermission.ts`, `backend/prisma/constraints_post_migrate.sql` |
| Formato | BDD / Gherkin (DADO · CUANDO · ENTONCES · Y) |
| Herramientas | Postman / Thunder Client (`postman/`), SQL Editor de Supabase (`sql/`), `npx vitest run`, `npx tsc --noEmit` |

> **Nota de trazabilidad (DEC-01):** en el Issue #7 los IDs `QA-001`, `QA-002` y `QA-022` nombran *login*, *sanitización* y *constraints*.
> En `Matriz-CA-01-a-CA-65.md` esos mismos IDs significan otra cosa (QA-001/002 = SKU y snapshot de precio; QA-022 = cliente que consulta pedidos ajenos).
> Esta matriz usa los IDs del issue y pide a Julio unificar la numeración.

---

## 1. QA-001 · Bloqueo de login tras 5 intentos fallidos (RF-USU-02, RN-ROL-08)

**Precondición común:** backend en `develop` corriendo; cuenta de prueba **desechable** (no usar `admin@forma.com` en la BD compartida, se bloquearía para todo el equipo). La colección crea la cuenta en `QA001-00`.

### QA-001-E1 · Bloqueo al 5.º intento fallido consecutivo
```gherkin
DADO   un usuario activo "qa.bloqueo.<ts>@forma-qa.test" con intentosFallidosLogin = 0 y bloqueadoHasta = NULL
CUANDO envía POST /api/auth/login con contraseña incorrecta 4 veces seguidas
ENTONCES cada respuesta es 401 y el mensaje indica 4, 3, 2 y 1 intentos restantes
CUANDO envía la 5.ª contraseña incorrecta
ENTONCES responde 423 Locked con error.code = "CUENTA_BLOQUEADA"
  Y el mensaje es "Ha superado el límite de 5 intentos fallidos. Su cuenta ha sido bloqueada temporalmente por 15 minutos."
  Y en BD: intentosFallidosLogin = 5 y bloqueadoHasta ≈ now() + 15 min (tolerancia ±1 min)
```
Verificación en BD:
```sql
SELECT correo, "intentosFallidosLogin",
       "bloqueadoHasta",
       round(extract(epoch FROM ("bloqueadoHasta" - now())) / 60) AS minutos_restantes
FROM "Usuario" WHERE correo = '<correo de prueba>';
```
> El texto del ejemplo del issue ("Cuenta bloqueada temporalmente. Intente nuevamente en 15 minutos") **no** es el que devuelve el código; se certifica contra el mensaje real de `auth.service.ts:129`.

### QA-001-E2 · La contraseña correcta no desbloquea antes de tiempo
```gherkin
DADO   la cuenta bloqueada en E1 (bloqueadoHasta en el futuro)
CUANDO envía la contraseña CORRECTA
ENTONCES responde 423 con "Intente nuevamente en N minuto(s)"
  Y intentosFallidosLogin sigue en 5 (no se incrementa ni se reinicia)
```

### QA-001-E3 · El bloqueo no se evade con mayúsculas ni por Google
```gherkin
DADO   la cuenta bloqueada
CUANDO hace login con el correo en MAYÚSCULAS
ENTONCES responde 423 (Zod normaliza a minúsculas)
CUANDO llama POST /api/auth/google con el mismo correo
ENTONCES responde 423
```

### QA-001-E4 · Desbloqueo al expirar los 15 minutos
```gherkin
DADO   la cuenta bloqueada
  Y han pasado 15 minutos (o en desarrollo se ejecuta:
       UPDATE "Usuario" SET "bloqueadoHasta" = now() - interval '1 minute' WHERE correo = '<correo>';)
CUANDO hace login con la contraseña correcta
ENTONCES responde 200 con token JWT
  Y en BD: intentosFallidosLogin = 0 y bloqueadoHasta = NULL
```

### QA-001-E5 · Tras expirar, el contador vuelve a dar 5 intentos *(falla con el código actual → DEF-SP107-03)*
```gherkin
DADO   una cuenta bloqueada cuyo bloqueadoHasta ya expiró y SIN login exitoso intermedio
CUANDO envía 1 contraseña incorrecta
ENTONCES (esperado por RN-ROL-08 "5.º intento fallido consecutivo") responde 401 con 4 intentos restantes
PERO   el código actual sube el contador a 6 y responde 423 de inmediato
```

### QA-001-E6 · Un login exitoso reinicia los fallos parciales
```gherkin
DADO   un usuario con 3 intentos fallidos
CUANDO inicia sesión correctamente
ENTONCES responde 200 Y intentosFallidosLogin = 0
CUANDO luego falla 1 vez
ENTONCES el mensaje indica 4 intentos restantes (no 1)
```

### QA-001-E7 · Usuario inexistente no revela información
```gherkin
DADO   un correo que no existe
CUANDO intenta iniciar sesión
ENTONCES responde 401 "Credenciales incorrectas" (mismo texto que contraseña errada, sin contador)
```

### QA-001-E8 · Concurrencia: ráfaga de 10 intentos simultáneos
```gherkin
DADO   un usuario activo con 0 fallos
CUANDO se disparan 10 logins erróneos en paralelo (Runner con 10 iteraciones / delay 0)
ENTONCES ninguna respuesta es 200 ni 500
  Y en BD intentosFallidosLogin ≥ 5
  Y intentosFallidosLogin = (nº de respuestas 401) + (nº de 423 con "Ha superado el límite…")
     (las 423 "Intente nuevamente en N minuto(s)" llegaron con la cuenta ya bloqueada y no incrementan;
      si la suma no cuadra, se perdió un incremento → race condition)
```

---

## 2. QA-002 · Sanitización de entradas: XSS, SQLi y validación (RN-GEN-01, Ley 1581)

**Criterio general de aceptación:** ninguna entrada maliciosa produce `200` indebido, `500`, stack trace, SQL en la respuesta, ni ejecución de script en el navegador.

| ID | Endpoint | Campo | Payload | Esperado | Comportamiento según código | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| QA002-01 | `POST /auth/registro-cliente` | `nombreCompleto` | `<script>alert('XSS')</script>` | 201 guardado literal **o** 400 (ver DEC-02) | 201: Zod solo valida longitud; se guarda tal cual | Requiere decisión |
| QA002-02 | `GET /auth/me` | — | (usuario de QA002-01) | JSON con `nosniff`; en el frontend se ve como texto, sin `alert()` | Helmet activo; React escapa `{}` | Ejecutar |
| QA002-03 | `POST /auth/registro-cliente` | `nombreCompleto` | `<img src=x onerror=alert(1)>` | igual que 01 | igual que 01 | Requiere decisión |
| QA002-04 | `POST /auth/login` | `correo` | `' OR '1'='1` | 400, detalle en `correo` | 400 por `z.email()` | Ejecutar |
| QA002-05 | `POST /auth/login` | `correo` + `password` | `admin'--@forma.com` / `' OR '1'='1` | 400 o 401, nunca 200/500 | Prisma parametriza → 401 | Ejecutar |
| QA002-06 | `POST /auth/login` | `password` | `' OR '1'='1' --` | 401 (o 423 si está bloqueada) | Cuenta como intento fallido | Ejecutar |
| QA002-07 | `POST /auth/login` | ambos | `{"$ne": null}` | 400 | 400 por tipos de Zod | Ejecutar |
| QA002-08 | `POST /auth/registro-cliente` | extra | `"rol":"ADMIN","permVender":true,...` | 201 con `rol = CLIENTE` | Zod descarta claves desconocidas | Ejecutar |
| QA002-09 | `POST /auth/registro-cliente` | `nombreCompleto` | 101 caracteres | 400 | `max(100)` | Ejecutar |
| QA002-10 | `POST /auth/registro-cliente` | `nombreCompleto` | `QA\u0000Nulo` | 400 | Probable **500**: PostgreSQL rechaza NUL (verificado) y no hay mapeo | DEF-SP107-04 |
| QA002-11 | `POST /auth/login` | cuerpo | JSON roto `{"correo":` | 400 | **500**: `errorHandler` ignora `err.status` de body-parser | DEF-SP107-05 |
| QA002-12 | `POST /auth/login` | cuerpo | > 100 KB | 413 | **500** (misma causa) | DEF-SP107-05 |
| QA002-13 | `POST /auth/registro-cliente` | `aceptoPrivacidad` | `false` | 400 con detalle `aceptoPrivacidad` | 400 | Ejecutar |

### QA-002-E1 · XSS almacenado no se ejecuta (escenario de navegador)
```gherkin
DADO   un cliente registrado con nombreCompleto = "<script>alert('XSS')</script>"
CUANDO inicia sesión en la Tienda Web y se muestra su nombre en el Navbar
ENTONCES el texto aparece literal en pantalla
  Y no se abre ningún alert ni aparece error en la consola del navegador
  Y en el código del frontend no existe dangerouslySetInnerHTML con datos del usuario
```

### QA-002-E2 · SQLi no altera la consulta
```gherkin
DADO   el formulario de login
CUANDO envía correo "' OR '1'='1" o contraseña "' OR '1'='1' --"
ENTONCES la respuesta es 400 o 401 con mensaje controlado
  Y no se devuelve token, ni texto SQL, ni stack trace
  Y en BD no cambia ningún registro distinto al contador de la cuenta atacada
```

### QA-002-E3 · Asignación masiva bloqueada
```gherkin
DADO   el endpoint público de registro
CUANDO se envían campos "rol": "ADMIN", "permVender": true, "topeDescuentoPorc": 100
ENTONCES el usuario se crea con rol CLIENTE y todos los permisos en false
```

> **DEC-02 (decisión del equipo):** el backend **no sanea** HTML; guarda el texto literal. Es una política válida (*codificar en la salida*) si se cumple siempre:
> React con `{}` (nunca `dangerouslySetInnerHTML`), `escapeHtml` en mensajes de Telegram con `parse_mode: "HTML"` y en las plantillas de correo de SP4-04.
> Alternativa: restringir `nombreCompleto` con una regex de letras/espacios. Julio debe elegir una de las dos para cerrar QA002-01/03.

---

## 3. CA-50 · Revocación de permisos en caliente (RN-ROL-05)

**Estado: BLOQUEADO para prueba de punta a punta.** Hoy `develop` no tiene (a) endpoint para editar permisos de un vendedor (RF-USU-03) ni (b) ninguna ruta protegida con `requirePermission(...)`. La lógica sí existe y tiene pruebas unitarias en `authPermission.test.ts` (sección 3).

### CA-50-E1 · Revocación por API surte efecto en la siguiente petición
```gherkin
DADO   un VENDEDOR con permVender = true y un JWT vigente (8 h)
  Y   la petición protegida por permVender responde 200
CUANDO el ADMIN desactiva permVender mediante el endpoint de RF-USU-03
ENTONCES la siguiente petición del vendedor, con el MISMO JWT, responde 403 "Permiso requerido no concedido: permVender"
  Y el vendedor no tuvo que cerrar sesión
  Y existe un RegistroAuditoria del cambio de permisos (RN-AUD-02)
```

### CA-50-E2 · Desactivación del usuario
```gherkin
DADO   un VENDEDOR autenticado
CUANDO el ADMIN lo desactiva (activo = false) por la API de RF-USU-05
ENTONCES la siguiente petición responde 401 "Usuario inactivo o no encontrado"
```

### CA-50-E3 · Cambio directo en la BD (limitación conocida)
```gherkin
DADO   un VENDEDOR autenticado (snapshot en UserPermissionCache)
CUANDO alguien cambia permVender = false directamente en Supabase (Table Editor / SQL)
ENTONCES el cambio NO es instantáneo: el snapshot cacheado sigue vigente hasta 60 s (TTL_MS)
  Y a partir de los 60 s la petición responde 403
```
> Resultado esperado documentado: CA-50 solo se garantiza si los cambios pasan por la API que llama `invalidateUserPermissions()`. Con varias instancias del backend, la invalidación en memoria no se propaga (ARQ-02 ya lo prevé).

**Criterio para desbloquear:** cuando llegue el PR de RF-USU-03, completar en la colección `CA50-02` (ruta real) y sustituir `CA50-01/03` por una ruta con `requirePermission('permVender')`.

---

## 4. QA-022 · Certificación de constraints nativos en PostgreSQL

**Script:** `sql/QA-022-certificacion-constraints.sql`. Se pega entero en el SQL Editor de Supabase y devuelve una tabla PASA/FALLA. Es **no destructivo**: cada intento corre en una subtransacción que se revierte.

> ⚠️ **Las consultas de ejemplo del Issue #7 dan un falso positivo.** Usan columnas que no existen (`codigo`, `esBodegaCentral`, `activo`, `cantidadFisica`), el tipo `'BODEGA'` (el enum es `CENTRAL`) e ids de texto (los ids son `SERIAL`). PostgreSQL responde `column "codigo" of relation "Ubicacion" does not exist` **antes** de evaluar el constraint, así que "da error" sin haber probado nada. Evidencia en `evidencia/QA-022-ejecucion-local.txt`, sección 3.

| Caso | Regla | Intento | Error esperado | Local (PG 16 + migraciones del repo) |
| :--- | :--- | :--- | :--- | :--- |
| P0 | — | Inventario de los 5 constraints/índices | Todos existen | PASA |
| A1 | RN-UBI-01 | INSERT segunda `CENTRAL` | `23505 uq_unica_bodega_central` | PASA |
| A2 | RN-UBI-01 | UPDATE de un punto a `CENTRAL` | `23505 uq_unica_bodega_central` | PASA |
| B1 | RN-INV-01 | `fisico = -5` | `23514 chk_saldo_stock_no_negativo` | PASA |
| B2 | RN-INV-01 | `reservadoBlando (3) > fisico (2)` | `23514 chk_saldo_stock_no_negativo` | PASA |
| B3 | RN-INV-01 | `noVendible = -1` | `23514 chk_saldo_stock_no_negativo` | PASA |
| B4 | RN-INV-01 | UPDATE de saldo válido a `-1` | `23514 chk_saldo_stock_no_negativo` | PASA |
| C1 | CA-51 | `precioVentaCop = 0` | `23514 chk_precio_venta_positivo` | PASA |
| D1 | QA-007 | 2 cajas `ABIERTA` en el mismo punto | `23505 uq_unica_sesion_caja_abierta_por_punto` | PASA |
| E1 | RN-CAJ-07 | `MovimientoCaja.montoCop = 0` | `23514 chk_movimiento_caja_monto_positivo` | PASA |
| P1 | — | No quedan residuos | Sin registros de prueba | PASA |

**Control negativo:** en una copia de la BD sin `chk_saldo_stock_no_negativo` ni `uq_unica_bodega_central`, el mismo script marca A1–B4 como `FALLA (la BD ACEPTÓ el dato inválido)` y no deja residuos. El script detecta de verdad la ausencia del constraint.

**Pendiente de Duvan:** ejecutarlo en Supabase (desarrollo), capturar la tabla final y pegarla en el Issue #7.

---

## 5. Defectos encontrados durante el diseño (Shift-Left)

| ID | Severidad | Módulo | Descripción | Evidencia / reproducción | Rama sugerida |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **DEF-SP107-01** | **Crítica** | SP1-02 Auth | `POST /api/auth/google` no verifica ningún ID token de Google: con solo el correo de un CLIENTE se obtiene su JWT. | `auth.schema.ts:24`, `auth.service.ts:199-237`. Colección: carpeta 04 (SEC01-00..02). | `bugfix/CA-SEC-google-idtoken` |
| DEF-SP107-02 | Media | SP1-02 Auth | Sin rate limit por IP (`express-rate-limit` instalado y sin usar). 5 intentos de un tercero bloquean cualquier cuenta, incluida la del admin (DoS dirigido). | `app.ts` sin limiter | `bugfix/CA-SEC-rate-limit-login` |
| DEF-SP107-03 | Media | SP1-02 Auth | Al expirar el bloqueo, `intentosFallidosLogin` sigue en ≥ 5: un solo fallo vuelve a bloquear 15 min. | `auth.service.ts:122`; caso QA-001-E5 | `bugfix/RF-USU-02-reinicio-contador` |
| DEF-SP107-04 | Baja | Global | Texto con `\u0000` llega a PostgreSQL ("null character not permitted") y termina en 500. | QA002-10 | `bugfix/validacion-nul` |
| DEF-SP107-05 | Baja | Global | `errorHandler` no respeta `err.status` de body-parser: JSON malformado y cuerpos > 100 KB responden 500 en vez de 400/413. | `errorHandler.ts:70`; QA002-11/12 | `bugfix/error-handler-body-parser` |
| DEF-SP107-06 | Media | SP1-05 Front | El proxy de Vite apunta a `:3000`; el backend escucha en `:3001`. El frontend no llega a la API en local (también en la rama de PR #17). | `frontend/vite.config.ts:10` vs `backend/src/config/env.ts:8` | Ajuste dentro de PR #17 |
| OBS-SP107-01 | Info | SP1-02 Auth | Una cuenta inactiva responde "Cuenta inactiva o suspendida…" antes de validar la contraseña: permite saber que el correo existe. | `auth.service.ts:90` | A decidir |

---

## 6. Fase 2 · Procedimiento del QA Gate por Pull Request

Para **cada PR** hacia `develop`:

```bash
git fetch origin
git checkout <rama-del-PR>          # ej. feature/SP1-05-vistas-auth-storefront
git pull

# Backend
cd backend
npm ci
npx tsc --noEmit                    # debe terminar sin errores (exit 0)
npx vitest run                      # todos en verde; anotar "X passed"

# Frontend (si el PR lo toca)
cd ../frontend
npm ci
npx tsc --noEmit
npx vitest run                      # solo si el PR trae tests de frontend
```

> `vitest` en backend necesita variables de entorno aunque use mocks: crear `backend/.env` a partir de `.env.example` con `JWT_SECRET` de **32+ caracteres** (si no, `env.ts` aborta al importar).

Luego: levantar el backend (`npm run dev`), importar la colección y correr la carpeta del módulo con el Runner (desmarcar las peticiones `[MANUAL]` y `[PENDIENTE]`). Finalmente publicar en el PR:

```markdown
## ✅ / ❌ QA Gate SP1-07 · PR #<n>
- Rama: `<rama>` @ `<sha corto>`
- `npx tsc --noEmit`: ✅ sin errores
- `npx vitest run`: ✅ <X> passed / 0 failed
- Colección Postman (carpeta <...>): <P> pass / <F> fail
- Criterios certificados: QA-001 E1–E4, E6–E8 · QA-002 (01–13) · CA-50 (<estado>)
- Defectos abiertos que bloquean: <DEF-...> | ninguno
- Decisión: **APROBADO** (`qa-approved`) | **RECHAZADO** (motivo)
— Duvan, QA Lead · <fecha COT>
```

Regla de bloqueo (MATRIZ-ROLES-Y-TAREAS §4): un PR **no** se aprueba si falla `tsc`, si falla algún test o si un criterio CA del módulo no tiene prueba.
