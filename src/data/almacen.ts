import { useSyncExternalStore } from 'react';
import { crearSemilla, VERSION_DATOS, type BaseDatos } from './semilla';
import { guardarClave, leerClave } from '@/lib/guardado';

/**
 * Almacén local (localStorage) que reemplaza al backend mientras no exista.
 * Toda lectura/escritura del resto de la app pasa por `api.ts`, así que
 * conectar el backend real implica cambiar solo ese archivo.
 */

const CLAVE = 'p3-entrenamiento-datos';

function cargar(): BaseDatos {
  try {
    const crudo = leerClave(CLAVE);
    if (crudo) {
      const datos = JSON.parse(crudo) as BaseDatos;
      if (datos.version === VERSION_DATOS) return datos;
    }
  } catch {
    // Datos corruptos: se regeneran.
  }
  return crearSemilla();
}

let estado: BaseDatos = cargar();
const oyentes = new Set<() => void>();

function persistir() {
  try {
    guardarClave(CLAVE, JSON.stringify(estado));
  } catch {
    // Sin almacenamiento disponible (modo privado): la app sigue en memoria.
  }
}

export function leer(): BaseDatos {
  return estado;
}

export function escribir(cambio: (borrador: BaseDatos) => BaseDatos) {
  estado = cambio(estado);
  persistir();
  oyentes.forEach((o) => o());
}

export function suscribir(oyente: () => void) {
  oyentes.add(oyente);
  return () => oyentes.delete(oyente);
}

export function reiniciarDatos() {
  estado = crearSemilla();
  persistir();
  oyentes.forEach((o) => o());
}

/** Lee una porción del almacén y re-renderiza cuando cambia. El selector debe devolver referencias estables. */
export function useAlmacen<T>(selector: (d: BaseDatos) => T): T {
  return useSyncExternalStore(suscribir, () => selector(estado), () => selector(estado));
}

/** Solo para tests. */
export function __reemplazarEstado(nuevo: BaseDatos) {
  estado = nuevo;
  oyentes.forEach((o) => o());
}
