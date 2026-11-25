import type { ItemPlan, Medicion, SerieRegistrada } from '@/domain/tipos';

const nf = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 });

export const kg = (n: number | undefined) => (n === undefined ? 'Peso corporal' : `${nf.format(n)} kg`);
export const numero = (n: number) => nf.format(n);

export function duracion(seg: number): string {
  if (seg < 60) return `${seg} s`;
  const m = Math.floor(seg / 60);
  const s = seg % 60;
  return s ? `${m} min ${s} s` : `${m} min`;
}

export function descanso(seg: number): string {
  return seg === 0 ? 'Sin descanso' : `${duracion(seg)} de descanso`;
}

/** "4 × 10" o "3 × 40 s" */
export function prescripcion(item: ItemPlan): string {
  const reps = item.repeticionesMax ? `${item.repeticiones}–${item.repeticionesMax}` : `${item.repeticiones ?? '?'}`;
  const volumen = item.tiempoSeg ? duracion(item.tiempoSeg) : reps;
  return item.series === 1 && item.tiempoSeg ? volumen : `${item.series} × ${volumen}`;
}

export function serieTexto(s: SerieRegistrada, medicion: Medicion): string {
  if (medicion === 'TIEMPO') return duracion(s.tiempoSeg ?? 0);
  return s.pesoKg ? `${nf.format(s.pesoKg)} kg × ${s.repeticiones ?? 0}` : `${s.repeticiones ?? 0} reps`;
}

/** "4 series de 45 kg × 10" si son todas iguales; si no, la lista separada por comas. */
export function resumenSeries(series: SerieRegistrada[], medicion: Medicion): string {
  const textos = series.map((s) => serieTexto(s, medicion));
  if (textos.length > 1 && textos.every((t) => t === textos[0])) return `${textos.length} series de ${textos[0]}`;
  return textos.join(', ');
}

const fechaCorta = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' });
const fechaLarga = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
const mesAnio = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' });

export const fecha = (iso: string) => fechaCorta.format(new Date(iso.length === 10 ? `${iso}T12:00:00` : iso));
export const fechaCompleta = (iso: string) => fechaLarga.format(new Date(iso));
export const mes = (iso: string) => mesAnio.format(new Date(iso));

export function haceCuanto(iso: string): string {
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (dias <= 0) return 'hoy';
  if (dias === 1) return 'ayer';
  if (dias < 7) return `hace ${dias} días`;
  if (dias < 14) return 'hace una semana';
  return `hace ${Math.floor(dias / 7)} semanas`;
}

export function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export function nombreDePila(nombre: string) {
  return nombre.split(/\s+/)[0];
}
