import clsx from 'clsx';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { TipoEjercicio } from '@/domain/tipos';
import { NOMBRE_TIPO, TIPOS } from '@/domain/clasificacion';
import { numero } from '@/lib/formato';
import { HEX_TIPO } from './colores';

/**
 * Piezas de maquetación compartidas por las pantallas del alumno,
 * para que todas tengan la misma jerarquía y ritmo.
 */

/**
 * Cabecera de pantalla sobre verde pino, con las formas de la portada de la
 * presentación (el bloque redondeado verde y el círculo amarillo).
 */
export function Cabecera({ titulo, bajada, children, arriba }: { titulo: ReactNode; bajada?: ReactNode; children?: ReactNode; arriba?: ReactNode }) {
  return (
    <header className="relative -mx-5 overflow-hidden bg-goma px-5 pb-7 pt-6 text-white">
      <span className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-[3.5rem] bg-superior/70" aria-hidden />
      <span className="pointer-events-none absolute -right-2 top-24 h-14 w-14 rounded-full bg-chispa" aria-hidden />
      <span className="pointer-events-none absolute -bottom-24 right-16 h-40 w-40 rounded-full bg-[#34B36A]/40" aria-hidden />
      <div className="relative">
        {arriba}
        <h1 className="text-3xl leading-[1.05]">{titulo}</h1>
        {bajada && <p className="mt-2 max-w-sm text-tiza/80">{bajada}</p>}
        {children && <div className="mt-5">{children}</div>}
      </div>
    </header>
  );
}

/** Sección con título y una línea que explica para qué sirve. */
export function Seccion({ titulo, bajada, accion, children, className, id }: { titulo: ReactNode; bajada?: ReactNode; accion?: ReactNode; children: ReactNode; className?: string; id?: string }) {
  return (
    <section aria-labelledby={id} className={clsx('mt-9', className)}>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 id={id} className="text-xl leading-tight">
            {titulo}
          </h2>
          {bajada && <p className="mt-0.5 text-sm text-tinta-suave">{bajada}</p>}
        </div>
        {accion}
      </div>
      {children}
    </section>
  );
}

/** Cifra destacada para las cabeceras: número grande y una etiqueta corta debajo. */
export function Cifra({ valor, etiqueta, acento }: { valor: ReactNode; etiqueta: string; acento?: boolean }) {
  return (
    <div>
      <dd className={clsx('marcador text-2xl leading-none', acento && 'text-chispa')}>{valor}</dd>
      <dt className="mt-1.5 text-xs text-tiza/70">{etiqueta}</dt>
    </div>
  );
}

/** Número que cuenta hacia arriba al aparecer (o salta directo si se prefiere menos movimiento). */
export function Contador({ valor, duracion = 900, formato = numero }: { valor: number; duracion?: number; formato?: (n: number) => string }) {
  const [mostrado, setMostrado] = useState(0);
  const desde = useRef(0);
  useEffect(() => {
    const reducido = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reducido) {
      setMostrado(valor);
      return;
    }
    const inicio = performance.now();
    const origen = desde.current;
    let id = 0;
    const paso = (ahora: number) => {
      const t = Math.min(1, (ahora - inicio) / duracion);
      const e = 1 - Math.pow(1 - t, 3);
      const v = origen + (valor - origen) * e;
      setMostrado(v);
      if (t < 1) id = requestAnimationFrame(paso);
      else desde.current = valor;
    };
    id = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(id);
  }, [valor, duracion]);
  return <span className="cifra">{formato(Math.round(mostrado))}</span>;
}

/** Barra apilada con la proporción de cada categoría (con leyenda opcional). */
export function BarraCategorias({ cantidades, alto = 'h-2.5', leyenda, oscuro }: { cantidades: Partial<Record<TipoEjercicio, number>>; alto?: string; leyenda?: boolean; oscuro?: boolean }) {
  const total = TIPOS.reduce((t, k) => t + (cantidades[k] ?? 0), 0) || 1;
  return (
    <div>
      <div className={clsx('flex gap-0.5 overflow-hidden rounded-full', alto, oscuro ? 'bg-white/10' : 'bg-tiza-200')} aria-hidden>
        {TIPOS.map((t) =>
          cantidades[t] ? <span key={t} style={{ width: `${((cantidades[t] ?? 0) / total) * 100}%`, background: HEX_TIPO[t].base }} /> : null,
        )}
      </div>
      {leyenda && (
        <ul className={clsx('mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs', oscuro ? 'text-tiza/75' : 'text-tinta-suave')}>
          {TIPOS.filter((t) => cantidades[t]).map((t) => (
            <li key={t} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: HEX_TIPO[t].base }} aria-hidden />
              {NOMBRE_TIPO[t]} <span className="cifra font-semibold">{Math.round(((cantidades[t] ?? 0) / total) * 100)}%</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
