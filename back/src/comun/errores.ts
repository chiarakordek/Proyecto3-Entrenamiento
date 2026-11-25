import { BadRequestException, ForbiddenException, NotFoundException, type ValidationError } from '@nestjs/common';
import type { ErrorRegla } from '../dominio/reglas';

/**
 * Error de regla de negocio. Responde 400 con { mensaje, errores: [{ campo, mensaje }] },
 * el mismo formato que el front ya sabe mostrar junto a cada campo.
 */
export class ErrorDominio extends BadRequestException {
  constructor(public readonly errores: ErrorRegla[]) {
    super({ mensaje: errores.map((e) => e.mensaje).join(' '), errores });
  }
}

export const error = (campo: string, mensaje: string) => new ErrorDominio([{ campo, mensaje }]);
export const noEncontrado = (que: string) => new NotFoundException({ mensaje: `${que} no existe.` });
export const prohibido = (mensaje = 'No tenés permiso para hacer esto.') => new ForbiddenException({ mensaje });

/** Convierte los errores de class-validator al mismo formato. */
export function errorDeValidacion(errores: ValidationError[]): ErrorDominio {
  const planos: ErrorRegla[] = [];
  const recorrer = (lista: ValidationError[], prefijo = '') => {
    for (const e of lista) {
      const campo = prefijo ? `${prefijo}.${e.property}` : e.property;
      for (const m of Object.values(e.constraints ?? {})) planos.push({ campo, mensaje: m });
      if (e.children?.length) recorrer(e.children, campo);
    }
  };
  recorrer(errores);
  return new ErrorDominio(planos);
}
