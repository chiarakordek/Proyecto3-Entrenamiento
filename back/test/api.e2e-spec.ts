import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/configurar';
import type { Plan } from '../src/dominio/tipos';
import { SembradorService } from '../src/semilla/sembrador.service';

/**
 * API completa contra una base en memoria cargada con los datos de prueba.
 * Cada describe arranca de la semilla limpia.
 */
let app: INestApplication;
const PASS = 'entrenar123';

beforeAll(async () => {
  const modulo = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = modulo.createNestApplication({ logger: false });
  configurarApp(app);
  await app.init();
});

afterAll(() => app.close());

const api = () => request(app.getHttpServer());

async function token(email: string, password = PASS) {
  const r = await api().post('/api/auth/login').send({ email, password }).expect(200);
  return r.body.token as string;
}

const comoEntrenador = () => token('martina@entrenamiento.test');
const comoLucia = () => token('lucia@entrenamiento.test');

function planValido(alumnoId: string): Partial<Plan> {
  return {
    nombre: 'Inicio',
    alumnoId,
    vigenciaDesde: '2026-12-01',
    vigenciaHasta: '2027-01-01',
    dias: [
      { numero: 1, items: [{ id: 'a', ejercicioId: 'ej-press-banca', series: 3, repeticiones: 8, repeticionesMax: 12, descansoSeg: 90, cargaKg: 30 }] },
      { numero: 2, items: [{ id: 'b', ejercicioId: 'ej-sentadilla', series: 3, repeticiones: 10, descansoSeg: 90, cargaKg: 40 }] },
      { numero: 3, items: [{ id: 'c', ejercicioId: 'ej-plancha-frontal', series: 3, tiempoSeg: 40, descansoSeg: 45 }] },
    ],
  };
}

beforeEach(async () => {
  await app.get(SembradorService).reiniciar();
});

describe('login', () => {
  it('entra con email y contraseña y devuelve el usuario sin la contraseña', async () => {
    const r = await api().post('/api/auth/login').send({ email: 'MARTINA@entrenamiento.test', password: PASS }).expect(200);
    expect(r.body.token).toBeTruthy();
    expect(r.body.usuario).toMatchObject({ id: 'ent-1', rol: 'ENTRENADOR' });
    expect(JSON.stringify(r.body)).not.toContain('passwordHash');
  });

  it('no dice si el email existe cuando falla', async () => {
    const malPass = await api().post('/api/auth/login').send({ email: 'lucia@entrenamiento.test', password: 'otra-cosa' }).expect(401);
    const noExiste = await api().post('/api/auth/login').send({ email: 'nadie@entrenamiento.test', password: 'otra-cosa' }).expect(401);
    expect(malPass.body.mensaje).toBe(noExiste.body.mensaje);
  });

  it('sin token no se puede leer nada', async () => {
    await api().get('/api/datos').expect(401);
  });

  it('un alumno se registra solo y queda sin entrenador', async () => {
    const r = await api().post('/api/auth/registro').send({ nombre: 'Ana Gómez', email: 'ana@entrenamiento.test', password: 'clave-segura' }).expect(201);
    expect(r.body.usuario).toMatchObject({ rol: 'ALUMNO', nombre: 'Ana Gómez' });
    expect(r.body.usuario.entrenadorId).toBeUndefined();
    const dup = await api().post('/api/auth/registro').send({ nombre: 'Ana', email: 'ana@entrenamiento.test', password: 'clave-segura' }).expect(400);
    expect(dup.body.errores[0].campo).toBe('email');
  });
});

describe('permisos por rol', () => {
  it('el entrenador ve solo a sus alumnos; el alumno solo lo suyo', async () => {
    const e = await api().get('/api/datos').set('Authorization', `Bearer ${await comoEntrenador()}`).expect(200);
    expect(e.body.alumnos.map((a: { id: string }) => a.id).sort()).toEqual(['alu-1', 'alu-2', 'alu-3', 'alu-4']);
    expect(e.body.ejercicios).toHaveLength(35);

    const a = await api().get('/api/datos').set('Authorization', `Bearer ${await comoLucia()}`).expect(200);
    expect(a.body.alumnos).toHaveLength(1);
    expect(new Set(a.body.sesiones.map((s: { alumnoId: string }) => s.alumnoId))).toEqual(new Set(['alu-1']));
    expect(a.body.planes.every((p: Plan) => p.alumnoId === 'alu-1')).toBe(true);
  });

  it('un alumno no puede armar planes y un entrenador no puede registrar sesiones', async () => {
    await api().post('/api/planes').set('Authorization', `Bearer ${await comoLucia()}`).send({ plan: planValido('alu-1'), asignar: true }).expect(403);
    await api().post('/api/sesiones').set('Authorization', `Bearer ${await comoEntrenador()}`).send({ planId: 'plan-1', dia: 1 }).expect(403);
  });
});

describe('planes', () => {
  it('rechaza días iguales con el mensaje del dominio', async () => {
    const plan = planValido('alu-4');
    plan.dias![2] = { numero: 3, items: plan.dias![0].items.map((i) => ({ ...i, id: 'x' })) };
    const r = await api().post('/api/planes').set('Authorization', `Bearer ${await comoEntrenador()}`).send({ plan, asignar: true }).expect(400);
    expect(r.body.errores).toContainEqual(expect.objectContaining({ campo: 'dia-3', mensaje: expect.stringContaining('igual al Día 1') }));
  });

  it('asigna a varios alumnos: cada uno recibe su copia activa y se finaliza el plan anterior', async () => {
    const r = await api()
      .post('/api/planes')
      .set('Authorization', `Bearer ${await comoEntrenador()}`)
      .send({ plan: planValido('alu-4'), asignar: true, otrosAlumnoIds: ['alu-3'] })
      .expect(201);
    const activos = (r.body.planes as Plan[]).filter((p) => p.estado === 'ACTIVO');
    expect(activos.filter((p) => p.alumnoId === 'alu-4')).toHaveLength(1);
    expect(activos.filter((p) => p.alumnoId === 'alu-3')).toHaveLength(1);
    expect((r.body.planes as Plan[]).find((p) => p.id === 'plan-3')?.estado).toBe('FINALIZADO');
    expect(activos.find((p) => p.alumnoId === 'alu-4')?.dias[0].items[0].repeticionesMax).toBe(12);
  });

  it('no deja armar planes para alumnos de otro entrenador o sin vincular', async () => {
    const r = await api().post('/api/planes').set('Authorization', `Bearer ${await comoEntrenador()}`).send({ plan: planValido('alu-5'), asignar: true }).expect(400);
    expect(r.body.mensaje).toContain('no está a tu cargo');
  });

  it('descarta campos desconocidos del cuerpo', async () => {
    const plan = { ...planValido('alu-4'), entrenadorId: 'otro', estado: 'FINALIZADO', hack: true } as unknown as Plan;
    const r = await api().post('/api/planes').set('Authorization', `Bearer ${await comoEntrenador()}`).send({ plan, asignar: true }).expect(201);
    const nuevo = (r.body.planes as Plan[]).find((p) => p.alumnoId === 'alu-4')!;
    expect(nuevo).toMatchObject({ entrenadorId: 'ent-1', estado: 'ACTIVO' });
    expect(nuevo).not.toHaveProperty('hack');
  });
});

describe('sesiones', () => {
  it('registra series, exige esfuerzo para cerrar y después es inmutable', async () => {
    const t = await comoLucia();
    const auth = { Authorization: `Bearer ${t}` };
    const s = (await api().post('/api/sesiones').set(auth).send({ planId: 'plan-1', dia: 1 }).expect(201)).body;
    const item = s.ejercicios[0].itemId;

    await api().post(`/api/sesiones/${s.id}/series`).set(auth).send({ itemId: item, pesoKg: 45, repeticiones: 10 }).expect(201);
    const con2 = (await api().post(`/api/sesiones/${s.id}/series`).set(auth).send({ itemId: item, pesoKg: 45, repeticiones: 9 }).expect(201)).body;
    expect(con2.ejercicios[0].series).toHaveLength(2);

    const sin1 = (await api().delete(`/api/sesiones/${s.id}/series/ultima`).query({ itemId: item }).set(auth).expect(200)).body;
    expect(sin1.ejercicios[0].series).toHaveLength(1);

    const sinEsfuerzo = await api().post(`/api/sesiones/${s.id}/cerrar`).set(auth).send({}).expect(400);
    expect(sinEsfuerzo.body.errores[0].mensaje).toBe('Indicá cuánto te costó la sesión.');

    const cerrada = (await api().post(`/api/sesiones/${s.id}/cerrar`).set(auth).send({ esfuerzo: 7, comentario: 'Bien' }).expect(200)).body;
    expect(cerrada).toMatchObject({ esfuerzo: 7, comentario: 'Bien' });
    expect(cerrada.cerradaEn).toBeTruthy();

    const tarde = await api().post(`/api/sesiones/${s.id}/series`).set(auth).send({ itemId: item, pesoKg: 50, repeticiones: 10 }).expect(400);
    expect(tarde.body.mensaje).toContain('ya está cerrada');
  });

  it('un alumno no puede tocar el plan de otro', async () => {
    await api().post('/api/sesiones').set('Authorization', `Bearer ${await comoLucia()}`).send({ planId: 'plan-2', dia: 1 }).expect(404);
  });
});

describe('alumnos y objetivo', () => {
  it('vincula a un alumno con cuenta y sin entrenador', async () => {
    const auth = { Authorization: `Bearer ${await comoEntrenador()}` };
    const antes = (await api().get('/api/alumnos/buscar').query({ email: 'sofia@entrenamiento.test' }).set(auth).expect(200)).body;
    expect(antes.alumno).toMatchObject({ nombre: 'Sofía Paz', estado: 'SIN_ENTRENADOR' });
    await api().post('/api/alumnos/vincular').set(auth).send({ email: 'sofia@entrenamiento.test' }).expect(201);
    const despues = (await api().get('/api/alumnos/buscar').query({ email: 'sofia@entrenamiento.test' }).set(auth).expect(200)).body;
    expect(despues.alumno.estado).toBe('TUYO');
  });

  it('da de alta un alumno que después entra con su contraseña inicial', async () => {
    const auth = { Authorization: `Bearer ${await comoEntrenador()}` };
    await api().post('/api/alumnos').set(auth).send({ nombre: 'Pedro Ruiz', email: 'pedro@entrenamiento.test', password: 'inicial-123' }).expect(201);
    const r = await api().post('/api/auth/login').send({ email: 'pedro@entrenamiento.test', password: 'inicial-123' }).expect(200);
    expect(r.body.usuario).toMatchObject({ rol: 'ALUMNO', entrenadorId: 'ent-1' });
  });

  it('el peso ideal solo se pide para bajar de peso y cada peso queda en el historial', async () => {
    const auth = { Authorization: `Bearer ${await token('tomas@entrenamiento.test')}` };
    const r = await api().put('/api/yo/meta').set(auth).send({ objetivo: 'BAJAR_PESO', pesoActualKg: 93 }).expect(400);
    expect(r.body.errores[0].campo).toBe('pesoIdealKg');
    const ok = (await api().put('/api/yo/meta').set(auth).send({ objetivo: 'BAJAR_PESO', pesoActualKg: 93, pesoIdealKg: 82 }).expect(200)).body;
    expect(ok.pesos.at(-1)).toMatchObject({ kg: 93 });
    const fuerza = (await api().put('/api/yo/meta').set(auth).send({ objetivo: 'FUERZA', pesoActualKg: 92, pesoIdealKg: 80 }).expect(200)).body;
    expect(fuerza.meta.pesoIdealKg).toBeUndefined();
  });
});

describe('catálogo', () => {
  it('alta, modificación y baja, sin borrar ejercicios en uso', async () => {
    const auth = { Authorization: `Bearer ${await comoEntrenador()}` };
    const enUso = await api().delete('/api/ejercicios/ej-press-banca').set(auth).expect(400);
    expect(enUso.body.mensaje).toContain('Sacalo del plan');

    const nuevo = (
      await api()
        .post('/api/ejercicios')
        .set(auth)
        .send({ nombre: 'Estocadas', descripcion: 'Paso largo y bajá la rodilla de atrás.', grupo: 'CUADRICEPS', medicion: 'REPETICIONES' })
        .expect(201)
    ).body;
    expect(nuevo.tipo).toBe('TREN_INFERIOR');
    await api().put(`/api/ejercicios/${nuevo.id}`).set(auth).send({ ...nuevo, videoUrl: 'video' }).expect(400);
    await api().delete(`/api/ejercicios/${nuevo.id}`).set(auth).expect(204);

    await api().post('/api/ejercicios').set('Authorization', `Bearer ${await comoLucia()}`).send({}).expect(403);
  });
});
