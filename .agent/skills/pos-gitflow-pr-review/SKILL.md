---
name: pos-gitflow-pr-review
description: Revisa y audita de forma exhaustiva Issues y Pull Requests en el repositorio bajo GitFlow. Valida invariantes del sistema, genera comentarios con correcciones exactas y crea automáticamente la tarea de QA para Duvan antes de permitir el merge a develop o main. Activar al revisar código, evaluar un PR, auditar ramas o preparar entregas.
---
# Auditor Exhaustivo de Issues y Pull Requests (GitFlow + Guardrails)

Esta skill audita cada Pull Request o Issue en el repositorio [`Proyecto-Forma-POS-Pagina-web-IA`](https://github.com/julio7879/Proyecto-Forma-POS-Pagina-web-IA.git) para garantizar que ningún código con fallos de concurrencia, reglas rotas o falta de pruebas llegue a `develop` o `main`.

---

## 1. Reglas de Validación de Ramas y GitFlow

Todo Pull Request debe cumplir estrictamente la nomenclatura de ramas:
- `feature/RF-XXX-descripcion`: Para nuevas funcionalidades (asignadas a Julio, Exneider, Yeimer o Thomas).
- `bugfix/CA-XX-descripcion`: Para correcciones de fallos reportados en QA o auditorías.
- `release/vX.X`: Para congelamiento de versiones y certificación integral de Sprint.
- `hotfix/descripcion`: Para parches críticos directos sobre `main`.

**Destino de PRs:**
- Todo `feature/*` y `bugfix/*` debe apuntar como base a **`develop`**.
- Solo `release/*` y `hotfix/*` pueden fusionarse hacia **`main`**.
- Prohibido hacer PRs directos de `feature/` hacia `main`.

---

## 2. Checklist de Guardrails Obligatorios (DoD)

Antes de emitir aprobación, el revisor debe verificar punto por punto:

0. **Alineación con el Contrato del Issue (DoR vs DoD):** ¿El PR cumple con el contrato técnico de DTOs, esquemas Zod y rutas especificado en el Issue correspondiente? Si el Issue estaba sub-especificado, la revisión debe documentar los ajustes requeridos con soluciones exactas y enriquecer el Issue.
1. **Dinero Entero (`RN-GEN-04`):** ¿Todos los montos en COP son enteros `INT`? ¿Se usó `MoneyCOP.ts` para cálculos y prorrateos con residuo a la última línea elegible (`RN-DES-09`)?
2. **Hora Oficial de Colombia (`RN-GEN-05`):** ¿Las fechas se guardan en UTC pero los cortes de día (`YYYY-MM-DD`), mes (`YYYY-MM`) y sesiones de caja se evalúan en `America/Bogota` usando `ColombiaTime.ts`?
3. **Kardex Único (`RN-GEN-02`):** ¿Toda modificación de `SaldoStock` pasa obligatoriamente por `InventoryLedgerService.ts`? (Rechazo inmediato si se detecta `prisma.saldoStock.update()` suelto).
4. **Orden Anti-Deadlock (`RNF-003`):** ¿Las transacciones que bloquean múltiples variantes ejecutan ordenamiento canónico `varianteId ASC` antes de `SELECT ... FOR UPDATE`?
5. **Validación Zod (`RN-SEG-02`):** ¿Cada endpoint valida sus entradas con esquema Zod exigiendo enteros positivos y formatos válidos?
6. **Configuración de Entorno y Arquitectura Multi-Portal (`ARQ-05`):**
   - En frontend: ¿Se preserva `AppRouter.tsx` con carga diferida (`React.lazy`) para Storefront, POS y Admin?
   - ¿Está configurado el proxy de Vite (`server.proxy` para `/api`) para conectar el dev server con Express?
7. **Compilación y Tests:** ¿Se ejecutó `npx tsc --noEmit` sin errores y `npx vitest run` con todos los tests en verde?

---

## 3. Disparo Automático de Tarea de QA para Duvan

Si el PR introduce o modifica lógica funcional de backend, frontend o base de datos que requiera verificación de negocio, la skill debe formular o ejecutar la creación de un Issue de QA para Duvan con el comando de GitHub CLI:

```bash
gh issue create \
  --title "[QA] Certificar PR #<NUM_PR>: <Titulo_Funcionalidad>" \
  --body "### Verificación Obligatoria de QA
- **PR Asociado:** #<NUM_PR>
- **Responsable QA:** @Duvan
- **Desarrollador:** @<Autor>
- **Rama:** <rama_origen> -> develop

### Criterios de Aceptación a Probar:
- [ ] CA-XX: <Descripcion del criterio>
- [ ] CA-YY: <Descripcion del criterio>

### Comprobaciones del Entorno:
- [ ] Pruebas unitarias/integración en verde (\`npx vitest run\`).
- [ ] Verificación de flujo funcional manual.
- [ ] Sin regresiones en módulos dependientes." \
  --label "qa-verification"
```

El PR **no se puede mergear** hasta que Duvan marque todas las casillas de verificación.

---

## 4. Formato Estructurado de Comentarios en el PR

La skill debe emitir la retroalimentación dividida en 3 niveles de severidad:
- **🔴 Bloqueante:** Violación de invariante, fallo de compilación o falta de tests.
- **🟡 Advertencia:** Código mejorable o documentación faltante.
- **🟢 Aprobado:** Listo para QA Gate.

---

## 5. Plantilla Obligatoria de Acompañamiento en Issues (Guía Operativa GitFlow y Testing)

**Regla Inquebrantable:** Cada vez que se crea una nueva Issue en GitHub, debe publicarse un comentario de acompañamiento técnico para el integrante asignado, detallando:
1. **Ruta y Rama GitFlow:**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/<codigo-tarea>-<descripcion-corta>
   ```
2. **Convención de Tests Unitarios (Vitest):**
   - Ubicación: `__tests__/<modulo>.test.ts`
   - Estructura Arrange-Act-Assert con `describe`, `it`, `expect`.
   - Comprobación: `npx vitest run` y `npx tsc --noEmit`.
3. **Flujo de Push y Pull Request:**
   ```bash
   git add .
   git commit -m "feat(<modulo>): descripcion clara del cambio"
   git push -u origin feature/<codigo-tarea>-<descripcion-corta>
   gh pr create --base develop --head feature/<codigo-tarea>-<descripcion-corta> --title "[CODIGO] Titulo" --body "..."
   ```
4. **Para Roles No-Código (Sofía / UX-UI):**
   - Indicar exportación de tokens, enlaces navegables en Figma/Lovable y registro de maquetas para alimentar el frontend de Exneider sin tocar código fuente.


- **🔴 BLOQUEANTE (Blocker):** Fallos que impiden el merge (violación de invariantes, dinero flotante, falta de lock pesimista, `tsc` fallando o falta de pruebas para los criterios `CA-*`).
- **🟡 ADVERTENCIA (Warning):** Oportunidades de mejora de rendimiento, nombrado confuso o deuda técnica menor.
- **🟢 APROBACIÓN (Praise):** Aspectos bien resueltos (buena cobertura de tests, código tipado limpiamente).

---

## 5. Criterio de Decisión Final

- Si hay al menos un **🔴 BLOQUEANTE**: Solicitar cambios (`Request Changes`) con instrucciones exactas de cómo solucionarlo.
- Si solo hay **🟡 ADVERTENCIAS** o todo está en **🟢**: Aprobar (`Approve`) condicionado al visto bueno de Duvan en la tarea de QA.

