import { Column, Entity, Index, PrimaryColumn } from 'typeorm';
import type { DiaPlan, EstadoPlan } from '../dominio/tipos';

/**
 * Plan de entrenamiento. Sus 3 días (con los ítems ordenados) se guardan como JSON:
 * el plan es un agregado que siempre se lee y se escribe entero, y así la API
 * devuelve exactamente la misma forma que usa el front.
 */
@Entity('planes')
export class PlanEntidad {
  @PrimaryColumn({ type: 'varchar', length: 40 })
  id: string;

  @Column({ type: 'varchar', length: 120 })
  nombre: string;

  @Index()
  @Column({ type: 'varchar', length: 40 })
  entrenadorId: string;

  @Index()
  @Column({ type: 'varchar', length: 40 })
  alumnoId: string;

  @Column({ type: 'simple-json' })
  dias: [DiaPlan, DiaPlan, DiaPlan];

  @Column({ type: 'varchar', length: 10 })
  vigenciaDesde: string;

  @Column({ type: 'varchar', length: 10 })
  vigenciaHasta: string;

  @Column({ type: 'varchar', length: 12 })
  estado: EstadoPlan;

  @Column({ type: 'varchar', length: 30 })
  creadoEn: string;
}
