// Copia de front/src/domain/clasificacion.ts. Mantener las dos iguales: el front valida para avisar al instante y el back para que nada se saltee.
import type { GrupoMuscular, Objetivo, TipoEjercicio } from './tipos';

export const TIPOS: TipoEjercicio[] = ['TREN_SUPERIOR', 'TREN_INFERIOR', 'ZONA_MEDIA', 'CARDIO'];

export const NOMBRE_TIPO: Record<TipoEjercicio, string> = {
  TREN_SUPERIOR: 'Tren superior',
  TREN_INFERIOR: 'Tren inferior',
  ZONA_MEDIA: 'Zona media',
  CARDIO: 'Cardio',
};

export const GRUPOS_POR_TIPO: Record<TipoEjercicio, GrupoMuscular[]> = {
  TREN_SUPERIOR: ['PECHO', 'ESPALDA', 'HOMBROS', 'BRAZOS'],
  TREN_INFERIOR: ['CUADRICEPS', 'GLUTEOS_ISQUIOS', 'PANTORRILLAS'],
  ZONA_MEDIA: ['ABDOMEN', 'OBLICUOS', 'LUMBAR'],
  CARDIO: ['CUERPO_COMPLETO', 'PREDOMINIO_INFERIOR'],
};

export const NOMBRE_GRUPO: Record<GrupoMuscular, string> = {
  PECHO: 'Pecho',
  ESPALDA: 'Espalda',
  HOMBROS: 'Hombros',
  BRAZOS: 'Brazos',
  CUADRICEPS: 'Cuádriceps',
  GLUTEOS_ISQUIOS: 'Glúteos e isquiotibiales',
  PANTORRILLAS: 'Pantorrillas',
  ABDOMEN: 'Abdomen',
  OBLICUOS: 'Oblicuos',
  LUMBAR: 'Lumbar',
  CUERPO_COMPLETO: 'Cuerpo completo',
  PREDOMINIO_INFERIOR: 'Predominio inferior',
};

export const NOMBRE_OBJETIVO: Record<Objetivo, string> = {
  BAJAR_PESO: 'Bajar de peso / Definición',
  HIPERTROFIA: 'Aumento de masa muscular / Hipertrofia',
  FUERZA: 'Fuerza',
  SALUD_GENERAL: 'Acondicionamiento físico / Salud general',
};

export const DESCRIPCION_OBJETIVO: Record<Objetivo, string> = {
  BAJAR_PESO: 'Definición y reducción de peso corporal.',
  HIPERTROFIA: 'Aumentar el volumen muscular.',
  FUERZA: 'Levantar más en los ejercicios básicos.',
  SALUD_GENERAL: 'Acondicionamiento y bienestar.',
};

export function tipoDeGrupo(grupo: GrupoMuscular): TipoEjercicio {
  const tipo = TIPOS.find((t) => GRUPOS_POR_TIPO[t].includes(grupo));
  if (!tipo) throw new Error(`Grupo muscular sin tipo: ${grupo}`);
  return tipo;
}
