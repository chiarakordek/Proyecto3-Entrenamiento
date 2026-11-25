import clsx from 'clsx';
import { GRUPOS_POR_TIPO, NOMBRE_GRUPO, NOMBRE_TIPO, TIPOS } from '@/domain/clasificacion';
import type { TipoEjercicio } from '@/domain/tipos';
import { MapaMuscular } from './MapaMuscular';
import { HEX_TIPO } from './colores';

/**
 * Las 4 categorías como en la diapositiva 3 de la presentación: tarjetas de color
 * con sus grupos musculares, alrededor de un mapa del cuerpo pintado por categoría.
 * Tocar una tarjeta resalta su zona en el mapa (y opcionalmente filtra).
 */
export function Categorias({
  seleccion,
  onElegir,
  conteo,
}: {
  seleccion: TipoEjercicio | null;
  onElegir?: (t: TipoEjercicio | null) => void;
  conteo?: Partial<Record<TipoEjercicio, number>>;
}) {
  return (
    <div className="grid items-center gap-4 sm:grid-cols-[1fr_11rem_1fr]">
      {[TIPOS.slice(0, 2), null, TIPOS.slice(2)].map((grupo, col) =>
        grupo === null ? (
          <div key="mapa" className="order-first mx-auto w-40 sm:order-none">
            <MapaMuscular resaltar={seleccion} />
          </div>
        ) : (
          <div key={col} className="grid gap-3">
            {grupo.map((t) => {
              const activo = seleccion === t;
              const atenuado = seleccion && !activo;
              const oscuroTexto = t === 'ZONA_MEDIA';
              return (
                <button
                  key={t}
                  type="button"
                  aria-pressed={activo}
                  onClick={() => onElegir?.(activo ? null : t)}
                  className={clsx(
                    'rounded-2xl px-4 py-3 text-left transition-[transform,opacity,box-shadow] duration-200 hover:-translate-y-0.5',
                    activo && 'shadow-hoja ring-4 ring-white',
                    atenuado && 'opacity-45',
                  )}
                  style={{ background: HEX_TIPO[t].base, color: oscuroTexto ? '#12302A' : '#fff' }}
                >
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="display text-lg">{NOMBRE_TIPO[t]}</span>
                    {conteo?.[t] !== undefined && <span className="cifra text-sm opacity-80">{conteo[t]}</span>}
                  </span>
                  <span className="mt-1 block text-sm opacity-90">{GRUPOS_POR_TIPO[t].map((g) => NOMBRE_GRUPO[g]).join(', ')}</span>
                </button>
              );
            })}
          </div>
        ),
      )}
    </div>
  );
}
