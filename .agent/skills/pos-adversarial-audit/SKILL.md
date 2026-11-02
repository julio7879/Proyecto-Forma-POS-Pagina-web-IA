---
name: pos-adversarial-audit
description: Ejecuta una auditoria adversarial en 3 fases (Reconocimiento, Caza por @Sabueso-Hunter y Refutacion por @Juez-Esceptico) sobre cualquier modulo del Sistema POS y Tienda Web antes de darlo por terminado.
---
# Auditoria Adversarial de Logica de Negocio, Concurrencia y Seguridad

## Fase 1: Reconocimiento
Identifica los archivos modificados y las reglas `RN-*` y `CA-*` aplicables en `docs/vault/`.

## Fase 2: Caza de Fallos (`@Sabueso-Hunter`)
Busca estas 6 vulnerabilidades críticas:
1. **Precios/Descuentos manipulables (`CA-16`, `CA-22`, `CA-23`):** ¿Se confía en algún importe enviado desde el cliente en vez de recalcular en el backend?
2. **Fuga entre ubicaciones (`RN-ROL-04`, `CA-41`, `CA-49`):** ¿Un vendedor del Punto A puede operar o leer datos del Punto B cambiando `ubicacionId`?
3. **Condición de carrera (`CA-02`, `CA-38`):** ¿Falta ordenar por `varianteId ASC` o falta `SELECT ... FOR UPDATE`?
4. **Sesión de caja vencida o plazo de cambio (`CA-56`, `CA-63`):** ¿Permite vender/anular en una sesión abierta de un día anterior o reinicia los 5 días en un cambio?
5. **Descuadre de Caja o Ventas Netas (`CA-14`, `CA-54`, `CA-64`, `CA-65`):** ¿Una transferencia o un retorno logístico contraentrega afecta la caja o las Ventas Netas?
6. **Falta de Idempotencia (`CA-08`, `CA-18`):** ¿Un doble clic duplica la operación?

## Fase 3: Verificación Escéptica (`@Juez-Esceptico`)
Para cada sospecha de la Fase 2, intenta desmontarla verificando si un middleware, esquema Zod o constraint SQL ya cubría el caso. Reporta y corrige únicamente los hallazgos `CONFIRMADOS`.
