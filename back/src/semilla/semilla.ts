// Datos de prueba que carga el back. front/src/test/semilla.ts es la misma copia, que usan los tests del front.
import type { Alumno, Entrenador, ItemPlan, NumeroDia, Plan, SerieRegistrada, Sesion } from '../dominio/tipos';
import { CATALOGO_SEMILLA } from './catalogo-semilla';

/**
 * Datos de demostración. Las fechas se calculan desde "hoy" para que el
 * historial y el resumen del mes siempre tengan contenido.
 */

export interface BaseDatos {
  version: number;
  entrenadores: Entrenador[];
  alumnos: Alumno[];
  ejercicios: typeof CATALOGO_SEMILLA;
  planes: Plan[];
  sesiones: Sesion[];
}

export const VERSION_DATOS = 5;

const dias = (n: number, base = new Date()) => {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
};
const iso = (d: Date) => d.toISOString();
const fecha = (d: Date) => d.toISOString().slice(0, 10);

const item = (id: string, ejercicioId: string, p: Omit<ItemPlan, 'id' | 'ejercicioId'>): ItemPlan => ({
  id,
  ejercicioId,
  ...p,
});

function planBase(id: string, alumnoId: string, nombre: string, desde: Date, escala = 1): Plan {
  const kg = (n: number) => Math.round((n * escala) / 2.5) * 2.5;
  return {
    id,
    nombre,
    entrenadorId: 'ent-1',
    alumnoId,
    estado: 'ACTIVO',
    creadoEn: iso(desde),
    vigenciaDesde: fecha(desde),
    vigenciaHasta: fecha(dias(84, desde)),
    dias: [
      {
        numero: 1,
        titulo: 'Empuje y cardio',
        items: [
          item(`${id}-1a`, 'ej-press-banca', { series: 4, repeticiones: 10, descansoSeg: 90, cargaKg: kg(40), notas: 'Bajá en dos tiempos.' }),
          item(`${id}-1b`, 'ej-press-militar', { series: 3, repeticiones: 10, descansoSeg: 90, cargaKg: kg(25) }),
          item(`${id}-1c`, 'ej-plancha-frontal', { series: 3, tiempoSeg: 40, descansoSeg: 45 }),
          item(`${id}-1d`, 'ej-cinta', { series: 1, tiempoSeg: 900, descansoSeg: 0, notas: 'Ritmo conversacional.' }),
        ],
      },
      {
        numero: 2,
        titulo: 'Piernas',
        items: [
          item(`${id}-2a`, 'ej-sentadilla', { series: 4, repeticiones: 10, descansoSeg: 90, cargaKg: kg(40), notas: 'Espalda recta.' }),
          item(`${id}-2b`, 'ej-hip-thrust', { series: 3, repeticiones: 12, descansoSeg: 75, cargaKg: kg(50) }),
          item(`${id}-2c`, 'ej-talones-parado', { series: 3, repeticiones: 15, descansoSeg: 45, cargaKg: kg(20) }),
          item(`${id}-2d`, 'ej-plancha-lateral', { series: 3, tiempoSeg: 30, descansoSeg: 30, notas: 'Cada lado.' }),
        ],
      },
      {
        numero: 3,
        titulo: 'Tracción y cadena posterior',
        items: [
          item(`${id}-3a`, 'ej-remo-barra', { series: 4, repeticiones: 10, descansoSeg: 90, cargaKg: kg(35) }),
          item(`${id}-3b`, 'ej-peso-muerto-rumano', { series: 4, repeticiones: 8, descansoSeg: 120, cargaKg: kg(45) }),
          item(`${id}-3c`, 'ej-curl', { series: 3, repeticiones: 10, repeticionesMax: 12, descansoSeg: 60, cargaKg: kg(10) }),
          item(`${id}-3d`, 'ej-bici', { series: 1, tiempoSeg: 1200, descansoSeg: 0 }),
        ],
      },
    ],
  };
}

/** Genera sesiones cerradas con progresión de cargas para mostrar evolución y récords. */
function historial(plan: Plan, cantidad: number, cadaDias: number, progresoPorSemana: number, ultimaHaceDias = 0): Sesion[] {
  const sesiones: Sesion[] = [];
  const hoy = new Date();
  const comentarios = [
    'Bien, la última serie costó.',
    '',
    'Molestia leve en el hombro derecho en la 3ra serie.',
    'Me sentí liviano, se puede subir.',
    '',
    'Dormí poco, bajé un poco el ritmo.',
  ];
  for (let n = cantidad; n >= 1; n--) {
    const cuando = dias(-Math.round(n * cadaDias) - ultimaHaceDias, hoy);
    cuando.setHours(18 + (n % 3), 15, 0, 0);
    const indice = cantidad - n;
    const dia = ((indice % 3) + 1) as NumeroDia;
    const semanas = (indice * cadaDias) / 7;
    const diaPlan = plan.dias[dia - 1];
    const ejercicios = diaPlan.items.map((it) => {
      const series: SerieRegistrada[] = [];
      for (let s = 1; s <= it.series; s++) {
        if (it.tiempoSeg) {
          series.push({ numero: s, tiempoSeg: it.tiempoSeg + Math.round(semanas) * 5 - (s === it.series ? 5 : 0) });
        } else {
          const carga = it.cargaKg !== undefined
            ? Math.max(0, Math.round((it.cargaKg - 5 + semanas * progresoPorSemana) / 2.5) * 2.5)
            : undefined;
          const reps = (it.repeticiones ?? 10) - (s === it.series && indice % 2 === 0 ? 2 : 0);
          series.push({ numero: s, pesoKg: carga, repeticiones: reps });
        }
      }
      return { itemId: it.id, ejercicioId: it.ejercicioId, series };
    });
    const fin = new Date(cuando.getTime() + 55 * 60_000);
    sesiones.push({
      id: `${plan.id}-ses-${indice + 1}`,
      alumnoId: plan.alumnoId,
      planId: plan.id,
      dia,
      iniciadaEn: iso(cuando),
      cerradaEn: iso(fin),
      ejercicios,
      esfuerzo: 5 + ((indice * 3) % 4),
      comentario: comentarios[indice % comentarios.length] || undefined,
    });
  }
  return sesiones;
}

export function crearSemilla(): BaseDatos {
  const hoy = new Date();
  const entrenadores: Entrenador[] = [
    { id: 'ent-1', nombre: 'Martina Sosa', email: 'martina@entrenamiento.test', rol: 'ENTRENADOR' },
  ];
  const alumnos: Alumno[] = [
    {
      id: 'alu-1', nombre: 'Lucía Fernández', email: 'lucia@entrenamiento.test', rol: 'ALUMNO', entrenadorId: 'ent-1',
      altaEn: iso(dias(-70, hoy)),
      meta: { objetivo: 'FUERZA', pesoActualKg: 62, definidaEn: iso(dias(-70, hoy)) },
      pesos: [{ fecha: iso(dias(-70, hoy)), kg: 63 }, { fecha: iso(dias(-40, hoy)), kg: 62.5 }, { fecha: iso(dias(-10, hoy)), kg: 62 }],
    },
    {
      id: 'alu-2', nombre: 'Tomás Herrera', email: 'tomas@entrenamiento.test', rol: 'ALUMNO', entrenadorId: 'ent-1',
      altaEn: iso(dias(-40, hoy)),
      meta: { objetivo: 'BAJAR_PESO', pesoActualKg: 94, pesoIdealKg: 82, definidaEn: iso(dias(-40, hoy)) },
      pesos: [{ fecha: iso(dias(-40, hoy)), kg: 97 }, { fecha: iso(dias(-30, hoy)), kg: 96.2 }, { fecha: iso(dias(-20, hoy)), kg: 95.1 }, { fecha: iso(dias(-10, hoy)), kg: 94.6 }, { fecha: iso(dias(-2, hoy)), kg: 94 }],
    },
    {
      id: 'alu-3', nombre: 'Valentina Ruiz', email: 'valentina@entrenamiento.test', rol: 'ALUMNO', entrenadorId: 'ent-1',
      altaEn: iso(dias(-33, hoy)),
      meta: { objetivo: 'HIPERTROFIA', pesoActualKg: 58, definidaEn: iso(dias(-33, hoy)) },
      pesos: [{ fecha: iso(dias(-33, hoy)), kg: 57.2 }, { fecha: iso(dias(-6, hoy)), kg: 58 }],
    },
    {
      id: 'alu-4', nombre: 'Joaquín Méndez', email: 'joaquin@entrenamiento.test', rol: 'ALUMNO', entrenadorId: 'ent-1',
      altaEn: iso(dias(-1, hoy)),
    },
    {
      // Tiene cuenta pero todavía no está vinculada a ningún entrenador: se puede vincular por email.
      id: 'alu-5', nombre: 'Sofía Paz', email: 'sofia@entrenamiento.test', rol: 'ALUMNO',
      altaEn: iso(dias(-3, hoy)),
      meta: { objetivo: 'SALUD_GENERAL', pesoActualKg: 66, definidaEn: iso(dias(-3, hoy)) },
      pesos: [{ fecha: iso(dias(-3, hoy)), kg: 66 }],
    },
  ];

  const p1 = planBase('plan-1', 'alu-1', 'Fuerza base, bloque 1', dias(-63, hoy), 1);
  const p2 = planBase('plan-2', 'alu-2', 'Recomposición inicial', dias(-35, hoy), 1.3);
  const p3 = planBase('plan-3', 'alu-3', 'Hipertrofia 3 días', dias(-32, hoy), 0.8);

  return {
    version: VERSION_DATOS,
    entrenadores,
    alumnos,
    ejercicios: CATALOGO_SEMILLA,
    planes: [p1, p2, p3],
    sesiones: [
      ...historial(p1, 24, 2.5, 1.2),
      ...historial(p2, 12, 2.8, 0.8, 4),
      ...historial(p3, 7, 3, 1, 8),
    ],
  };
}
