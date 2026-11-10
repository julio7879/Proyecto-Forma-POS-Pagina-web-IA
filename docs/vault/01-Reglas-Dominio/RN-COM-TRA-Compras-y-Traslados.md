---
id: RN-COM-TRA
tags: [compras, proveedores, traslados, transito, novedades, faltantes, excedentes, retornando]
criterios_ca: [CA-04, CA-05, CA-06, CA-07, CA-09, CA-10, CA-11, CA-57, CA-58, CA-59, QA-010, QA-011, QA-012]
modelos_prisma: [CompraProveedor, LineaCompra, Traslado, LineaTraslado, ResolucionNovedadTraslado]
---
# Reglas de Compras y Traslados entre Sedes (RN-COM y RN-TRA)

Relacionado con: [[MOD-05-Compras]] | [[MOD-06-Traslados]] | [[RN-INV-Kardex-y-Saldos]]

## 1. Compras a Proveedor en Bodega Central (`RN-COM-01` a `RN-COM-07`)
- **RN-COM-01 [D]:** Toda compra a proveedor ingresa exclusivamente a **Bodega Central**.
- **RN-COM-02 [D]:** Estados: `PEDIDA -> RECIBIDA` o `CANCELADA`. Mientras esté en `PEDIDA` no altera stock.
- **RN-COM-03 [D] (Recepción Única e Idempotente):** La recepción se efectúa una sola vez por las unidades realmente recibidas (`cantidadRecibida`), sumando a `fisico` en Central (`COMPRA_RECIBIDA`). Reintentos no duplican stock.
- **RN-COM-04 [D]:** Costo unitario (`costoUnitarioCop`) opcional en MVP.
- **RN-COM-05 [D]:** Una compra en `RECIBIDA` o `CANCELADA` es inmutable.

## 2. Ciclo de Vida de Traslados y Novedades (`RN-TRA-01`, `03`, `04`, `07`, `08`, `09`, `10`, `12` y `15`)
- **RN-TRA-01 [D]:** Solicitud desde punto inicia en `SOLICITADO`. Envío directo de Central inicia en `APROBADO`.
- **RN-TRA-03 [D] (Despacho y Tránsito, `CA-04`, `CA-05`):** Al pasar a `ENVIADO`, resta `cantidadEnviada` del `fisico` de Central. La mercancía queda **en tránsito**; ninguna sede puede venderla.
- **RN-TRA-04 [D]:** `cantidadAprobada` no puede superar `cantidadSolicitada` (`CA-11`).
- **RN-TRA-07 [D] (Recepción en Destino, `CA-07`):** El punto registra `recibidaBuena` y `recibidaDanada`. Se valida:
  ```text
  recibidaBuena + recibidaDanada <= enviada
  ```
- **RN-TRA-08 [D] (Recepción Directa sin Novedad, `CA-57`, `QA-010`):**
  Si `recibidaBuena + recibidaDanada == enviada` y `excedenteReportado == 0`:
  - Suma buenas a `fisico` del punto.
  - Suma dañadas a `noVendible` del punto (con observación obligatoria si `dañadas > 0`).
  - Pasa directamente al estado final **`RECIBIDO`**.
- **RN-TRA-09 [D] (Novedades por Faltante o Excedente, `CA-06`, `CA-58`, `QA-011`):**
  Si hay faltantes (`recibidaBuena + recibidaDanada < enviada`) o se marca check de excedente (`excedenteReportado > 0`):
  - El traslado pasa a **`RECIBIDO_CON_NOVEDAD`** con observación obligatoria.
- **RN-TRA-10 [D] (Resolución por Administrador, `CA-10`):**
  Solo el Admin puede resolver novedades:
  - **Faltantes:** Tipificados como *Llegó después* (+ `fisico`), *Retornó a Central* (+ `fisico` Central), o *Pérdida/Merma* (baja).
  - **Excedentes:** *Incorporar* (- `fisico` Central, + `fisico` punto) o *Descartar/Devolver*.
  - Al resolverse el 100% de unidades pendientes, el traslado pasa a **`CERRADO`**.
- **RN-TRA-12 [D] (Flujo «Retornando a Central», `CA-09`, `CA-59`, `QA-012`):**
  Si el Admin cancela un traslado en estado `ENVIADO`:
  1) Pasa al estado intermedio **`RETORNANDO_A_CENTRAL`** (las unidades continúan en tránsito y el punto destino queda bloqueado para recibirlo).
  2) Cuando el paquete llega físicamente de vuelta a Bodega Central, el Admin confirma el reingreso físico: suma al `fisico` de Central y transiciona a **`CANCELADO`**.
- **RN-TRA-15 [D]:** Alerta automática si un traslado lleva más de 48 horas en tránsito sin recepción.
