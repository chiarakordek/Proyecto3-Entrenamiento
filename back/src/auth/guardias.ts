import { Injectable, UnauthorizedException, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Rol } from '../dominio/tipos';
import { prohibido } from '../comun/errores';
import { CLAVE_PUBLICO, CLAVE_ROLES, type UsuarioToken } from './decoradores';

/** Toda ruta requiere un token válido, salvo las marcadas con @Publico(). */
@Injectable()
export class GuardiaSesion implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const publico = this.reflector.getAllAndOverride<boolean>(CLAVE_PUBLICO, [ctx.getHandler(), ctx.getClass()]);
    if (publico) return true;
    const req = ctx.switchToHttp().getRequest();
    const [tipo, token] = String(req.headers.authorization ?? '').split(' ');
    if (tipo !== 'Bearer' || !token) throw new UnauthorizedException({ mensaje: 'Iniciá sesión para continuar.' });
    try {
      const datos = await this.jwt.verifyAsync<{ sub: string; rol: Rol }>(token);
      req.usuario = { id: datos.sub, rol: datos.rol } satisfies UsuarioToken;
      return true;
    } catch {
      throw new UnauthorizedException({ mensaje: 'Tu sesión venció. Volvé a iniciar sesión.' });
    }
  }
}

/** Restringe por rol las rutas marcadas con @Roles(). */
@Injectable()
export class GuardiaRoles implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Rol[]>(CLAVE_ROLES, [ctx.getHandler(), ctx.getClass()]);
    if (!roles?.length) return true;
    const usuario: UsuarioToken | undefined = ctx.switchToHttp().getRequest().usuario;
    if (!usuario || !roles.includes(usuario.rol)) {
      throw prohibido(roles.includes('ENTRENADOR') ? 'Esto lo puede hacer solo un entrenador.' : 'Esto lo puede hacer solo un alumno.');
    }
    return true;
  }
}
