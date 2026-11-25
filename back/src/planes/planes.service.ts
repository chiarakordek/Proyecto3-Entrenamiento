import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Not, Repository } from 'typeorm';
import { AlumnosService } from '../alumnos/alumnos.service';
import { error, ErrorDominio } from '../comun/errores';
import { ahora, nuevoId } from '../comun/util';
import { validarPlan } from '../dominio/reglas';
import type { DiaPlan, ItemPlan, NumeroDia, Plan } from '../dominio/tipos';
import { EjercicioEntidad } from '../entidades/ejercicio.entidad';
import { aEjercicio, aPlan } from '../entidades/mapeos';
import { PlanEntidad } from '../entidades/plan.entidad';
import type { GuardarPlanDto } from './dto';

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
const texto = (v: unknown, max: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : undefined);

/** Reconstruye los 3 días solo con campos conocidos y tipos correctos (nada extra se guarda). */
function diasLimpios(entrada: unknown): [DiaPlan, DiaPlan, DiaPlan] {
  if (!Array.isArray(entrada) || entrada.length !== 3) throw error('plan', 'Un plan tiene exactamente 3 días.');
  return entrada.map((d, i) => {
    const items = Array.isArray(d?.items) ? d.items : [];
    return {
      numero: (i + 1) as NumeroDia,
      ...(texto(d?.titulo, 80) ? { titulo: texto(d.titulo, 80) } : {}),
      items: items.slice(0, 30).map((it: Record<string, unknown>): ItemPlan => {
        const limpio: ItemPlan = {
          id: texto(it?.id, 40) ?? nuevoId('it'),
          ejercicioId: String(it?.ejercicioId ?? ''),
          series: num(it?.series) ?? 0,
          descansoSeg: num(it?.descansoSeg) ?? 0,
        };
        for (const k of ['repeticiones', 'repeticionesMax', 'tiempoSeg', 'cargaKg'] as const) {
          const v = num(it?.[k]);
          if (v !== undefined) limpio[k] = v;
        }
        const notas = texto(it?.notas, 300);
        if (notas) limpio.notas = notas;
        return limpio;
      }),
    };
  }) as [DiaPlan, DiaPlan, DiaPlan];
}

@Injectable()
export class PlanesService {
  constructor(
    @InjectRepository(PlanEntidad) private readonly planes: Repository<PlanEntidad>,
    @InjectRepository(EjercicioEntidad) private readonly ejercicios: Repository<EjercicioEntidad>,
    private readonly alumnos: AlumnosService,
    private readonly db: DataSource,
  ) {}

  async delEntrenador(entrenadorId: string): Promise<Plan[]> {
    return (await this.planes.find({ where: { entrenadorId }, order: { creadoEn: 'ASC' } })).map(aPlan);
  }

  /**
   * Guarda un plan (nuevo o existente). Con asignar=true queda ACTIVO y el plan activo anterior
   * del alumno pasa a FINALIZADO. otrosAlumnoIds: el documento pide asignar "a uno o varios alumnos";
   * cada uno recibe su copia. Devuelve todos los planes del entrenador.
   */
  async guardar(entrenadorId: string, dto: GuardarPlanDto): Promise<Plan[]> {
    const entrada = dto.plan as unknown as Record<string, unknown>;
    const plan: Plan = {
      id: texto(entrada.id, 40) ?? nuevoId('plan'),
      nombre: texto(entrada.nombre, 120) ?? '',
      entrenadorId,
      alumnoId: String(entrada.alumnoId ?? ''),
      dias: diasLimpios(entrada.dias),
      vigenciaDesde: String(entrada.vigenciaDesde ?? '').slice(0, 10),
      vigenciaHasta: String(entrada.vigenciaHasta ?? '').slice(0, 10),
      estado: 'BORRADOR',
      creadoEn: ahora(),
    };

    const catalogo = (await this.ejercicios.find()).map(aEjercicio);
    const errores = validarPlan(plan, catalogo);
    if (errores.length) throw new ErrorDominio(errores);

    await this.alumnos.alumnoDe(entrenadorId, plan.alumnoId);
    const otros = [...new Set(dto.otrosAlumnoIds ?? [])].filter((id) => id !== plan.alumnoId);
    for (const id of otros) await this.alumnos.alumnoDe(entrenadorId, id);

    const existente = await this.planes.findOneBy({ id: plan.id });
    if (existente) {
      if (existente.entrenadorId !== entrenadorId) throw error('plan', 'Ese plan es de otro entrenador.');
      if (existente.alumnoId !== plan.alumnoId) throw error('plan', 'Un plan existente no se puede pasar a otro alumno: asignale una copia.');
      plan.creadoEn = existente.creadoEn;
    }
    plan.estado = dto.asignar ? 'ACTIVO' : existente?.estado === 'ACTIVO' ? 'ACTIVO' : 'BORRADOR';

    await this.db.transaction(async (m) => {
      const repo = m.getRepository(PlanEntidad);
      const activar = async (p: Plan) => {
        // Un alumno tiene un solo plan activo: el anterior pasa a finalizado.
        await repo.update({ alumnoId: p.alumnoId, estado: 'ACTIVO', id: Not(p.id) }, { estado: 'FINALIZADO' });
        await repo.save(repo.create(p));
      };
      if (plan.estado === 'ACTIVO') await activar(plan);
      else await repo.save(repo.create(plan));
      if (dto.asignar) {
        for (const alumnoId of otros) {
          await activar({
            ...plan,
            id: nuevoId('plan'),
            alumnoId,
            creadoEn: ahora(),
            dias: plan.dias.map((d) => ({ ...d, items: d.items.map((i) => ({ ...i, id: nuevoId('it') })) })) as Plan['dias'],
          });
        }
      }
    });

    return this.delEntrenador(entrenadorId);
  }
}
