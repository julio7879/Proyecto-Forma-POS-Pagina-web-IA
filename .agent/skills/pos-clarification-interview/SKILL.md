---
name: pos-clarification-interview
description: Entrevista técnica socrática e interrogatorio de requisitos (inspirada en grill-me de mattpocock/skills). Activar cuando una solicitud del usuario, regla de negocio, alcance o diseño sea ambiguo, incompleto o presente múltiples alternativas de implementación. Detiene la ejecución y formula preguntas interactivas antes de escribir código.
---

# Entrevista Técnica y Clarificación Socrática (`@Inquisidor-Requerimientos`)

Esta skill traslada el patrón de **interrogatorio pre-construcción** (popularizado por `mattpocock/skills` en GitHub) al Sistema POS y Tienda Web. Su misión es erradicar el *vibe coding* y las suposiciones no verificadas mediante preguntas precisas al usuario.

---

## Cuándo Activar Esta Skill
- El usuario pide una funcionalidad con requerimientos escuetos o abstractos (ej. *"haz el carrito de compras"*, *"permite devoluciones parciales"*).
- Existen casos de borde sin regla explícita en `docs/vault/`.
- Hay una disyuntiva arquitectónica (ej. ¿almacenar en sesión, en Redis o en base de datos?; ¿notificar por WhatsApp o solo correo?).
- Cualquier momento donde un agente no tenga certeza absoluta sobre la decisión que tomaría el Líder Técnico.

---

## Protocolo de Ejecución (Paso a Paso)

### 1. Parada Preventiva Inmediata
- **Queda prohibido escribir código o modificar esquemas.**
- Identifica el punto ciego exacto o la bifurcación de diseño.

### 2. Consulta Quirúrgica en el Vault
- Revisa si en `docs/vault/01-Reglas-Dominio/` ya existe un precedente.
- Si no existe o hay contradicción, formula el interrogatorio.

### 3. Formulación de Preguntas al Usuario
- Emplea la herramienta interactiva `ask_user_question` para brindar opciones fundamentadas (o redacta preguntas concisas si son aclaraciones abiertas).
- Reglas para las preguntas:
  - Máximo 3 preguntas por ronda.
  - Cada opción debe detallar el impacto técnico y en las 7 invariantes (ej. Opción A: reserva en BD con bloqueo pesimista vs. Opción B: reserva en memoria).
  - Incluir la opción recomendada al inicio con el prefijo `(Recomendado)`.

### 4. Pausa y Espera Obligatoria
- **No generes código especulativo mientras esperas.**
- Termina el turno y aguarda la selección o el texto del usuario.

### 5. Consolidación y Registro en el Vault
- Una vez recibida la respuesta, sintetiza la decisión en un contrato técnico DoR (Definition of Ready) de máximo 30 líneas.
- Si es una nueva regla de negocio, añade la nota correspondiente en `docs/vault/` para que quede indexada permanentemente.
- Solo entonces, reanuda el flujo con `@Forja-Backend` o `@Vitral-UI`.
