import { Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { hash } from 'bcryptjs';
import { DataSource, Repository } from 'typeorm';
import { RONDAS_BCRYPT } from '../auth/auth.service';
import { EjercicioEntidad } from '../entidades/ejercicio.entidad';
import { PlanEntidad } from '../entidades/plan.entidad';
import { SesionEntidad } from '../entidades/sesion.entidad';
import { UsuarioEntidad } from '../entidades/usuario.entidad';
import { crearSemilla } from './semilla';

/**
 * Datos de prueba (los mismos que usaba el front). Se cargan solos si la base está vacía,
 * o a pedido con `npm run seed`, que borra todo y los vuelve a crear.
 * Todos los usuarios de prueba tienen la contraseña SEMILLA_PASSWORD del .env.
 */
@Injectable()
export class SembradorService implements OnApplicationBootstrap {
  private readonly log = new Logger('Semilla');

  constructor(
    private readonly db: DataSource,
    @InjectRepository(UsuarioEntidad) private readonly usuarios: Repository<UsuarioEntidad>,
  ) {}

  async onApplicationBootstrap() {
    if ((await this.usuarios.count()) === 0) {
      await this.sembrar();
      this.log.log('Base vacía: se cargaron los datos de prueba.');
    }
  }

  async reiniciar() {
    await this.db.transaction(async (m) => {
      for (const entidad of [SesionEntidad, PlanEntidad, EjercicioEntidad, UsuarioEntidad]) {
        await m.getRepository(entidad).clear();
      }
    });
    await this.sembrar();
  }

  async sembrar() {
    const s = crearSemilla();
    const passwordHash = await hash(process.env.SEMILLA_PASSWORD || 'entrenar123', RONDAS_BCRYPT);
    await this.db.transaction(async (m) => {
      await m.getRepository(UsuarioEntidad).save([
        ...s.entrenadores.map((e) => ({
          id: e.id,
          nombre: e.nombre,
          email: e.email,
          rol: e.rol,
          passwordHash,
          entrenadorId: null,
          meta: null,
          pesos: null,
          altaEn: new Date().toISOString(),
        })),
        ...s.alumnos.map((a) => ({
          id: a.id,
          nombre: a.nombre,
          email: a.email,
          rol: a.rol,
          passwordHash,
          entrenadorId: a.entrenadorId ?? null,
          meta: a.meta ?? null,
          pesos: a.pesos ?? null,
          altaEn: a.altaEn,
        })),
      ]);
      await m.getRepository(EjercicioEntidad).save(s.ejercicios.map((e) => ({ ...e, equipo: e.equipo ?? null, videoUrl: e.videoUrl ?? null })));
      await m.getRepository(PlanEntidad).save(s.planes);
      await m
        .getRepository(SesionEntidad)
        .save(s.sesiones.map((x) => ({ ...x, cerradaEn: x.cerradaEn ?? null, esfuerzo: x.esfuerzo ?? null, comentario: x.comentario ?? null })), {
          chunk: 50,
        });
    });
  }
}
