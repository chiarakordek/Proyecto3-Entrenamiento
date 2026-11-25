import type { ErrorRegla } from '@/domain/reglas';
import { borrarClave, guardarClave, leerClave } from '@/lib/guardado';

/** Error que las pantallas muestran junto a cada campo. Viene del back o de la validación local. */
export class ErrorDominio extends Error {
  constructor(public readonly errores: ErrorRegla[]) {
    super(errores.map((e) => e.mensaje).join(' '));
  }
}

const CLAVE_TOKEN = 'p3-token';
/** En desarrollo Vite redirige /api al back (ver vite.config.ts). En producción se puede apuntar a otra URL. */
const BASE = (import.meta.env.VITE_API_URL ?? '') + '/api';

export const leerToken = () => leerClave(CLAVE_TOKEN);
export const guardarToken = (t: string) => guardarClave(CLAVE_TOKEN, t);
export const borrarToken = () => borrarClave(CLAVE_TOKEN);

/** Se llama cuando el back responde 401 (token vencido): la app vuelve al ingreso. */
let alExpirar: () => void = () => {};
export function cuandoExpireLaSesion(fn: () => void) {
  alExpirar = fn;
}

export async function pedir<T>(metodo: string, ruta: string, cuerpo?: unknown): Promise<T> {
  const token = leerToken();
  let respuesta: Response;
  try {
    respuesta = await fetch(BASE + ruta, {
      method: metodo,
      headers: {
        ...(cuerpo !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
    });
  } catch {
    throw new ErrorDominio([{ campo: 'servidor', mensaje: 'No se pudo conectar con el servidor. Revisá que el back esté corriendo.' }]);
  }

  if (respuesta.status === 204) return undefined as T;
  const datos = await respuesta.json().catch(() => ({}));
  if (respuesta.ok) return datos as T;

  if (respuesta.status === 401 && token) {
    borrarToken();
    alExpirar();
  }
  const errores: ErrorRegla[] = Array.isArray(datos?.errores) && datos.errores.length
    ? datos.errores
    : [{ campo: 'servidor', mensaje: datos?.mensaje ?? `Error del servidor (${respuesta.status}).` }];
  throw new ErrorDominio(errores);
}
