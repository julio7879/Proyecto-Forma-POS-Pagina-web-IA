/**
 * @deprecated F0 (10-nov-2026): componente de sandbox retirado.
 *
 * Este archivo contenía credenciales de ADMIN y VENDEDOR en texto plano y un
 * fallback que otorgaba roles sin validar contra el backend. No debe montarse
 * en producción. Se conserva el export para no romper imports históricos,
 * pero ya no renderiza nada ni contiene credenciales.
 */
export const SandboxRoleDock = (_props: { activeKey?: string }) => null;
