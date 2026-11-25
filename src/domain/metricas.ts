import type { ItemPlan, NumeroDia, Plan, SerieRegistrada, Sesion } from './tipos';

/** Tonelaje de una serie: peso × repeticiones. Sumado por series da peso × reps × series. */
export function tonelajeSerie(s: SerieRegistrada): number {
  return (s.pesoKg ?? 0) * (s.repeticiones ?? 0);
}

export function tonelajeSesion(sesion: Sesion): number {
  return sesion.ejercicios.reduce(
    (total, e) => total + e.series.reduce((t, s) => t + tonelajeSerie(s), 0),
    0,
  );
}

export function tonelajeTotal(sesiones: Sesion[]): number {
  return sesiones.reduce((t, s) => t + tonelajeSesion(s), 0);
}

function cerradasOrdenadas(sesiones: Sesion[]): Sesion[] {
  return sesiones
    .filter((s) => s.cerradaEn)
    .sort((a, b) => (a.cerradaEn! < b.cerradaEn! ? -1 : 1));
}

/** Últimos valores registrados para un ejercicio (sesión anterior), para autocompletar y comparar. */
export function ultimaEjecucion(
  sesiones: Sesion[],
  ejercicioId: string,
  excluirSesionId?: string,
): { fecha: string; series: SerieRegistrada[] } | undefined {
  const ordenadas = cerradasOrdenadas(sesiones).filter((s) => s.id !== excluirSesionId);
  for (let i = ordenadas.length - 1; i >= 0; i--) {
    const registro = ordenadas[i].ejercicios.find((e) => e.ejercicioId === ejercicioId && e.series.length);
    if (registro) return { fecha: ordenadas[i].cerradaEn!, series: registro.series };
  }
  return undefined;
}

export function pesoMaximo(series: SerieRegistrada[]): number {
  return series.reduce((m, s) => Math.max(m, s.pesoKg ?? 0), 0);
}

export interface RecordPersonal {
  ejercicioId: string;
  pesoKg: number;
  fecha: string;
}

/** Mejor peso histórico por ejercicio. */
export function records(sesiones: Sesion[]): Map<string, RecordPersonal> {
  const mejores = new Map<string, RecordPersonal>();
  for (const s of cerradasOrdenadas(sesiones)) {
    for (const e of s.ejercicios) {
      const max = pesoMaximo(e.series);
      if (max <= 0) continue;
      const previo = mejores.get(e.ejercicioId);
      if (!previo || max > previo.pesoKg) {
        mejores.set(e.ejercicioId, { ejercicioId: e.ejercicioId, pesoKg: max, fecha: s.cerradaEn! });
      }
    }
  }
  return mejores;
}

export interface EvolucionEjercicio {
  ejercicioId: string;
  inicialKg: number;
  maximoKg: number;
  esRecord: boolean;
}

export interface ResumenMensual {
  desde: string;
  hasta: string;
  sesiones: number;
  tonelajeKg: number;
  esfuerzoPromedio?: number;
  evolucion: EvolucionEjercicio[];
}

/**
 * Resumen de un período (mes o ciclo de 4 semanas):
 *  - evolución: peso de la primera sesión del período vs máximo alcanzado
 *  - récord: el máximo del período supera todo lo anterior al período
 *  - tonelaje acumulado
 */
export function resumenPeriodo(sesiones: Sesion[], desde: string, hasta: string): ResumenMensual {
  const cerradas = cerradasOrdenadas(sesiones);
  const enPeriodo = cerradas.filter((s) => s.cerradaEn! >= desde && s.cerradaEn! < hasta);
  const previas = cerradas.filter((s) => s.cerradaEn! < desde);
  const recordsPrevios = records(previas);

  const porEjercicio = new Map<string, { inicial: number; maximo: number }>();
  for (const s of enPeriodo) {
    for (const e of s.ejercicios) {
      const max = pesoMaximo(e.series);
      if (max <= 0) continue;
      const actual = porEjercicio.get(e.ejercicioId);
      if (!actual) porEjercicio.set(e.ejercicioId, { inicial: max, maximo: max });
      else actual.maximo = Math.max(actual.maximo, max);
    }
  }

  const evolucion = [...porEjercicio.entries()]
    .map(([ejercicioId, v]) => ({
      ejercicioId,
      inicialKg: v.inicial,
      maximoKg: v.maximo,
      esRecord: v.maximo > (recordsPrevios.get(ejercicioId)?.pesoKg ?? 0) && v.maximo > v.inicial,
    }))
    .sort((a, b) => b.maximoKg - b.inicialKg - (a.maximoKg - a.inicialKg));

  const conEsfuerzo = enPeriodo.filter((s) => s.esfuerzo);
  return {
    desde,
    hasta,
    sesiones: enPeriodo.length,
    tonelajeKg: tonelajeTotal(enPeriodo),
    esfuerzoPromedio: conEsfuerzo.length
      ? conEsfuerzo.reduce((t, s) => t + s.esfuerzo!, 0) / conEsfuerzo.length
      : undefined,
    evolucion,
  };
}

export type Cumplimiento = 'CUMPLIO' | 'PARCIAL' | 'SUPERO' | 'SIN_REGISTRO';

/**
 * Compara lo prescrito con lo real para un ítem:
 * cuenta series completas (reps o tiempo alcanzados y carga ≥ sugerida).
 */
export function cumplimientoItem(item: ItemPlan, series: SerieRegistrada[] | undefined): Cumplimiento {
  if (!series || series.length === 0) return 'SIN_REGISTRO';
  const completas = series.filter((s) => {
    const volumenOk = item.tiempoSeg
      ? (s.tiempoSeg ?? 0) >= item.tiempoSeg
      : (s.repeticiones ?? 0) >= (item.repeticiones ?? 0);
    const cargaOk = item.cargaKg === undefined || (s.pesoKg ?? 0) >= item.cargaKg;
    return volumenOk && cargaOk;
  }).length;
  if (completas < item.series) return 'PARCIAL';
  const supero =
    item.cargaKg !== undefined && series.some((s) => (s.pesoKg ?? 0) > item.cargaKg!);
  return supero ? 'SUPERO' : 'CUMPLIO';
}

/** Próximo día a entrenar: el siguiente al último día cerrado de ese plan (1 → 2 → 3 → 1). */
export function proximoDia(plan: Plan, sesiones: Sesion[]): NumeroDia {
  const delPlan = cerradasOrdenadas(sesiones).filter((s) => s.planId === plan.id);
  const ultimo = delPlan.at(-1);
  if (!ultimo) return 1;
  return ((ultimo.dia % 3) + 1) as NumeroDia;
}

/**
 * Ciclo de 4 semanas (el documento admite "cada mes o ciclo de 4 semanas"):
 * los 28 días que terminan hoy (inclusive), desplazados de a 4 semanas.
 */
export function limitesCiclo(fecha: Date, desfaseCiclos = 0): { desde: string; hasta: string } {
  const hasta = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + 1 + desfaseCiclos * 28);
  const desde = new Date(hasta.getFullYear(), hasta.getMonth(), hasta.getDate() - 28);
  return { desde: desde.toISOString(), hasta: hasta.toISOString() };
}

/**
 * Límites (en ISO/UTC) del mes calendario local de `fecha`, desplazado `desfaseMeses`.
 * Se usa la hora local del alumno: una sesión del 31 a la noche cuenta en ese mes.
 */
export function limitesMes(fecha: Date, desfaseMeses = 0): { desde: string; hasta: string } {
  const desde = new Date(fecha.getFullYear(), fecha.getMonth() + desfaseMeses, 1);
  const hasta = new Date(fecha.getFullYear(), fecha.getMonth() + desfaseMeses + 1, 1);
  return { desde: desde.toISOString(), hasta: hasta.toISOString() };
}
