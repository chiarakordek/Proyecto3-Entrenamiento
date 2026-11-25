import { useSyncExternalStore } from 'react';
import type { Alumno, Ejercicio, Entrenador, Plan, Sesion } from '@/domain/tipos';

/**
 * Copia en memoria de lo que el back le muestra al usuario (GET /api/datos).
 * Nada se guarda en el navegador: los datos viven en la base. Las pantallas leen de acá
 * y, después de cada operación, api.ts actualiza esta copia con la respuesta del servidor.
 */
export interface BaseDatos {
  entrenadores: Entrenador[];
  alumnos: Alumno[];
  ejercicios: Ejercicio[];
  planes: Plan[];
  sesiones: Sesion[];
}

export const VACIA: BaseDatos = { entrenadores: [], alumnos: [], ejercicios: [], planes: [], sesiones: [] };

let estado: BaseDatos = VACIA;
const oyentes = new Set<() => void>();
const avisar = () => oyentes.forEach((o) => o());

export function leer(): BaseDatos {
  return estado;
}

export function reemplazar(datos: BaseDatos) {
  estado = datos;
  avisar();
}

export function escribir(cambio: (borrador: BaseDatos) => BaseDatos) {
  estado = cambio(estado);
  avisar();
}

export function vaciar() {
  reemplazar(VACIA);
}

export function suscribir(oyente: () => void) {
  oyentes.add(oyente);
  return () => oyentes.delete(oyente);
}

/** Lee una porción del almacén y re-renderiza cuando cambia. El selector debe devolver referencias estables. */
export function useAlmacen<T>(selector: (d: BaseDatos) => T): T {
  return useSyncExternalStore(suscribir, () => selector(estado), () => selector(estado));
}

/** Reemplaza (o agrega) un elemento por id. */
export function conReemplazo<T extends { id: string }>(lista: T[], nuevo: T): T[] {
  return lista.some((x) => x.id === nuevo.id) ? lista.map((x) => (x.id === nuevo.id ? nuevo : x)) : [...lista, nuevo];
}

/** Solo para tests. */
export const __reemplazarEstado = reemplazar;
