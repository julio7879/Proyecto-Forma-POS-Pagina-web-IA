---
id: PARAM-DV
tags: [parametros, semillas, seed, decisiones, dv, configuracion]
---
# Parámetros Oficiales del Sistema y Cierre de Decisiones (DV-001 a DV-022)

Relacionado con: [[00-Indice-Mapa-Mental-MOC]] | [[MOD-02-Ubicaciones]] | [[MOD-11-Pedidos-Web-DANE]]

## 1. Tabla Oficial de Parámetros Configurables Cerrados (`seed.ts` y `ParametroSistema`)

| Parámetro del Sistema | Configuración | Valor Oficial Aprobado (`[D]`) | Regla |
| :--- | :--- | :--- | :--- |
| **Bodega Central** | Semilla Inicial | Cúcuta (DANE `54001`), Prioridad `40`, `despachaWeb = true`. | `RN-UBI-01` |
| **Punto Centro** | Semilla Inicial | Cúcuta (DANE `54001`), Prioridad `10`, Base `$200.000`, `despachaWeb = true`. | `RN-UBI-02` |
| **Punto Ocaña** | Semilla Inicial | Norte de Santander (DANE `54498`), Prioridad `20`, Base `$200.000`, `despachaWeb = true`. | `RN-UBI-02` |
| **Punto Bucaramanga** | Semilla Inicial | Santander (DANE `68001`), Prioridad `30`, Base `$200.000`, `despachaWeb = true`. | `RN-UBI-02` |
| **Base de Caja Objetivo** | Por Punto de Venta | **`$200.000 COP`** | `RN-CAJ-02` |
| **Plazo Devolución POS** | `ParametroSistema` | **`5 días calendario`** contados desde la venta raíz. | `RN-DEV-03` |
| **Plazo Devolución Web** | `ParametroSistema` | **`5 días hábiles`** desde la entrega (`FestivoColombia`). | `RN-DEV-14` |
| **Tope Descuento Vendedor** | Por Usuario | **`0%`** por defecto al crear uno nuevo; **`10%`** en datos semilla autorizados. | `RN-DES-05` |
| **Umbral Stock Bajo Interno** | Sistema / Variante | **`3 unidades`** o menos disponibles. | `RN-INV-07` |
| **Umbral Últimas Unidades Web** | `ParametroSistema` | **`5 unidades`** o menos disponibles. | `RN-WEB-02` |
| **TTL Reserva Transferencia Web** | `ParametroSistema` | **`1.440 minutos` (24 horas)** en estado `RECIBIDO`. | `RN-WEB-09` |
| **Alerta Preparación Web** | `ParametroSistema` | **`24 horas`** en `CONFIRMADO` sin pasar a preparación. | `RN-WEB-17` |
| **Tiempo Máx Tránsito Traslado** | `ParametroSistema` | **`48 horas`** en `ENVIADO` sin recepción. | `RN-TRA-15` |
| **Tarifa Envío Zona 1** | `TarifaZonaEnvio` | **`$8.000 COP`** · 1 a 2 días hábiles (Mismo municipio). | `RN-ENV-02` |
| **Tarifa Envío Zona 2** | `TarifaZonaEnvio` | **`$12.000 COP`** · 2 a 3 días hábiles (Mismo depto). | `RN-ENV-02` |
| **Tarifa Envío Zona 3** | `TarifaZonaEnvio` | **`$16.000 COP`** · 3 a 4 días hábiles (Misma región). | `RN-ENV-02` |
| **Tarifa Envío Zona 4** | `TarifaZonaEnvio` | **`$22.000 COP`** · 4 a 6 días hábiles (Otra región). | `RN-ENV-02` |
| **Cosméticos y Aretes** | `Categoria` / `Producto` | **`reintegrableEnDevolucion = false`** (van forzosos a no vendible). | `RN-CAT-02` |

---

## 2. Cierre Definitivo de las 22 Decisiones de Dominio (DV-001 a DV-022)

| ID | Decisión | Resolución Oficial Cerrada (`[D]`) en Documento Maestro v2.1 |
| :--- | :--- | :--- |
| **DV-001** | Ubicaciones reales y Central | 1 Bodega Central (Cúcuta `54001`) + 3 Tiendas: Punto Centro, Punto Ocaña y Punto Bucaramanga. |
| **DV-002** | Atributos de variantes | SKU único + Talla + Color/Presentación. Sin personalización. |
| **DV-003** | Precio base vs descuentos | `precioVentaCop` único e inmutable en variante; descuentos se aplican en la transacción. |
| **DV-004** | Reserva disponible web | `disponibleWeb = fisico - reservadoBlando - reservadoDuro` en sedes habilitadas. |
| **DV-005** | TTL reserva transferencia | 24 horas exactas con worker cada 60s con `SKIP LOCKED`. |
| **DV-006** | Métodos de pago | POS: `EFECTIVO` y `TRANSFERENCIA`. Web: `TRANSFERENCIA` y `CONTRAENTREGA`. |
| **DV-007** | Validación de transferencia | Registro obligatorio de referencia y confirmación manual por Admin. |
| **DV-008** | Tarifas y zonas DANE | Zonas 1 a 4 con tarifas de $8k, $12k, $16k y $22k más tabla de excepciones. |
| **DV-009** | Desempate de sedes | 1.º Menor flete DANE, 2.º Menor prioridad de despacho, 3.º Menor ID. |
| **DV-010** | Cosméticos no reintegrables | Cosméticos, ropa interior y aretes van siempre a `noVendible` en devoluciones. |
| **DV-011** | Condiciones de devolución | Clasificación obligatoria entre `VENDIBLE` y `NO_VENDIBLE` por el operador. |
| **DV-012** | Devoluciones fuera de plazo | Excedidos los 5 días, solo el Administrador puede autorizar con motivo. |
| **DV-013** | Venta reconocida | POS: venta completada. Web: cuando cumple ambos (`PAGADO` y `ENVIADO`). |
| **DV-014** | Facturación electrónica | Excluida del MVP; desacoplada en `FacturacionPort` con comprobante interno. |
| **DV-015** | Datos de checkout web | Nombre, correo, clave, teléfono, dirección, municipio DANE y consentimiento Ley 1581. |
| **DV-016** | Roles y permisos | `ADMIN`, `VENDEDOR` (11 permisos configurables) y `CLIENTE`. |
| **DV-017** | Compras a proveedor | Ingreso exclusivo a Central en `PEDIDA -> RECIBIDA/CANCELADA`. |
| **DV-018** | Formato de comprobante | Comprobante imprimible por navegador con consecutivo diferido. |
| **DV-019 / 020** | Pooler y Supabase | Supabase PostgreSQL con `DATABASE_URL` (pooler) y `DIRECT_URL` (migraciones). |
| **DV-021 / 022** | Dispositivos y conectividad | POS web para pantallas `>= 1024px`. Sin modo offline; protección por `Idempotency-Key`. |
