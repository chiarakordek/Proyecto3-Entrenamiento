import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CATALOGO_SEMILLA } from '@/test/catalogo-semilla';
import { validarItem } from '@/domain/reglas';
import { prescripcion } from '@/lib/formato';
import { leer, reemplazar, VACIA } from './almacen';
import { ErrorDominio, guardarPlan, planVacio, registrarSerie } from './api';
import { cuandoExpireLaSesion, pedir } from './http';

/** Capa HTTP: formato de errores, token y actualización del almacén con la respuesta. */

const respuesta = (status: number, cuerpo?: unknown) =>
  new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), { status, headers: { 'Content-Type': 'application/json' } });

beforeEach(() => reemplazar({ ...VACIA, ejercicios: CATALOGO_SEMILLA }));
afterEach(() => vi.unstubAllGlobals());

async function errorDe(p: Promise<unknown>) {
  try {
    await p;
  } catch (e) {
    return e as ErrorDominio;
  }
  throw new Error('Se esperaba un error');
}

describe('pedir', () => {
  it('manda el token y convierte los errores del back en ErrorDominio con sus campos', async () => {
    localStorage.setItem('p3-token', 'abc');
    const fetchFalso = vi.fn().mockResolvedValue(respuesta(400, { mensaje: 'x', errores: [{ campo: 'email', mensaje: 'Ingresá un email válido.' }] }));
    vi.stubGlobal('fetch', fetchFalso);
    const e = await errorDe(pedir('POST', '/alumnos', { email: 'no' }));
    expect(e).toBeInstanceOf(ErrorDominio);
    expect(e.errores).toEqual([{ campo: 'email', mensaje: 'Ingresá un email válido.' }]);
    expect(fetchFalso.mock.calls[0][1].headers.Authorization).toBe('Bearer abc');
  });

  it('con 401 borra el token y avisa que la sesión venció', async () => {
    localStorage.setItem('p3-token', 'vencido');
    const alVencer = vi.fn();
    cuandoExpireLaSesion(alVencer);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respuesta(401, { mensaje: 'Tu sesión venció. Volvé a iniciar sesión.' })));
    const e = await errorDe(pedir('GET', '/datos'));
    expect(e.message).toBe('Tu sesión venció. Volvé a iniciar sesión.');
    expect(localStorage.getItem('p3-token')).toBeNull();
    expect(alVencer).toHaveBeenCalled();
  });

  it('si el back no responde, explica qué revisar', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const e = await errorDe(pedir('GET', '/datos'));
    expect(e.message).toContain('No se pudo conectar con el servidor');
  });
});

describe('casos de uso', () => {
  it('valida el plan antes de llamar al servidor', async () => {
    const fetchFalso = vi.fn();
    vi.stubGlobal('fetch', fetchFalso);
    const e = await errorDe(guardarPlan(planVacio('ent-1', 'alu-4'), { asignar: true }));
    expect(e.errores.map((x) => x.mensaje)).toContain('Poné un nombre al plan.');
    expect(fetchFalso).not.toHaveBeenCalled();
  });

  it('actualiza el almacén con la sesión que devuelve el servidor', async () => {
    const sesion = { id: 's1', alumnoId: 'alu-1', planId: 'p', dia: 1, iniciadaEn: '', ejercicios: [{ itemId: 'i', ejercicioId: 'e', series: [{ numero: 1, pesoKg: 40, repeticiones: 10 }] }] };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respuesta(201, sesion)));
    await registrarSerie('s1', 'i', { pesoKg: 40, repeticiones: 10 });
    expect(leer().sesiones).toEqual([sesion]);
  });
});

describe('rango de repeticiones (lenguaje ubicuo: "rango de repeticiones")', () => {
  const banca = CATALOGO_SEMILLA.find((e) => e.id === 'ej-press-banca')!;
  it('se muestra como mínimo–máximo', () => {
    expect(prescripcion({ id: 'i', ejercicioId: banca.id, series: 4, repeticiones: 8, repeticionesMax: 12, descansoSeg: 90 })).toBe('4 × 8–12');
  });
  it('el tope tiene que ser mayor que el mínimo', () => {
    const errores = validarItem({ id: 'i', ejercicioId: banca.id, series: 4, repeticiones: 12, repeticionesMax: 8, descansoSeg: 90 }, banca);
    expect(errores.map((e) => e.mensaje)).toContain('Press de banca: el tope del rango tiene que ser mayor que el mínimo.');
  });
});
