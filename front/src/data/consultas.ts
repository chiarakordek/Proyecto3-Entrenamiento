import { useMemo } from 'react';
import type { Ejercicio, Plan, Sesion, TipoEjercicio } from '@/domain/tipos';
import { useAlmacen } from './almacen';

/** Lecturas derivadas del almacén. Cada hook memoiza sobre las colecciones base. */

export function useCatalogo(): { lista: Ejercicio[]; porId: Map<string, Ejercicio> } {
  const lista = useAlmacen((d) => d.ejercicios);
  const porId = useMemo(() => new Map(lista.map((e) => [e.id, e])), [lista]);
  return { lista, porId };
}

export function useAlumnosDe(entrenadorId: string) {
  const alumnos = useAlmacen((d) => d.alumnos);
  return useMemo(() => alumnos.filter((a) => a.entrenadorId === entrenadorId), [alumnos, entrenadorId]);
}

export function useAlumno(id: string | undefined) {
  const alumnos = useAlmacen((d) => d.alumnos);
  return useMemo(() => alumnos.find((a) => a.id === id), [alumnos, id]);
}

export function usePlanes() {
  return useAlmacen((d) => d.planes);
}

export function usePlanActivo(alumnoId: string | undefined): Plan | undefined {
  const planes = usePlanes();
  return useMemo(() => planes.find((p) => p.alumnoId === alumnoId && p.estado === 'ACTIVO'), [planes, alumnoId]);
}

export function usePlan(id: string | undefined): Plan | undefined {
  const planes = usePlanes();
  return useMemo(() => planes.find((p) => p.id === id), [planes, id]);
}

export function useSesionesDe(alumnoId: string | undefined): Sesion[] {
  const sesiones = useAlmacen((d) => d.sesiones);
  return useMemo(
    () =>
      sesiones
        .filter((s) => s.alumnoId === alumnoId)
        .sort((a, b) => (a.iniciadaEn < b.iniciadaEn ? 1 : -1)),
    [sesiones, alumnoId],
  );
}

export function useSesion(id: string | undefined) {
  const sesiones = useAlmacen((d) => d.sesiones);
  return useMemo(() => sesiones.find((s) => s.id === id), [sesiones, id]);
}

export function tiposDelPlan(plan: Plan, porId: Map<string, Ejercicio>): TipoEjercicio[][] {
  return plan.dias.map((d) => d.items.map((i) => porId.get(i.ejercicioId)?.tipo).filter((t): t is TipoEjercicio => !!t));
}
