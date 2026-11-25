import { Lightbulb, Video } from 'lucide-react';
import { NOMBRE_GRUPO, NOMBRE_TIPO } from '@/domain/clasificacion';
import { pasosDe } from '@/domain/animaciones';
import type { Ejercicio, TipoEjercicio } from '@/domain/tipos';
import { AnimacionEjercicio } from './AnimacionEjercicio';
import { MapaMuscular } from './MapaMuscular';
import { EtiquetaTipo } from './tipo';
import { HEX_TIPO } from './colores';

/** Un consejo general por categoría, para quien recién empieza. */
export const CONSEJO_TIPO: Record<TipoEjercicio, string> = {
  TREN_SUPERIOR: 'Exhalá cuando empujás o tirás, e inhalá al volver. Hombros lejos de las orejas.',
  TREN_INFERIOR: 'Rodillas siempre en la dirección de las puntas de los pies y todo el pie apoyado.',
  ZONA_MEDIA: 'No contengas la respiración: respirá corto y mantené el abdomen firme.',
  CARDIO: 'Un ritmo en el que puedas hablar con frases cortas es el ideal para empezar.',
};

/** Ficha completa: animación, zona que trabaja, pasos y consejo. */
export function DetalleEjercicio({ ejercicio, notaEntrenador }: { ejercicio: Ejercicio; notaEntrenador?: string }) {
  const pasos = pasosDe(ejercicio.descripcion);
  const color = HEX_TIPO[ejercicio.tipo];
  return (
    <div className="grid gap-5 md:grid-cols-[1.1fr_1fr]">
      <AnimacionEjercicio ejercicio={ejercicio} />
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <EtiquetaTipo tipo={ejercicio.tipo} />
          <span className="text-sm text-tinta-suave">
            {NOMBRE_GRUPO[ejercicio.grupo]}
            {ejercicio.equipo && `, con ${ejercicio.equipo.toLowerCase()}`}
          </span>
        </div>
        <div className="grid grid-cols-[7rem_1fr] items-center gap-3 rounded-2xl bg-white p-3">
          <MapaMuscular grupo={ejercicio.grupo} tipo={ejercicio.tipo} />
          <p className="text-sm">
            Trabaja <span className="font-bold" style={{ color: color.oscuro }}>{NOMBRE_GRUPO[ejercicio.grupo].toLowerCase()}</span>. Es un ejercicio de{' '}
            {NOMBRE_TIPO[ejercicio.tipo].toLowerCase()}
            {ejercicio.medicion === 'TIEMPO' ? ' y se mide por tiempo.' : ' y se mide en repeticiones.'}
          </p>
        </div>
        <section aria-label="Paso a paso">
          <h3 className="text-base">Paso a paso</h3>
          <ol className="mt-2 space-y-2">
            {pasos.map((p, i) => (
              <li key={i} className="flex gap-3 text-sm leading-snug">
                <span className="marcador grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs" style={{ background: color.base, color: ejercicio.tipo === 'ZONA_MEDIA' ? '#12302A' : '#fff' }}>
                  {i + 1}
                </span>
                <span className="pt-0.5">{p}</span>
              </li>
            ))}
          </ol>
        </section>
        <p className="flex gap-2.5 rounded-xl px-3 py-2.5 text-sm" style={{ background: color.claro }}>
          <Lightbulb size={18} className="mt-0.5 shrink-0" style={{ color: color.oscuro }} aria-hidden />
          <span>{CONSEJO_TIPO[ejercicio.tipo]}</span>
        </p>
        {ejercicio.videoUrl && (
          <a
            href={ejercicio.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl border-2 border-tiza-300 px-3 py-2.5 text-sm font-semibold text-goma hover:border-goma/40"
          >
            <Video size={18} aria-hidden /> Ver video explicativo
            <span className="sr-only">(se abre en otra pestaña)</span>
          </a>
        )}
        {notaEntrenador && (
          <p className="rounded-xl bg-chispa-claro px-3 py-2.5 text-sm">
            <span className="font-semibold">Tu entrenador: </span>
            {notaEntrenador}
          </p>
        )}
      </div>
    </div>
  );
}
