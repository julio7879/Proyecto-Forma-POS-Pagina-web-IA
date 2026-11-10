---
name: pos-dashboard-designer
description: Arquitectura de información, leyes de diseño y visualización de datos para Paneles de Control (Dashboards Ejecutivos y Operativos) en React + Tailwind CSS (fundamentada en docs/vault/06-Arquitectura-y-Patrones/ARQ-08-Guia-Maestra-Diseno-Paneles-de-Control-Dashboards.md e inspirada en Justinmind y mejores prácticas de Business Intelligence). Activar obligatoriamente al construir, refactorizar o auditar el Dashboard Ejecutivo del Portal Admin (/admin/dashboard), paneles de analítica, tiras de KPIs, gráficos de series temporales, gráficos de distribución y widgets de actividad.
---

# Diseñador Maestro de Paneles de Control (`pos-dashboard-designer`)

Esta skill rige los principios canónicos de diseño UI/UX para la construcción y auditoría de **Dashboards Ejecutivos y Operativos** dentro del ecosistema FORMA (Portal 3: Dashboard Administrativo y Portal 2: Terminal POS), garantizando máxima claridad visual, velocidad de lectura y cero sobrecarga cognitiva.

---

## Cuándo Activar Esta Skill

* Al maquetar, estructurar o rediseñar la vista de `AdminDashboardPage.tsx`, `AdminTopbar.tsx` o cualquier vista analítica de métricas.
* Al diseñar o refactorizar tiras de KPIs (`KPIStatCard.tsx`), gráficos de tendencias (`AdminLineTrendChart.tsx`), gráficos de distribución circular (`AdminDonutDistributionChart.tsx`) o tablas de actividad reciente.
* Al auditar la jerarquía visual, la paleta de color y la armonía estética de los cuadros de mando frente a la sobrecarga de datos o elementos chillones.

---

## 1. Las 5 Leyes Inquebrantables del Panel de Control

### Ley 1: Límite Estricto de 5 a 6 Tarjetas Principales
* Ningún panel de control debe abrumar al usuario con decenas de widgets. La vista inicial principal debe contener como máximo **5 o 6 contenedores o tarjetas estructuradas**.
* Toda métrica secundaria o de granularidad profunda debe ofrecerse mediante filtros temporales, pestañas o cajones de detalle (*DetailDrawer*), nunca apilando bloques infinitos.

### Ley 2: Principio de «Una Sola Pantalla» (Everything at a Glance)
* En resoluciones de escritorio estándar (1080p / 1440p), el cuadro de mando debe ser comprensible **sin forzar al usuario a hacer scroll vertical kilométrico**.
* La altura de los gráficos y la densidad de las tarjetas debe calibrarse armónicamente para que los 4 KPIs clave y las 2 visualizaciones principales sean visibles al instante.

### Ley 3: Patrón de Escaneo Visual en F y Z
* **Cuadrante Superior Izquierdo (Foco Absoluto):** La métrica reina del negocio: **Ventas Netas Consolidadas** en COP entero (`RN-GEN-04`) con su delta porcentual vs período anterior.
* **Línea Superior Horizontal:** Los 4 KPIs directivos (Ventas, Inventario Valorizado, Pedidos Web Activos, Estado de Cajas).
* **Zona Central / Diagonal:** Gráfico de Tendencia Temporal (Línea/Área de 60% de ancho) y Gráfico de Participación por Sede (Donut de 40% de ancho).
* **Zona Inferior:** Histograma comparativo o tabla de actividad/pedidos urgentes.

### Ley 4: Paleta Cromática Atelier y Cero Colores Estridentes
* **Prohibido:** Fondos saturados, verdes neón, amarillos cegadores o combinaciones circenses.
* **Paleta Canónica FORMA:**
  * Fondo: Marfil Atelier `#FAF8F5` en modo día / Carbón Atelier `#0E0C0A` en modo noche.
  * Marca: Vinotinto Haute Couture `#741C2B` (acento sofisticado).
  * Acento Secundario: Champagne Dorado `#C49A68` / `#D4AF37`.
  * Superficies: Vidrio satinado translúcido con bordes sutiles `border-slate-200/80` (día) o `border-white/10` (noche).
  * Texto: Máximo contraste Slate `#0F172A` (día) / `#F8FAFC` (noche).

### Ley 5: Visualización de Datos Funcional
* **Series Temporales:** Usar curvas suaves de Área/Línea con relleno degradado sutil y tooltip interactivo.
* **Participación y Cuotas:** Usar gráfico Donut con cutout central limpio que muestre la cifra total consolidada y leyenda con porcentajes.
* **Comparativas Categóricas:** Usar gráficos de barras con bordes redondeados y proporciones claras.

---

## 2. Checklist de Auditoría Pre-Despliegue de un Dashboard

Antes de dar por completado un panel de control, verificar:
1. [ ] ¿Hay como máximo 4 KPIs titulares en la fila superior?
2. [ ] ¿Los números son grandes, en negrita y usan formato `COP` entero sin decimales?
3. [ ] ¿Los gráficos cargan datos reales y se adaptan a los filtros (*Hoy, 7 Días, Mes, Año*)?
4. [ ] ¿El contraste de textos y etiquetas de ejes cumple accesibilidad WCAG AA?
5. [ ] ¿La interfaz luce balanceada y sin scroll excesivo en monitores de escritorio?
6. [ ] ¿El modo noche es 100% legible con fondos sólidos u opacos y sin transparencias que deformen el contenido?
