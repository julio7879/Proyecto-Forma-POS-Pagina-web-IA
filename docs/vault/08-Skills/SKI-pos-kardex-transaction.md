---
id: SKI-KARDEX
tags: [skill, kardex, inventario, acid]
skill_dir: ".agent/skills/pos-kardex-transaction"
agente_responsable: "[[AGE-04-Forja-Backend]]"
---
# 🛠️ Skill: pos-kardex-transaction

Procedimiento obligatorio para consultar, reservar, descontar o trasladar inventario mediante `InventoryLedgerService.ts`.

## Conexiones en el Grafo
- **Invocada por:** [[AGE-04-Forja-Backend]]
- **Reglas Inmutables:** [[RN-INV-Kardex-y-Saldos]] | [[RN-GEN-Principios-Inmutables]]
- **Módulos que Impacta:** [[MOD-04-Inventario-Ledger]], [[MOD-06-Traslados]], [[MOD-08-Ventas-POS]]
