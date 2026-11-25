import { Column, Entity, Index, PrimaryColumn } from 'typeorm';
import type { GrupoMuscular, Medicion, TipoEjercicio } from '../dominio/tipos';

/** Ejercicio del catálogo (biblioteca global). */
@Entity('ejercicios')
export class EjercicioEntidad {
  @PrimaryColumn({ type: 'varchar', length: 40 })
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 120 })
  nombre: string;

  @Column({ type: 'text' })
  descripcion: string;

  @Column({ type: 'varchar', length: 20 })
  tipo: TipoEjercicio;

  @Column({ type: 'varchar', length: 30 })
  grupo: GrupoMuscular;

  @Column({ type: 'varchar', length: 80, nullable: true })
  equipo: string | null;

  @Column({ type: 'varchar', length: 15 })
  medicion: Medicion;

  @Column({ type: 'varchar', length: 500, nullable: true })
  videoUrl: string | null;
}
