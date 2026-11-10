---
id: RN-CAJ-VTA
tags: [caja, sesiones, arqueo, pos, ventas, preempcion, efectivo, bogota]
criterios_ca: [CA-12, CA-13, CA-14, CA-15, CA-16, CA-17, CA-18, CA-55, CA-56, CA-60, CA-61, QA-004, QA-005, QA-006, QA-007, QA-008, QA-009]
modelos_prisma: [SesionCaja, MovimientoCaja, RelevoTurnoCaja, VentaPOS, LineaVentaPOS, PagoVentaPOS, ConsecutivoUbicacion]
---
# Reglas de Caja y Terminal Punto de Venta (RN-CAJ y RN-VTA)

Relacionado con: [[MOD-07-Sesiones-Caja]] | [[MOD-08-Ventas-POS]] | [[RN-INV-Kardex-y-Saldos]]

## 1. Sesiones de Caja, Movimientos y Arqueo (`RN-CAJ-01`, `02`, `05`, `06`, `07`, `10` y `13`)
- **RN-CAJ-01 [D]:** Máximo **una sola sesión `ABIERTA`** por punto de venta a la vez, garantizado por el índice único parcial `uq_unica_sesion_caja_abierta_por_punto` (`QA-007`).
- **RN-CAJ-02 [D] (Apertura con Base Contada):** El cajero ingresa `baseContadaCop`. Si difiere de los $200.000 COP configurados, exige observación.
- **RN-CAJ-05 [D] (Vigencia Diaria en Colombia, `CA-56`, `QA-009`):**
  La sesión guarda `fechaNegocioColombia = hoy_bogota()`. Si `fechaNegocioColombia < hoy_bogota()`, la sesión se considera **vencida**:
  - **Bloquea rotundamente:** Emitir ventas POS, registrar devoluciones, procesar cambios, anular ventas o registrar movimientos de caja.
  - **Única acción permitida:** Ejecutar su arqueo de cierre.
- **RN-CAJ-06 [D] (Fórmula Integral de Efectivo Esperado, `CA-15`, `CA-55`, `QA-008`):**
  ```text
  efectivoEsperado = baseContadaCop 
                   + ventasEfectivoSesion 
                   - reembolsosEfectivoSesion 
                   - sangriasRetirosSesion 
                   - gastosMenoresSesion 
                   + ingresosManualesSesion

  diferencia = efectivoContadoCierreCop - efectivoEsperado
  ```
  El cálculo parte siempre de la `baseContadaCop` real de apertura del día, evitando arrastrar descuadres de días anteriores (`CA-55`).
- **RN-CAJ-07 [D] (Sangrías y Movimientos de Caja):**
  En cualquier momento de la sesión `ABIERTA`, el cajero puede registrar un `MovimientoCaja`:
  - `SANGRIA_RETIRO`: Retiro de efectivo de seguridad hacia caja fuerte o depósito. Resta de `efectivoEsperado`.
  - `GASTO_MENOR`: Pago de caja menor (aseo, cafetería, flete local). Exige concepto y soporte opcional. Resta de `efectivoEsperado`.
  - `INGRESO_MANUAL`: Entrada de menudo o sencillo para dar cambio. Suma a `efectivoEsperado`.
  - Todo movimiento valida `montoCop > 0` entero en COP (`RN-GEN-04`) y queda registrado con el `usuarioId` que lo ejecutó.
- **RN-CAJ-10 [D] (Efectivo a Entregar al Cierre):**
  ```text
  efectivoAEntregar = max(0, efectivoContadoCierreCop - baseConfiguradaCop)
  ```
  Jamás genera un valor negativo.
- **RN-CAJ-13 [D] (Relevo de Turno / Corte X y Cajero Activo):**
  - **Relevo de Turno Oficial:** Sin cerrar la sesión del local, el cajero saliente realiza un conteo rápido (`efectivoContadoCop`). El sistema genera un registro inmutable en `RelevoTurnoCaja` con la foto del efectivo esperado a esa hora, liquidando el saldo de responsabilidad del cajero saliente y entregando la gaveta al entrante.
  - **Ausencias Temporales (Almuerzo / Permiso):** La terminal permite cambiar de cajero activo (mediante PIN de 4 dígitos o selector autenticado). Cada ticket de venta, devolución o movimiento de caja se sella con el `vendedorId` de quien lo ejecuta físicamente, garantizando trazabilidad individual de cada vuelto y cobro.

## 2. Ventas POS y Disponibilidad en Mostrador (`RN-VTA-01`, `02`, `03`, `09` y `10`)
- **RN-VTA-01 [D]:** Venta exige sesión de caja abierta y vigente en ese punto.
- **RN-VTA-02 [D]:** Métodos de pago permitidos en POS: `EFECTIVO` y `TRANSFERENCIA` (exige referencia bancaria, no suma a efectivo esperado, `CA-14`).
- **RN-VTA-03 [D] (Preempción Física POS sobre Reservas Web, `CA-60`, `CA-61`):**
  - Si un cliente presencial está en mostrador con el producto físico en mano:
    - Se verifica: `fisico - reservadoDuro >= cantidad`.
    - **Si toma unidades de `reservadoBlando` (`RECIBIDO` o `CONFIRMADO`):** La venta POS procede con éxito; en la misma transacción atómica se reduce `reservadoBlando` y se dispara la reasignación del pedido web a otra sede o a custodia en Central (`CA-60`, `QA-004`).
    - **Excepción Inviolable (`reservadoDuro`, `CA-61`, `QA-005`):** Si la prenda está en un pedido web `EN_PREPARACION`, la unidad está empacada físicamente: el POS no puede venderla y la transacción se aborta con error explicativo.
- **RN-VTA-09 [D] (Consecutivo Diferido por Punto):** El consecutivo oficial (`P01-000001`) se genera e incrementa sobre `ConsecutivoUbicacion` como la última instrucción antes del `COMMIT`, garantizando numeración secuencial sin huecos.
- **RN-VTA-10 [D]:** Todo comprobante POS muestra datos de la empresa, sede, consecutivo, detalle y leyenda legal de comprobante interno (MVP sin DIAN, `DV-014`).
