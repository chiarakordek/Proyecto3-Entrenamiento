import clsx from 'clsx';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, SlidersHorizontal } from 'lucide-react';
import { useAlumno, useCatalogo, usePlan, useSesion } from '@/data/consultas';
import { cumplimientoItem, tonelajeSesion, type Cumplimiento } from '@/domain/metricas';
import { fechaCompleta, kg, numero, prescripcion, serieTexto } from '@/lib/formato';
import { Vacio } from '@/ui/base';
import { BARRA_TIPO } from '@/ui/tipo';

const CUMPLIMIENTO: Record<Cumplimiento, { texto: string; clase: string }> = {
  CUMPLIO: { texto: 'Cumplió', clase: 'bg-exito-claro text-exito-oscuro' },
  SUPERO: { texto: 'Superó la carga', clase: 'bg-goma text-white' },
  PARCIAL: { texto: 'Parcial', clase: 'bg-aviso-claro text-aviso-oscuro' },
  SIN_REGISTRO: { texto: 'No lo hizo', clase: 'bg-peligro-claro text-peligro-oscuro' },
};

/** El entrenador compara lo prescrito con lo que el alumno realmente hizo. */
export function SesionRevisionPage() {
  const { sesionId } = useParams();
  const sesion = useSesion(sesionId);
  const plan = usePlan(sesion?.planId);
  const alumno = useAlumno(sesion?.alumnoId);
  const { porId } = useCatalogo();

  if (!sesion || !plan || !alumno) return <Vacio titulo="Esa sesión no existe" />;
  const dia = plan.dias[sesion.dia - 1];

  return (
    <div className="mx-auto max-w-4xl">
      <Link to={`/entrenador/alumnos/${alumno.id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-tinta-suave hover:text-tinta">
        <ArrowLeft size={16} aria-hidden /> {alumno.nombre}
      </Link>
      <h1 className="mt-4 text-3xl">
        Día {sesion.dia}
        {dia.titulo && <span className="text-tinta-suave">: {dia.titulo}</span>}
      </h1>
      <p className="mt-1 text-tinta-suave first-letter:uppercase">
        {fechaCompleta(sesion.iniciadaEn)}
        {sesion.cerradaEn ? `, ${numero(tonelajeSesion(sesion))} kg movidos` : ', en curso'}
      </p>

      {(sesion.esfuerzo || sesion.comentario) && (
        <figure className="mt-6 flex gap-5 rounded-2xl bg-goma p-5 text-white">
          {sesion.esfuerzo && (
            <div className="shrink-0 text-center">
              <span className="cifra block display text-4xl">{sesion.esfuerzo}</span>
              <span className="text-xs text-tiza/70">esfuerzo de 10</span>
            </div>
          )}
          <blockquote className="self-center text-lg">
            {sesion.comentario ? `“${sesion.comentario}”` : <span className="text-tiza/60">Sin comentarios.</span>}
          </blockquote>
        </figure>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-tiza-300 px-4 py-3">
        <p className="text-sm text-tinta-suave">Con lo realizado y el feedback, podés ajustar cargas o sustituir ejercicios del plan.</p>
        <Link to={`/entrenador/planes/${plan.id}`} className="inline-flex items-center gap-2 rounded-xl bg-goma px-4 py-2 text-sm font-semibold text-white hover:bg-goma-700">
          <SlidersHorizontal size={16} aria-hidden /> Ajustar el plan
        </Link>
      </div>

      <div className="mt-8 overflow-x-auto rounded-2xl bg-white shadow-hoja">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <caption className="sr-only">Prescrito contra realizado</caption>
          <thead className="border-b border-tiza-200 text-tinta-suave">
            <tr>
              <th scope="col" className="py-3 pl-6 pr-3 font-semibold">Ejercicio</th>
              <th scope="col" className="px-3 py-3 font-semibold">Prescrito</th>
              <th scope="col" className="px-3 py-3 font-semibold">Realizado</th>
              <th scope="col" className="px-3 py-3 font-semibold">
                <span className="sr-only">Resultado</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {dia.items.map((it) => {
              const ej = porId.get(it.ejercicioId);
              if (!ej) return null;
              const series = sesion.ejercicios.find((e) => e.itemId === it.id)?.series ?? [];
              const c = cumplimientoItem(it, series);
              return (
                <tr key={it.id} className="border-b border-tiza-200/70 align-top last:border-0">
                  <th scope="row" className="relative py-3 pl-6 pr-3 font-semibold">
                    <span className={clsx('absolute inset-y-3 left-2.5 w-1.5 rounded-full', BARRA_TIPO[ej.tipo])} aria-hidden />
                    {ej.nombre}
                  </th>
                  <td className="cifra px-3 py-3 text-tinta-suave">
                    {prescripcion(it)}
                    {ej.medicion === 'REPETICIONES' && it.cargaKg !== undefined && <>, {kg(it.cargaKg)}</>}
                  </td>
                  <td className="cifra px-3 py-3">
                    {series.length === 0 ? (
                      <span className="text-tinta-suave">Sin registrar</span>
                    ) : (
                      <ol className="space-y-0.5">
                        {series.map((s) => (
                          <li key={s.numero}>
                            <span className="mr-2 text-tinta-suave">{s.numero}.</span>
                            {serieTexto(s, ej.medicion)}
                          </li>
                        ))}
                      </ol>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className={clsx('whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold', CUMPLIMIENTO[c].clase)}>
                      {CUMPLIMIENTO[c].texto}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
