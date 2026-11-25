import type { DiaPlan, Ejercicio, Sesion, TipoEjercicio } from '@/domain/tipos';

/** Series por categoría en un día del plan (para la barra de colores). */
export function composicionDia(dia: DiaPlan, porId: Map<string, Ejercicio>): Partial<Record<TipoEjercicio, number>> {
  const r: Partial<Record<TipoEjercicio, number>> = {};
  for (const it of dia.items) {
    const t = porId.get(it.ejercicioId)?.tipo;
    if (t) r[t] = (r[t] ?? 0) + it.series;
  }
  return r;
}

/** Series realizadas por categoría en un conjunto de sesiones. */
export function composicionSesiones(sesiones: Sesion[], porId: Map<string, Ejercicio>): Partial<Record<TipoEjercicio, number>> {
  const r: Partial<Record<TipoEjercicio, number>> = {};
  for (const s of sesiones)
    for (const e of s.ejercicios) {
      const t = porId.get(e.ejercicioId)?.tipo;
      if (t && e.series.length) r[t] = (r[t] ?? 0) + e.series.length;
    }
  return r;
}

/** Duración estimada en minutos: trabajo (3 s por repetición o el tiempo pautado) más los descansos. */
export function minutosEstimados(dia: DiaPlan): number {
  const seg = dia.items.reduce((t, it) => {
    const trabajo = it.tiempoSeg ?? (it.repeticiones ?? 10) * 3;
    return t + it.series * trabajo + Math.max(0, it.series - 1) * it.descansoSeg + 60; // +1 min de preparación
  }, 0);
  return Math.max(5, Math.round(seg / 60 / 5) * 5);
}

/** Los últimos 7 días (de hoy hacia atrás), con las sesiones cerradas de cada uno. */
export function semana(sesiones: Sesion[], hoy = new Date()): { fecha: Date; sesiones: Sesion[] }[] {
  const dias: { fecha: Date; sesiones: Sesion[] }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - i);
    const sig = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    dias.push({
      fecha: d,
      sesiones: sesiones.filter((s) => s.cerradaEn && new Date(s.cerradaEn) >= d && new Date(s.cerradaEn) < sig),
    });
  }
  return dias;
}

/** Semanas seguidas (hacia atrás desde la actual) con al menos una sesión. */
export function rachaSemanas(sesiones: Sesion[], hoy = new Date()): number {
  const cerradas = sesiones.filter((s) => s.cerradaEn).map((s) => new Date(s.cerradaEn!).getTime());
  let racha = 0;
  for (let w = 0; w < 104; w++) {
    const fin = hoy.getTime() - w * 7 * 86_400_000;
    const inicio = fin - 7 * 86_400_000;
    if (cerradas.some((t) => t > inicio && t <= fin)) racha++;
    else if (w > 0) break;
    else continue;
  }
  return racha;
}
