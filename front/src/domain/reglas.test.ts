import { describe, expect, it } from 'vitest';
import { CATALOGO_SEMILLA } from '@/test/catalogo-semilla';
import { normalizarMeta, validarCierreSesion, validarMeta, validarPlan } from './reglas';
import type { DiaPlan, ItemPlan, Plan } from './tipos';

const it_ = (id: string, ejercicioId: string, extra: Partial<ItemPlan> = {}): ItemPlan => ({
  id,
  ejercicioId,
  series: 3,
  repeticiones: 10,
  descansoSeg: 60,
  cargaKg: 20,
  ...extra,
});

function plan(dias: DiaPlan[], extra: Partial<Plan> = {}) {
  return { nombre: 'Plan', vigenciaDesde: '2026-01-01', vigenciaHasta: '2026-02-01', dias: dias as Plan['dias'], ...extra };
}

const valido = () =>
  plan([
    { numero: 1, items: [it_('a', 'ej-press-banca'), it_('b', 'ej-plancha-frontal', { repeticiones: undefined, tiempoSeg: 30, cargaKg: undefined })] },
    { numero: 2, items: [it_('c', 'ej-sentadilla')] },
    { numero: 3, items: [it_('d', 'ej-remo-barra'), it_('e', 'ej-bici', { series: 1, repeticiones: undefined, tiempoSeg: 900, cargaKg: undefined })] },
  ]);

describe('validarPlan', () => {
  it('acepta un plan de 3 días distintos', () => {
    expect(validarPlan(valido(), CATALOGO_SEMILLA)).toEqual([]);
  });

  it('exige exactamente 3 días', () => {
    const p = valido();
    const errores = validarPlan({ ...p, dias: p.dias.slice(0, 2) as unknown as Plan['dias'] }, CATALOGO_SEMILLA);
    expect(errores.map((e) => e.mensaje)).toContain('Un plan tiene exactamente 3 días.');
  });

  it('exige al menos un ejercicio por día', () => {
    const p = valido();
    p.dias[1] = { numero: 2, items: [] };
    expect(validarPlan(p, CATALOGO_SEMILLA)).toContainEqual({ campo: 'dia-2', mensaje: 'El Día 2 no tiene ejercicios.' });
  });

  it('rechaza días iguales entre sí', () => {
    const p = valido();
    p.dias[2] = { numero: 3, items: p.dias[0].items.map((i) => ({ ...i, id: i.id + '-copia' })) };
    const errores = validarPlan(p, CATALOGO_SEMILLA);
    expect(errores).toContainEqual(expect.objectContaining({ campo: 'dia-3', mensaje: expect.stringContaining('igual al Día 1') }));
  });

  it('considera distintos dos días con los mismos ejercicios pero otra carga', () => {
    const p = valido();
    p.dias[2] = { numero: 3, items: p.dias[0].items.map((i) => ({ ...i, id: i.id + 'x', cargaKg: i.cargaKg ? i.cargaKg + 5 : undefined })) };
    expect(validarPlan(p, CATALOGO_SEMILLA)).toEqual([]);
  });

  it('pide repeticiones o tiempo según cómo se mide el ejercicio', () => {
    const p = valido();
    p.dias[0].items[0] = it_('a', 'ej-press-banca', { repeticiones: undefined });
    p.dias[0].items[1] = it_('b', 'ej-plancha-frontal', { repeticiones: 10, tiempoSeg: undefined });
    const mensajes = validarPlan(p, CATALOGO_SEMILLA).map((e) => e.mensaje);
    expect(mensajes).toContain('Press de banca: indicá las repeticiones.');
    expect(mensajes).toContain('Plancha frontal: indicá el tiempo objetivo.');
  });

  it('valida nombre y vigencia', () => {
    const errores = validarPlan({ ...valido(), nombre: ' ', vigenciaHasta: '2025-12-01' }, CATALOGO_SEMILLA);
    expect(errores.map((e) => e.campo)).toEqual(expect.arrayContaining(['nombre', 'vigencia']));
  });

  it('rechaza series fuera de rango y cargas negativas', () => {
    const p = valido();
    p.dias[1].items[0] = it_('c', 'ej-sentadilla', { series: 0, cargaKg: -5 });
    const mensajes = validarPlan(p, CATALOGO_SEMILLA).map((e) => e.mensaje);
    expect(mensajes).toContain('Sentadilla: las series van de 1 a 20.');
    expect(mensajes).toContain('Sentadilla: la carga no puede ser negativa.');
  });
});

describe('validarMeta', () => {
  it('el peso actual es obligatorio', () => {
    expect(validarMeta({ objetivo: 'FUERZA' })).toContainEqual({ campo: 'pesoActualKg', mensaje: 'El peso actual es obligatorio.' });
  });

  it('no pide peso ideal si el objetivo no es bajar de peso', () => {
    expect(validarMeta({ objetivo: 'HIPERTROFIA', pesoActualKg: 70 })).toEqual([]);
  });

  it('pide peso ideal menor al actual cuando el objetivo es bajar de peso', () => {
    expect(validarMeta({ objetivo: 'BAJAR_PESO', pesoActualKg: 80 })).toContainEqual(
      expect.objectContaining({ campo: 'pesoIdealKg' }),
    );
    expect(validarMeta({ objetivo: 'BAJAR_PESO', pesoActualKg: 80, pesoIdealKg: 85 })).toContainEqual({
      campo: 'pesoIdealKg',
      mensaje: 'El peso ideal tiene que ser menor al actual.',
    });
    expect(validarMeta({ objetivo: 'BAJAR_PESO', pesoActualKg: 80, pesoIdealKg: 72 })).toEqual([]);
  });

  it('descarta el peso ideal si el objetivo cambia', () => {
    const meta = normalizarMeta({ objetivo: 'FUERZA', pesoActualKg: 80, pesoIdealKg: 70, definidaEn: '' });
    expect(meta).not.toHaveProperty('pesoIdealKg');
  });
});

describe('validarCierreSesion', () => {
  it('exige esfuerzo entre 1 y 10', () => {
    expect(validarCierreSesion(undefined)).toHaveLength(1);
    expect(validarCierreSesion(0)).toHaveLength(1);
    expect(validarCierreSesion(11)).toHaveLength(1);
    expect(validarCierreSesion(7)).toEqual([]);
  });
});
