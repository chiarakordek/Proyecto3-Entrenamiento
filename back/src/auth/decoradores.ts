import { createParamDecorator, SetMetadata, type ExecutionContext } from '@nestjs/common';
import type { Rol } from '../dominio/tipos';

export interface UsuarioToken {
  id: string;
  rol: Rol;
}

export const CLAVE_PUBLICO = 'p3:publico';
export const CLAVE_ROLES = 'p3:roles';

/** La ruta no requiere sesión (login y registro). */
export const Publico = () => SetMetadata(CLAVE_PUBLICO, true);

/** Solo pueden usar la ruta los roles indicados. */
export const Roles = (...roles: Rol[]) => SetMetadata(CLAVE_ROLES, roles);

/** Usuario que hizo la petición, sacado del token. */
export const UsuarioActual = createParamDecorator((_: unknown, ctx: ExecutionContext): UsuarioToken => {
  return ctx.switchToHttp().getRequest().usuario;
});
