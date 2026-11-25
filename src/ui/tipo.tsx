import clsx from 'clsx';
import type { ReactNode } from 'react';
import { NOMBRE_TIPO } from '@/domain/clasificacion';
import type { TipoEjercicio } from '@/domain/tipos';

/** Color de cada tipo de ejercicio: la barra lateral lo identifica en todo el producto. */
export const BARRA_TIPO: Record<TipoEjercicio, string> = {
  TREN_SUPERIOR: 'bg-superior',
  TREN_INFERIOR: 'bg-inferior',
  ZONA_MEDIA: 'bg-media',
  CARDIO: 'bg-cardio',
};

export const FONDO_TIPO: Record<TipoEjercicio, string> = {
  TREN_SUPERIOR: 'bg-superior-claro text-superior-oscuro',
  TREN_INFERIOR: 'bg-inferior-claro text-inferior-oscuro',
  ZONA_MEDIA: 'bg-media-claro text-media-oscuro',
  CARDIO: 'bg-cardio-claro text-cardio-oscuro',
};

export function EtiquetaTipo({ tipo, className }: { tipo: TipoEjercicio; className?: string }) {
  return (
    <span className={clsx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold', FONDO_TIPO[tipo], className)}>
      <span className={clsx('h-2 w-2 rounded-full', BARRA_TIPO[tipo])} aria-hidden />
      {NOMBRE_TIPO[tipo]}
    </span>
  );
}

/** Fila con la barra de color del tipo a la izquierda, como en el boceto del entrenador. */
export function FilaTipo({
  tipo,
  children,
  className,
  as: Comp = 'div',
}: {
  tipo: TipoEjercicio;
  children: ReactNode;
  className?: string;
  as?: 'div' | 'li';
}) {
  return (
    <Comp className={clsx('relative flex gap-3 rounded-xl bg-white py-3 pl-5 pr-3', className)}>
      <span className={clsx('absolute inset-y-2.5 left-2 w-1.5 rounded-full', BARRA_TIPO[tipo])} aria-hidden />
      {children}
    </Comp>
  );
}

/** Qué significa cada color (los colores de los discos olímpicos). */
export function LeyendaTipos({ className }: { className?: string }) {
  return (
    <ul className={clsx('flex flex-wrap gap-x-4 gap-y-1 text-xs text-tinta-suave', className)} aria-label="Colores por tipo de ejercicio">
      {(Object.keys(BARRA_TIPO) as TipoEjercicio[]).map((t) => (
        <li key={t} className="flex items-center gap-1.5">
          <span className={clsx('h-3 w-1.5 rounded-full', BARRA_TIPO[t])} aria-hidden />
          {NOMBRE_TIPO[t]}
        </li>
      ))}
    </ul>
  );
}

/** Mini mapa del plan: una columna por día con un segmento por ejercicio, coloreado por tipo. */
export function HuellaPlan({ dias, className }: { dias: TipoEjercicio[][]; className?: string }) {
  return (
    <div className={clsx('flex gap-1', className)} aria-hidden>
      {dias.map((tipos, i) => (
        <div key={i} className="flex w-4 flex-col gap-0.5">
          {tipos.length === 0 ? (
            <span className="h-1.5 rounded-sm bg-tiza-300" />
          ) : (
            tipos.map((t, j) => <span key={j} className={clsx('h-1.5 rounded-sm', BARRA_TIPO[t])} />)
          )}
        </div>
      ))}
    </div>
  );
}
