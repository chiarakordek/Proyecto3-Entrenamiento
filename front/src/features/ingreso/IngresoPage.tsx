import clsx from 'clsx';
import { useState, type FormEvent } from 'react';
import { ErrorDominio } from '@/data/api';
import type { ErrorRegla } from '@/domain/reglas';
import { useUsuario } from '@/lib/sesion-usuario';
import { sonidos } from '@/lib/sonido';
import type { TipoEjercicio } from '@/domain/tipos';
import { Boton, Campo, Entrada } from '@/ui/base';
import { BotonSonido } from '@/ui/BotonSonido';
import { Categorias } from '@/ui/Categorias';
const PASOS = [
  'El alumno define su objetivo',
  'El entrenador asigna el plan',
  'El alumno registra peso y repeticiones reales',
  'Cierra con esfuerzo y comentarios',
  'El entrenador compara lo prescrito con lo real',
];

/** Portada con la identidad de la presentación y el ingreso (login o registro de alumno). */
export function IngresoPage() {
  const [categoria, setCategoria] = useState<TipoEjercicio | null>(null);

  return (
    <div className="min-h-dvh">
      <div className="relative overflow-hidden bg-goma text-white">
        {/* Formas de la portada de la PPT */}
        <span className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-[4rem] bg-superior/80 md:h-[26rem] md:w-[26rem] md:rounded-[6rem]" aria-hidden />
        <span className="pointer-events-none absolute -bottom-40 right-10 h-64 w-64 rounded-full md:right-40 md:h-80 md:w-80 bg-[#34B36A]/70" aria-hidden />
        <span className="pointer-events-none absolute bottom-24 right-24 h-24 w-24 rounded-full bg-chispa" aria-hidden />

        <div className="relative mx-auto flex max-w-6xl justify-end px-6 pt-4">
          <BotonSonido oscuro />
        </div>
        <div className="relative mx-auto grid max-w-6xl gap-10 px-6 pb-16 pt-4 lg:grid-cols-[1.2fr_1fr] lg:pb-24">
          <section className="self-center">
            <div className="mb-6 flex gap-1.5" aria-hidden>
              {['bg-superior', 'bg-inferior', 'bg-media', 'bg-cardio'].map((c) => (
                <span key={c} className={clsx('h-9 w-2.5 rounded-full', c)} />
              ))}
            </div>
            <h1 className="text-3xl leading-[1.02] md:text-4xl">MVP de entrenamiento físico</h1>
            <p className="mt-5 max-w-lg text-lg text-tiza/85">
              Un sistema para que el entrenador arme planes y siga la evolución de sus alumnos. Tres días por plan, cada serie anotada.
            </p>
            <ol className="mt-8 grid max-w-xl gap-2 sm:grid-cols-5">
              {PASOS.map((p, i) => (
                <li key={p} className="flex gap-2 text-sm sm:flex-col">
                  <span className="marcador grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-sm text-goma">{i + 1}</span>
                  <span className="text-tiza/85">{p}</span>
                </li>
              ))}
            </ol>
          </section>

          <FormIngreso />
        </div>
      </div>

      <section aria-labelledby="titulo-categorias" className="mx-auto max-w-4xl px-6 py-14">
        <h2 id="titulo-categorias" className="text-center text-2xl">
          Cuatro tipos de ejercicio, cuatro colores
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-center text-tinta-suave">
          Cada ejercicio se define con nombre, descripción técnica, tipo general y grupo muscular. El color te dice qué parte del cuerpo trabaja. Tocá una categoría.
        </p>
        <div className="mt-8">
          <Categorias seleccion={categoria} onElegir={(t) => { sonidos.toque(); setCategoria(t); }} />
        </div>
      </section>
    </div>
  );
}

/** Cuentas de prueba que crea la semilla del back (la contraseña está en el README). */
const CUENTAS_PRUEBA = [
  { email: 'martina@entrenamiento.test', quien: 'Entrenadora' },
  { email: 'lucia@entrenamiento.test', quien: 'Alumna con historial' },
  { email: 'joaquin@entrenamiento.test', quien: 'Alumno nuevo' },
];

function FormIngreso() {
  const { ingresar, registrarse } = useUsuario();
  const [modo, setModo] = useState<'ingreso' | 'registro'>('ingreso');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errores, setErrores] = useState<ErrorRegla[]>([]);
  const [enviando, setEnviando] = useState(false);

  const error = (c: string) => errores.find((e) => e.campo === c)?.mensaje;
  const general = errores.find((e) => !['nombre', 'email', 'password'].includes(e.campo))?.mensaje;

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setErrores([]);
    setEnviando(true);
    try {
      if (modo === 'ingreso') await ingresar(email, password);
      else await registrarse({ nombre, email, password });
      sonidos.ok();
    } catch (err) {
      setEnviando(false);
      if (err instanceof ErrorDominio) {
        sonidos.error();
        setErrores(err.errores);
      } else throw err;
    }
  };

  const cambiar = (m: 'ingreso' | 'registro') => {
    setModo(m);
    setErrores([]);
  };

  return (
    <section aria-labelledby="titulo-ingreso" className="relative self-start rounded-3xl bg-white p-6 text-tinta shadow-hoja md:p-8">
      <h2 id="titulo-ingreso" className="text-xl">
        {modo === 'ingreso' ? 'Entrar' : 'Crear cuenta de alumno'}
      </h2>
      <p className="mt-1 text-sm text-tinta-suave">
        {modo === 'ingreso'
          ? 'Con el email y la contraseña de tu cuenta.'
          : 'Después tu entrenador te vincula con este email y te asigna el plan.'}
      </p>

      <form onSubmit={enviar} noValidate className="mt-5 space-y-4">
        {modo === 'registro' && (
          <Campo etiqueta="Nombre y apellido" error={error('nombre')}>
            {(p) => <Entrada {...p} value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="name" autoFocus />}
          </Campo>
        )}
        <Campo etiqueta="Email" error={error('email')}>
          {(p) => <Entrada {...p} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />}
        </Campo>
        <Campo etiqueta="Contraseña" error={error('password')} ayuda={modo === 'registro' ? 'Al menos 8 caracteres.' : undefined}>
          {(p) => (
            <Entrada
              {...p}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={modo === 'ingreso' ? 'current-password' : 'new-password'}
            />
          )}
        </Campo>
        {general && (
          <p role="alert" className="rounded-xl bg-peligro-claro px-3 py-2 text-sm text-peligro-oscuro">
            {general}
          </p>
        )}
        <Boton type="submit" tamano="lg" className="w-full" disabled={enviando}>
          {enviando ? 'Un momento…' : modo === 'ingreso' ? 'Entrar' : 'Crear cuenta'}
        </Boton>
      </form>

      <p className="mt-4 text-center text-sm text-tinta-suave">
        {modo === 'ingreso' ? (
          <>
            ¿Sos alumno y no tenés cuenta?{' '}
            <button onClick={() => cambiar('registro')} className="font-semibold text-goma underline underline-offset-4">
              Creá una
            </button>
          </>
        ) : (
          <>
            ¿Ya tenés cuenta?{' '}
            <button onClick={() => cambiar('ingreso')} className="font-semibold text-goma underline underline-offset-4">
              Entrá
            </button>
          </>
        )}
      </p>

      {modo === 'ingreso' && (
        <div className="mt-6 border-t border-tiza-200 pt-4">
          <p className="text-sm font-semibold text-tinta-suave">Cuentas de prueba</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {CUENTAS_PRUEBA.map((c) => (
              <li key={c.email}>
                <button
                  type="button"
                  onClick={() => setEmail(c.email)}
                  className={clsx(
                    'rounded-full border-2 px-3 py-1 text-sm',
                    email === c.email ? 'border-goma bg-tiza-200 font-semibold' : 'border-tiza-300 hover:border-goma/40',
                  )}
                >
                  {c.quien}
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-tinta-suave">Completa el email; la contraseña de prueba está en el README del repo.</p>
        </div>
      )}
    </section>
  );
}