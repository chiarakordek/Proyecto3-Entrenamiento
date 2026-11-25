import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import type { UsuarioToken } from '../auth/decoradores';
import { noEncontrado } from '../comun/errores';
import type { Alumno, Ejercicio, Entrenador, Plan, Sesion } from '../dominio/tipos';
import { EjercicioEntidad } from '../entidades/ejercicio.entidad';
import { aAlumno, aEjercicio, aEntrenador, aPlan, aSesion } from '../entidades/mapeos';
import { PlanEntidad } from '../entidades/plan.entidad';
import { SesionEntidad } from '../entidades/sesion.entidad';
import { UsuarioEntidad } from '../entidades/usuario.entidad';

/** Lo que ve un usuario, en la misma forma que el almacén del front. */
export interface Datos {
  entrenadores: Entrenador[];
  alumnos: Alumno[];
  ejercicios: Ejercicio[];
  planes: Plan[];
  sesiones: Sesion[];
}

@Injectable()
export class DatosService {
  constructor(
    @InjectRepository(UsuarioEntidad) private readonly usuarios: Repository<UsuarioEntidad>,
    @InjectRepository(EjercicioEntidad) private readonly ejercicios: Repository<EjercicioEntidad>,
    @InjectRepository(PlanEntidad) private readonly planes: Repository<PlanEntidad>,
    @InjectRepository(SesionEntidad) private readonly sesiones: Repository<SesionEntidad>,
  ) {}

  /**
   * Entrenador: él, sus alumnos, sus planes y las sesiones de sus alumnos.
   * Alumno: él, su entrenador (nombre), sus planes y sus sesiones.
   * Los dos ven el catálogo completo.
   */
  async de(usuario: UsuarioToken): Promise<Datos> {
    const yo = await this.usuarios.findOneBy({ id: usuario.id });
    if (!yo) throw noEncontrado('El usuario');
    const ejercicios = (await this.ejercicios.find({ order: { nombre: 'ASC' } })).map(aEjercicio);

    if (yo.rol === 'ENTRENADOR') {
      const alumnos = await this.usuarios.find({ where: { entrenadorId: yo.id, rol: 'ALUMNO' }, order: { nombre: 'ASC' } });
      const ids = alumnos.map((a) => a.id);
      return {
        entrenadores: [aEntrenador(yo)],
        alumnos: alumnos.map(aAlumno),
        ejercicios,
        planes: (await this.planes.find({ where: { entrenadorId: yo.id }, order: { creadoEn: 'ASC' } })).map(aPlan),
        sesiones: ids.length ? (await this.sesiones.find({ where: { alumnoId: In(ids) } })).map(aSesion) : [],
      };
    }

    const entrenador = yo.entrenadorId ? await this.usuarios.findOneBy({ id: yo.entrenadorId }) : null;
    return {
      entrenadores: entrenador ? [aEntrenador(entrenador)] : [],
      alumnos: [aAlumno(yo)],
      ejercicios,
      planes: (await this.planes.find({ where: { alumnoId: yo.id }, order: { creadoEn: 'ASC' } })).map(aPlan),
      sesiones: (await this.sesiones.find({ where: { alumnoId: yo.id } })).map(aSesion),
    };
  }
}
