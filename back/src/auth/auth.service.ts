import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { compare, hash } from 'bcryptjs';
import { Repository } from 'typeorm';
import { error, noEncontrado } from '../comun/errores';
import { ahora, nuevoId } from '../comun/util';
import type { Alumno, Entrenador } from '../dominio/tipos';
import { aUsuario } from '../entidades/mapeos';
import { UsuarioEntidad } from '../entidades/usuario.entidad';
import type { LoginDto, RegistroDto } from './dto';

export interface Sesion {
  token: string;
  usuario: Alumno | Entrenador;
}

export const RONDAS_BCRYPT = 10;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UsuarioEntidad) private readonly usuarios: Repository<UsuarioEntidad>,
    private readonly jwt: JwtService,
  ) {}

  async login({ email, password }: LoginDto): Promise<Sesion> {
    const usuario = await this.usuarios
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.email = :email', { email: email.trim().toLowerCase() })
      .getOne();
    // Mismo mensaje si no existe o si la contraseña no coincide: no revela qué emails tienen cuenta.
    if (!usuario || !(await compare(password, usuario.passwordHash))) {
      throw new UnauthorizedException({ mensaje: 'El email o la contraseña no son correctos.' });
    }
    return this.emitir(usuario);
  }

  async registro(dto: RegistroDto): Promise<Sesion> {
    const email = dto.email.trim().toLowerCase();
    if (await this.usuarios.exist({ where: { email } })) throw error('email', 'Ya hay una cuenta con ese email. Iniciá sesión.');
    const usuario = this.usuarios.create({
      id: nuevoId('alu'),
      nombre: dto.nombre.trim(),
      email,
      rol: 'ALUMNO',
      passwordHash: await hash(dto.password, RONDAS_BCRYPT),
      entrenadorId: null,
      meta: null,
      pesos: null,
      altaEn: ahora(),
    });
    await this.usuarios.save(usuario);
    return this.emitir(usuario);
  }

  async yo(id: string): Promise<Alumno | Entrenador> {
    const usuario = await this.usuarios.findOneBy({ id });
    if (!usuario) throw noEncontrado('El usuario');
    return aUsuario(usuario);
  }

  private async emitir(usuario: UsuarioEntidad): Promise<Sesion> {
    const token = await this.jwt.signAsync({ sub: usuario.id, rol: usuario.rol });
    return { token, usuario: aUsuario(usuario) };
  }
}
