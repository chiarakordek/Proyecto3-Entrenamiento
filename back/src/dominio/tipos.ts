// Copia de front/src/domain/tipos.ts. Mantener las dos iguales: el front valida para avisar al instante y el back para que nada se saltee.
/**
 * Modelo de dominio del MVP de entrenamiento físico.
 * Los nombres siguen el lenguaje ubicuo del documento del Proyecto 3.
 */

export type TipoEjercicio = 'TREN_SUPERIOR' | 'TREN_INFERIOR' | 'ZONA_MEDIA' | 'CARDIO';

export type GrupoMuscular =
  // Tren superior
  | 'PECHO'
  | 'ESPALDA'
  | 'HOMBROS'
  | 'BRAZOS'
  // Tren inferior
  | 'CUADRICEPS'
  | 'GLUTEOS_ISQUIOS'
  | 'PANTORRILLAS'
  // Zona media
  | 'ABDOMEN'
  | 'OBLICUOS'
  | 'LUMBAR'
  // Cardio
  | 'CUERPO_COMPLETO'
  | 'PREDOMINIO_INFERIOR';

/** Cómo se mide el trabajo del ejercicio: por repeticiones o por tiempo sostenido. */
export type Medicion = 'REPETICIONES' | 'TIEMPO';

/** Definición conceptual del movimiento en la biblioteca global. */
export interface Ejercicio {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: TipoEjercicio;
  grupo: GrupoMuscular;
  equipo?: string;
  medicion: Medicion;
  /** Link a un video explicativo (guion de la PPT: "notas técnicas o videos explicativos"). */
  videoUrl?: string;
}

/** Ítem de ejercicio: instancia prescrita de un ejercicio dentro de un día. */
export interface ItemPlan {
  id: string;
  ejercicioId: string;
  series: number;
  /** Repeticiones objetivo (si la medición es por repeticiones). Con repeticionesMax forma un rango. */
  repeticiones?: number;
  /** Tope del rango de repeticiones (ej. 8 a 12). El documento habla de "rango de repeticiones". */
  repeticionesMax?: number;
  /** Tiempo objetivo en segundos (cardio o isometría). */
  tiempoSeg?: number;
  descansoSeg: number;
  /** Carga sugerida en kg. Vacía para peso corporal o cardio. */
  cargaKg?: number;
  notas?: string;
}

export type NumeroDia = 1 | 2 | 3;

/** Día de entrenamiento: colección ordenada de ítems. */
export interface DiaPlan {
  numero: NumeroDia;
  titulo?: string;
  items: ItemPlan[];
}

export type EstadoPlan = 'BORRADOR' | 'ACTIVO' | 'FINALIZADO';

/** Plan de entrenamiento: estructura fija de exactamente 3 días. */
export interface Plan {
  id: string;
  nombre: string;
  entrenadorId: string;
  alumnoId: string;
  dias: [DiaPlan, DiaPlan, DiaPlan];
  vigenciaDesde: string; // ISO date (yyyy-mm-dd)
  vigenciaHasta: string;
  estado: EstadoPlan;
  creadoEn: string;
}

export type Objetivo = 'BAJAR_PESO' | 'HIPERTROFIA' | 'FUERZA' | 'SALUD_GENERAL';

export interface MetaAlumno {
  objetivo: Objetivo;
  pesoActualKg: number;
  /** Solo cuando el objetivo es bajar de peso. */
  pesoIdealKg?: number;
  definidaEn: string;
}

export type Rol = 'ENTRENADOR' | 'ALUMNO';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
}

export interface Alumno extends Usuario {
  rol: 'ALUMNO';
  /** Vacío si el alumno todavía no está vinculado a un entrenador. */
  entrenadorId?: string;
  meta?: MetaAlumno;
  /** Registros de peso corporal en el tiempo, para contrastar la evolución contra el peso ideal. */
  pesos?: { fecha: string; kg: number }[];
  altaEn: string;
}

export interface Entrenador extends Usuario {
  rol: 'ENTRENADOR';
}

/** Valores reales logrados en una serie. */
export interface SerieRegistrada {
  numero: number;
  pesoKg?: number;
  repeticiones?: number;
  tiempoSeg?: number;
}

export interface EjercicioRegistrado {
  itemId: string;
  ejercicioId: string;
  series: SerieRegistrada[];
}

/** Sesión registrada: registro inmutable de la ejecución real una vez cerrada. */
export interface Sesion {
  id: string;
  alumnoId: string;
  planId: string;
  dia: NumeroDia;
  iniciadaEn: string;
  cerradaEn?: string;
  ejercicios: EjercicioRegistrado[];
  /** Esfuerzo percibido global (RPE), escala 1 a 10. */
  esfuerzo?: number;
  comentario?: string;
}
