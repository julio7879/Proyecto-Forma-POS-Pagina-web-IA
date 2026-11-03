## 🧪 SP1-07 · Fase 1 entregada — Matriz de pruebas + certificación de constraints

Hola @julio7879, dejo la Fase 1 en la rama `feature/SP1-07-qa-matriz-pruebas` (PR a `develop`), carpeta `docs/qa/SP1-07/`:

| Archivo | Contenido |
| :--- | :--- |
| `MATRIZ-PRUEBAS-SP1-07.md` | Casos Gherkin de QA-001 (8 escenarios), QA-002 (13 payloads + 3 escenarios), CA-50 (3 escenarios), QA-022 y procedimiento del QA Gate |
| `sql/QA-022-certificacion-constraints.sql` | Script autoverificable (PASA/FALLA) y no destructivo para Supabase |
| `postman/*.json` | Colección (34 peticiones) + environment, importable en Postman y Thunder Client |
| `evidencia/` | Ejecución local del script SQL y del control negativo |

### 1️⃣ Casos de prueba (resumen; detalle completo en la matriz)

**🧪 QA-001 · Bloqueo por fuerza bruta**
- **DADO** un usuario activo de prueba con `intentosFallidosLogin = 0`
- **CUANDO** falla la contraseña 5 veces seguidas
- **ENTONCES** los intentos 1–4 responden `401` con 4, 3, 2 y 1 intentos restantes, y el 5.º responde `423 Locked` con `code: "CUENTA_BLOQUEADA"`
- **Y** en BD `intentosFallidosLogin = 5` y `bloqueadoHasta ≈ now() + 15 min`. Durante el bloqueo, la clave correcta, el correo en mayúsculas y `/auth/google` también responden `423`.

**🧪 QA-002 · Sanitización XSS / SQLi**
- **DADO** el registro y el login
- **CUANDO** se envían `<script>alert('XSS')</script>`, `' OR '1'='1`, `{"$ne": null}`, `"rol":"ADMIN"`, `\u0000` o JSON malformado
- **ENTONCES** no hay `200` indebido, ni `500`, ni SQL o stack trace en la respuesta. SQLi responde `400`/`401`. La escalada de rol se ignora (queda `CLIENTE`).
- **Y** el XSS se guarda **literal** y debe verse como texto en el front (→ decisión DEC-02 abajo).

**🧪 CA-50 · Revocación en caliente**
- **DADO** un vendedor con JWT vigente y `permVender = true`
- **CUANDO** el admin revoca `permVender` por la API
- **ENTONCES** la siguiente petición con el **mismo** JWT responde `403`, sin re-login
- **Y** queda un `RegistroAuditoria`.

⚠️ CA-50 está **bloqueado E2E**: aún no existen el endpoint de RF-USU-03 ni rutas con `requirePermission`. Por ahora está cubierto por los tests unitarios de `authPermission.test.ts`. Además, un cambio hecho directo en la BD tarda hasta 60 s (TTL del caché).

### 2️⃣ QA-022 · Constraints en PostgreSQL

⚠️ **Las consultas de ejemplo de este issue dan falso positivo**: usan columnas que no existen (`codigo`, `esBodegaCentral`, `cantidadFisica`), el tipo `'BODEGA'` e ids de texto. PostgreSQL falla con `column "codigo" ... does not exist` **antes** de llegar al constraint. Por eso armé `sql/QA-022-certificacion-constraints.sql`, que valida el error exacto.

Resultado sobre PostgreSQL 16 con las migraciones y `constraints_post_migrate.sql` del repo:

```
A1  INSERT 2.ª Bodega Central         PASA  23505 uq_unica_bodega_central
A2  UPDATE punto → CENTRAL            PASA  23505 uq_unica_bodega_central
B1  fisico = -5                       PASA  23514 chk_saldo_stock_no_negativo
B2  reservadoBlando > fisico          PASA  23514 chk_saldo_stock_no_negativo
B3  noVendible = -1                   PASA  23514 chk_saldo_stock_no_negativo
B4  UPDATE saldo a -1                 PASA  23514 chk_saldo_stock_no_negativo
C1  precioVentaCop = 0                PASA  23514 chk_precio_venta_positivo
D1  2 cajas ABIERTA mismo punto       PASA  23505 uq_unica_sesion_caja_abierta_por_punto
E1  MovimientoCaja monto 0            PASA  23514 chk_movimiento_caja_monto_positivo
```
<!-- REEMPLAZAR por la captura de la ejecución en Supabase -->
📸 **Captura en Supabase (desarrollo):** _(adjuntar imagen de la tabla final)_

### 3️⃣ Defectos detectados (Shift-Left)

| ID | Sev. | Descripción |
| :--- | :--- | :--- |
| **DEF-SP107-01** | 🔴 Crítica | `/api/auth/google` no verifica el ID token de Google: con solo el correo de un cliente se obtiene su JWT (carpeta 04 de la colección) |
| DEF-SP107-02 | 🟠 Media | Sin rate limit por IP; 5 intentos de un tercero bloquean cualquier cuenta (incluido el admin) |
| DEF-SP107-03 | 🟠 Media | Al expirar el bloqueo el contador no se reinicia: 1 fallo vuelve a bloquear |
| DEF-SP107-04 | 🟢 Baja | `\u0000` en texto → 500 |
| DEF-SP107-05 | 🟢 Baja | JSON malformado / cuerpo > 100 KB → 500 en vez de 400/413 |
| DEF-SP107-06 | 🟠 Media | Proxy de Vite a `:3000`, backend en `:3001` (también en PR #17) |

### 4️⃣ Decisiones que necesito de tu parte
- **DEC-01:** los IDs QA-001/002/022 de este issue no coinciden con `Matriz-CA-01-a-CA-65.md` (allí QA-001/002 son SKU/precio y QA-022 es "cliente consulta pedidos ajenos"). ¿Unificamos la numeración?
- **DEC-02:** ¿el backend **rechaza** HTML en `nombreCompleto` (regex) o **guarda literal y se escapa en la salida** (React, Telegram, correos)?
- **DEC-03:** confirmar que tras expirar el bloqueo el usuario vuelve a tener 5 intentos (DEF-SP107-03).

### ✅ Checklist Fase 1
- [x] Diseño de Casos de Prueba (Markdown / Gherkin)
- [x] Certificación de Constraints (script validado en local · pendiente captura en Supabase)
- [x] Preparación de Suite HTTP (colección + environment)

— Duvan · QA Lead
