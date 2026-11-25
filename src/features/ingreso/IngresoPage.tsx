import clsx from 'clsx';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAlmacen, reiniciarDatos } from '@/data/almacen';
import { useUsuario } from '@/lib/sesion-usuario';
import { iniciales } from '@/lib/formato';
import { sonidos } from '@/lib/sonido';
import { NOMBRE_OBJETIVO } from '@/domain/clasificacion';
import type { TipoEjercicio } from '@/domain/tipos';
import { BotonSonido } from '@/ui/BotonSonido';
import { Categorias } from '@/ui/Categorias';

const PASOS = [
  'El alumno define su objetivo',
  'El entrenador asigna el plan',
  'El alumno registra peso y repeticiones reales',
  'Cierra con esfuerzo y comentarios',
  'El entrenador compara lo prescrito con lo real',
];

/** Ingreso de demostración, con la identidad de la portada de la presentación. */
export function IngresoPage() {
  const entrenadores = useAlmacen((d) => d.entrenadores);
  const alumnos = useAlmacen((d) => d.alumnos);
  const { ingresar } = useUsuario();
  const navegar = useNavigate();
  const [categoria, setCategoria] = useState<TipoEjercicio | null>(null);

  const entrar = (id: string, destino: string) => {
    sonidos.ok();
    ingresar(id);
    navegar(destino);
  };

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

          <section aria-labelledby="titulo-ingreso" className="relative self-start rounded-3xl bg-white p-6 text-tinta shadow-hoja md:p-8">
            <h2 id="titulo-ingreso" className="text-xl">
              Entrar como
            </h2>
            <p className="mt-1 text-sm text-tinta-suave">Versión de demostración: elegí un usuario de prueba.</p>

            <p className="mt-6 text-sm font-semibold text-tinta-suave">Entrenador</p>
            <ul className="mt-2 space-y-2">
              {entrenadores.map((e) => (
                <li key={e.id}>
                  <button
                    onClick={() => entrar(e.id, '/entrenador')}
                    className="flex w-full items-center gap-3 rounded-2xl bg-goma px-4 py-3 text-left text-white transition-transform hover:-translate-y-0.5 hover:bg-goma-700"
                  >
                    <span className="marcador grid h-11 w-11 place-items-center rounded-full bg-chispa text-goma">{iniciales(e.nombre)}</span>
                    <span>
                      <span className="block font-bold">{e.nombre}</span>
                      <span className="block text-sm text-tiza/75">Gestiona alumnos, diseña planes y revisa el progreso</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            <p className="mt-6 text-sm font-semibold text-tinta-suave">Alumnos</p>
            <ul className="mt-2 space-y-2">
              {alumnos.map((a, i) => (
                <li key={a.id}>
                  <button
                    onClick={() => entrar(a.id, '/alumno')}
                    className="flex w-full items-center gap-3 rounded-2xl border-2 border-tiza-200 px-4 py-2.5 text-left transition-transform hover:-translate-y-0.5 hover:border-goma/30 hover:bg-tiza"
                  >
                    <span
                      className={clsx(
                        'marcador grid h-10 w-10 place-items-center rounded-full text-sm',
                        ['bg-superior text-white', 'bg-inferior text-white', 'bg-media text-goma', 'bg-cardio text-white'][i % 4],
                      )}
                    >
                      {iniciales(a.nombre)}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-bold">{a.nombre}</span>
                      <span className="block truncate text-sm text-tinta-suave">
                        {a.meta ? NOMBRE_OBJETIVO[a.meta.objetivo] : 'Primera vez: va a definir su objetivo'}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            <button onClick={reiniciarDatos} className="mt-6 text-sm text-tinta-suave underline underline-offset-4 hover:text-tinta">
              Restablecer datos de prueba
            </button>
          </section>
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
