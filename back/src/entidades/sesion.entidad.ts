import { Column, Entity, Index, PrimaryColumn } from 'typeorm';
import type { EjercicioRegistrado, NumeroDia } from '../dominio/tipos';

/**
 * Sesión registrada. Mientras está abierta se le agregan series; al cerrarla
 * (con esfuerzo y comentario) queda inmutable, como pide el documento.
 */
@Entity('sesiones')
export class SesionEntidad {
  @PrimaryColumn({ type: 'varchar', length: 40 })
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 40 })
  alumnoId: string;

  @Index()
  @Column({ type: 'varchar', length: 40 })
  planId: string;

  @Column({ type: 'int' })
  dia: NumeroDia;

  @Column({ type: 'varchar', length: 30 })
  iniciadaEn: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  cerradaEn: string | null;

  @Column({ type: 'simple-json' })
  ejercicios: EjercicioRegistrado[];

  @Column({ type: 'int', nullable: true })
  esfuerzo: number | null;

  @Column({ type: 'text', nullable: true })
  comentario: string | null;
}
