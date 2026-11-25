import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { hash } from 'bcryptjs';
import { Repository } from 'typeorm';
import { RONDAS_BCRYPT } from '../auth/auth.service';
import { error, ErrorDominio, noEncontrado } from '../comun/errores';
import { ahora, nuevoId } from '../comun/util';
import { normalizarMeta, validarMeta } from '../dominio/reglas';
import type { Alumno, MetaAlumno, Objetivo } from '../dominio/tipos';
import { aAlumno } from '../entidades/mapeos';
import { UsuarioEntidad } from '../entidades/usuario.entidad';
import type { AltaAlumnoDto, MetaDto } from './dto';

export type EstadoVinculo = 'SIN_ENTRENADOR' | 'TUYO' | 'OTRO';

@Injectable()
export class AlumnosService {
  constructor(@InjectRepository(UsuarioEntidad) private readonly usuarios: Repository<UsuarioEntidad>) {}

  /** "Dar de alta" un alumno a cargo del entrenador, con una contraseña inicial. */
  async alta(entrenadorId: string, dto: AltaAlumnoDto): Promise<Alumno> {
    const email = dto.email.trim().toLowerCase();
    if (await this.usuarios.exist({ where: { email } })) {
      throw error('email', 'Ya hay una cuenta con ese email: vinculala en lugar de crearla.');
    }
    const alumno = this.usuarios.create({
      id: nuevoId('alu'),
      nombre: dto.nombre.trim(),
      email,
      rol: 'ALUMNO',
      passwordHash: await hash(dto.password, RONDAS_BCRYPT),
      entrenadorId,
      meta: null,
      pesos: null,
      altaEn: ahora(),
    });
    await this.usuarios.save(alumno);
    return aAlumno(alumno);
  }

  /** Para "vincular": muestra quién es y si ya tiene entrenador, sin revelar cuál. */
  async buscar(
    entrenadorId: string,
    email: string,
  ): Promise<{ id: string; nombre: string; email: string; estado: EstadoVinculo; objetivo?: Objetivo } | null> {
    const u = await this.usuarios.findOneBy({ email: email.trim().toLowerCase(), rol: 'ALUMNO' });
    if (!u) return null;
    const estado: EstadoVinculo = !u.entrenadorId ? 'SIN_ENTRENADOR' : u.entrenadorId === entrenadorId ? 'TUYO' : 'OTRO';
    return { id: u.id, nombre: u.nombre, email: u.email, estado, ...(u.meta ? { objetivo: u.meta.objetivo } : {}) };
  }

  /** "Vincular" un alumno que ya tiene cuenta y no tiene entrenador. */
  async vincular(entrenadorId: string, email: string): Promise<Alumno> {
    const u = await this.usuarios.findOneBy({ email: email.trim().toLowerCase(), rol: 'ALUMNO' });
    if (!u) throw error('email', 'No hay ningún alumno con ese email.');
    if (u.entrenadorId === entrenadorId) throw error('email', 'Ese alumno ya está en tu lista.');
    if (u.entrenadorId) throw error('email', 'Ese alumno ya entrena con otro entrenador.');
    u.entrenadorId = entrenadorId;
    await this.usuarios.save(u);
    return aAlumno(u);
  }

  /** Objetivo y peso del alumno. Cada peso informado se suma al historial. */
  async definirMeta(alumnoId: string, dto: MetaDto): Promise<Alumno> {
    const errores = validarMeta(dto);
    if (errores.length) throw new ErrorDominio(errores);
    const u = await this.usuarios.findOneBy({ id: alumnoId, rol: 'ALUMNO' });
    if (!u) throw noEncontrado('El alumno');
    const meta: MetaAlumno = normalizarMeta({ ...dto, definidaEn: ahora() });
    u.meta = meta;
    u.pesos = [...(u.pesos ?? []), { fecha: meta.definidaEn, kg: meta.pesoActualKg }];
    await this.usuarios.save(u);
    return aAlumno(u);
  }

  /** El entrenador solo puede operar sobre alumnos a su cargo. */
  async alumnoDe(entrenadorId: string, alumnoId: string): Promise<UsuarioEntidad> {
    const u = await this.usuarios.findOneBy({ id: alumnoId, rol: 'ALUMNO' });
    if (!u || u.entrenadorId !== entrenadorId) throw error('alumno', 'Ese alumno no está a tu cargo.');
    return u;
  }
}
