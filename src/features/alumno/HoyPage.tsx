import clsx from 'clsx';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock3, Play, Target } from 'lucide-react';
import { iniciarSesion } from '@/data/api';
import { useCatalogo, usePlanActivo, useSesionesDe } from '@/data/consultas';
import { NOMBRE_OBJETIVO } from '@/domain/clasificacion';
import { proximoDia } from '@/domain/metricas';
import type { NumeroDia } from '@/domain/tipos';
import { useAlumnoActual } from '@/lib/sesion-usuario';
import { descanso, duracion, haceCuanto, kg } from '@/lib/formato';
import { composicionDia, minutosEstimados, semana } from '@/lib/resumenes';
import { sonidos } from '@/lib/sonido';
import { Vacio } from '@/ui/base';
import { ComoFunciona, Termino } from '@/ui/didactico';
import { BarraCategorias, Cabecera, Seccion } from '@/ui/pagina';
import { HEX_TIPO } from '@/ui/colores';
import { NOMBRE_TIPO } from '@/domain/clasificacion';

const INICIAL_DIA = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

export function HoyPage() {
  const alumno = useAlumnoActual();
  const plan = usePlanActivo(alumno.id);
  const sesiones = useSesionesDe(alumno.id);
  const { porId } = useCatalogo();
  const navegar = useNavigate();
  const abierta = sesiones.find((s) => !s.cerradaEn);
  const sugerido = plan ? proximoDia(plan, sesiones) : 1;
  const [elegido, setElegido] = useState<NumeroDia | null>(null);
  const dia = elegido ?? sugerido;
  const ultima = sesiones.find((s) => s.cerradaEn);
  const dias7 = useMemo(() => semana(sesiones), [sesiones]);
  const enLaSemana = dias7.reduce((t, d) => t + d.sesiones.length, 0);

  if (!plan) {
    return (
      <div>
        <Cabecera titulo="Todavía no tenés plan" bajada="Cuando tu entrenador te asigne uno, vas a ver acá qué te toca cada día." />
        <div className="mt-8">
          <Vacio titulo="Mientras tanto, aprendé los ejercicios">
            <Link to="/alumno/aprender" className="font-semibold text-goma underline underline-offset-4">
              Ver la guía con animaciones
            </Link>
          </Vacio>
        </div>
        <Objetivo />
      </div>
    );
  }

  const diaPlan = plan.dias[dia - 1];
  const composicion = composicionDia(diaPlan, porId);
  const minutos = minutosEstimados(diaPlan);

  const empezar = () => {
    sonidos.ok();
    iniciarSesion(alumno.id, plan, dia);
    navegar('/alumno/sesion');
  };

  return (
    <div>
      {abierta ? (
        <Cabecera
          titulo="Tenés una sesión sin cerrar"
          bajada={`Día ${abierta.dia}, empezada ${haceCuanto(abierta.iniciadaEn)}. Lo que anotaste quedó guardado.`}
        >
          <Link to="/alumno/sesion" className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-chispa text-lg font-bold text-goma hover:brightness-105">
            <Play size={20} fill="currentColor" aria-hidden /> Seguir la sesión
          </Link>
        </Cabecera>
      ) : (
        <Cabecera
          arriba={<p className="mb-1 text-tiza/80">{elegido && elegido !== sugerido ? 'Elegiste el' : 'Hoy te toca el'}</p>}
          titulo={
            <span className="flex items-end gap-3">
              <span>Día</span>
              <span className="marcador text-[4.5rem] leading-[0.8] text-chispa">{dia}</span>
            </span>
          }
          bajada={diaPlan.titulo}
        >
          <BarraCategorias cantidades={composicion} leyenda oscuro alto="h-3" />
          <dl className="mt-4 flex gap-5 text-sm">
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">Ejercicios</dt>
              <dd>
                <span className="marcador text-lg">{diaPlan.items.length}</span> <span className="text-tiza/75">ejercicios</span>
              </dd>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock3 size={16} className="text-tiza/70" aria-hidden />
              <dt className="sr-only">Duración estimada</dt>
              <dd>
                <span className="marcador text-lg">~{minutos}</span> <span className="text-tiza/75">min</span>
              </dd>
            </div>
          </dl>
          <button
            onClick={empezar}
            className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-chispa text-lg font-bold text-goma shadow-[0_6px_0_0_rgba(0,0,0,0.18)] transition-transform hover:brightness-105 active:translate-y-1 active:shadow-none"
          >
            <Play size={20} fill="currentColor" aria-hidden /> Empezar Día {dia}
          </button>
        </Cabecera>
      )}

      <Seccion titulo="Tu semana" bajada={`${enLaSemana} de 3 sesiones en los últimos 7 días`} id="sem">
        <ol className="grid grid-cols-7 gap-1.5 rounded-2xl bg-white p-3">
          {dias7.map(({ fecha, sesiones: ss }, i) => {
            const hoy = i === 6;
            const s = ss[0];
            return (
              <li key={i} className="flex flex-col items-center gap-1.5">
                <span className={clsx('text-xs font-semibold', hoy ? 'text-goma' : 'text-tinta-suave')}>{INICIAL_DIA[fecha.getDay()]}</span>
                <span
                  className={clsx(
                    'marcador grid h-10 w-10 place-items-center rounded-full text-sm',
                    s ? 'bg-goma text-white' : hoy ? 'border-2 border-dashed border-goma/40 text-goma' : 'bg-tiza text-tinta-suave',
                  )}
                  title={s ? `Día ${s.dia}` : undefined}
                >
                  {s ? s.dia : fecha.getDate()}
                </span>
                <span className="sr-only">{s ? `Entrenaste el Día ${s.dia}` : 'Sin sesión'}</span>
              </li>
            );
          })}
        </ol>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-tiza-200" aria-hidden>
          <div className="h-full rounded-full bg-exito transition-[width] duration-700" style={{ width: `${Math.min(100, (enLaSemana / 3) * 100)}%` }} />
        </div>
      </Seccion>

      {!abierta && (
        <Seccion titulo="¿Otro día?" bajada="Podés elegir cualquiera de los tres." id="otros">
          <div className="grid grid-cols-3 gap-2" role="group" aria-label="Elegir día">
            {plan.dias.map((d) => {
              const activo = dia === d.numero;
              return (
                <button
                  key={d.numero}
                  aria-pressed={activo}
                  onClick={() => {
                    sonidos.toque();
                    setElegido(d.numero);
                  }}
                  className={clsx(
                    'relative rounded-2xl border-2 p-3 text-left transition-colors',
                    activo ? 'border-goma bg-white' : 'border-transparent bg-white/60 hover:bg-white',
                  )}
                >
                  <span className="flex items-baseline justify-between">
                    <span className="marcador text-2xl">{d.numero}</span>
                    {d.numero === sugerido && <span className="absolute -top-2.5 right-2 rounded-full bg-chispa px-2 py-0.5 text-[0.7rem] font-bold text-goma shadow-hoja">Te toca</span>}
                  </span>
                  <span className="mt-1 block truncate text-xs text-tinta-suave">{d.titulo ?? `Día ${d.numero}`}</span>
                  <span className="mt-2 block">
                    <BarraCategorias cantidades={composicionDia(d, porId)} alto="h-1.5" />
                  </span>
                </button>
              );
            })}
          </div>
        </Seccion>
      )}

      <Seccion titulo="El recorrido de hoy" bajada={<>En este orden. Tocá <Link to="/alumno/plan" className="font-semibold text-goma underline underline-offset-2">Mi plan</Link> para ver cómo se hace cada uno.</>} id="recorrido">
        <ol className="relative">
          {diaPlan.items.map((it, i) => {
            const ej = porId.get(it.ejercicioId);
            if (!ej) return null;
            const c = HEX_TIPO[ej.tipo];
            const ultimo = i === diaPlan.items.length - 1;
            return (
              <li key={it.id} className="relative flex gap-4 pb-4">
                {!ultimo && <span className="absolute left-[1.05rem] top-9 h-[calc(100%-1.75rem)] w-0.5 bg-tiza-300" aria-hidden />}
                <span
                  className="marcador relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm"
                  style={{ background: c.base, color: ej.tipo === 'ZONA_MEDIA' ? '#12302A' : '#fff' }}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1 rounded-2xl bg-white px-4 py-3">
                  <p className="text-xs font-semibold" style={{ color: c.oscuro }}>
                    {NOMBRE_TIPO[ej.tipo]}
                  </p>
                  <p className="font-bold leading-snug">{ej.nombre}</p>
                  <ul className="mt-2 flex flex-wrap gap-1.5 text-xs">
                    <Chip>{it.series} {it.series === 1 ? 'serie' : 'series'}</Chip>
                    <Chip>{it.tiempoSeg ? duracion(it.tiempoSeg) : `${it.repeticiones}${it.repeticionesMax ? `–${it.repeticionesMax}` : ""} reps`}</Chip>
                    {ej.medicion === 'REPETICIONES' && it.cargaKg !== undefined && <Chip>{kg(it.cargaKg)}</Chip>}
                    {it.descansoSeg > 0 && <Chip>{descanso(it.descansoSeg)}</Chip>}
                  </ul>
                  {it.notas && <p className="mt-2 text-sm italic text-tinta-suave">“{it.notas}”</p>}
                </div>
              </li>
            );
          })}
        </ol>
        <p className="text-sm text-tinta-suave">
          ¿Qué es una <Termino clave="serie">serie</Termino>? ¿Y el <Termino clave="descanso">descanso</Termino>? Tocá las palabras para ver la explicación.
        </p>
      </Seccion>

      <Objetivo />

      <div className="mt-9">
        <ComoFunciona
          clave="alumno"
          titulo="Cómo es una sesión"
          pasos={[
            'Tocá Empezar y mirá la animación de cada ejercicio.',
            'Hacé la serie y anotá el peso y las repeticiones reales.',
            'Descansá: te avisamos con un sonido cuando volver.',
            'Al final, contá cuánto te costó y dejale una nota a tu entrenador.',
          ]}
        />
      </div>

      {ultima && (
        <p className="mt-6 text-center text-sm text-tinta-suave">
          Última sesión: Día {ultima.dia}, {haceCuanto(ultima.cerradaEn!)}.{' '}
          <Link to="/alumno/historial" className="font-semibold text-goma underline underline-offset-4">
            Ver historial
          </Link>
        </p>
      )}
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <li className="cifra rounded-full border border-tiza-300 px-2.5 py-0.5 font-semibold text-tinta">{children}</li>;
}

function Objetivo() {
  const alumno = useAlumnoActual();
  if (!alumno.meta) return null;
  const m = alumno.meta;
  return (
    <Seccion titulo="Tu objetivo" bajada="Tu entrenador lo ve para ajustar el plan." id="objetivo" accion={<Link to="/alumno/objetivo" className="text-sm font-semibold text-goma underline underline-offset-4">Cambiar</Link>}>
      <div className="flex items-center gap-4 rounded-2xl bg-white p-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-chispa-claro text-goma">
          <Target size={24} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold">{NOMBRE_OBJETIVO[m.objetivo]}</p>
          <p className="cifra text-sm text-tinta-suave">
            Peso actual {kg(m.pesoActualKg)}
            {m.pesoIdealKg !== undefined && `, meta ${kg(m.pesoIdealKg)}`}
          </p>
          {m.pesoIdealKg !== undefined && m.pesoActualKg > m.pesoIdealKg && (
            <p className="mt-1 text-sm font-semibold text-exito-oscuro">Te faltan {kg(m.pesoActualKg - m.pesoIdealKg)}</p>
          )}
        </div>
      </div>
    </Seccion>
  );
}
