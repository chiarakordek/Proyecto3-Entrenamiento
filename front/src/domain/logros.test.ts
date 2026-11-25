import { describe, expect, it } from 'vitest';
import { calcularLogros, logrosNuevos } from './logros';
import type { NumeroDia, Sesion } from './tipos';

let n = 0;
function sesion(dia: number, pesos: number[], fecha: string, extra: Partial<Sesion> = {}): Sesion {
  n++;
  return {
    id: `s${n}`,
    alumnoId: 'a',
    planId: 'p',
    dia: dia as NumeroDia,
    iniciadaEn: fecha,
    cerradaEn: fecha,
    ejercicios: [{ itemId: 'i', ejercicioId: 'ej', series: pesos.map((p, i) => ({ numero: i + 1, pesoKg: p, repeticiones: 10 })) }],
    esfuerzo: 6,
    ...extra,
  };
}

const ganado = (s: Sesion[], id: string) => calcularLogros(s).find((l) => l.definicion.id === id)!;

describe('logros', () => {
  it('primera sesión y progreso de constancia', () => {
    const s = [sesion(1, [20], '2026-03-01T10:00:00Z')];
    expect(ganado(s, 'primera-sesion').ganadoEn).toBe('2026-03-01T10:00:00Z');
    expect(ganado(s, 'diez-sesiones')).toMatchObject({ ganadoEn: undefined, progreso: 1 });
  });

  it('los tres días del plan y la semana perfecta', () => {
    const s = [sesion(1, [20], '2026-03-01T10:00:00Z'), sesion(2, [20], '2026-03-03T10:00:00Z'), sesion(3, [20], '2026-03-05T10:00:00Z')];
    expect(ganado(s, 'plan-completo').ganadoEn).toBe('2026-03-05T10:00:00Z');
    expect(ganado(s, 'semana-perfecta').ganadoEn).toBe('2026-03-05T10:00:00Z');
  });

  it('no hay semana perfecta si las sesiones están separadas', () => {
    const s = [sesion(1, [20], '2026-03-01T10:00:00Z'), sesion(2, [20], '2026-03-09T10:00:00Z'), sesion(3, [20], '2026-03-17T10:00:00Z')];
    expect(ganado(s, 'semana-perfecta').ganadoEn).toBeUndefined();
  });

  it('cuenta récords solo cuando se supera una marca previa', () => {
    const s = [sesion(1, [40], '2026-03-01T10:00:00Z'), sesion(2, [40], '2026-03-02T10:00:00Z'), sesion(3, [45], '2026-03-03T10:00:00Z')];
    expect(ganado(s, 'primer-record').ganadoEn).toBe('2026-03-03T10:00:00Z');
    expect(ganado(s, 'cinco-records').progreso).toBe(1);
  });

  it('tonelaje en una sesión y esfuerzo máximo', () => {
    // 4 series × 30 kg × 10 = 1.200 kg
    const s = [sesion(1, [30, 30, 30, 30], '2026-03-01T10:00:00Z', { esfuerzo: 9 })];
    expect(ganado(s, 'una-tonelada').ganadoEn).toBeTruthy();
    expect(ganado(s, 'a-fondo').ganadoEn).toBeTruthy();
  });

  it('logrosNuevos devuelve solo lo que gana la última sesión', () => {
    const antes = [sesion(1, [40], '2026-03-01T10:00:00Z')];
    const despues = [...antes, sesion(2, [50], '2026-03-02T10:00:00Z', { comentario: 'bien' })];
    expect(logrosNuevos(antes, despues).map((l) => l.id)).toEqual(['primer-record']);
  });
});
