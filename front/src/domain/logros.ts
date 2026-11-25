import { pesoMaximo, tonelajeSesion } from './metricas';
import type { Sesion } from './tipos';

/**
 * Logros del alumno: se calculan a partir de sus sesiones cerradas.
 * Cada uno explica cómo se gana y cuánto falta, para motivar sin adivinar.
 */

export type IconoLogro = 'paso' | 'calendario' | 'fuego' | 'estrella' | 'trofeo' | 'pesa' | 'montana' | 'grua' | 'charla' | 'rayo' | 'tres' | 'medalla';

export interface DefinicionLogro {
  id: string;
  titulo: string;
  comoSeGana: string;
  icono: IconoLogro;
  /** Índice de color (0 a 3: superior, inferior, media, cardio; 4: dorado). */
  color: number;
  meta: number;
}

export const LOGROS: DefinicionLogro[] = [
  { id: 'primera-sesion', titulo: 'Primer paso', comoSeGana: 'Cerrá tu primera sesión.', icono: 'paso', color: 0, meta: 1 },
  { id: 'plan-completo', titulo: 'Los tres días', comoSeGana: 'Hacé el Día 1, el Día 2 y el Día 3 de tu plan.', icono: 'tres', color: 1, meta: 3 },
  { id: 'semana-perfecta', titulo: 'Semana perfecta', comoSeGana: 'Cerrá 3 sesiones en 7 días.', icono: 'calendario', color: 2, meta: 3 },
  { id: 'diez-sesiones', titulo: 'Constancia', comoSeGana: 'Llegá a 10 sesiones cerradas.', icono: 'fuego', color: 3, meta: 10 },
  { id: 'veinticinco-sesiones', titulo: 'Imparable', comoSeGana: 'Llegá a 25 sesiones cerradas.', icono: 'rayo', color: 4, meta: 25 },
  { id: 'primer-record', titulo: 'Primer récord', comoSeGana: 'Superá tu mejor peso en algún ejercicio.', icono: 'estrella', color: 4, meta: 1 },
  { id: 'cinco-records', titulo: 'Coleccionista', comoSeGana: 'Superá tus marcas 5 veces.', icono: 'trofeo', color: 4, meta: 5 },
  { id: 'una-tonelada', titulo: 'Una tonelada', comoSeGana: 'Mové 1.000 kg en una sola sesión.', icono: 'pesa', color: 0, meta: 1000 },
  { id: 'diez-toneladas', titulo: 'Diez toneladas', comoSeGana: 'Acumulá 10.000 kg movidos.', icono: 'montana', color: 1, meta: 10000 },
  { id: 'cincuenta-toneladas', titulo: 'Fuerza de grúa', comoSeGana: 'Acumulá 50.000 kg movidos.', icono: 'grua', color: 3, meta: 50000 },
  { id: 'buena-comunicacion', titulo: 'Buena comunicación', comoSeGana: 'Dejale un comentario a tu entrenador en 5 sesiones.', icono: 'charla', color: 2, meta: 5 },
  { id: 'a-fondo', titulo: 'A fondo', comoSeGana: 'Cerrá una sesión con esfuerzo 9 o 10.', icono: 'medalla', color: 3, meta: 1 },
];

export interface EstadoLogro {
  definicion: DefinicionLogro;
  /** Fecha en que se ganó (cierre de la sesión que lo desbloqueó). */
  ganadoEn?: string;
  progreso: number;
}

/** Recorre las sesiones en orden y registra cuándo se gana cada logro. */
export function calcularLogros(sesiones: Sesion[]): EstadoLogro[] {
  const cerradas = sesiones.filter((s) => s.cerradaEn).sort((a, b) => (a.cerradaEn! < b.cerradaEn! ? -1 : 1));
  const ganados = new Map<string, string>();
  const progreso = new Map<string, number>();

  const mejores = new Map<string, number>();
  const diasHechos = new Map<string, Set<number>>(); // por plan
  let total = 0;
  let records = 0;
  let comentarios = 0;
  let maxSesion = 0;
  let maxSemana = 0;
  let maxDias = 0;
  let maxEsfuerzo = 0;

  const marcar = (id: string, valor: number, fecha: string) => {
    const def = LOGROS.find((l) => l.id === id)!;
    progreso.set(id, Math.max(progreso.get(id) ?? 0, valor));
    if (valor >= def.meta && !ganados.has(id)) ganados.set(id, fecha);
  };

  cerradas.forEach((s, i) => {
    const fecha = s.cerradaEn!;
    const ton = tonelajeSesion(s);
    total += ton;
    maxSesion = Math.max(maxSesion, ton);
    if (s.comentario) comentarios++;
    maxEsfuerzo = Math.max(maxEsfuerzo, (s.esfuerzo ?? 0) >= 9 ? 1 : 0);

    for (const e of s.ejercicios) {
      const max = pesoMaximo(e.series);
      if (max <= 0) continue;
      const previo = mejores.get(e.ejercicioId);
      if (previo !== undefined && max > previo) records++;
      if (previo === undefined || max > previo) mejores.set(e.ejercicioId, max);
    }

    const dias = diasHechos.get(s.planId) ?? new Set<number>();
    dias.add(s.dia);
    diasHechos.set(s.planId, dias);
    maxDias = Math.max(maxDias, dias.size);

    const hace7 = new Date(new Date(fecha).getTime() - 7 * 86_400_000).toISOString();
    const enSemana = cerradas.slice(0, i + 1).filter((x) => x.cerradaEn! > hace7).length;
    maxSemana = Math.max(maxSemana, enSemana);

    marcar('primera-sesion', i + 1, fecha);
    marcar('plan-completo', maxDias, fecha);
    marcar('semana-perfecta', maxSemana, fecha);
    marcar('diez-sesiones', i + 1, fecha);
    marcar('veinticinco-sesiones', i + 1, fecha);
    marcar('primer-record', records, fecha);
    marcar('cinco-records', records, fecha);
    marcar('una-tonelada', maxSesion, fecha);
    marcar('diez-toneladas', total, fecha);
    marcar('cincuenta-toneladas', total, fecha);
    marcar('buena-comunicacion', comentarios, fecha);
    marcar('a-fondo', maxEsfuerzo, fecha);
  });

  return LOGROS.map((definicion) => ({
    definicion,
    ganadoEn: ganados.get(definicion.id),
    progreso: Math.min(definicion.meta, progreso.get(definicion.id) ?? 0),
  }));
}

/** Logros que se ganan con una sesión nueva (comparando el antes y el después). */
export function logrosNuevos(antes: Sesion[], despues: Sesion[]): DefinicionLogro[] {
  const previos = new Set(calcularLogros(antes).filter((l) => l.ganadoEn).map((l) => l.definicion.id));
  return calcularLogros(despues)
    .filter((l) => l.ganadoEn && !previos.has(l.definicion.id))
    .map((l) => l.definicion);
}
