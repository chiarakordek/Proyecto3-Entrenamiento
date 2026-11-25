import type { Alumno, Ejercicio, Entrenador, Plan, Sesion } from '../dominio/tipos';
import { sinNulos } from '../comun/util';
import type { EjercicioEntidad } from './ejercicio.entidad';
import type { PlanEntidad } from './plan.entidad';
import type { SesionEntidad } from './sesion.entidad';
import type { UsuarioEntidad } from './usuario.entidad';

/** De entidad a la forma que usa el front (sin hash de contraseña y sin campos vacíos). */

export function aAlumno(u: UsuarioEntidad): Alumno {
  const copia: Partial<UsuarioEntidad> = { ...u };
  delete copia.passwordHash;
  return sinNulos({ ...copia, rol: 'ALUMNO' }) as unknown as Alumno;
}

export function aEntrenador(u: UsuarioEntidad): Entrenador {
  return { id: u.id, nombre: u.nombre, email: u.email, rol: 'ENTRENADOR' };
}

export const aUsuario = (u: UsuarioEntidad): Alumno | Entrenador => (u.rol === 'ENTRENADOR' ? aEntrenador(u) : aAlumno(u));

export const aEjercicio = (e: EjercicioEntidad): Ejercicio => sinNulos({ ...e }) as unknown as Ejercicio;

export const aPlan = (p: PlanEntidad): Plan => ({ ...p });

export const aSesion = (s: SesionEntidad): Sesion => sinNulos({ ...s }) as unknown as Sesion;
