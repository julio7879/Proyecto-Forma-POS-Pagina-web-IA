---
id: RN-DES
tags: [descuentos, promociones, prorrateo, math-floor, residuo, cupones]
criterios_ca: [CA-19, CA-20, CA-21, CA-22, CA-23, CA-24, CA-25]
modelos_prisma: [Promocion, LineaVentaPOS, LineaPedidoWeb]
---
# Reglas de Descuentos, Promociones y Prorrateo (RN-DES-01, 02, 04, 05, 07 y 09)

Relacionado con: [[MOD-09-Descuentos]] | [[RN-GEN-Principios-Inmutables]] | [[RN-DEV-Devoluciones-y-Cambios]]

## 1. Reglas de Descuento
- **RN-DES-01 [D]:** El motor opera en POS y Tienda Web.
- **RN-DES-02 [D]:** Tipos de promoción: `PORCENTAJE` (entero 1 a 100) y `VALOR_FIJO` (entero en COP).
- **RN-DES-04 [D] (No Acumulación Estricta, `CA-22`):** Máximo **un solo descuento por operación**. Prohibido combinar un cupón con otro cupón, o un cupón con descuento manual.
- **RN-DES-05 [D] (Descuento Manual en POS, `CA-23`):**
  Un vendedor con `permDescuentoManual = true` puede aplicar descuento manual (en porcentaje entero o monto fijo) con motivo obligatorio. El descuento máximo admisible es:
  ```typescript
  topeMaximoCop = Math.round((subtotalElegible * vendedor.topeDescuentoPorc) / 100);
  ```
  El Administrador no tiene tope.
- **RN-DES-07 [D] (Promoción Mayor al Subtotal, `CA-25`):**
  Si una promoción de valor fijo supera el subtotal elegible, el descuento se trunca exactamente al subtotal (`descuento = subtotalElegible`), dejando los productos en **`$0 COP`** (jamás negativo). El flete web no se descuenta.

## 2. Algoritmo Canónico de Prorrateo (`RN-DES-09`, `CA-20`)
Todo descuento global `D` aplicado a un conjunto de líneas elegibles con subtotales `L_1, L_2, ..., L_n` y base total `B = SUM(L_i)` se distribuye de la siguiente forma:

1. **Parte Entera por Línea:**
   ```typescript
   parte_i = Math.floor((D * L_i) / B);
   ```
2. **Residuo a la Última Línea Elegible:**
   ```typescript
   sumaPartes = SUM(parte_i);
   residuo = D - sumaPartes;
   parte_n = parte_n + residuo;
   ```
3. **Precio Neto Guardado en Snapshot:**
   Cada línea persiste `precioUnitarioBaseCop`, `descuentoProrrateadoCop` y `precioNetoTotalCop`, garantizando que la suma de los netos sea idéntica al total pagado.

### Ejemplo Oficial (`CA-20`):
Descuento fijo de $1.000 COP sobre 3 líneas de $10.000 COP:
- Línea 1: `floor(1000 * 10000 / 30000) = 333`
- Línea 2: `floor(1000 * 10000 / 30000) = 333`
- Línea 3: `333 + (1000 - 666) = 334`
- Total descontado: `333 + 333 + 334 = 1.000 COP` exactos.
