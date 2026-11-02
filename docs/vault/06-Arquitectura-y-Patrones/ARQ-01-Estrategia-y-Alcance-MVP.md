---
id: ARQ-01
tags: [arquitectura, alcance, mvp, objetivos, productos]
---
# Formulación Estratégica y Alcance del MVP (v2.1)

Relacionado con: [[00-Indice-Mapa-Mental-MOC]] | [[RN-GEN-Principios-Inmutables]]

## 1. Planteamiento del Problema
Las empresas comercializadoras de ropa, accesorios, cosméticos y artesanías con bodega central, puntos de venta y tienda web sufren fragmentación de inventario y reglas financieras. Este sistema unifica la operación bajo un **Monolito Modular Transaccional con 3 Clientes Web** (POS, Tienda Web y Admin) sobre una única base de datos relacional (PostgreSQL en Supabase) y un motor de reglas inmutable (*Append-Only Ledger*).

## 2. Catálogo de Productos Físicos Estándar
Mercancía física terminada, estándar y no personalizada (sin configurador visual ni fabricación por encargo):
- **Ropa y Camisetas:** Talla (`XS` a `XL`) + Color. `reintegrableEnDevolucion = true`.
- **Accesorios:** Talla única/medida + Material. `reintegrableEnDevolucion = true`.
- **Cosméticos y Uso Personal:** Presentación (`30ml`, `50ml`) + Tono. **`reintegrableEnDevolucion = false`** (toda devolución autorizada va a `noVendible`).
- **Artesanías:** Modelo + Tamaño/Color. `reintegrableEnDevolucion = true` (averías van a `noVendible`).

## 3. Matriz de Alcance: Dentro vs. Fuera del MVP

| Dimensión | Dentro del MVP (Se Construye) | Fuera del MVP (Excluido pero Previsto) |
| :--- | :--- | :--- |
| **Catálogo** | Variantes por SKU único inmutable, precio único en COP enteros, marca reintegrable. | Personalización visual, órdenes de producción, lotes/vencimientos (`RN-CAT-08`). |
| **Inventario** | Saldos por sede (`fisico`, `reservado`, `noVendible`), Kardex inmutable (26 tipos), compras Central, traslados con novedades y retorno. | Cuentas por pagar, costeo promedio ponderado (`RN-REP-02`), traslados Punto-Punto. |
| **Ventas POS** | Búsqueda por SKU/nombre, apertura con base contada, venta efectivo/transferencia, preempción de reserva blanda, descuentos y arqueos. | Escaneo láser obligatorio, pagos mixtos en interfaz MVP, crédito/apartados, modo offline. |
| **Tienda Web** | Registro obligatorio, semáforo de disponibilidad, fletes DANE, transferencia/contraentrega, reserva TTL 24h, cuarentena SKU y custodia Central. | Compra como invitado, envíos divididos (*split shipments*), pasarela bancaria en vivo. |
| **Gobierno** | Ventas netas en `America/Bogota`, histórico mensual inmutable, 11 permisos por vendedor, auditoría *append-only*, semillas reproducibles. | Facturación electrónica DIAN en vivo (`DV-014`), nómina/contabilidad general. |
