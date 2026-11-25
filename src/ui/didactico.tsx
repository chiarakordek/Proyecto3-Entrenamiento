import clsx from 'clsx';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { CircleHelp, X } from 'lucide-react';
import { ESCALA_ESFUERZO, GLOSARIO, type ClaveGlosario } from '@/domain/glosario';
import { sonidos } from '@/lib/sonido';
import { borrarClave, guardarClave, leerClave } from '@/lib/guardado';

/**
 * Término con explicación: se toca y aparece una definición corta.
 * Sirve para que alguien sin experiencia entienda "serie", "RPE", "tonelaje", etc.
 */
export function Termino({ clave, children, oscuro }: { clave: ClaveGlosario; children?: ReactNode; oscuro?: boolean }) {
  const [abierto, setAbierto] = useState(false);
  const id = useId();
  const ref = useRef<HTMLSpanElement>(null);
  const entrada = GLOSARIO[clave];

  useEffect(() => {
    if (!abierto) return;
    const cerrar = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener('mousedown', cerrar);
    document.addEventListener('keydown', cerrar);
    return () => {
      document.removeEventListener('mousedown', cerrar);
      document.removeEventListener('keydown', cerrar);
    };
  }, [abierto]);

  return (
    <span ref={ref} className="relative inline-flex">
      <button
        type="button"
        aria-expanded={abierto}
        aria-controls={id}
        aria-label={children === '' ? `Qué es: ${entrada.termino}` : undefined}
        onClick={() => setAbierto(!abierto)}
        className={clsx(
          'inline-flex items-center gap-1 rounded underline decoration-dotted decoration-2 underline-offset-4',
          oscuro ? 'decoration-white/40 hover:decoration-white' : 'decoration-tinta-suave/50 hover:decoration-tinta',
        )}
      >
        {children ?? entrada.termino}
        <CircleHelp size={14} className="opacity-60" aria-hidden />
      </button>
      {abierto && (
        <span
          id={id}
          role="note"
          className="aparecer absolute left-0 top-full z-30 mt-2 w-72 max-w-[80vw] rounded-xl bg-goma p-3.5 text-left text-sm font-normal normal-case leading-relaxed text-white shadow-hoja"
          style={{ fontStretch: '100%', letterSpacing: 0 }}
        >
          <span className="mb-1 block font-bold text-chispa">{entrada.termino}</span>
          {entrada.explicacion}
        </span>
      )}
    </span>
  );
}

/** Tarjeta "Cómo funciona": pasos numerados (es una secuencia real) que se pueden ocultar. */
export function ComoFunciona({ clave, titulo, pasos }: { clave: string; titulo: string; pasos: ReactNode[] }) {
  const k = `p3-ayuda-${clave}`;
  const [visible, setVisible] = useState(() => leerClave(k) !== 'oculta');
  if (!visible) {
    return (
      <button
        onClick={() => {
          borrarClave(k);
          setVisible(true);
        }}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-tinta-suave hover:text-tinta"
      >
        <CircleHelp size={16} aria-hidden /> Ver cómo funciona
      </button>
    );
  }
  return (
    <section aria-label={titulo} className="relative rounded-2xl border-2 border-dashed border-tiza-300 bg-white/70 p-4">
      <button
        onClick={() => {
          guardarClave(k, 'oculta');
          setVisible(false);
        }}
        className="absolute right-2 top-2 rounded-lg p-1.5 text-tinta-suave hover:bg-tiza-200"
        aria-label="Ocultar ayuda"
      >
        <X size={16} />
      </button>
      <h2 className="pr-8 text-lg">{titulo}</h2>
      <ol className="mt-3 grid gap-3 sm:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))]">
        {pasos.map((p, i) => (
          <li key={i} className="flex gap-3 text-sm leading-snug">
            <span className="marcador grid h-7 w-7 shrink-0 place-items-center rounded-full bg-goma text-sm text-white">{i + 1}</span>
            <span className="pt-1">{p}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function colorEsfuerzo(n: number) {
  return n <= 4 ? 'exito' : n <= 7 ? 'aviso' : 'peligro';
}

const CLASE_ESFUERZO = {
  exito: 'border-exito bg-exito text-white',
  aviso: 'border-aviso bg-aviso text-goma',
  peligro: 'border-peligro bg-peligro text-white',
} as const;

/** Selector de esfuerzo 1-10 que explica qué significa cada número. */
export function EscalaEsfuerzo({ valor, onCambiar }: { valor: number | undefined; onCambiar: (n: number) => void }) {
  const detalle = valor ? ESCALA_ESFUERZO[valor] : undefined;
  return (
    <div>
      <div className="relative mt-3">
        {/* Degradé de referencia: de fácil (verde) a máximo (rojo). */}
        <div className="mb-2 h-1.5 rounded-full bg-gradient-to-r from-exito via-aviso to-peligro" aria-hidden />
        <div className="grid grid-cols-10 gap-1">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              aria-pressed={valor === n}
              aria-label={`${n}: ${ESCALA_ESFUERZO[n].titulo}`}
              onClick={() => {
                sonidos.toque();
                onCambiar(n);
              }}
              className={clsx(
                'marcador grid h-11 place-items-center rounded-lg border-2 text-base transition-colors',
                valor === n ? CLASE_ESFUERZO[colorEsfuerzo(n)] : 'border-tiza-300 bg-white text-tinta hover:border-goma/40',
              )}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="mt-1 flex justify-between text-xs text-tinta-suave">
          <span>Muy fácil</span>
          <span>Máximo</span>
        </div>
      </div>
      <p aria-live="polite" className="mt-3 min-h-12 rounded-xl bg-white px-4 py-2.5 text-sm">
        {detalle ? (
          <>
            <span className="font-bold">{detalle.titulo}.</span> {detalle.detalle}
          </>
        ) : (
          <span className="text-tinta-suave">Tocá un número para ver qué significa.</span>
        )}
      </p>
    </div>
  );
}
