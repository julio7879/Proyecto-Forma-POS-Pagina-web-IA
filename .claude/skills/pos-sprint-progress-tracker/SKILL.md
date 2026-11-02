---
name: pos-sprint-progress-tracker
description: Evalúa y registra el progreso de los Sprints, actualizando la documentación viva en docs/vault/05-Estado-Sprints/PROGRESO-ACTUAL.md cada vez que se fusiona un PR a develop o se completa un hito. Evalúa velocidad, porcentaje de avance, tareas de Duvan, Thomas, Exneider, Yeimer y Julio, y alerta sobre bloqueos o desvíos.
---
# Rastreador de Progreso, Evaluación de Sprints e Hitos Vivos

Esta skill mantiene actualizado el estado real de desarrollo en [`docs/vault/05-Estado-Sprints/PROGRESO-ACTUAL.md`](file:///c:/Users/Usuario/Desktop/Forma-SPOS/docs/vault/05-Estado-Sprints/PROGRESO-ACTUAL.md) asegurando que cada avance quede documentado de forma transparente y sin pérdida de memoria entre sesiones.

---

## 1. Disparadores de Activación (Triggers)

Esta skill debe invocarse en los siguientes momentos:
1. **Merge a `develop`:** Cuando un Pull Request de `feature/*` o `bugfix/*` ha sido aprobado y fusionado en `develop`.
2. **Cierre de Tarea de QA:** Cuando Duvan certifica los criterios `CA-*` asociados a un Issue.
3. **Inicio o Cierre de Sprint:** Al comenzar o concluir cualquiera de los Sprints 0 al 5 según [[PLAN-MAESTRO-SPRINTS]].
4. **Consulta de Estado por el Líder (Julio):** Cuando Julio pregunte *"¿Cómo vamos con el sprint actual?"*, *"¿Qué tareas faltan?"* o *"¿Qué tiene pendiente Thomas/Exneider/Yeimer?"*.

---

## 2. Procedimiento de Actualización de Hitos

Cada vez que se complete un PR o tarea, la skill ejecuta los siguientes pasos:

### Paso 1: Recopilación de Metadatos
- **Nombre del Hito / Funcionalidad:** Ej. *"Carga inicial de Catálogo DANE y tarifas por zona"*.
- **Fecha y Hora Operativa:** Evaluada en zona horaria `America/Bogota` (`YYYY-MM-DD HH:mm`).
- **Desarrollador Responsable:** Julio, Exneider, Yeimer o Thomas.
- **Auditor de QA:** Duvan (con enlace al Issue de QA cerrado).
- **Criterios `CA-*` Certificados:** Lista de criterios superados (ej. `CA-37`, `QA-007`).

### Paso 2: Registro en `PROGRESO-ACTUAL.md`
Inserta una fila en la tabla de **Registro Cronológico de Hitos Alcanzados** en [`docs/vault/05-Estado-Sprints/PROGRESO-ACTUAL.md`](file:///c:/Users/Usuario/Desktop/Forma-SPOS/docs/vault/05-Estado-Sprints/PROGRESO-ACTUAL.md):

```markdown
| YYYY-MM-DD | <Nombre_del_Hito> | <Desarrollador> | Certificado por @Duvan | COMPLETADO [x] |
```

### Paso 3: Marcado de Checklist del Sprint y Recálculo de Porcentaje
- Marca con `[x]` la tarea correspondiente en la sección del Sprint actual (ej. `- [x] SP0-03 (Thomas): Creación del catálogo DANE`).
- Calcula el porcentaje de avance:
  $$\text{Avance} = \left( \frac{\text{Tareas Completadas}}{\text{Total Tareas del Sprint}} \right) \times 100$$
- Actualiza la barra visual de progreso: `[██████░░░░] 60%`.

### Paso 4: Definición de la Siguiente Tarea Prioritaria
Revisa [[PLAN-MAESTRO-SPRINTS]] y actualiza la sección **Próximos Pasos Inmediatos**, indicando:
1. Qué integrante debe tomar la siguiente tarea.
2. Si Duvan debe comenzar pruebas sobre un módulo entregado.
3. Si Sofía debe entregar un nuevo prototipo en Figma para desbloquear el frontend de Exneider.

---

## 3. Protocolo de Detección de Bloqueos y Alertas

Si durante la evaluación la skill detecta alguna de las siguientes condiciones, emite una alerta prioritaria a Julio:
- **Sobrecarga de Junior:** Si Yeimer o Thomas tienen más de 1 tarea activa asignada al mismo tiempo.
- **Cuello de Botella en QA:** Si hay 2 o más PRs esperando revisión por parte de Duvan sin cerrar.
- **Falta de Prototipo:** Si Exneider no puede avanzar porque Sofía no ha entregado la maqueta del módulo.
- **Riesgo de Invariante:** Si un PR intentó modificar `SaldoStock` o saltarse `MoneyCOP.ts`.

