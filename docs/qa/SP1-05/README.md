# QA Issue #24 — Certificación PR #17 (Login, Registro Ley 1581, Navbar Storefront)

Rama QA: `qa/SP1-05-certificacion-vistas-auth` (desde `develop`).
Responsable QA: @duvancovilla292-prog · Desarrollador: @ExneiderNava · Issue origen: #5 (SP1-05)
Estado: **revisión estática hecha (sin bloqueantes); ejecución de tests y prueba visual PENDIENTE de evidencia local.**

## Hallazgos de la revisión
1. **GitFlow: el PR #17 ya está fusionado en `develop`** (commit `0fef2e2`, 03-nov-2026), aunque la regla del Issue dice que no podía fusionarse antes de que QA validara el checklist. El código de `feature/SP1-05-vistas-auth-storefront` (`fc1ca63`) y el de `develop` son **idénticos** en `features/auth`, `layouts` y `routes`, así que se certifica sobre `develop`. Se deja constancia para el tracker.
2. **Referencia rota en la guía del Issue:** el comentario cita el test 423 como "[SP1-04] Issue #T2…#4" (es un autolink de GitHub). El test real es `LoginForm.test.tsx › muestra alerta de bloqueo si el backend responde HTTP 423`.
3. **Cobertura automática incompleta (observación, no bloqueante):**
   - No hay test para `CLIENTE → /` en login (solo ADMIN y VENDEDOR). Se cubre en la prueba manual.
   - **No hay tests del Navbar** (estado sin sesión, nombre tras login, logout, aria-label). Se cubre en la prueba manual.
4. **Backend (fuera del alcance del PR, observación):** en `auth.service.ts` el contador `intentosFallidosLogin` no se reinicia cuando expira `bloqueadoHasta`; tras los 15 min, **un solo fallo** vuelve a bloquear la cuenta (en vez de dar 5 intentos nuevos). Se recomienda abrir un issue aparte.
5. **Responsive (verificar visualmente):** en el Navbar el nombre del usuario no tiene `truncate`/`max-w`; un nombre largo puede desbordar en pantallas de 320–375 px.
6. Los tests y el build **no pudieron ejecutarse en el entorno donde se escribió este documento** (instalación de dependencias bloqueada). Los resultados 8/8, build y 61/61 deben tomarse de tu máquina.

## Revisión estática por criterio — resultado
| Criterio | Dónde | Resultado |
|---|---|---|
| Correo válido y en minúsculas | `authSchema.ts` (`.trim().email().toLowerCase()`), también en backend | ✅ |
| Contraseña ≥ 8 y confirmación igual | `registerSchema` `.min(8)` + `.refine(password === confirmarPassword)` | ✅ |
| `confirmarPassword` no viaja a la API | `RegisterForm.tsx` (destructuring) + test de registro exitoso | ✅ |
| Ley 1581: checkbox NO premarcado y bloquea | `defaultValues.aceptoPrivacidad: false` + `refine(val === true)`; también se exige en backend | ✅ |
| Enlace a `/politica-privacidad` | `<Link to="/politica-privacidad" target="_blank">` + ruta en `AppRouter.tsx` | ✅ (abre en pestaña nueva, el formulario no se pierde) |
| Opcionales vacíos sin 400 | se filtran `''`/`undefined`/`null` antes de enviar; backend los acepta como `optional()` | ✅ |
| Correo duplicado → 409 amigable | backend `AppError.conflict`; UI muestra `error.message` | ✅ |
| Auto-login tras registro y redirección a `/` | guarda `token` y `usuario` en localStorage → `navigate('/')` | ✅ |
| 401 con mensaje rojo | caja `bg-red-100 text-red-600` con el mensaje del backend ("Intentos restantes…") | ✅ |
| Redirección por rol | ADMIN → `/admin/dashboard`, VENDEDOR → `/pos/venta`, resto → `/` | ✅ |
| 5.° fallo → 423 + alerta ámbar 15 min | backend bloquea con `>= 5`; UI detecta `status 423` o `CUENTA_BLOQUEADA` | ✅ |
| Navbar sin sesión → icono a `/login` | `Navbar.tsx` | ✅ |
| Navbar reactivo sin recargar | se resincroniza con `location.pathname` y el evento `storage` | ✅ |
| Logout limpia y va a `/login` | `removeItem('token'/'usuario')` + `navigate('/login')` | ✅ |
| aria-label en botones de icono | carrito, login, logout, mostrar/ocultar contraseña | ✅ |

## Cómo ejecutar (desde la raíz del repo)
```bash
git fetch origin
git checkout qa/SP1-05-certificacion-vistas-auth
npm ci --prefix frontend && npm ci --prefix backend
npm test --prefix frontend -- src/features/auth/__tests__/   # 8/8 (4 Login + 4 Registro)
npm run build --prefix frontend                               # 0 errores TS / Vite
npm test --prefix backend                                     # 61/61
```
Prueba visual: `npm run dev --prefix backend` y `npm run dev --prefix frontend` en dos terminales; abrir http://localhost:5173.

## Resultados de ejecución (llenar)
| Comprobación | Esperado | Obtenido |
|---|---|---|
| Tests frontend auth | 8/8 | |
| Build frontend | 0 errores | |
| Tests backend | 61/61 | |
| Flujo Registro (Ley 1581) | OK | |
| Flujo Login / roles / 423 | OK | |
| Navbar y logout | OK | |
| Móvil (375 px) | sin desbordes | |

**Dictamen provisional:** sin bloqueantes en código. Certificar al completar la tabla de resultados.
