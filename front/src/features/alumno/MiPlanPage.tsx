import clsx from 'clsx';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useCatalogo, usePlanActivo } from '@/data/consultas';
import type { NumeroDia } from '@/domain/tipos';
import { useAlumnoActual } from '@/lib/sesion-usuario';
import { descanso, fecha, kg, prescripcion } from '@/lib/formato';
import { Vacio } from '@/ui/base';
import { BARRA_TIPO, LeyendaTipos } from '@/ui/tipo';
import { DetalleEjercicio } from '@/ui/DetalleEjercicio';
import { Termino } from '@/ui/didactico';

/** El plan activo con la guía técnica de cada ejercicio. */
export function MiPlanPage() {
  const alumno = useAlumnoActual();
  const plan = usePlanActivo(alumno.id);
  const { porId } = useCatalogo();
  const [dia, setDia] = useState<NumeroDia>(1);
  const [abiertos, setAbiertos] = useState<Set<string>>(new Set());

  if (!plan) return <div className="pt-6"><Vacio titulo="Todavía no tenés plan asignado" /></div>;
  const actual = plan.dias[dia - 1];

  return (
    <div className="pt-4">
      <h1 className="text-3xl leading-tight">{plan.nombre}</h1>
      <p className="mt-1 text-tinta-suave">
        Del {fecha(plan.vigenciaDesde)} al {fecha(plan.vigenciaHasta)}
      </p>

      <div role="tablist" aria-label="Días del plan" className="mt-6 grid grid-cols-3 gap-1 rounded-2xl bg-tiza-200/70 p-1">
        {plan.dias.map((d) => (
          <button
            key={d.numero}
            role="tab"
            id={`tab-dia-${d.numero}`}
            aria-selected={dia === d.numero}
            aria-controls="panel-dia"
            onClick={() => setDia(d.numero)}
            className={clsx('rounded-xl py-2.5 text-sm font-semibold', dia === d.numero ? 'bg-white shadow-hoja' : 'text-tinta-suave')}
          >
            Día {d.numero}
          </button>
        ))}
      </div>

      <section id="panel-dia" role="tabpanel" aria-labelledby={`tab-dia-${dia}`} className="mt-5">
        {actual.titulo && <h2 className="mb-1 text-xl">{actual.titulo}</h2>}
        <p className="mb-3 text-sm text-tinta-suave">
          Tocá un ejercicio para ver qué músculo trabaja y cómo se hace. "4 × 10" son 4{' '}
          <Termino clave="serie">series</Termino> de 10 <Termino clave="repeticion">repeticiones</Termino>.
        </p>
        <LeyendaTipos className="mb-3" />
        <ol className="space-y-2.5">
          {actual.items.map((it, i) => {
            const ej = porId.get(it.ejercicioId);
            if (!ej) return null;
            return (
              <li key={it.id}>
                <details
                  onToggle={(e) => {
                    const abierto = (e.currentTarget as HTMLDetailsElement).open;
                    setAbiertos((prev) => {
                      const s = new Set(prev);
                      if (abierto) s.add(it.id);
                      else s.delete(it.id);
                      return s;
                    });
                  }}
                  className="group relative rounded-2xl bg-white py-4 pl-6 pr-4 [&_summary::-webkit-details-marker]:hidden"
                >
                  <span className={clsx('absolute inset-y-3.5 left-2.5 w-1.5 rounded-full', BARRA_TIPO[ej.tipo])} aria-hidden />
                  <summary className="flex cursor-pointer list-none items-start gap-3">
                    <span className="cifra mt-0.5 w-5 shrink-0 display text-lg text-tinta-suave">{i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{ej.nombre}</span>
                      <span className="cifra block text-sm text-tinta-suave">
                        <span className="font-semibold text-tinta">{prescripcion(it)}</span>
                        {ej.medicion === 'REPETICIONES' && `, ${kg(it.cargaKg)}`}
                      </span>
                    </span>
                    <ChevronDown size={20} className="mt-1 shrink-0 text-tinta-suave transition-transform group-open:rotate-180" aria-hidden />
                  </summary>
                  {abiertos.has(it.id) && (
                    <div className="mt-3 space-y-3 border-t border-tiza-200 pt-3 text-sm">
                      <p className="text-tinta-suave">
                        {it.descansoSeg > 0 ? (
                          <>
                            <Termino clave="descanso">Descanso</Termino>: {descanso(it.descansoSeg).replace(' de descanso', '')} entre series
                          </>
                        ) : (
                          'Sin pausas entre series'
                        )}
                      </p>
                      <DetalleEjercicio ejercicio={ej} notaEntrenador={it.notas} />
                    </div>
                  )}
                </details>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
