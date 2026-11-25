import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { error, ErrorDominio, noEncontrado } from '../comun/errores';
import { ahora, nuevoId } from '../comun/util';
import { validarCierreSesion, type ErrorRegla } from '../dominio/reglas';
import type { NumeroDia, SerieRegistrada, Sesion } from '../dominio/tipos';
import { aSesion } from '../entidades/mapeos';
import { PlanEntidad } from '../entidades/plan.entidad';
import { SesionEntidad } from '../entidades/sesion.entidad';
import type { SerieDto } from './dto';

@Injectable()
export class SesionesService {
  constructor(
    @InjectRepository(SesionEntidad) private readonly sesiones: Repository<SesionEntidad>,
    @InjectRepository(PlanEntidad) private readonly planes: Repository<PlanEntidad>,
  ) {}

  /** Inicia el día elegido del plan activo. Si ya hay una sesión abierta, devuelve esa. */
  async iniciar(alumnoId: string, planId: string, dia: NumeroDia): Promise<Sesion> {
    const abierta = await this.sesiones.findOneBy({ alumnoId, cerradaEn: IsNull() });
    if (abierta) return aSesion(abierta);
    const plan = await this.planes.findOneBy({ id: planId });
    if (!plan || plan.alumnoId !== alumnoId) throw noEncontrado('El plan');
    if (plan.estado !== 'ACTIVO') throw error('plan', 'Ese plan ya no está activo.');
    const sesion = this.sesiones.create({
      id: nuevoId('ses'),
      alumnoId,
      planId,
      dia,
      iniciadaEn: ahora(),
      cerradaEn: null,
      ejercicios: plan.dias[dia - 1].items.map((it) => ({ itemId: it.id, ejercicioId: it.ejercicioId, series: [] })),
      esfuerzo: null,
      comentario: null,
    });
    await this.sesiones.save(sesion);
    return aSesion(sesion);
  }

  async registrarSerie(alumnoId: string, sesionId: string, dto: SerieDto): Promise<Sesion> {
    const errores: ErrorRegla[] = [];
    if (dto.pesoKg !== undefined && (dto.pesoKg < 0 || dto.pesoKg > 500)) errores.push({ campo: 'pesoKg', mensaje: 'El peso va de 0 a 500 kg.' });
    if (dto.repeticiones !== undefined && (dto.repeticiones < 0 || dto.repeticiones > 200)) {
      errores.push({ campo: 'repeticiones', mensaje: 'Las repeticiones van de 0 a 200.' });
    }
    if (dto.tiempoSeg !== undefined && (dto.tiempoSeg < 0 || dto.tiempoSeg > 7200)) errores.push({ campo: 'tiempoSeg', mensaje: 'El tiempo va de 0 a 2 horas.' });
    if (dto.pesoKg === undefined && dto.repeticiones === undefined && dto.tiempoSeg === undefined) {
      errores.push({ campo: 'serie', mensaje: 'Indicá peso y repeticiones, o el tiempo.' });
    }
    if (errores.length) throw new ErrorDominio(errores);

    const sesion = await this.abiertaDe(alumnoId, sesionId);
    const ejercicio = sesion.ejercicios.find((e) => e.itemId === dto.itemId);
    if (!ejercicio) throw error('itemId', 'Ese ejercicio no es de esta sesión.');
    const serie: SerieRegistrada = { numero: ejercicio.series.length + 1 };
    if (dto.pesoKg !== undefined) serie.pesoKg = dto.pesoKg;
    if (dto.repeticiones !== undefined) serie.repeticiones = dto.repeticiones;
    if (dto.tiempoSeg !== undefined) serie.tiempoSeg = dto.tiempoSeg;
    ejercicio.series = [...ejercicio.series, serie];
    await this.sesiones.save(sesion);
    return aSesion(sesion);
  }

  async deshacerSerie(alumnoId: string, sesionId: string, itemId: string): Promise<Sesion> {
    const sesion = await this.abiertaDe(alumnoId, sesionId);
    const ejercicio = sesion.ejercicios.find((e) => e.itemId === itemId);
    if (!ejercicio) throw error('itemId', 'Ese ejercicio no es de esta sesión.');
    ejercicio.series = ejercicio.series.slice(0, -1);
    await this.sesiones.save(sesion);
    return aSesion(sesion);
  }

  /** Cierra con esfuerzo (1 a 10) y comentario. Desde ahí la sesión es inmutable. */
  async cerrar(alumnoId: string, sesionId: string, esfuerzo: number | undefined, comentario: string | undefined): Promise<Sesion> {
    const errores = validarCierreSesion(esfuerzo);
    const sesion = await this.abiertaDe(alumnoId, sesionId);
    if (!sesion.ejercicios.some((e) => e.series.length)) errores.push({ campo: 'sesion', mensaje: 'Registrá al menos una serie antes de cerrar.' });
    if (errores.length) throw new ErrorDominio(errores);
    sesion.esfuerzo = esfuerzo!;
    sesion.comentario = comentario?.trim().slice(0, 500) || null;
    sesion.cerradaEn = ahora();
    await this.sesiones.save(sesion);
    return aSesion(sesion);
  }

  /** Descarta una sesión abierta (por ejemplo, si se salió sin anotar nada). */
  async descartar(alumnoId: string, sesionId: string): Promise<void> {
    const sesion = await this.abiertaDe(alumnoId, sesionId);
    await this.sesiones.delete({ id: sesion.id });
  }

  private async abiertaDe(alumnoId: string, sesionId: string): Promise<SesionEntidad> {
    const sesion = await this.sesiones.findOneBy({ id: sesionId });
    if (!sesion || sesion.alumnoId !== alumnoId) throw noEncontrado('La sesión');
    if (sesion.cerradaEn) throw error('sesion', 'La sesión ya está cerrada y no se puede modificar.');
    return sesion;
  }
}
