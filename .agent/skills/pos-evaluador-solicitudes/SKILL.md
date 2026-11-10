---
name: pos-evaluador-solicitudes
description: Evalúa, audita y refina quirúrgicamente cada solicitud, requerimiento o instrucción del usuario ANTES de ejecutarla en el Sistema POS y Tienda Web. Detecta dependencias prematuras (como pedirle a QA probar código aún no construido), riesgos de choque con las 7 invariantes, falta de insumos o ambigüedades de diseño y alcance, emitiendo un diagnóstico claro con semáforo (Verde, Amarillo, Rojo).
---

# Evaluador y Auditor Pre-Vuelo de Solicitudes y Requerimientos (@Vigía-Requerimientos)

Esta skill actúa como el **filtro pre-vuelo obligatorio (Paso 0)** ante cualquier requerimiento, cambio de alcance, creación de tareas o instrucción técnica enviada por el Líder del Proyecto (Julio). Su función es evitar que se creen expectativas irreales en el equipo, que se programen funciones sobre cimientos inexistentes o que se violen las reglas arquitectónicas del sistema.

---

## 1. El Rol de `@Vigía-Requerimientos` (Paso 0 del Escuadrón)

Antes de que `@Oraculo-Analista` planifique contratos o `@Forja-Backend` escriba una sola línea de código, `@Vigía-Requerimientos` audita la solicitud del usuario bajo el principio de **Shift-Left Requirements**: *es 100 veces más barato corregir una ambigüedad o dependencia en la solicitud que corregir código ya escrito o destrabar a un compañero bloqueado*.

```mermaid
flowchart TD
    User["Solicitud del Usuario"] --> Vigia["@Vigía-Requerimientos<br/>(Skill: pos-evaluador-solicitudes)"]
    
    subgraph Filtros["Los 5 Filtros de Auditoría"]
        F1["1. Dependencia Temporal y Fase Actual"]
        F2["2. Compatibilidad con 7 Invariantes"]
        F3["3. Asignación y Capacidad por Rol"]
        F4["4. Cero Suposición vs Obsidian Vault"]
        F5["5. Claridad y Criterios de Aceptación"]
    end
    
    Vigia --> Filtros
    
    Filtros --> Semaforo{"Semáforo de Dictamen"}
    Semaforo -->|"🟢 Verde"| Directo["Ejecución Directa"]
    Semaforo -->|"🟡 Amarillo"| Reestructurado["Reestructuración Proactiva<br/>(Desglose en Fases / Matices)"]
    Semaforo -->|"🔴 Rojo"| Pausa["Pausa Preventiva<br/>(Alerta de Invariante / Conflicto)"]
```

---

## 2. Los 5 Filtros de Pre-Vuelo

Toda solicitud se evalúa rigurosamente contra estos 5 filtros:

### Filtro 1: Dependencias Temporales y Fase del Proyecto (Anti-Bloqueo de Equipo)
- **Pregunta clave:** *¿El entregable solicitado depende de algo que todavía no se ha construido?*
- **Casos típicos detectados:**
  - Pedirle a **Duván (QA)** que certifique endpoints o vistas antes de que Backend o Frontend abran el Pull Request. *(Solución: Desglosar en Fase 1 de diseño de pruebas y tests sobre BD existente, y Fase 2 de validación de PRs).*
  - Pedirle a **Exneider (Frontend)** maquetar componentes sin que **Sofía (UX/UI)** haya definido los tokens de color o layouts.
  - Pedirle a **Yeimer o Thomas** programar endpoints que dependen de migraciones de Prisma no ejecutadas.

### Filtro 2: Compatibilidad con las 7 Invariantes Inquebrantables (`AGENTS.md`)
- **Dinero COP Entero (`RN-GEN-04`):** ¿La solicitud menciona decimales o centavos? (Rechazar/Ajustar a `INT`).
- **Hora Colombia (`RN-GEN-05`):** ¿Pide evaluar turnos o cierres usando hora del cliente/servidor sin `ColombiaTime.ts`?
- **Kardex Único (`RN-GEN-02`):** ¿Sugiere modificar stock directamente sin pasar por `InventoryLedgerService.ts`?
- **Orden Anti-Deadlock (`RNF-003`):** ¿Involucra transacciones multi-variante sin ordenar por `varianteId ASC`?
- **Dos Niveles de Reserva (`RN-VTA-03`, `RN-WEB-16`):** ¿Respeta la separación entre `reservadoBlando` y `reservadoDuro`?
- **Idempotencia y Consecutivos Diferidos (`RN-GEN-08`):** ¿Exige `Idempotency-Key` en operaciones de venta/pago?
- **Inmutabilidad (`RN-GEN-03`):** ¿Sugiere borrar físicamente (`DELETE`) registros con trazabilidad?

### Filtro 3: Capacidad y Especialidad por Rol
- **Julio (Líder / Backend Senior):** Arquitectura núcleo, transacciones complejas, seguridad auth y concurrencia.
- **Sofía (Diseño UX/UI):** **0% código fuente**. Solo Figma, tokens, wireframes, guías visuales y prototipos.
- **Duvan (QA Lead):** Diseño de matrices de prueba, suite HTTP (Postman/Thunder), ataques de seguridad y firma de PRs.
- **Exneider (Frontend Lead):** Componentes React + Tailwind sin calcular precios ni stock en el navegador (`RN-GEN-01`).
- **Yeimer (Backend Junior):** Endpoints CRUD asistidos con schemas Zod y validaciones de sede.
- **Thomas (Junior Acotado):** Tareas puntuales aisladas (ej. carga de seeds, catálogos DANE, datos estáticos).

### Filtro 4: Cero Suposición vs. Obsidian Vault (`docs/vault/`)
- ¿La solicitud contradice alguna regla de negocio (`RN-*`) o criterio de aceptación (`CA-*`) ya acordado?
- Si el usuario solicita un cambio de regla (ej. cambio en la expiración de reservas web o manejo de devoluciones), se documenta explícitamente el impacto antes de tocar código.

### Filtro 5: Claridad y Criterios de Aceptación
- ¿La solicitud especifica un resultado medible?
- Si la solicitud es ambigua (*"haz que se vea bonito"* o *"arregla la caja"*), se proponen opciones concretas con criterios de aceptación `CA` verificables.

---

## 3. Formato del Veredicto Pre-Vuelo

Ante cada nueva solicitud de peso, `@Vigía-Requerimientos` emite un dictamen ágil en la respuesta:

```markdown
### 🛡️ Dictamen Pre-Vuelo (@Vigía-Requerimientos)
- **Estado:** 🟢 VIABLE DIRECTO | 🟡 OBSERVACIÓN PROACTIVA | 🔴 ALERTA DE CONFLICTO
- **Análisis de Dependencias:** ¿Quiénes intervienen y en qué orden?
- **Alineación con Invariantes:** ¿Cumple con las 7 reglas inquebrantables?
- **Recomendación / Ajuste:** (Si aplica, el desglose en fases para evitar bloqueos).
```

---

## 4. Ejemplos de Intervención Exitosa

### Caso Real: Tarea de QA en Fase Temprana
- **Solicitud del usuario:** *"Asigna una tarea a Duván para probar el bloqueo de 5 intentos fallidos y la inyección SQL en autenticación."*
- **Diagnóstico del Vigía:** 🟡 *OBSERVACIÓN PROACTIVA*. Los endpoints aún no están programados. Si Duván intenta ejecutarlos hoy, se frustrará.
- **Ajuste automático:** Desglosar en Fase 1 (diseño de la matriz de pruebas y validación de los constraints SQL en Supabase que ya existen) y Fase 2 (certificación en los Pull Requests).

---

## 5. Directriz Obligatoria: Onboarding Técnico en Cada Issue Creado

Toda tarea o issue que se genere en el repositorio debe incluir obligatoriamente las instrucciones detalladas de ejecución:
1. **Ramas GitFlow:** Rama base `develop` y nombre `feature/<tarea>-<descripcion>`.
2. **Convención de Testing Unitario:** Cómo estructurar el archivo `.test.ts`, importar `describe`, `it`, `expect` de Vitest y ejecutar `npx vitest run`.
3. **Validación Pre-PR:** `npx tsc --noEmit` y `npx vitest run` en verde antes de crear el Pull Request hacia `develop`.
4. **Instrucciones para Perfiles Especiales:**
   - **Sofía (UX/UI):** Cómo vincular wireframes/tokens en Figma sin escribir código.
   - **Duván (QA):** Cómo diseñar matrices Gherkin y validar constraints en Supabase.
   - **Thomas (Junior):** Cómo ejecutar `npx prisma db seed` de forma segura.

---

## 6. Regla Inquebrantable de Definición de Listo (DoR - Definition of Ready)

**PROHIBIDO asignar, habilitar o dejar un Issue en GitHub sin su Ficha Técnica Oficial (Contrato Técnico de Máximo 30 líneas extraído de `docs/vault/`).**

Todo Issue debe contener antes de iniciar desarrollo:
1. **Contrato de Datos y DTOs:** Tabla de campos, tipos, obligatoriedad (opcional vs requerido) y transformaciones Zod (`.trim()`, `.toLowerCase()`).
2. **Rutas y Verbos HTTP Canónicos:** URLs absolutas dentro de `/api` y métodos (`GET`, `POST`, `PUT`, `PATCH`).
3. **Invariantes de Negocio Aplicables:** Reglas explícitas (`RN-*` y `CA-*`), constraints de base de datos e índices únicos.
4. **Respuestas y Códigos HTTP:** Estructura JSON para éxito (`datos`) y error (`error: { message, code, detalles }`).
5. **Matriz de Pruebas Obligatorias (Vitest):** Casos felices y casos de borde a incluir en el archivo `__tests__`.

Si se detecta un Issue existente sub-especificado o escueto, `@Vigía-Requerimientos` debe actualizar de inmediato el cuerpo del Issue en GitHub (`gh issue edit <ID> -F <archivo>`) para evitar que el desarrollador trabaje a ciegas o asuma reglas erróneas.

---

## 7. Protocolo Obligatorio de Parada y Consulta Activa ante Ambigüedad o Falta de Certeza

**Regla de Oro de Cero Suposición e Interrogación al Usuario:**
Si `@Vigía-Requerimientos` (o cualquier agente en el flujo) detecta:
1. Requerimientos o instrucciones ambiguas, incompletas o abiertas a múltiples interpretaciones.
2. Inexistencia de la regla de negocio en `docs/vault/` o discrepancia entre lo solicitado y las notas atómicas.
3. Incertidumbre técnica, de diseño visual o de flujos alternativos/fallback.
4. Cualquier punto donde el agente sienta la tentación de "asumir" o "deducir" el comportamiento.

**Acción Inquebrantable:**
1. **DETENER LA EJECUCIÓN:** No generar código, no abrir PRs, no crear archivos ni ejecutar comandos modificadores.
2. **FORMULAR PREGUNTAS AL USUARIO:** Usar la herramienta `ask_user_question` para presentar opciones múltiples bien fundamentadas (o formular preguntas directas en lenguaje claro).
3. **BLOQUEO HASTA RESPUESTA:** La tarea se pausa por completo hasta recibir la respuesta explícita y decisión del usuario.
4. **PROSEGUIR TRAS LA RESPUESTA:** Solo una vez resuelta la duda y documentada la decisión en el Vault, se continúa con la planificación y construcción.

