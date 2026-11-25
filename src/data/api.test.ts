import { beforeEach, describe, expect, it } from 'vitest';
import { CATALOGO_SEMILLA } from './catalogo-semilla';
import { __reemplazarEstado, leer } from './almacen';
import { asignarPlanAVarios, definirMeta, eliminarEjercicio, ErrorDominio, guardarEjercicio, planVacio, vincularAlumno, altaAlumno } from './api';
import { crearSemilla } from './semilla';
import { validarItem } from '@/domain/reglas';
import { prescripcion } from '@/lib/formato';

beforeEach(() => __reemplazarEstado(crearSemilla()));

const errorDe = (fn: () => unknown) => {
  try {
    fn();
  } catch (e) {
    if (e instanceof ErrorDominio) return e.errores.map((x) => x.mensaje).join(' ');
    throw e;
  }
  return '';
};

describe('rango de repeticiones (lenguaje ubicuo: "rango de repeticiones")', () => {
  const banca = CATALOGO_SEMILLA.find((e) => e.id === 'ej-press-banca')!;
  it('se muestra como mínimo–máximo', () => {
    expect(prescripcion({ id: 'i', ejercicioId: banca.id, series: 4, repeticiones: 8, repeticionesMax: 12, descansoSeg: 90 })).toBe('4 × 8–12');
  });
  it('el tope tiene que ser mayor que el mínimo', () => {
    const errores = validarItem({ id: 'i', ejercicioId: banca.id, series: 4, repeticiones: 12, repeticionesMax: 8, descansoSeg: 90 }, banca);
    expect(errores.map((e) => e.mensaje)).toContain('Press de banca: el tope del rango tiene que ser mayor que el mínimo.');
  });
});

describe('dar de alta o vincular alumnos', () => {
  it('vincula a un alumno con cuenta y sin entrenador', () => {
    vincularAlumno('ent-1', 'SOFIA@entrenamiento.test');
    expect(leer().alumnos.find((a) => a.id === 'alu-5')?.entrenadorId).toBe('ent-1');
  });
  it('no vincula a quien ya está en la lista ni duplica cuentas en el alta', () => {
    expect(errorDe(() => vincularAlumno('ent-1', 'lucia@entrenamiento.test'))).toContain('ya está en tu lista');
    expect(errorDe(() => altaAlumno('ent-1', { nombre: 'Otra', email: 'sofia@entrenamiento.test' }))).toContain('vinculala');
  });
});

describe('asignar el plan a uno o varios alumnos', () => {
  it('cada alumno recibe su copia activa', () => {
    const plan = planVacio('ent-1', 'alu-4');
    plan.nombre = 'Inicio';
    plan.dias[0].items = [{ id: 'a', ejercicioId: 'ej-press-banca', series: 3, repeticiones: 10, descansoSeg: 60 }];
    plan.dias[1].items = [{ id: 'b', ejercicioId: 'ej-sentadilla', series: 3, repeticiones: 10, descansoSeg: 60 }];
    plan.dias[2].items = [{ id: 'c', ejercicioId: 'ej-remo-barra', series: 3, repeticiones: 10, descansoSeg: 60 }];
    const asignados = asignarPlanAVarios(plan, ['alu-3']);
    expect(asignados.map((p) => p.alumnoId)).toEqual(['alu-4', 'alu-3']);
    const activos = leer().planes.filter((p) => p.estado === 'ACTIVO');
    expect(activos.filter((p) => p.alumnoId === 'alu-3')).toHaveLength(1); // el plan anterior de alu-3 se finaliza
    expect(asignados[1].id).not.toBe(asignados[0].id);
    expect(asignados[1].dias[0].items[0].id).not.toBe('a');
  });
});

describe('baja de ejercicios del catálogo', () => {
  it('no deja borrar uno que está en un plan', () => {
    expect(errorDe(() => eliminarEjercicio('ej-press-banca'))).toContain('Sacalo del plan');
  });
  it('borra uno que nunca se usó', () => {
    const nuevo = guardarEjercicio({ nombre: 'Estocadas', descripcion: 'Paso largo y bajá la rodilla de atrás.', tipo: 'TREN_INFERIOR', grupo: 'CUADRICEPS', medicion: 'REPETICIONES' });
    eliminarEjercicio(nuevo.id);
    expect(leer().ejercicios.some((e) => e.id === nuevo.id)).toBe(false);
  });
  it('valida el link del video explicativo', () => {
    expect(
      errorDe(() => guardarEjercicio({ nombre: 'Estocadas', descripcion: 'Paso largo y bajá la rodilla.', tipo: 'TREN_INFERIOR', grupo: 'CUADRICEPS', medicion: 'REPETICIONES', videoUrl: 'video' })),
    ).toContain('http');
  });
});

describe('peso para contrastar la evolución en el tiempo', () => {
  it('cada registro de peso se suma al historial', () => {
    const antes = leer().alumnos.find((a) => a.id === 'alu-2')!.pesos!.length;
    definirMeta('alu-2', { objetivo: 'BAJAR_PESO', pesoActualKg: 93, pesoIdealKg: 82 });
    const alumno = leer().alumnos.find((a) => a.id === 'alu-2')!;
    expect(alumno.pesos).toHaveLength(antes + 1);
    expect(alumno.pesos!.at(-1)!.kg).toBe(93);
  });
});
