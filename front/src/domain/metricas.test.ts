import { describe, expect, it } from 'vitest';
import { cumplimientoItem, limitesCiclo, limitesMes, proximoDia, records, resumenPeriodo, tonelajeSesion, ultimaEjecucion } from './metricas';
import type { ItemPlan, NumeroDia, Plan, Sesion } from './tipos';

function sesion(id: string, cerradaEn: string | undefined, pesos: number[], dia: NumeroDia = 1, ejercicioId = 'ej-sentadilla'): Sesion {
  return {
    id,
    alumnoId: 'a',
    planId: 'p',
    dia,
    iniciadaEn: cerradaEn ?? '2026-03-01T10:00:00.000Z',
    cerradaEn,
    ejercicios: [{ itemId: 'i', ejercicioId, series: pesos.map((p, n) => ({ numero: n + 1, pesoKg: p, repeticiones: 10 })) }],
  };
}

describe('tonelaje', () => {
  it('suma peso × repeticiones de cada serie', () => {
    // 3 series de 40 kg × 10 = 1200
    expect(tonelajeSesion(sesion('s', '2026-03-01T10:00:00.000Z', [40, 40, 40]))).toBe(1200);
  });
});

describe('records y última ejecución', () => {
  const historial = [
    sesion('s1', '2026-03-01T10:00:00.000Z', [40, 40]),
    sesion('s2', '2026-03-05T10:00:00.000Z', [45, 42.5]),
    sesion('s3', '2026-03-09T10:00:00.000Z', [42.5]),
    sesion('abierta', undefined, [100]),
  ];

  it('el récord es el mayor peso de sesiones cerradas', () => {
    expect(records(historial).get('ej-sentadilla')).toMatchObject({ pesoKg: 45, fecha: '2026-03-05T10:00:00.000Z' });
  });

  it('la última ejecución es la sesión cerrada más reciente', () => {
    expect(ultimaEjecucion(historial, 'ej-sentadilla')?.series.map((s) => s.pesoKg)).toEqual([42.5]);
    expect(ultimaEjecucion(historial, 'ej-sentadilla', 's3')?.series.map((s) => s.pesoKg)).toEqual([45, 42.5]);
    expect(ultimaEjecucion(historial, 'otro')).toBeUndefined();
  });
});

describe('resumenPeriodo', () => {
  it('compara el inicio del mes con el máximo y marca récords sobre el histórico previo', () => {
    const historial = [
      sesion('feb', '2026-02-20T10:00:00.000Z', [48]),
      sesion('m1', '2026-03-02T10:00:00.000Z', [40]),
      sesion('m2', '2026-03-20T10:00:00.000Z', [50]),
    ];
    const r = resumenPeriodo(historial, '2026-03-01T00:00:00.000Z', '2026-04-01T00:00:00.000Z');
    expect(r.sesiones).toBe(2);
    expect(r.tonelajeKg).toBe(900);
    expect(r.evolucion).toEqual([{ ejercicioId: 'ej-sentadilla', inicialKg: 40, maximoKg: 50, esRecord: true }]);
  });

  it('no es récord si no supera una marca anterior al mes', () => {
    const historial = [sesion('feb', '2026-02-20T10:00:00.000Z', [60]), sesion('m1', '2026-03-02T10:00:00.000Z', [40]), sesion('m2', '2026-03-20T10:00:00.000Z', [50])];
    const r = resumenPeriodo(historial, '2026-03-01T00:00:00.000Z', '2026-04-01T00:00:00.000Z');
    expect(r.evolucion[0].esRecord).toBe(false);
  });
});

describe('cumplimientoItem', () => {
  const item: ItemPlan = { id: 'i', ejercicioId: 'e', series: 3, repeticiones: 10, descansoSeg: 60, cargaKg: 40 };
  const s = (pesoKg: number, repeticiones: number, numero = 1) => ({ numero, pesoKg, repeticiones });

  it('detecta cumplido, parcial, superado y sin registro', () => {
    expect(cumplimientoItem(item, [])).toBe('SIN_REGISTRO');
    expect(cumplimientoItem(item, [s(40, 10), s(40, 10), s(40, 8)])).toBe('PARCIAL');
    expect(cumplimientoItem(item, [s(40, 10), s(40, 10), s(40, 10)])).toBe('CUMPLIO');
    expect(cumplimientoItem(item, [s(42.5, 10), s(40, 10), s(40, 10)])).toBe('SUPERO');
  });

  it('para ejercicios por tiempo compara segundos', () => {
    const plancha: ItemPlan = { id: 'p', ejercicioId: 'e', series: 2, tiempoSeg: 30, descansoSeg: 30 };
    expect(cumplimientoItem(plancha, [{ numero: 1, tiempoSeg: 30 }, { numero: 2, tiempoSeg: 35 }])).toBe('CUMPLIO');
    expect(cumplimientoItem(plancha, [{ numero: 1, tiempoSeg: 30 }, { numero: 2, tiempoSeg: 20 }])).toBe('PARCIAL');
  });
});

describe('limitesMes', () => {
  it('usa el mes local, también desplazado hacia atrás', () => {
    const hoy = new Date(2026, 10, 22, 23, 30); // 22 nov local, de noche
    const { desde, hasta } = limitesMes(hoy);
    expect(new Date(desde).getMonth()).toBe(10);
    expect(new Date(desde).getDate()).toBe(1);
    expect(new Date(hasta).getMonth()).toBe(11);
    expect(new Date(limitesMes(hoy, -11).desde).getFullYear()).toBe(2025);
  });
});

describe('limitesCiclo', () => {
  it('son los 28 días que terminan hoy, y retrocede de a 4 semanas', () => {
    const hoy = new Date(2026, 10, 22, 15, 0);
    const { desde, hasta } = limitesCiclo(hoy);
    expect(new Date(hasta).getDate()).toBe(23);
    expect(new Date(desde).getDate()).toBe(26); // 26 de octubre
    expect((new Date(hasta).getTime() - new Date(desde).getTime()) / 86_400_000).toBeCloseTo(28, 0);
    const anterior = limitesCiclo(hoy, -1);
    expect(anterior.hasta).toBe(desde);
  });
});

describe('proximoDia', () => {
  const plan = { id: 'p' } as Plan;
  it('rota 1, 2, 3 y vuelve a empezar', () => {
    expect(proximoDia(plan, [])).toBe(1);
    expect(proximoDia(plan, [sesion('a', '2026-03-01T10:00:00.000Z', [1], 1)])).toBe(2);
    expect(proximoDia(plan, [sesion('a', '2026-03-01T10:00:00.000Z', [1], 1), sesion('b', '2026-03-03T10:00:00.000Z', [1], 3)])).toBe(1);
  });
});
