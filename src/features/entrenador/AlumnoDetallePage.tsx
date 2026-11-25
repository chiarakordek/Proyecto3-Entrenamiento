import clsx from 'clsx';
import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Pencil, Plus } from 'lucide-react';
import { useAlumno, useCatalogo, usePlanActivo, useSesionesDe } from '@/data/consultas';
import { NOMBRE_OBJETIVO } from '@/domain/clasificacion';
import { cumplimientoItem, records, tonelajeSesion } from '@/domain/metricas';
import type { Plan, Sesion } from '@/domain/tipos';
import { fecha, haceCuanto, kg, numero } from '@/lib/formato';
import { Vacio } from '@/ui/base';
import { GraficoEvolucion } from '@/ui/GraficoEvolucion';
import { GraficoPeso } from '@/ui/GraficoPeso';
import { Medalla } from '@/ui/Medalla';
import { calcularLogros } from '@/domain/logros';
import { PlanTresDias } from '@/ui/plan';
import { FilaTipo } from '@/ui/tipo';

export function AlumnoDetallePage() {
  const { alumnoId } = useParams();
  const alumno = useAlumno(alumnoId);
  const plan = usePlanActivo(alumnoId);
  const sesiones = useSesionesDe(alumnoId);
  const { porId } = useCatalogo();
  const cerradas = useMemo(() => sesiones.filter((s) => s.cerradaEn), [sesiones]);
  const logros = useMemo(() => calcularLogros(cerradas), [cerradas]);
  const logrosGanados = logros.filter((l) => l.ganadoEn);
  const mejores = useMemo(() => [...records(cerradas).values()].sort((a, b) => b.pesoKg - a.pesoKg), [cerradas]);

  if (!alumno) {
    return <Vacio titulo="Ese alumno no existe" accion={<Link to="/entrenador" className="text-goma underline">Volver a alumnos</Link>} />;
  }

  return (
    <div className="mx-auto max-w-6xl">
      <Link to="/entrenador" className="inline-flex items-center gap-1.5 text-sm font-semibold text-tinta-suave hover:text-tinta">
        <ArrowLeft size={16} aria-hidden /> Alumnos
      </Link>

      <header className="mt-4 flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl">{alumno.nombre}</h1>
          <p className="mt-1 text-tinta-suave">{alumno.email}</p>
        </div>
        {alumno.meta ? (
          <dl className="flex gap-6 rounded-2xl bg-white px-5 py-3 shadow-hoja">
            <Dato termino="Objetivo" valor={NOMBRE_OBJETIVO[alumno.meta.objetivo]} />
            <Dato termino="Peso actual" valor={kg(alumno.meta.pesoActualKg)} />
            {alumno.meta.pesoIdealKg !== undefined && <Dato termino="Quiere llegar a" valor={kg(alumno.meta.pesoIdealKg)} />}
          </dl>
        ) : (
          <p className="rounded-2xl border border-dashed border-tiza-300 px-4 py-3 text-sm text-tinta-suave">
            Todavía no definió su objetivo. Lo va a hacer cuando entre por primera vez.
          </p>
        )}
      </header>

      {(alumno.pesos?.length ?? 0) >= 2 && (
        <section className="mt-6 max-w-xl rounded-2xl bg-white p-5 shadow-hoja" aria-labelledby="titulo-peso">
          <h2 id="titulo-peso" className="text-lg">
            Evolución del peso corporal
          </h2>
          <div className="mt-2">
            <GraficoPeso alumno={alumno} />
          </div>
        </section>
      )}

      <section className="mt-10" aria-labelledby="titulo-plan">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="titulo-plan" className="text-2xl">
              {plan ? plan.nombre : 'Plan activo'}
            </h2>
            {plan && (
              <p className="text-sm text-tinta-suave">
                Vigente del {fecha(plan.vigenciaDesde)} al {fecha(plan.vigenciaHasta)}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {plan && (
              <Link
                to={`/entrenador/planes/${plan.id}`}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-goma/40 bg-white px-4 font-semibold text-goma hover:bg-tiza-200"
              >
                <Pencil size={16} aria-hidden /> Editar plan
              </Link>
            )}
            <Link
              to={`/entrenador/alumnos/${alumno.id}/plan/nuevo`}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-goma px-4 font-semibold text-white hover:bg-goma-700"
            >
              <Plus size={16} aria-hidden /> {plan ? 'Nuevo plan' : 'Armar plan'}
            </Link>
          </div>
        </div>
        <div className="mt-5">
          {plan ? (
            <PlanTresDias dias={plan.dias} porId={porId} compacto />
          ) : (
            <Vacio titulo="Sin plan asignado">Armá un plan de 3 días y asignáselo para que pueda empezar a entrenar.</Vacio>
          )}
        </div>
      </section>

      <section className="mt-12" aria-labelledby="titulo-evolucion">
        <h2 id="titulo-evolucion" className="text-2xl">
          Evolución de cargas
        </h2>
        <p className="mb-4 text-sm text-tinta-suave">El peso más alto de cada sesión. Si la línea sube, hay sobrecarga progresiva.</p>
        <GraficoEvolucion sesiones={cerradas} porId={porId} />
      </section>

      {logrosGanados.length > 0 && (
        <section className="mt-12" aria-labelledby="titulo-logros">
          <h2 id="titulo-logros" className="text-2xl">
            Logros de {alumno.nombre.split(' ')[0]}
          </h2>
          <p className="mb-4 text-sm text-tinta-suave">
            {logrosGanados.length} de {logros.length} ganados.
          </p>
          <ul className="flex flex-wrap gap-3">
            {logrosGanados.map(({ definicion: l, ganadoEn }) => (
              <li key={l.id} className="flex w-28 flex-col items-center rounded-2xl bg-white px-2 py-3 text-center" title={l.comoSeGana}>
                <Medalla logro={l} ganada tamano={46} />
                <span className="mt-1 text-sm font-bold leading-tight">{l.titulo}</span>
                <span className="text-xs text-tinta-suave">{fecha(ganadoEn!)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <div className="mt-12 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        <section aria-labelledby="titulo-sesiones">
          <h2 id="titulo-sesiones" className="text-2xl">
            Sesiones registradas
          </h2>
          {cerradas.length === 0 ? (
            <div className="mt-4">
              <Vacio titulo="Todavía no registró sesiones" />
            </div>
          ) : (
            <ol className="mt-4 space-y-2">
              {cerradas.slice(0, 12).map((s) => (
                <FilaSesion key={s.id} sesion={s} plan={plan} />
              ))}
            </ol>
          )}
        </section>

        <section aria-labelledby="titulo-records">
          <h2 id="titulo-records" className="text-2xl">
            Mejores marcas
          </h2>
          {mejores.length === 0 ? (
            <p className="mt-4 text-tinta-suave">Aparecen cuando registre cargas.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {mejores.map((r) => {
                const ej = porId.get(r.ejercicioId);
                if (!ej) return null;
                return (
                  <FilaTipo key={r.ejercicioId} tipo={ej.tipo} as="li" className="items-center justify-between">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{ej.nombre}</span>
                      <span className="block text-xs text-tinta-suave">{fecha(r.fecha)}</span>
                    </span>
                    <span className="cifra display text-xl">{kg(r.pesoKg)}</span>
                  </FilaTipo>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Dato({ termino, valor }: { termino: string; valor: string }) {
  return (
    <div>
      <dt className="text-xs text-tinta-suave">{termino}</dt>
      <dd className="cifra font-semibold">{valor}</dd>
    </div>
  );
}

const COLOR_ESFUERZO = (n: number) => (n <= 4 ? 'bg-exito-claro text-exito-oscuro' : n <= 7 ? 'bg-aviso-claro text-aviso-oscuro' : 'bg-peligro-claro text-peligro-oscuro');

function FilaSesion({ sesion, plan }: { sesion: Sesion; plan: Plan | undefined }) {
  const items = plan?.id === sesion.planId ? plan.dias[sesion.dia - 1].items : [];
  const completos = items.filter((it) => {
    const c = cumplimientoItem(it, sesion.ejercicios.find((e) => e.itemId === it.id)?.series);
    return c === 'CUMPLIO' || c === 'SUPERO';
  }).length;

  return (
    <li>
      <Link
        to={`/entrenador/sesiones/${sesion.id}`}
        className="grid grid-cols-[3.5rem_1fr_auto] items-start gap-3 rounded-xl bg-white px-4 py-3 hover:bg-white/70"
      >
        <span className="display text-lg leading-tight">Día {sesion.dia}</span>
        <span className="min-w-0">
          <span className="block text-sm">
            {fecha(sesion.cerradaEn!)}, {haceCuanto(sesion.cerradaEn!)}
            {items.length > 0 && (
              <span className="text-tinta-suave">
                , {completos} de {items.length} ejercicios cumplidos
              </span>
            )}
          </span>
          <span className="cifra block text-sm text-tinta-suave">{numero(tonelajeSesion(sesion))} kg movidos</span>
          {sesion.comentario && (
            <span className="mt-1 flex items-start gap-1.5 text-sm italic">
              <MessageSquare size={14} className="mt-1 shrink-0 text-tinta-suave" aria-hidden />
              {sesion.comentario}
            </span>
          )}
        </span>
        {sesion.esfuerzo && (
          <span
            className={clsx('cifra rounded-lg px-2 py-1 text-center text-sm font-semibold', COLOR_ESFUERZO(sesion.esfuerzo))}
            title="Esfuerzo percibido (1 a 10)"
          >
            {sesion.esfuerzo}/10
          </span>
        )}
      </Link>
    </li>
  );
}
