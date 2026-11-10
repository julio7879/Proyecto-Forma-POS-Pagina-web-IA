---
id: MOD-01
modulo: 01-identidad-usuarios-roles
tags: [usuarios, roles, permisos, auth, bcrypt, jwt]
rf_codes: [RF-USU-01, RF-USU-02, RF-USU-03, RF-USU-04, RF-USU-05, RF-USU-06]
modelos_prisma: [Usuario, Ubicacion, RegistroAuditoria]
criterios_ca: [CA-50]
---
# Módulo 01: Identidad, Usuarios, Roles y Permisos Dinámicos (RF-USU)

Relacionado con: [[RN-ROL-Usuarios-y-Permisos]] | [[RN-GEN-Principios-Inmutables]] | [[Esquema-Prisma-35-Modelos]]

## 1. Alcance Funcional
Gestiona la autenticación, autorización y ciclo de vida de los usuarios del sistema (`ADMIN`, `VENDEDOR` y `CLIENTE`), el control de intentos fallidos y la matriz dinámica de 11 permisos con revocación en tiempo real.

## 2. Requerimientos Funcionales Detallados

| Código RF | Nombre | Actores | Reglas | Entrada → Proceso → Salida | Criterios de Aceptación |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RF-USU-01** | Registro de cuenta de cliente web con consentimiento Ley 1581 | Cliente | `RN-ROL-01`, `RN-ROL-06`, `RN-ROL-08` | **E:** Nombre, correo, clave, teléfono, dirección, municipio DANE y check privacidad.<br>**P:** Valida con Zod, genera hash `bcrypt`, guarda `rol = CLIENTE` y `aceptoPrivacidadEn = NOW()`.<br>**S:** Token JWT y sesión iniciada. | Rechazo si el correo ya existe o falta aceptar la política de privacidad. |
| **RF-USU-02** | Login con control de intentos fallidos | Admin, Vendedor, Cliente | `RN-ROL-08` | **E:** Correo y contraseña.<br>**P:** Verifica que `activo == true` y `bloqueadoHasta < NOW()`. Compara hash `bcrypt`. Al 5.º intento fallido bloquea la cuenta 15 minutos.<br>**S:** JWT con claims de rol, permisos y `ubicacionId`. | Cuenta inactiva o bloqueada recibe `401/403`. |
| **RF-USU-03** | Matriz de permisos de vendedor y revocación instantánea | Administrador | `RN-ROL-02`, `RN-ROL-04`, `RN-ROL-05`, `RN-AUD-02` | **E:** `usuarioId`, `topeDescuentoPorc` (0-100) y los 11 booleanos.<br>**P:** Actualiza `Usuario`, registra en `RegistroAuditoria` e **invalida `UserPermissionCache`** de inmediato.<br>**S:** Permisos actualizados en caliente. | **CA-50:** Desactivar un permiso surte efecto en el siguiente request (`403`) sin desloguear. |
| **RF-USU-04** | Reasignación de punto de venta de un vendedor | Administrador | `RN-ROL-04`, `RN-AUD-02` | **E:** `vendedorId` y `nuevaUbicacionId` activa.<br>**P:** Verifica que NO exista una `SesionCaja` en `ABIERTA` en la sede actual. Si existe, aborta. Si está cerrada, actualiza sede e invalida caché.<br>**S:** Vendedor asignado al nuevo punto. | Se rechaza reasignar vendedor si su punto actual tiene caja abierta. |
| **RF-USU-05** | Desactivación segura de usuarios | Administrador | `RN-ROL-03`, `RN-ROL-07`, `RN-GEN-07` | **E:** `usuarioId` a desactivar.<br>**P:** Prohibido `DELETE`. Si es `ADMIN`, valida que quede al menos otro activo. Si es `VENDEDOR`, valida que su sede no tenga caja abierta. Marca `activo = false` e invalida caché.<br>**S:** Usuario desactivado con historial intacto. | Prohibido desactivar al último Admin o a un vendedor con caja abierta. |
| **RF-USU-06** | Recuperación de clave y notificaciones simuladas | Cliente, Vendedor, Admin | `RN-ROL-06`, `RN-ROL-08` | **E:** Solicitud de reset de clave.<br>**P:** En MVP desacoplado detrás de `NotificacionPort`, registra en bandeja de notificaciones simuladas del Admin.<br>**S:** Hash actualizado de contraseña. | Funciona en local sin SMTP externo. |
