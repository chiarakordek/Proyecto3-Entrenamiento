import { vi } from 'vitest';
import { normalizarMeta, validarCierreSesion, validarMeta, validarPlan } from '@/domain/reglas';
import type { Plan, Sesion } from '@/domain/tipos';
import type { BaseDatos } from '@/data/almacen';
import { crearSemilla } from './semilla';

/**
 * Imitación mínima de la API del back para los tests de pantallas: responde las rutas
 * que usan los flujos probados, con las mismas reglas y formatos de error.
 * Las reglas de verdad y los permisos se prueban en back/test/api.e2e-spec.ts.
 */
export interface ServidorFalso {
  datos: BaseDatos;
  pedidos: { metodo: string; ruta: string; cuerpo?: unknown }[];
}

export const PASSWORD_PRUEBA = 'entrenar123';
export const tokenDe = (usuarioId: string) => `tok-${usuarioId}`;

const json = (status: number, cuerpo: unknown) =>
  new Response(status === 204 ? null : JSON.stringify(cuerpo), { status, headers: { 'Content-Type': 'application/json' } });
const errorDominio = (errores: { campo: string; mensaje: string }[]) => json(400, { mensaje: errores.map((e) => e.mensaje).join(' '), errores });

export function instalarServidorFalso(): ServidorFalso {
  const s: ServidorFalso = { datos: crearSemilla(), pedidos: [] };
  const todos = () => [...s.datos.entrenadores, ...s.datos.alumnos];

  vi.stubGlobal('fetch', async (url: string, init: RequestInit = {}) => {
    const metodo = init.method ?? 'GET';
    const [ruta, query] = url.replace(/^.*\/api/, '').split('?');
    const cuerpo = init.body ? JSON.parse(String(init.body)) : undefined;
    s.pedidos.push({ metodo, ruta, cuerpo });
    const token = String((init.headers as Record<string, string> | undefined)?.Authorization ?? '').replace('Bearer ', '');
    const yo = todos().find((u) => tokenDe(u.id) === token);

    if (metodo === 'POST' && ruta === '/auth/login') {
      const u = todos().find((x) => x.email === String(cuerpo.email).toLowerCase());
      if (!u || cuerpo.password !== PASSWORD_PRUEBA) return json(401, { mensaje: 'El email o la contraseña no son correctos.' });
      return json(200, { token: tokenDe(u.id), usuario: u });
    }
    if (!yo) return json(401, { mensaje: 'Iniciá sesión para continuar.' });

    if (metodo === 'GET' && ruta === '/auth/yo') return json(200, yo);
    if (metodo === 'GET' && ruta === '/datos') return json(200, s.datos);

    if (metodo === 'PUT' && ruta === '/yo/meta') {
      const errores = validarMeta(cuerpo);
      if (errores.length) return errorDominio(errores);
      const meta = normalizarMeta({ ...cuerpo, definidaEn: new Date().toISOString() });
      s.datos.alumnos = s.datos.alumnos.map((a) => (a.id === yo.id ? { ...a, meta, pesos: [...(a.pesos ?? []), { fecha: meta.definidaEn, kg: meta.pesoActualKg }] } : a));
      return json(200, s.datos.alumnos.find((a) => a.id === yo.id));
    }

    if (metodo === 'POST' && ruta === '/planes') {
      const plan: Plan = cuerpo.plan;
      const errores = validarPlan(plan, s.datos.ejercicios);
      if (errores.length) return errorDominio(errores);
      const final: Plan = { ...plan, entrenadorId: yo.id, estado: cuerpo.asignar ? 'ACTIVO' : 'BORRADOR' };
      s.datos.planes = [
        ...s.datos.planes
          .filter((p) => p.id !== final.id)
          .map((p) => (cuerpo.asignar && p.alumnoId === final.alumnoId && p.estado === 'ACTIVO' ? { ...p, estado: 'FINALIZADO' as const } : p)),
        final,
      ];
      return json(201, { planes: s.datos.planes });
    }

    if (metodo === 'POST' && ruta === '/sesiones') {
      const abierta = s.datos.sesiones.find((x) => x.alumnoId === yo.id && !x.cerradaEn);
      if (abierta) return json(201, abierta);
      const plan = s.datos.planes.find((p) => p.id === cuerpo.planId)!;
      const nueva: Sesion = {
        id: `ses-${s.pedidos.length}`,
        alumnoId: yo.id,
        planId: plan.id,
        dia: cuerpo.dia,
        iniciadaEn: new Date().toISOString(),
        ejercicios: plan.dias[cuerpo.dia - 1].items.map((it) => ({ itemId: it.id, ejercicioId: it.ejercicioId, series: [] })),
      };
      s.datos.sesiones = [...s.datos.sesiones, nueva];
      return json(201, nueva);
    }

    const serie = ruta.match(/^\/sesiones\/([^/]+)\/series$/);
    if (metodo === 'POST' && serie) {
      const { itemId, ...valores } = cuerpo;
      s.datos.sesiones = s.datos.sesiones.map((x) =>
        x.id === serie[1]
          ? { ...x, ejercicios: x.ejercicios.map((e) => (e.itemId === itemId ? { ...e, series: [...e.series, { numero: e.series.length + 1, ...valores }] } : e)) }
          : x,
      );
      return json(201, s.datos.sesiones.find((x) => x.id === serie[1]));
    }

    const cierre = ruta.match(/^\/sesiones\/([^/]+)\/cerrar$/);
    if (metodo === 'POST' && cierre) {
      const errores = validarCierreSesion(cuerpo.esfuerzo);
      if (errores.length) return errorDominio(errores);
      s.datos.sesiones = s.datos.sesiones.map((x) =>
        x.id === cierre[1] ? { ...x, esfuerzo: cuerpo.esfuerzo, comentario: cuerpo.comentario, cerradaEn: new Date().toISOString() } : x,
      );
      return json(200, s.datos.sesiones.find((x) => x.id === cierre[1]));
    }

    return json(404, { mensaje: `Ruta no simulada: ${metodo} ${ruta}${query ? `?${query}` : ''}` });
  });

  return s;
}
