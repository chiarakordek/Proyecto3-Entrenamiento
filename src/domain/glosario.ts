/** Términos del entrenamiento explicados en lenguaje simple, para quien recién empieza. */
export const GLOSARIO = {
  serie: {
    termino: 'Serie',
    explicacion: 'Un bloque de repeticiones seguidas, sin parar. "4 × 10" son 4 series de 10 repeticiones, con descanso entre cada serie.',
  },
  repeticion: {
    termino: 'Repetición',
    explicacion: 'Un movimiento completo del ejercicio: por ejemplo, bajar y subir una vez en la sentadilla.',
  },
  descanso: {
    termino: 'Descanso',
    explicacion: 'La pausa entre series. Deja que el músculo se recupere lo justo para la siguiente. Respetarlo es parte del plan.',
  },
  carga: {
    termino: 'Carga sugerida',
    explicacion: 'El peso con el que tu entrenador propone trabajar. Si podés hacer todas las repeticiones con buena técnica, la próxima vez se sube un poco.',
  },
  esfuerzo: {
    termino: 'Esfuerzo percibido (RPE)',
    explicacion: 'Una nota del 1 al 10 sobre cuánto te costó la sesión. Le sirve a tu entrenador para decidir si subir, mantener o bajar la carga.',
  },
  tonelaje: {
    termino: 'Tonelaje',
    explicacion: 'El total de kilos que moviste: peso × repeticiones, sumado en todas las series. Es una forma simple de medir cuánto trabajaste.',
  },
  record: {
    termino: 'Récord personal',
    explicacion: 'El mayor peso que levantaste en un ejercicio. Superarlo es la señal más clara de que estás progresando.',
  },
  sobrecarga: {
    termino: 'Sobrecarga progresiva',
    explicacion: 'La idea central del entrenamiento: pedirle al cuerpo un poco más cada vez (más peso, más repeticiones o más tiempo) para que se adapte y mejore.',
  },
  isometrico: {
    termino: 'Ejercicio por tiempo',
    explicacion: 'Se sostiene una posición o un ritmo durante un tiempo, en vez de contar repeticiones. Por ejemplo, la plancha o la cinta.',
  },
} as const;

export type ClaveGlosario = keyof typeof GLOSARIO;

/** Qué significa cada nivel de esfuerzo (escala RPE adaptada). */
export const ESCALA_ESFUERZO: Record<number, { titulo: string; detalle: string }> = {
  1: { titulo: 'Muy fácil', detalle: 'Casi sin esfuerzo, como una caminata.' },
  2: { titulo: 'Fácil', detalle: 'Podrías seguir mucho tiempo más.' },
  3: { titulo: 'Cómodo', detalle: 'Respirás tranquilo y podés hablar sin problema.' },
  4: { titulo: 'Moderado', detalle: 'Empezás a sentir el trabajo, pero sobra energía.' },
  5: { titulo: 'Algo exigente', detalle: 'Te quedaban unas 5 repeticiones en cada serie.' },
  6: { titulo: 'Exigente', detalle: 'Te quedaban unas 4 repeticiones en cada serie.' },
  7: { titulo: 'Duro', detalle: 'Te quedaban 3 repeticiones. Buena zona para progresar.' },
  8: { titulo: 'Muy duro', detalle: 'Te quedaban 2 repeticiones como mucho.' },
  9: { titulo: 'Casi al límite', detalle: 'Te quedaba 1 repetición, no más.' },
  10: { titulo: 'Máximo', detalle: 'No podías hacer ni una repetición más.' },
};
