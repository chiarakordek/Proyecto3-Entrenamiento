import { validarCierreSesion, validarMeta, validarPlan } from '@/domain/reglas';
import type { Alumno, Ejercicio, Entrenador, MetaAlumno, NumeroDia, Objetivo, Plan, SerieRegistrada, Sesion } from '@/domain/tipos';
import { conReemplazo, escribir, leer, reemplazar, type BaseDatos } from './almacen';
import { ErrorDominio, guardarToken, pedir } from './http';

export { ErrorDominio } from './http';

/**
 * Casos de uso del MVP contra la API (back/). Antes de llamar al servidor se validan
 * las reglas del dominio para avisar al instante; el back las vuelve a validar.
 * Con la respuesta se actualiza la copia en memoria (almacen.ts).
 */

const nuevoId = (prefijo: string) => `${prefijo}-${crypto.randomUUID().slice(0, 8)}`;
const ahora = () => new Date().toISOString();

// ───────────── Sesión de usuario ─────────────

export interface SesionUsuario {
  token: string;
  usuario: Alumno | Entrenador;
}

export async function iniciarSesionUsuario(email: string, password: string): Promise<SesionUsuario> {
  const s = await pedir<SesionUsuario>('POST', '/auth/login', { email, password });
  guardarToken(s.token);
  return s;
}

export async function registrarAlumno(datos: { nombre: string; email: string; password: string }): Promise<SesionUsuario> {
  const s = await pedir<SesionUsuario>('POST', '/auth/registro', datos);
  guardarToken(s.token);
  return s;
}

export const usuarioActual = () => pedir<Alumno | Entrenador>('GET', '/auth/yo');

/** Trae todo lo que el usuario puede ver y lo deja en el almacén. */
export async function cargarDatos(): Promise<BaseDatos> {
  const datos = await pedir<BaseDatos>('GET', '/datos');
  reemplazar(datos);
  return datos;
}

// ───────────── Entrenador: alumnos ─────────────

/** "Dar de alta": el entrenador crea la cuenta con una contraseña inicial para el alumno. */
export async function altaAlumno(datos: { nombre: string; email: string; password: string }): Promise<Alumno> {
  const alumno = await pedir<Alumno>('POST', '/alumnos', datos);
  escribir((d) => ({ ...d, alumnos: conReemplazo(d.alumnos, alumno) }));
  return alumno;
}

export type EstadoVinculo = 'SIN_ENTRENADOR' | 'TUYO' | 'OTRO';
export interface AlumnoEncontrado {
  id: string;
  nombre: string;
  email: string;
  estado: EstadoVinculo;
  objetivo?: Objetivo;
}

/** Para "vincular": quién es y si ya tiene entrenador. */
export async function buscarAlumnoPorEmail(email: string): Promise<AlumnoEncontrado | null> {
  const r = await pedir<{ alumno: AlumnoEncontrado | null }>('GET', `/alumnos/buscar?email=${encodeURIComponent(email.trim())}`);
  return r.alumno;
}

export async function vincularAlumno(email: string): Promise<Alumno> {
  const alumno = await pedir<Alumno>('POST', '/alumnos/vincular', { email });
  escribir((d) => ({ ...d, alumnos: conReemplazo(d.alumnos, alumno) }));
  return alumno;
}

// ───────────── Entrenador: catálogo ─────────────

export async function guardarEjercicio(ejercicio: Omit<Ejercicio, 'id' | 'tipo'> & { id?: string; tipo?: Ejercicio['tipo'] }): Promise<Ejercicio> {
  const cuerpo = {
    nombre: ejercicio.nombre,
    descripcion: ejercicio.descripcion,
    grupo: ejercicio.grupo,
    medicion: ejercicio.medicion,
    ...(ejercicio.equipo ? { equipo: ejercicio.equipo } : {}),
    ...(ejercicio.videoUrl ? { videoUrl: ejercicio.videoUrl } : {}),
  };
  const guardado = ejercicio.id
    ? await pedir<Ejercicio>('PUT', `/ejercicios/${encodeURIComponent(ejercicio.id)}`, cuerpo)
    : await pedir<Ejercicio>('POST', '/ejercicios', cuerpo);
  escribir((d) => ({ ...d, ejercicios: conReemplazo(d.ejercicios, guardado) }));
  return guardado;
}

/** Baja de un ejercicio del catálogo (PPT: "alta-baja-modificación"). El back no deja borrar uno en uso. */
export async function eliminarEjercicio(id: string): Promise<void> {
  await pedir<void>('DELETE', `/ejercicios/${encodeURIComponent(id)}`);
  escribir((d) => ({ ...d, ejercicios: d.ejercicios.filter((e) => e.id !== id) }));
}

// ───────────── Entrenador: planes ─────────────

async function enviarPlan(plan: Plan, asignar: boolean, otrosAlumnoIds: string[] = []): Promise<Plan[]> {
  const errores = validarPlan(plan, leer().ejercicios);
  if (errores.length) throw new ErrorDominio(errores);
  const { planes } = await pedir<{ planes: Plan[] }>('POST', '/planes', { plan, asignar, otrosAlumnoIds });
  escribir((d) => ({ ...d, planes }));
  return planes;
}

export const guardarPlan = (plan: Plan, { asignar }: { asignar: boolean }) => enviarPlan(plan, asignar);

/** El documento pide asignar el plan "a uno o varios alumnos": cada uno recibe su copia activa. */
export const asignarPlanAVarios = (plan: Plan, otrosAlumnoIds: string[]) => enviarPlan(plan, true, otrosAlumnoIds);

export function planVacio(entrenadorId: string, alumnoId: string): Plan {
  const hoy = new Date();
  const fin = new Date(hoy);
  fin.setDate(fin.getDate() + 28);
  return {
    id: nuevoId('plan'),
    nombre: '',
    entrenadorId,
    alumnoId,
    estado: 'BORRADOR',
    creadoEn: ahora(),
    vigenciaDesde: hoy.toISOString().slice(0, 10),
    vigenciaHasta: fin.toISOString().slice(0, 10),
    dias: [
      { numero: 1, items: [] },
      { numero: 2, items: [] },
      { numero: 3, items: [] },
    ],
  };
}

export function nuevoItemId() {
  return nuevoId('it');
}

// ───────────── Alumno: meta ─────────────

export async function definirMeta(meta: Omit<MetaAlumno, 'definidaEn'>): Promise<Alumno> {
  const errores = validarMeta(meta);
  if (errores.length) throw new ErrorDominio(errores);
  const alumno = await pedir<Alumno>('PUT', '/yo/meta', meta);
  escribir((d) => ({ ...d, alumnos: conReemplazo(d.alumnos, alumno) }));
  return alumno;
}

// ───────────── Alumno: sesiones ─────────────

const conSesion = (s: Sesion) => {
  escribir((d) => ({ ...d, sesiones: conReemplazo(d.sesiones, s) }));
  return s;
};

export async function iniciarSesion(plan: Plan, dia: NumeroDia): Promise<Sesion> {
  return conSesion(await pedir<Sesion>('POST', '/sesiones', { planId: plan.id, dia }));
}

export async function registrarSerie(sesionId: string, itemId: string, serie: Omit<SerieRegistrada, 'numero'>): Promise<Sesion> {
  return conSesion(await pedir<Sesion>('POST', `/sesiones/${sesionId}/series`, { itemId, ...serie }));
}

export async function deshacerSerie(sesionId: string, itemId: string): Promise<Sesion> {
  return conSesion(await pedir<Sesion>('DELETE', `/sesiones/${sesionId}/series/ultima?itemId=${encodeURIComponent(itemId)}`));
}

export async function cerrarSesion(sesionId: string, esfuerzo: number | undefined, comentario: string): Promise<Sesion> {
  const errores = validarCierreSesion(esfuerzo);
  const sesion = leer().sesiones.find((s) => s.id === sesionId);
  if (sesion && !sesion.ejercicios.some((e) => e.series.length)) {
    errores.push({ campo: 'sesion', mensaje: 'Registrá al menos una serie antes de cerrar.' });
  }
  if (errores.length) throw new ErrorDominio(errores);
  return conSesion(await pedir<Sesion>('POST', `/sesiones/${sesionId}/cerrar`, { esfuerzo, comentario: comentario.trim() || undefined }));
}

export async function descartarSesion(sesionId: string): Promise<void> {
  await pedir<void>('DELETE', `/sesiones/${sesionId}`);
  escribir((d) => ({ ...d, sesiones: d.sesiones.filter((s) => s.id !== sesionId) }));
}
