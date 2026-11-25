import { normalizarMeta, validarCierreSesion, validarMeta, validarPlan, type ErrorRegla } from '@/domain/reglas';
import type {
  Alumno,
  Ejercicio,
  MetaAlumno,
  NumeroDia,
  Plan,
  SerieRegistrada,
  Sesion,
} from '@/domain/tipos';
import { escribir, leer } from './almacen';

/**
 * Casos de uso del MVP. Es la frontera con el backend: hoy opera sobre el
 * almacén local; mañana cada función puede llamar al endpoint equivalente.
 */

export class ErrorDominio extends Error {
  constructor(public readonly errores: ErrorRegla[]) {
    super(errores.map((e) => e.mensaje).join(' '));
  }
}

const nuevoId = (prefijo: string) => `${prefijo}-${crypto.randomUUID().slice(0, 8)}`;
const ahora = () => new Date().toISOString();

// ───────────── Entrenador: alumnos ─────────────

export function altaAlumno(entrenadorId: string, datos: { nombre: string; email: string }): Alumno {
  const nombre = datos.nombre.trim();
  const email = datos.email.trim().toLowerCase();
  const errores: ErrorRegla[] = [];
  if (nombre.length < 2) errores.push({ campo: 'nombre', mensaje: 'Ingresá el nombre del alumno.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errores.push({ campo: 'email', mensaje: 'Ingresá un email válido.' });
  else if (leer().alumnos.some((a) => a.email === email)) {
    errores.push({ campo: 'email', mensaje: 'Ya hay una cuenta con ese email: vinculala en lugar de crearla.' });
  }
  if (errores.length) throw new ErrorDominio(errores);

  const alumno: Alumno = { id: nuevoId('alu'), nombre, email, rol: 'ALUMNO', entrenadorId, altaEn: ahora() };
  escribir((d) => ({ ...d, alumnos: [...d.alumnos, alumno] }));
  return alumno;
}

/**
 * Busca si el email ya tiene cuenta. El documento pide "dar de alta o vincular alumnos":
 * si existe y no tiene entrenador, se puede vincular en vez de crearlo de nuevo.
 */
export function buscarAlumnoPorEmail(email: string): Alumno | undefined {
  const limpio = email.trim().toLowerCase();
  return leer().alumnos.find((a) => a.email === limpio);
}

export function vincularAlumno(entrenadorId: string, email: string): Alumno {
  const alumno = buscarAlumnoPorEmail(email);
  if (!alumno) throw new ErrorDominio([{ campo: 'email', mensaje: 'No hay ningún alumno con ese email.' }]);
  if (alumno.entrenadorId === entrenadorId) throw new ErrorDominio([{ campo: 'email', mensaje: 'Ese alumno ya está en tu lista.' }]);
  if (alumno.entrenadorId) throw new ErrorDominio([{ campo: 'email', mensaje: 'Ese alumno ya entrena con otro entrenador.' }]);
  const vinculado = { ...alumno, entrenadorId };
  escribir((d) => ({ ...d, alumnos: d.alumnos.map((a) => (a.id === alumno.id ? vinculado : a)) }));
  return vinculado;
}

// ───────────── Entrenador: catálogo ─────────────

export function guardarEjercicio(ejercicio: Omit<Ejercicio, 'id'> & { id?: string }): Ejercicio {
  const errores: ErrorRegla[] = [];
  if (ejercicio.nombre.trim().length < 3) errores.push({ campo: 'nombre', mensaje: 'El nombre tiene que tener al menos 3 letras.' });
  if (ejercicio.descripcion.trim().length < 10) {
    errores.push({ campo: 'descripcion', mensaje: 'Describí la técnica en al menos una oración.' });
  }
  const repetido = leer().ejercicios.find(
    (e) => e.nombre.toLowerCase() === ejercicio.nombre.trim().toLowerCase() && e.id !== ejercicio.id,
  );
  if (repetido) errores.push({ campo: 'nombre', mensaje: 'Ya existe un ejercicio con ese nombre.' });
  if (ejercicio.videoUrl && !/^https?:\/\/\S+\.\S+/.test(ejercicio.videoUrl.trim())) {
    errores.push({ campo: 'videoUrl', mensaje: 'El link del video tiene que empezar con http:// o https://.' });
  }
  if (errores.length) throw new ErrorDominio(errores);

  const final: Ejercicio = { ...ejercicio, nombre: ejercicio.nombre.trim(), id: ejercicio.id ?? nuevoId('ej') };
  escribir((d) => ({
    ...d,
    ejercicios: ejercicio.id
      ? d.ejercicios.map((e) => (e.id === final.id ? final : e))
      : [...d.ejercicios, final],
  }));
  return final;
}

/**
 * Baja de un ejercicio del catálogo (PPT: "alta-baja-modificación", a definir con el cliente).
 * Para no romper planes ni historiales, solo se puede borrar si nunca se usó.
 */
export function eliminarEjercicio(id: string) {
  const d = leer();
  const enPlan = d.planes.find((p) => p.dias.some((dia) => dia.items.some((i) => i.ejercicioId === id)));
  if (enPlan) {
    const alumno = d.alumnos.find((a) => a.id === enPlan.alumnoId);
    throw new ErrorDominio([
      { campo: 'ejercicio', mensaje: `Está en el plan "${enPlan.nombre}"${alumno ? ` de ${alumno.nombre}` : ''}. Sacalo del plan antes de borrarlo.` },
    ]);
  }
  if (d.sesiones.some((s) => s.ejercicios.some((e) => e.ejercicioId === id))) {
    throw new ErrorDominio([{ campo: 'ejercicio', mensaje: 'Ya hay sesiones registradas con este ejercicio: borrarlo dejaría historiales incompletos.' }]);
  }
  escribir((x) => ({ ...x, ejercicios: x.ejercicios.filter((e) => e.id !== id) }));
}

// ───────────── Entrenador: planes ─────────────

export function guardarPlan(plan: Plan, { asignar }: { asignar: boolean }): Plan {
  const errores = validarPlan(plan, leer().ejercicios);
  if (errores.length) throw new ErrorDominio(errores);

  const final: Plan = { ...plan, estado: asignar ? 'ACTIVO' : plan.estado === 'ACTIVO' ? 'ACTIVO' : 'BORRADOR' };
  escribir((d) => {
    // Un alumno tiene un solo plan activo: el anterior pasa a finalizado.
    const planes = d.planes.map((p) =>
      asignar && p.alumnoId === final.alumnoId && p.estado === 'ACTIVO' && p.id !== final.id
        ? { ...p, estado: 'FINALIZADO' as const }
        : p,
    );
    const existe = planes.some((p) => p.id === final.id);
    return { ...d, planes: existe ? planes.map((p) => (p.id === final.id ? final : p)) : [...planes, final] };
  });
  return final;
}

/**
 * El documento pide asignar el plan "a uno o varios alumnos". Cada alumno recibe su propia copia
 * (así sus sesiones y ajustes quedan separados) y queda activa.
 */
export function asignarPlanAVarios(plan: Plan, otrosAlumnoIds: string[]): Plan[] {
  const principal = guardarPlan(plan, { asignar: true });
  const copias = otrosAlumnoIds
    .filter((id) => id !== plan.alumnoId)
    .map((alumnoId) =>
      guardarPlan(
        {
          ...plan,
          id: nuevoId('plan'),
          alumnoId,
          creadoEn: ahora(),
          dias: plan.dias.map((d) => ({ ...d, items: d.items.map((i) => ({ ...i, id: nuevoId('it') })) })) as Plan['dias'],
        },
        { asignar: true },
      ),
    );
  return [principal, ...copias];
}

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

export function definirMeta(alumnoId: string, meta: Omit<MetaAlumno, 'definidaEn'>): MetaAlumno {
  const errores = validarMeta(meta);
  if (errores.length) throw new ErrorDominio(errores);
  const final = normalizarMeta({ ...meta, definidaEn: ahora() });
  // Cada peso informado queda en el historial (no se pisa) para ver la evolución en el tiempo.
  escribir((d) => ({
    ...d,
    alumnos: d.alumnos.map((a) =>
      a.id === alumnoId ? { ...a, meta: final, pesos: [...(a.pesos ?? []), { fecha: final.definidaEn, kg: final.pesoActualKg }] } : a,
    ),
  }));
  return final;
}

// ───────────── Alumno: sesiones ─────────────

export function iniciarSesion(alumnoId: string, plan: Plan, dia: NumeroDia): Sesion {
  const abierta = leer().sesiones.find((s) => s.alumnoId === alumnoId && !s.cerradaEn);
  if (abierta) return abierta;
  const sesion: Sesion = {
    id: nuevoId('ses'),
    alumnoId,
    planId: plan.id,
    dia,
    iniciadaEn: ahora(),
    ejercicios: plan.dias[dia - 1].items.map((it) => ({ itemId: it.id, ejercicioId: it.ejercicioId, series: [] })),
  };
  escribir((d) => ({ ...d, sesiones: [...d.sesiones, sesion] }));
  return sesion;
}

function modificarAbierta(sesionId: string, cambio: (s: Sesion) => Sesion) {
  const sesion = leer().sesiones.find((s) => s.id === sesionId);
  if (!sesion) throw new ErrorDominio([{ campo: 'sesion', mensaje: 'La sesión no existe.' }]);
  if (sesion.cerradaEn) {
    throw new ErrorDominio([{ campo: 'sesion', mensaje: 'La sesión ya está cerrada y no se puede modificar.' }]);
  }
  escribir((d) => ({ ...d, sesiones: d.sesiones.map((s) => (s.id === sesionId ? cambio(s) : s)) }));
}

export function registrarSerie(sesionId: string, itemId: string, serie: Omit<SerieRegistrada, 'numero'>) {
  const errores: ErrorRegla[] = [];
  if (serie.pesoKg !== undefined && (serie.pesoKg < 0 || serie.pesoKg > 500)) {
    errores.push({ campo: 'pesoKg', mensaje: 'El peso va de 0 a 500 kg.' });
  }
  if (serie.repeticiones !== undefined && (serie.repeticiones < 0 || serie.repeticiones > 200)) {
    errores.push({ campo: 'repeticiones', mensaje: 'Las repeticiones van de 0 a 200.' });
  }
  if (serie.tiempoSeg !== undefined && (serie.tiempoSeg < 0 || serie.tiempoSeg > 7200)) {
    errores.push({ campo: 'tiempoSeg', mensaje: 'El tiempo va de 0 a 2 horas.' });
  }
  if (errores.length) throw new ErrorDominio(errores);

  modificarAbierta(sesionId, (s) => ({
    ...s,
    ejercicios: s.ejercicios.map((e) =>
      e.itemId === itemId ? { ...e, series: [...e.series, { ...serie, numero: e.series.length + 1 }] } : e,
    ),
  }));
}

export function deshacerSerie(sesionId: string, itemId: string) {
  modificarAbierta(sesionId, (s) => ({
    ...s,
    ejercicios: s.ejercicios.map((e) => (e.itemId === itemId ? { ...e, series: e.series.slice(0, -1) } : e)),
  }));
}

export function cerrarSesion(sesionId: string, esfuerzo: number | undefined, comentario: string) {
  const errores = validarCierreSesion(esfuerzo);
  const sesion = leer().sesiones.find((s) => s.id === sesionId);
  if (sesion && !sesion.ejercicios.some((e) => e.series.length)) {
    errores.push({ campo: 'sesion', mensaje: 'Registrá al menos una serie antes de cerrar.' });
  }
  if (errores.length) throw new ErrorDominio(errores);
  modificarAbierta(sesionId, (s) => ({
    ...s,
    esfuerzo,
    comentario: comentario.trim() || undefined,
    cerradaEn: ahora(),
  }));
}

export function descartarSesion(sesionId: string) {
  const sesion = leer().sesiones.find((s) => s.id === sesionId);
  if (sesion?.cerradaEn) throw new ErrorDominio([{ campo: 'sesion', mensaje: 'Una sesión cerrada no se puede borrar.' }]);
  escribir((d) => ({ ...d, sesiones: d.sesiones.filter((s) => s.id !== sesionId) }));
}
