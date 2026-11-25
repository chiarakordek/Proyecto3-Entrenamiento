import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { error, ErrorDominio, noEncontrado } from '../comun/errores';
import { nuevoId } from '../comun/util';
import { GRUPOS_POR_TIPO, tipoDeGrupo } from '../dominio/clasificacion';
import type { ErrorRegla } from '../dominio/reglas';
import type { Ejercicio } from '../dominio/tipos';
import { EjercicioEntidad } from '../entidades/ejercicio.entidad';
import { aEjercicio } from '../entidades/mapeos';
import { PlanEntidad } from '../entidades/plan.entidad';
import { SesionEntidad } from '../entidades/sesion.entidad';
import { UsuarioEntidad } from '../entidades/usuario.entidad';
import type { EjercicioDto } from './dto';

const GRUPOS_VALIDOS = Object.values(GRUPOS_POR_TIPO).flat();

@Injectable()
export class EjerciciosService {
  constructor(
    @InjectRepository(EjercicioEntidad) private readonly ejercicios: Repository<EjercicioEntidad>,
    @InjectRepository(PlanEntidad) private readonly planes: Repository<PlanEntidad>,
    @InjectRepository(SesionEntidad) private readonly sesiones: Repository<SesionEntidad>,
    @InjectRepository(UsuarioEntidad) private readonly usuarios: Repository<UsuarioEntidad>,
  ) {}

  async listar(): Promise<Ejercicio[]> {
    return (await this.ejercicios.find({ order: { nombre: 'ASC' } })).map(aEjercicio);
  }

  /** Alta (sin id) o modificación (con id). El tipo sale del grupo muscular. */
  async guardar(dto: EjercicioDto, id?: string): Promise<Ejercicio> {
    const nombre = dto.nombre.trim();
    const errores: ErrorRegla[] = [];
    if (nombre.length < 3) errores.push({ campo: 'nombre', mensaje: 'El nombre tiene que tener al menos 3 letras.' });
    if (dto.descripcion.trim().length < 10) errores.push({ campo: 'descripcion', mensaje: 'Describí la técnica en al menos una oración.' });
    if (!GRUPOS_VALIDOS.includes(dto.grupo)) errores.push({ campo: 'grupo', mensaje: 'Elegí un grupo muscular de la clasificación.' });
    if (dto.videoUrl && !/^https?:\/\/\S+\.\S+/.test(dto.videoUrl.trim())) {
      errores.push({ campo: 'videoUrl', mensaje: 'El link del video tiene que empezar con http:// o https://.' });
    }
    const repetido = await this.ejercicios
      .createQueryBuilder('e')
      .where('LOWER(e.nombre) = :n', { n: nombre.toLowerCase() })
      .andWhere(id ? 'e.id <> :id' : '1=1', { id })
      .getOne();
    if (repetido) errores.push({ campo: 'nombre', mensaje: 'Ya existe un ejercicio con ese nombre.' });
    if (errores.length) throw new ErrorDominio(errores);

    if (id && !(await this.ejercicios.exist({ where: { id } }))) throw noEncontrado('El ejercicio');
    const entidad = this.ejercicios.create({
      id: id ?? nuevoId('ej'),
      nombre,
      descripcion: dto.descripcion.trim(),
      grupo: dto.grupo,
      tipo: tipoDeGrupo(dto.grupo),
      medicion: dto.medicion,
      equipo: dto.equipo?.trim() || null,
      videoUrl: dto.videoUrl?.trim() || null,
    });
    await this.ejercicios.save(entidad);
    return aEjercicio(entidad);
  }

  /** Baja (PPT: "alta-baja-modificación"). Solo si nunca se usó, para no romper planes ni historiales. */
  async eliminar(id: string): Promise<void> {
    if (!(await this.ejercicios.exist({ where: { id } }))) throw noEncontrado('El ejercicio');
    const enPlan = (await this.planes.find()).find((p) => p.dias.some((d) => d.items.some((i) => i.ejercicioId === id)));
    if (enPlan) {
      const alumno = await this.usuarios.findOneBy({ id: enPlan.alumnoId });
      throw error('ejercicio', `Está en el plan "${enPlan.nombre}"${alumno ? ` de ${alumno.nombre}` : ''}. Sacalo del plan antes de borrarlo.`);
    }
    const enSesion = (await this.sesiones.find()).some((s) => s.ejercicios.some((e) => e.ejercicioId === id));
    if (enSesion) throw error('ejercicio', 'Ya hay sesiones registradas con este ejercicio: borrarlo dejaría historiales incompletos.');
    await this.ejercicios.delete({ id });
  }
}
