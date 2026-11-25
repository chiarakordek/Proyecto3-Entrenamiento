import type { Ejercicio, ItemPlan, MetaAlumno, Plan, Sesion } from './tipos';

export interface ErrorRegla {
  /** Dónde está el problema: 'plan', 'dia-1', 'item-<id>', 'pesoActualKg', etc. */
  campo: string;
  mensaje: string;
}

/** Firma de un día: el orden de ejercicios con sus parámetros. Dos días con la misma firma son iguales. */
export function firmaDia(items: ItemPlan[]): string {
  return items
    .map((i) => [i.ejercicioId, i.series, i.repeticiones ?? '', i.repeticionesMax ?? '', i.tiempoSeg ?? '', i.cargaKg ?? ''].join(':'))
    .join('|');
}

export function validarItem(item: ItemPlan, ejercicio: Ejercicio | undefined): ErrorRegla[] {
  const errores: ErrorRegla[] = [];
  const campo = `item-${item.id}`;
  if (!ejercicio) {
    errores.push({ campo, mensaje: 'El ejercicio ya no está en el catálogo.' });
    return errores;
  }
  if (!Number.isInteger(item.series) || item.series < 1 || item.series > 20) {
    errores.push({ campo, mensaje: `${ejercicio.nombre}: las series van de 1 a 20.` });
  }
  if (ejercicio.medicion === 'REPETICIONES') {
    if (!item.repeticiones || item.repeticiones < 1) {
      errores.push({ campo, mensaje: `${ejercicio.nombre}: indicá las repeticiones.` });
    }
    if (item.repeticionesMax !== undefined && item.repeticiones && item.repeticionesMax <= item.repeticiones) {
      errores.push({ campo, mensaje: `${ejercicio.nombre}: el tope del rango tiene que ser mayor que el mínimo.` });
    }
  } else if (!item.tiempoSeg || item.tiempoSeg < 1) {
    errores.push({ campo, mensaje: `${ejercicio.nombre}: indicá el tiempo objetivo.` });
  }
  if (item.descansoSeg < 0) {
    errores.push({ campo, mensaje: `${ejercicio.nombre}: el descanso no puede ser negativo.` });
  }
  if (item.cargaKg !== undefined && item.cargaKg < 0) {
    errores.push({ campo, mensaje: `${ejercicio.nombre}: la carga no puede ser negativa.` });
  }
  return errores;
}

/**
 * Reglas estructurales del plan:
 *  - exactamente 3 días (Día 1, 2 y 3)
 *  - cada día tiene al menos un ejercicio
 *  - los días no son iguales entre sí
 *  - cada ítem tiene parámetros válidos
 *  - la vigencia termina después de empezar
 */
export function validarPlan(
  plan: Pick<Plan, 'nombre' | 'dias' | 'vigenciaDesde' | 'vigenciaHasta'>,
  catalogo: Ejercicio[],
): ErrorRegla[] {
  const errores: ErrorRegla[] = [];
  const porId = new Map(catalogo.map((e) => [e.id, e]));

  if (!plan.nombre.trim()) errores.push({ campo: 'nombre', mensaje: 'Poné un nombre al plan.' });

  if (plan.dias.length !== 3) {
    errores.push({ campo: 'plan', mensaje: 'Un plan tiene exactamente 3 días.' });
    return errores;
  }

  plan.dias.forEach((dia, idx) => {
    if (dia.numero !== idx + 1) {
      errores.push({ campo: `dia-${idx + 1}`, mensaje: `El día ${idx + 1} está fuera de orden.` });
    }
    if (dia.items.length === 0) {
      errores.push({ campo: `dia-${dia.numero}`, mensaje: `El Día ${dia.numero} no tiene ejercicios.` });
    }
    dia.items.forEach((item) => errores.push(...validarItem(item, porId.get(item.ejercicioId))));
  });

  const firmas = plan.dias.map((d) => firmaDia(d.items));
  for (let a = 0; a < 3; a++) {
    for (let b = a + 1; b < 3; b++) {
      if (firmas[a] && firmas[a] === firmas[b]) {
        errores.push({
          campo: `dia-${b + 1}`,
          mensaje: `El Día ${b + 1} es igual al Día ${a + 1}. Los tres días tienen que ser distintos.`,
        });
      }
    }
  }

  if (!plan.vigenciaDesde || !plan.vigenciaHasta) {
    errores.push({ campo: 'vigencia', mensaje: 'Indicá desde y hasta cuándo rige el plan.' });
  } else if (plan.vigenciaHasta <= plan.vigenciaDesde) {
    errores.push({ campo: 'vigencia', mensaje: 'La fecha de fin tiene que ser posterior a la de inicio.' });
  }

  return errores;
}

/** Meta del alumno: peso actual obligatorio; peso ideal solo (y obligatorio) si el objetivo es bajar de peso. */
export function validarMeta(meta: Partial<MetaAlumno>): ErrorRegla[] {
  const errores: ErrorRegla[] = [];
  if (!meta.objetivo) errores.push({ campo: 'objetivo', mensaje: 'Elegí un objetivo.' });
  const actual = meta.pesoActualKg;
  if (actual === undefined || Number.isNaN(actual)) {
    errores.push({ campo: 'pesoActualKg', mensaje: 'El peso actual es obligatorio.' });
  } else if (actual < 25 || actual > 350) {
    errores.push({ campo: 'pesoActualKg', mensaje: 'Ingresá un peso entre 25 y 350 kg.' });
  }
  if (meta.objetivo === 'BAJAR_PESO') {
    const ideal = meta.pesoIdealKg;
    if (ideal === undefined || Number.isNaN(ideal)) {
      errores.push({ campo: 'pesoIdealKg', mensaje: 'Indicá el peso al que querés llegar.' });
    } else if (actual !== undefined && ideal >= actual) {
      errores.push({ campo: 'pesoIdealKg', mensaje: 'El peso ideal tiene que ser menor al actual.' });
    } else if (ideal < 25) {
      errores.push({ campo: 'pesoIdealKg', mensaje: 'Ingresá un peso mayor a 25 kg.' });
    }
  }
  return errores;
}

/** Normaliza la meta: descarta el peso ideal si el objetivo no es bajar de peso. */
export function normalizarMeta(meta: MetaAlumno): MetaAlumno {
  if (meta.objetivo === 'BAJAR_PESO') return meta;
  const { pesoIdealKg: _descartado, ...resto } = meta;
  return resto;
}

export function validarCierreSesion(esfuerzo: number | undefined): ErrorRegla[] {
  if (esfuerzo === undefined) return [{ campo: 'esfuerzo', mensaje: 'Indicá cuánto te costó la sesión.' }];
  if (!Number.isInteger(esfuerzo) || esfuerzo < 1 || esfuerzo > 10) {
    return [{ campo: 'esfuerzo', mensaje: 'El esfuerzo va de 1 a 10.' }];
  }
  return [];
}

export function sesionCerrada(sesion: Sesion): boolean {
  return Boolean(sesion.cerradaEn);
}
