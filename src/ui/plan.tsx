import clsx from 'clsx';
import type { ReactNode } from 'react';
import type { DiaPlan, Ejercicio, ItemPlan } from '@/domain/tipos';
import { NOMBRE_GRUPO } from '@/domain/clasificacion';
import { descanso, kg, prescripcion } from '@/lib/formato';
import { FilaTipo } from './tipo';

/** Fila de un ejercicio prescrito: nombre, series×reps, carga y descanso. */
export function ItemPrescrito({
  item,
  ejercicio,
  extra,
  compacto,
}: {
  item: ItemPlan;
  ejercicio: Ejercicio | undefined;
  extra?: ReactNode;
  compacto?: boolean;
}) {
  if (!ejercicio) return null;
  return (
    <FilaTipo tipo={ejercicio.tipo} as="li" className="items-start">
      <div className="min-w-0 flex-1">
        <p className="font-semibold leading-snug">{ejercicio.nombre}</p>
        <p className="mt-0.5 text-sm text-tinta-suave">
          <span className="cifra font-semibold text-tinta">{prescripcion(item)}</span>
          {ejercicio.medicion === 'REPETICIONES' && (
            <>
              {', '}
              <span className="cifra">{kg(item.cargaKg)}</span>
            </>
          )}
          {!compacto && item.descansoSeg > 0 && <>, {descanso(item.descansoSeg)}</>}
        </p>
        {!compacto && item.notas && <p className="mt-1 text-sm italic text-tinta-suave">{item.notas}</p>}
        {!compacto && <p className="mt-1 text-xs text-tinta-suave/80">{NOMBRE_GRUPO[ejercicio.grupo]}</p>}
      </div>
      {extra}
    </FilaTipo>
  );
}

/** Los 3 días del plan en columnas (escritorio) o apilados (celular). */
export function PlanTresDias({
  dias,
  porId,
  compacto,
  destacarDia,
  accionDia,
}: {
  dias: DiaPlan[];
  porId: Map<string, Ejercicio>;
  compacto?: boolean;
  destacarDia?: number;
  accionDia?: (dia: DiaPlan) => ReactNode;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {dias.map((dia) => (
        <section
          key={dia.numero}
          aria-label={`Día ${dia.numero}`}
          className={clsx(
            'rounded-2xl p-3',
            destacarDia === dia.numero ? 'bg-goma text-white' : 'bg-tiza-200/60',
          )}
        >
          <header className="flex items-center gap-3 px-1 pb-3 pt-1">
            <span
              className={clsx(
                'grid h-9 w-9 shrink-0 place-items-center rounded-full display text-lg',
                destacarDia === dia.numero ? 'bg-chispa text-goma' : 'bg-goma text-white',
              )}
            >
              {dia.numero}
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg leading-tight">Día {dia.numero}</h3>
              {dia.titulo && (
                <p className={clsx('truncate text-sm', destacarDia === dia.numero ? 'text-tiza/80' : 'text-tinta-suave')}>
                  {dia.titulo}
                </p>
              )}
            </div>
            {accionDia?.(dia)}
          </header>
          <ol className="space-y-2 text-tinta">
            {dia.items.map((it) => (
              <ItemPrescrito key={it.id} item={it} ejercicio={porId.get(it.ejercicioId)} compacto={compacto} />
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
