---
id: SKI-DASHBOARD-DESIGNER
tags: [skill, dashboard, bi, kpi, justinmind, analytics, visualizacion]
skill_dir: ".agent/skills/pos-dashboard-designer"
agente_responsable: "[[AGE-10-Vitral-Dashboard]]"
fecha_creacion: 2026-11-10
relacionados:
  - "[[00-Oficina-Agentes-MOC]]"
  - "[[00-Indice-Mapa-Mental-MOC]]"
  - "[[AGE-10-Vitral-Dashboard]]"
  - "[[AGE-05-Vitral-UI]]"
  - "[[ARQ-08-Guia-Maestra-Diseno-Paneles-de-Control-Dashboards]]"
  - "[[MOD-12-Reportes-Auditoria]]"
---

# 🛠️ Skill: pos-dashboard-designer

Arquitectura de información, visualización de datos, regla de 5-6 tarjetas primarias, pantalla única y leyes canónicas para Dashboards en React + Tailwind CSS.

---

## Propósito de la Skill

Proveer el conjunto de reglas, directrices de maquetación y patrones visuales obligatorios para construir o refactorizar cualquier panel de control ejecutivo u operativo en el Portal Administrativo (`/admin/dashboard` y módulos gerenciales):

1. **Pantalla Única (Single-Screen Glance):** Garantizar que la vista inicial encaje en resoluciones estándar de escritorio (1080p) sin provocar scroll vertical infinito.
2. **Arquitectura de 3 Filas Balanceada:**
   - Fila 1: Tira de KPIs de 95px de altura (`min-h-[95px]`) con números grandes y audaces.
   - Fila 2: Dos visualizaciones analíticas centrales (Línea de tendencia 65% + Dona de participación por sede 35%).
   - Fila 3: Histograma comparativo de sucursales (50%) + Monitores operativos con scroll interno delimitado a 220px (`max-h-[220px]`).
3. **Cero Transparencias y Alto Contraste:** Lienzo oscuro sólido `#151210` o claro `#FFFFFF`, suprimiendo opacidades desvaídas y selectores CSS no estándar.
4. **Modales Elevados y Nítidos:** Diálogos en `z-[100]`, backdrop `bg-slate-950/70 backdrop-blur-sm` y contenedores con fondo 100% sólido.

---

## Conexiones en el Grafo de Obsidian

- **Invocada por:** [[AGE-10-Vitral-Dashboard]] y [[AGE-05-Vitral-UI]]
- **Guía Vinculante:** [[ARQ-08-Guia-Maestra-Diseno-Paneles-de-Control-Dashboards]]
- **Módulos del Sistema:** [[MOD-12-Reportes-Auditoria]]
- **Evidencias Visuales:** `docs/vault/assets/dashboards/` (20 Figuras Normativas)
