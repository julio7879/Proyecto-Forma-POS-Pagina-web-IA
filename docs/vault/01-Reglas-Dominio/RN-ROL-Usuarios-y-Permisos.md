---
id: RN-ROL
tags: [usuarios, roles, permisos, seguridad, auth, cache]
criterios_ca: [CA-03, CA-41, CA-49, CA-50]
modelos_prisma: [Usuario, Ubicacion, RegistroAuditoria]
---
# Reglas de Usuarios, Roles y Permisos (RN-ROL-01 a RN-ROL-08)

Relacionado con: [[MOD-01-Identidad]] | [[RN-GEN-Principios-Inmutables]] | [[Matriz-CA-01-a-CA-65]]

## 1. Definición de Roles (`RN-ROL-01`)
El sistema cuenta exclusivamente con tres roles (`enum RolUsuario`):
1. **`ADMIN` (Administrador):** Control total del sistema, configuración global, todas las sedes, auditoría y resolución de novedades.
2. **`VENDEDOR` (Vendedor / Cajero):** Operador físico asignado a un único punto de venta presencial. Sus capacidades dependen de 11 permisos booleanos configurables.
3. **`CLIENTE` (Comprador Web):** Usuario final que compra en la Tienda Web. Solo tiene acceso a su perfil y sus propios pedidos.

## 2. Invariantes de Seguridad y Asignación
- **RN-ROL-02 [D]:** El Administrador define los 11 permisos y el tope porcentual de descuento manual (`topeDescuentoPorc`, 0% a 100%) de cada vendedor.
- **RN-ROL-03 [D]:** El Administrador tiene todos los permisos activos por diseño. El sistema prohíbe desactivar al último Administrador activo (`RF-USU-05`).
- **RN-ROL-04 [D]:** Un vendedor pertenece a un único punto de venta a la vez y solo puede operar con datos de su `ubicacionId`. Solo el Admin puede reasignarlo, y **únicamente si el punto actual no tiene una sesión de caja `ABIERTA`**.
- **RN-ROL-05 [D] (Revocación Instantánea, `CA-50`):** Todo cambio en los permisos o desactivación de un vendedor invalida inmediatamente su entrada en la caché local (`UserPermissionCache`), surtiendo efecto en la siguiente petición (`403 Forbidden`) sin necesidad de esperar a que expire el token JWT.
- **RN-ROL-06 [D]:** Para comprar en la web es obligatorio registrarse con correo y contraseña o mediante inicio de sesión social con Google OAuth (almacenando `googleId` con `passwordHash` opcional). Un cliente jamás puede consultar datos de otros clientes.
- **RN-ROL-07 [D]:** Prohibido el borrado físico de usuarios. Un vendedor con sesión de caja abierta en su tienda no puede ser desactivado.
- **RN-ROL-08 [D]:** Las contraseñas se almacenan con hash seguro `bcrypt`. Al 5.º intento fallido consecutivo de login, la cuenta se bloquea por 15 minutos (`RF-USU-02`).

## 3. Matriz Oficial de los 11 Permisos del Vendedor
| Código Permiso | Nombre Funcional | Valor Semilla por Defecto | Alcance Operativo |
| :--- | :--- | :--- | :--- |
| `permVender` | Cobrar en Terminal POS | `true` | Permite emitir ventas presenciales en su sede. |
| `permCaja` | Abrir y cerrar sesión de caja | `true` | Permite registrar base contada y arqueo de cierre. |
| `permDescuentoManual` | Aplicar descuentos manuales | `false` | Habilita aplicar hasta su `topeDescuentoPorc` en POS. |
| `permAnularVentas` | Anular ventas del día | `false` | Solo en la sesión abierta del día actual. |
| `permDevoluciones` | Procesar devoluciones y cambios | `false` | Requiere sesión abierta y respetar los 5 días raíz. |
| `permVerInventario` | Consultar stock de su sede | `true` | Visualiza saldos físico, reservado y disponible. |
| `permSolicitarTraslado` | Solicitar mercancía a Central | `true` | Crea documentos de traslado en estado `SOLICITADO`. |
| `permRecibirTraslado` | Recibir traslados en el punto | `true` | Registra conteo físico de mercancía recibida. |
| `permVerOtrosPuntos` | Ver inventario de otras sedes | `false` | Si es `false`, consultar otra sede da `403`. |
| `permPedidosWeb` | Preparar y despachar pedidos web | `false` | Solo en puntos con `despachaWeb = true`. |
| `permVerVentasPunto` | Ver reporte de ventas de su punto | `true` | Restringido exclusivamente a su propia sede. |
