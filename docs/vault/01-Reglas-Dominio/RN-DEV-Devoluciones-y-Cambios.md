---
id: RN-DEV
tags: [devoluciones, cambios, reembolsos, iliquidez, caja, venta-raiz, plazos]
criterios_ca: [CA-26, CA-27, CA-28, CA-29, CA-30, CA-31, CA-32, CA-33, CA-34, CA-54, CA-63, QA-016, QA-017, QA-018, QA-019]
modelos_prisma: [DevolucionPOS, LineaDevolucionPOS, VentaPOS, SesionCaja]
---
# Reglas de Devoluciones, Cambios y Anulaciones (RN-DEV-01 a RN-DEV-16)

Relacionado con: [[MOD-10-Devoluciones-Cambios]] | [[RN-CAJ-VTA-Caja-y-Ventas-POS]] | [[RN-DES-Promociones-y-Prorrateo]]

## 1. Plazos y Condiciones en POS
- **RN-DEV-01 [D]:** Una devolución en POS debe realizarse en el **mismo punto de venta** donde se emitió la compra original, con una sesión de caja `ABIERTA` hoy (`CA-29`).
- **RN-DEV-02 [D] (Excepción por Iliquidez en Caja, `CA-54`, `QA-019`):**
  Si una devolución de una compra pagada en efectivo supera el `efectivoEsperado` actual de la sesión de caja:
  - El sistema **habilita reembolsar por `TRANSFERENCIA`** (con código de referencia y observación obligatorios).
  - Este reembolso no descuenta del efectivo esperado de la caja, evitando dejar el saldo en negativo.
- **RN-DEV-03 [D] (Plazo Anclado a la Venta Raíz, `CA-63`):**
  El plazo en mostrador POS es de **5 días calendario** contados estrictamente desde la **fecha de la venta original (raíz)**. Realizar un cambio de prenda **NO reinicia el plazo** (`CA-63`). Vencidos los 5 días, solo el Administrador puede autorizar la operación (`CA-27`).
- **RN-DEV-06 [D] (Reembolso sobre Neto Prorrateado, `CA-26`):**
  El monto a devolver por cada unidad es exactamente su precio neto unitario pagado (`precioNetoTotalCop / cantidad`), nunca el precio de lista. Si el artículo tenía 100% de descuento ($0 COP), el reembolso es de $0 COP.

## 2. Operación de Cambios en POS (`RN-DEV-11`, `CA-30`)
Un cambio es una operación atómica que vincula una devolución y una nueva venta:
- **Caso A (Mismo Producto, Talla/Color Distinto, `QA-017`):** El nuevo artículo conserva el precio neto pagado por la prenda devuelta. La diferencia es estrictamente **`$0 COP`**.
- **Caso B (Producto Distinto de Mayor Valor, `QA-018`):** El nuevo artículo se factura a su precio de lista vigente sin descuentos. El cliente paga el excedente.
- **Caso C (Producto Distinto de Menor Valor):** Se liquida la diferencia a favor del cliente en efectivo o transferencia.
- **Caso D (Devolución Posterior de Cambio Mixto):** Si el cliente pagó parte en efectivo y parte con saldo a favor, el cajero decide en cuál de los dos medios reembolsa si hay liquidez.

## 3. Invariantes de Destino Físico y Contable
- **RN-DEV-09 [D] (No Vendible por Defecto, `CA-31`):** Cosméticos, ropa interior y aretes entran siempre a saldo `noVendible`. En ropa y calzado, el cajero selecciona si entra a `fisico` (vendible) o a `noVendible` (prenda con imperfectos).
- **RN-DEV-10 [D] (Regla de Mes Cerrado, `CA-34`):** Una devolución jamás modifica registros ni reportes de meses anteriores. La devolución resta en las Ventas Netas del mes y día en que se procesa.
- **RN-DEV-12 [D] (Anulaciones en el Día, `CA-33`):** Solo se anulan ventas de la sesión de caja abierta actual que no tengan devoluciones previas.
