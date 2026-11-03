---
id: MOD-02
modulo: 02-ubicaciones-cobertura
tags: [ubicaciones, central, tiendas, dane, cobertura]
rf_codes: [RF-UBI-01, RF-UBI-02]
modelos_prisma: [Ubicacion, MunicipioDane, DepartamentoDane, RegionEnvio]
criterios_ca: [CA-35, CA-37]
---
# Módulo 02: Gestión de Ubicaciones y Cobertura Geográfica (RF-UBI)

Relacionado con: [[RN-UBI-CAT-Ubicaciones-Catalogo]] | [[Constraints-SQL-e-Indices]] | [[MOD-11-Pedidos-Web-DANE]]

## 1. Alcance Funcional
Administra la Bodega Central y los Puntos de Venta físicos, su vinculación con la división político-administrativa DANE de Colombia, sus prioridades de despacho web y las condiciones para su desactivación segura.

## 2. Requerimientos Funcionales Detallados

| Código RF | Nombre | Actores | Reglas | Entrada → Proceso → Salida | Criterios de Aceptación |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-UBI-01** | Configuración de Bodega Central y Puntos de Venta | Administrador | `RN-UBI-01` a `RN-UBI-04` | **E:** Nombre, `tipo` (`CENTRAL` / `PUNTO_VENTA`), `municipioDaneId`, dirección, `despachaWeb`, `prioridadDespacho` y `baseCajaCop` ($200.000 COP).<br>**P:** Garantiza que solo exista una Central (`uq_unica_bodega_central`). Central no tiene caja ni vendedores.<br>**S:** Ubicación creada o editada. | Se rechaza crear una segunda Central o asignar caja/vendedor a Central. |
| **RF-UBI-02** | Desactivación validada de un Punto de Venta | Administrador | `RN-UBI-05`, `RN-UBI-06`, `RN-GEN-07` | **E:** `ubicacionId` a desactivar.<br>**P:** Verifica en transacción las 5 condiciones: 1) `tipo === PUNTO_VENTA` (Central jamás se desactiva); 2) `fisico == 0` y `noVendible == 0`; 3) cero traslados abiertos; 4) cero pedidos web en curso; 5) cero cajas `ABIERTA`. Marca `activa = false` y audita.<br>**S:** Sede desactivada. | Falla si es Central, o si tiene stock, traslados, pedidos pendientes o caja abierta. |
