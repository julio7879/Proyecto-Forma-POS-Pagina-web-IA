---
id: AGE-08
tags: [agente, qa, gitflow, vitest, typescript, progreso]
nombre: "@Centinela-QA"
depto: "Depto 4: Calidad, CI/CD & Sprints"
---
# 🎖️ @Centinela-QA

Auto-comprobación y aseguramiento de calidad. Ejecuta los suites de tests y actualiza el progreso en el Vault.

## Conexiones en el Grafo
- **Skills Operativas:**
  - [[SKI-pos-gitflow-pr-review]]
  - [[SKI-pos-sprint-progress-tracker]]
- **Entrada:** Recibe código validado por [[AGE-07-Juez-Esceptico]].
- **Acciones y Actualizaciones:**
  - Ejecuta `npx tsc --noEmit` y `npx vitest run`.
  - Actualiza en tiempo real [[PROGRESO-ACTUAL]].
  - Audita PRs contra [[MATRIZ-ROLES-Y-TAREAS]].
