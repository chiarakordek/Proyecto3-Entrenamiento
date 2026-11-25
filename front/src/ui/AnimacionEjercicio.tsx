import clsx from 'clsx';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, Turtle } from 'lucide-react';
import { animacionDe, SEGMENTOS_POR_GRUPO, type Equipo, type P, type Pose, type Segmento } from '@/domain/animaciones';
import type { Ejercicio } from '@/domain/tipos';
import { HEX, HEX_TIPO } from './colores';

const SUELO = 108;
const NEUTRO = '#7E9C90';
const NEUTRO_LEJOS = '#B7CCC2';
const EQUIPO = '#3C5A50';

const suave = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const mezclar = (a: P, b: P, t: number): P => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

function interpolar(a: Pose, b: Pose, t: number): Pose {
  const m = (k: keyof Pose, def?: P) => {
    const pa = (a[k] as P | undefined) ?? def;
    const pb = (b[k] as P | undefined) ?? def;
    return pa && pb ? mezclar(pa, pb, t) : undefined;
  };
  return {
    hombro: mezclar(a.hombro, b.hombro, t),
    cadera: mezclar(a.cadera, b.cadera, t),
    codo: mezclar(a.codo, b.codo, t),
    mano: mezclar(a.mano, b.mano, t),
    rodilla: mezclar(a.rodilla, b.rodilla, t),
    tobillo: mezclar(a.tobillo, b.tobillo, t),
    punta: m('punta', [a.tobillo[0] + 8, a.tobillo[1] + 1]),
    codo2: m('codo2'),
    mano2: m('mano2'),
    rodilla2: m('rodilla2'),
    tobillo2: m('tobillo2'),
    punta2: m('punta2'),
    cuerda: a.cuerda !== undefined && b.cuerda !== undefined ? a.cuerda + (b.cuerda - a.cuerda) * t : undefined,
  };
}

function cabeza(p: Pose): P {
  const dx = p.hombro[0] - p.cadera[0];
  const dy = p.hombro[1] - p.cadera[1];
  const l = Math.hypot(dx, dy) || 1;
  return [p.hombro[0] + (dx / l) * 12, p.hombro[1] + (dy / l) * 12];
}

function Hueso({ a, b, color, ancho, brillo }: { a: P; b: P; color: string; ancho: number; brillo?: boolean }) {
  return (
    <>
      {brillo && <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={color} strokeOpacity={0.25} strokeWidth={ancho + 7} strokeLinecap="round" />}
      <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={color} strokeWidth={ancho} strokeLinecap="round" />
    </>
  );
}

function DibujoEquipo({ e, pose }: { e: Equipo; pose: Pose }) {
  switch (e.t) {
    case 'rect':
      return <rect x={e.x} y={e.y} width={e.w} height={e.h} rx={2.5} fill={EQUIPO} />;
    case 'linea':
      return <line x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke={EQUIPO} strokeWidth={e.grosor ?? 3} strokeLinecap="round" />;
    case 'circulo':
      return <circle cx={e.cx} cy={e.cy} r={e.r} fill="none" stroke={EQUIPO} strokeWidth={4} />;
    case 'cable':
      return <line x1={e.x} y1={e.y} x2={pose.mano[0]} y2={pose.mano[1]} stroke={EQUIPO} strokeWidth={1.5} strokeDasharray="3 2" />;
    case 'barra-corta':
      return <line x1={pose.mano[0] - 16} y1={pose.mano[1]} x2={pose.mano[0] + 16} y2={pose.mano[1]} stroke={EQUIPO} strokeWidth={3} strokeLinecap="round" />;
    case 'rueda':
      return <circle cx={pose.mano[0]} cy={pose.mano[1] + 5} r={6} fill="#fff" stroke={EQUIPO} strokeWidth={3} />;
    case 'cuerda': {
      const [x, y] = pose.mano;
      const c = pose.cuerda ?? SUELO;
      return <path d={`M ${x} ${y} C ${x - 58} ${c} ${x + 44} ${c} ${x - 8} ${y}`} fill="none" stroke={EQUIPO} strokeWidth={1.6} />;
    }
  }
}

/**
 * Figura animada que muestra cómo se hace el ejercicio.
 * Las partes que trabajan se pintan del color de la categoría (con un halo).
 */
export function AnimacionEjercicio({
  ejercicio,
  className,
  compacta,
  autoplay = true,
  controlada,
}: {
  ejercicio: Pick<Ejercicio, 'id' | 'grupo' | 'tipo' | 'equipo' | 'nombre'>;
  className?: string;
  /** Sin la lista de fases ni los botones (miniaturas). */
  compacta?: boolean;
  autoplay?: boolean;
  /** Si se pasa, decide desde afuera si se reproduce (por ejemplo, al pasar el mouse). */
  controlada?: boolean;
}) {
  const { patron, carga, velocidad } = useMemo(() => animacionDe(ejercicio), [ejercicio]);
  const reducido = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const [reproduciendoPropio, setReproduciendo] = useState(autoplay && !reducido);
  const reproduciendo = controlada ?? reproduciendoPropio;
  const [lento, setLento] = useState(false);
  const [estado, setEstado] = useState({ fase: 0, t: 0 });
  const acumulado = useRef(0);

  const total = patron.tiempos.reduce((a, b) => a + b, 0);

  useEffect(() => {
    if (!reproduciendo) return;
    let previo = performance.now();
    let id = 0;
    const paso = (ahora: number) => {
      const factor = velocidad * (lento ? 0.45 : 1);
      acumulado.current = (acumulado.current + ((ahora - previo) / 1000) * factor) % total;
      previo = ahora;
      let resto = acumulado.current;
      let fase = 0;
      while (fase < patron.tiempos.length - 1 && resto >= patron.tiempos[fase]) {
        resto -= patron.tiempos[fase];
        fase++;
      }
      setEstado({ fase, t: Math.min(1, resto / patron.tiempos[fase]) });
      id = requestAnimationFrame(paso);
    };
    id = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(id);
  }, [reproduciendo, lento, patron, total, velocidad]);

  const a = patron.poses[estado.fase];
  const b = patron.poses[(estado.fase + 1) % patron.poses.length];
  const pose = interpolar(a, b, suave(estado.t));
  const color = HEX_TIPO[ejercicio.tipo].base;
  const trabaja = new Set<Segmento>(SEGMENTOS_POR_GRUPO[ejercicio.grupo]);
  const col = (s: Segmento) => (trabaja.has(s) ? color : NEUTRO);
  const colLejos = (s: Segmento) => (trabaja.has(s) ? color : NEUTRO_LEJOS);
  const c = cabeza(pose);
  const punta = pose.punta ?? [pose.tobillo[0] + 8, pose.tobillo[1] + 1];

  const lejos = {
    codo: pose.codo2 ?? pose.codo,
    mano: pose.mano2 ?? pose.mano,
    rodilla: pose.rodilla2 ?? pose.rodilla,
    tobillo: pose.tobillo2 ?? pose.tobillo,
    punta: pose.punta2 ?? punta,
  };
  const desplazado = (p: P): P => (pose.codo2 || pose.rodilla2 ? p : [p[0] - 2.5, p[1] - 1.5]);

  return (
    <figure className={clsx('flex flex-col', className)}>
      <div className="relative overflow-hidden rounded-2xl" style={{ background: HEX_TIPO[ejercicio.tipo].claro }}>
        <svg viewBox="0 -14 160 128" className="h-auto w-full" role="img" aria-label={`Animación: cómo se hace ${ejercicio.nombre}`}>
          {!patron.sinSuelo && <line x1="6" y1={SUELO + 2} x2="154" y2={SUELO + 2} stroke={HEX.tiza300} strokeWidth="3" strokeLinecap="round" />}
          {patron.equipo?.map((e, i) => <DibujoEquipo key={i} e={e} pose={pose} />)}

          {/* Lado lejano, más claro */}
          <g opacity={pose.codo2 || pose.rodilla2 ? 0.55 : 0.5}>
            <Hueso a={desplazado(pose.hombro)} b={desplazado(lejos.codo)} color={colLejos('brazo')} ancho={6} />
            <Hueso a={desplazado(lejos.codo)} b={desplazado(lejos.mano)} color={colLejos('antebrazo')} ancho={5.5} />
            <Hueso a={desplazado(pose.cadera)} b={desplazado(lejos.rodilla)} color={colLejos('muslo')} ancho={7} />
            <Hueso a={desplazado(lejos.rodilla)} b={desplazado(lejos.tobillo)} color={colLejos('pierna')} ancho={6} />
            <Hueso a={desplazado(lejos.tobillo)} b={desplazado(lejos.punta)} color={NEUTRO_LEJOS} ancho={4} />
          </g>

          {/* Torso y cabeza */}
          <Hueso a={pose.cadera} b={pose.hombro} color={col('torso')} ancho={10} brillo={trabaja.has('torso')} />
          <circle cx={c[0]} cy={c[1]} r={7.5} fill="#5E7D72" stroke="#fff" strokeWidth={1.5} />

          {/* Lado cercano */}
          <Hueso a={pose.cadera} b={pose.rodilla} color={col('muslo')} ancho={8} brillo={trabaja.has('muslo')} />
          <Hueso a={pose.rodilla} b={pose.tobillo} color={col('pierna')} ancho={7} brillo={trabaja.has('pierna')} />
          <Hueso a={pose.tobillo} b={punta} color={NEUTRO} ancho={4.5} />
          <Hueso a={pose.hombro} b={pose.codo} color={col('brazo')} ancho={7} brillo={trabaja.has('brazo')} />
          <Hueso a={pose.codo} b={pose.mano} color={col('antebrazo')} ancho={6} brillo={trabaja.has('antebrazo')} />

          {/* Carga en las manos */}
          {carga === 'disco' && (
            <g>
              <circle cx={pose.mano[0]} cy={pose.mano[1]} r={11} fill={HEX.goma} />
              <circle cx={pose.mano[0]} cy={pose.mano[1]} r={4} fill="#fff" opacity={0.85} />
            </g>
          )}
          {carga === 'mancuerna' && (
            <g>
              <rect x={pose.mano[0] - 6} y={pose.mano[1] - 2} width={12} height={4} rx={1.5} fill={EQUIPO} />
              <rect x={pose.mano[0] - 7} y={pose.mano[1] - 5} width={4} height={10} rx={1.5} fill={HEX.goma} />
              <rect x={pose.mano[0] + 3} y={pose.mano[1] - 5} width={4} height={10} rx={1.5} fill={HEX.goma} />
            </g>
          )}
          {/* Articulaciones */}
          {[pose.hombro, pose.codo, pose.cadera, pose.rodilla].map((p, i) => (
            <circle key={i} cx={p[0]} cy={p[1]} r={2.2} fill="#fff" opacity={0.9} />
          ))}
        </svg>

        {!compacta && (
        <div className="absolute right-2 top-2 flex gap-1">
          <button
            onClick={() => setLento(!lento)}
            aria-pressed={lento}
            className={clsx('grid h-8 w-8 place-items-center rounded-lg', lento ? 'bg-goma text-white' : 'bg-white/80 text-tinta hover:bg-white')}
            aria-label={lento ? 'Velocidad normal' : 'Cámara lenta'}
            title={lento ? 'Velocidad normal' : 'Cámara lenta'}
          >
            <Turtle size={16} />
          </button>
          <button
            onClick={() => setReproduciendo(!reproduciendo)}
            className="grid h-8 w-8 place-items-center rounded-lg bg-white/80 text-tinta hover:bg-white"
            aria-label={reproduciendo ? 'Pausar animación' : 'Reproducir animación'}
            title={reproduciendo ? 'Pausar' : 'Reproducir'}
          >
            {reproduciendo ? <Pause size={16} /> : <Play size={16} />}
          </button>
        </div>
        )}
      </div>

      {!compacta && (
        <figcaption className="mt-3">
          <ol className="space-y-1.5">
            {patron.fases.map((texto, i) => (
              <li
                key={i}
                className={clsx(
                  'flex items-start gap-2.5 rounded-xl px-2.5 py-1.5 text-sm transition-colors duration-200',
                  estado.fase === i ? 'bg-white font-semibold text-tinta shadow-hoja' : 'text-tinta-suave',
                )}
              >
                <span
                  className="marcador mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[0.7rem] text-white"
                  style={{ background: estado.fase === i ? color : HEX.tiza300 }}
                >
                  {i + 1}
                </span>
                {texto}
                {patron.fases.length === 2 && (
                  <span className="ml-auto shrink-0 font-normal text-tinta-suave">{numeroSeg(patron.tiempos[i] / velocidad)}</span>
                )}
              </li>
            ))}
          </ol>
        </figcaption>
      )}
    </figure>
  );
}

function numeroSeg(s: number) {
  return `${s.toLocaleString('es-AR', { maximumFractionDigits: 1 })} s`;
}
