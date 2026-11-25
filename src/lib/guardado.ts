/**
 * Acceso a localStorage que nunca rompe la app: en modo privado o dentro de un
 * visor embebido puede no existir o lanzar errores. En ese caso se trabaja en memoria.
 */
const memoria = new Map<string, string>();

export function leerClave(clave: string): string | null {
  try {
    return localStorage.getItem(clave);
  } catch {
    return memoria.get(clave) ?? null;
  }
}

export function guardarClave(clave: string, valor: string) {
  try {
    localStorage.setItem(clave, valor);
  } catch {
    memoria.set(clave, valor);
  }
}

export function borrarClave(clave: string) {
  try {
    localStorage.removeItem(clave);
  } catch {
    memoria.delete(clave);
  }
}
