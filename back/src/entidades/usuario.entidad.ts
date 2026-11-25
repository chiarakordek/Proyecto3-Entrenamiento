import { Column, Entity, Index, PrimaryColumn } from 'typeorm';
import type { MetaAlumno, Rol } from '../dominio/tipos';

/** Entrenadores y alumnos en una sola tabla, distinguidos por rol. */
@Entity('usuarios')
export class UsuarioEntidad {
  @PrimaryColumn({ type: 'varchar', length: 40 })
  id: string;

  @Column({ type: 'varchar', length: 120 })
  nombre: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 160 })
  email: string;

  @Column({ type: 'varchar', length: 12 })
  rol: Rol;

  /** Hash bcrypt. No se lee salvo al iniciar sesión. */
  @Column({ type: 'varchar', length: 100, select: false })
  passwordHash: string;

  /** Solo alumnos: entrenador al que está vinculado (vacío si todavía no tiene). */
  @Index()
  @Column({ type: 'varchar', length: 40, nullable: true })
  entrenadorId: string | null;

  /** Solo alumnos: objetivo y pesos (el peso ideal solo si el objetivo es bajar de peso). */
  @Column({ type: 'simple-json', nullable: true })
  meta: MetaAlumno | null;

  /** Solo alumnos: historial de peso corporal para ver la evolución. */
  @Column({ type: 'simple-json', nullable: true })
  pesos: { fecha: string; kg: number }[] | null;

  @Column({ type: 'varchar', length: 30 })
  altaEn: string;
}
