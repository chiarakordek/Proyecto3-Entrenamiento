import { randomUUID } from 'node:crypto';

/** Mismo formato de id que usaba el front: prefijo legible + 8 caracteres. */
export const nuevoId = (prefijo: string) => `${prefijo}-${randomUUID().slice(0, 8)}`;

export const ahora = () => new Date().toISOString();

/** Quita las propiedades null (la base guarda null; el front usa "ausente"). */
export function sinNulos<T extends object>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== null && v !== undefined)) as T;
}
