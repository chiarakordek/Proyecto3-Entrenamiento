import clsx from 'clsx';
import type { GrupoMuscular, TipoEjercicio } from '@/domain/tipos';
import { NOMBRE_GRUPO, tipoDeGrupo } from '@/domain/clasificacion';
import { HEX, HEX_TIPO } from './colores';

/**
 * Silueta simplificada de frente y de espalda que marca qué zona trabaja el ejercicio.
 * Cada forma pertenece a un grupo muscular; las que no corresponden quedan en gris.
 */

type Forma =
  | { tipo: 'rect'; x: number; y: number; w: number; h: number; r?: number; g?: Zona }
  | { tipo: 'circ'; cx: number; cy: number; r: number; g?: Zona };

type Zona = GrupoMuscular | 'NEUTRO';

const r = (x: number, y: number, w: number, h: number, g?: Zona, rad = 5): Forma => ({ tipo: 'rect', x, y, w, h, r: rad, g });
const c = (cx: number, cy: number, radio: number, g?: Zona): Forma => ({ tipo: 'circ', cx, cy, r: radio, g });

/** Figura centrada en x=50 (frente) y x=150 (espalda). */
const FRENTE: Forma[] = [
  c(50, 15, 10, 'NEUTRO'),
  r(46, 24, 8, 6, 'NEUTRO', 2),
  c(29, 38, 8, 'HOMBROS'),
  c(71, 38, 8, 'HOMBROS'),
  r(35, 32, 14.5, 20, 'PECHO', 6),
  r(50.5, 32, 14.5, 20, 'PECHO', 6),
  r(18, 46, 9, 28, 'BRAZOS'),
  r(73, 46, 9, 28, 'BRAZOS'),
  r(16, 76, 8, 26, 'NEUTRO'),
  r(76, 76, 8, 26, 'NEUTRO'),
  r(41, 54, 18, 32, 'ABDOMEN', 4),
  r(34, 55, 6, 29, 'OBLICUOS', 3),
  r(60, 55, 6, 29, 'OBLICUOS', 3),
  r(35, 87, 30, 12, 'NEUTRO', 5),
  r(35, 100, 14, 44, 'CUADRICEPS', 7),
  r(51, 100, 14, 44, 'CUADRICEPS', 7),
  r(37, 147, 10, 40, 'NEUTRO', 5),
  r(53, 147, 10, 40, 'NEUTRO', 5),
];

const ESPALDA: Forma[] = [
  c(150, 15, 10, 'NEUTRO'),
  r(146, 24, 8, 6, 'NEUTRO', 2),
  c(129, 38, 8, 'HOMBROS'),
  c(171, 38, 8, 'HOMBROS'),
  r(135, 31, 30, 38, 'ESPALDA', 8),
  r(118, 46, 9, 28, 'BRAZOS'),
  r(173, 46, 9, 28, 'BRAZOS'),
  r(116, 76, 8, 26, 'NEUTRO'),
  r(176, 76, 8, 26, 'NEUTRO'),
  r(139, 71, 22, 15, 'LUMBAR', 4),
  r(135, 87, 30, 16, 'GLUTEOS_ISQUIOS', 7),
  r(135, 105, 14, 39, 'GLUTEOS_ISQUIOS', 7),
  r(151, 105, 14, 39, 'GLUTEOS_ISQUIOS', 7),
  r(137, 147, 10, 40, 'PANTORRILLAS', 5),
  r(153, 147, 10, 40, 'PANTORRILLAS', 5),
];

function activa(zona: Zona | undefined, grupo: GrupoMuscular | undefined): boolean {
  if (!zona || zona === 'NEUTRO' || !grupo) return false;
  if (grupo === 'CUERPO_COMPLETO') return true;
  if (grupo === 'PREDOMINIO_INFERIOR') return ['CUADRICEPS', 'GLUTEOS_ISQUIOS', 'PANTORRILLAS'].includes(zona);
  return zona === grupo;
}

/**
 * Sin `grupo`: cada zona se pinta con el color de su categoría (mapa de colores del cuerpo).
 * Con `grupo`: la zona que trabaja va a pleno; el resto queda tenue pero con su color.
 * `resaltar` permite marcar una categoría entera (por ejemplo, al pasar sobre una leyenda).
 */
export function MapaMuscular({
  grupo,
  tipo,
  className,
  conEtiquetas = true,
  resaltar,
}: {
  grupo?: GrupoMuscular;
  tipo?: TipoEjercicio;
  className?: string;
  conEtiquetas?: boolean;
  resaltar?: TipoEjercicio | null;
}) {
  const dibujar = (f: Forma, i: number) => {
    const zonaTipo = f.g && f.g !== 'NEUTRO' ? tipoDeGrupo(f.g) : undefined;
    let fill = HEX.tiza300;
    let opacidad = 1;
    if (grupo) {
      if (activa(f.g, grupo) && tipo) fill = HEX_TIPO[tipo].base;
      else if (zonaTipo) {
        fill = HEX_TIPO[zonaTipo].base;
        opacidad = 0.18;
      }
    } else if (zonaTipo) {
      fill = HEX_TIPO[zonaTipo].base;
      opacidad = resaltar && resaltar !== zonaTipo ? 0.18 : 1;
    }
    const props = { fill, opacity: opacidad, style: { transition: 'opacity 200ms, fill 200ms' } };
    return f.tipo === 'rect' ? (
      <rect key={i} x={f.x} y={f.y} width={f.w} height={f.h} rx={f.r} {...props} />
    ) : (
      <circle key={i} cx={f.cx} cy={f.cy} r={f.r} {...props} />
    );
  };

  return (
    <figure className={clsx('flex flex-col items-center', className)}>
      <svg
        viewBox="0 0 200 192"
        className="h-auto w-full max-w-[13rem]"
        role="img"
        aria-label={grupo ? `Zona que trabaja: ${NOMBRE_GRUPO[grupo]}` : 'Mapa del cuerpo con el color de cada categoría'}
      >
        <g>{FRENTE.map(dibujar)}</g>
        <g>{ESPALDA.map(dibujar)}</g>
        {/* Cardio no es un músculo: trabaja corazón y cuerpo completo. En el mapa general se muestra como un corazón. */}
        {!grupo && (
          <path
            d="M100 34 c -5 -8 -17 -3 -10 7 l10 10 l10 -10 c7 -10 -5 -15 -10 -7 z"
            fill={HEX_TIPO.CARDIO.base}
            opacity={resaltar && resaltar !== 'CARDIO' ? 0.18 : 1}
            style={{ transition: 'opacity 200ms' }}
          />
        )}
      </svg>
      {conEtiquetas && (
        <figcaption className="mt-1 grid w-full max-w-[13rem] grid-cols-2 text-center text-xs text-tinta-suave">
          <span>Frente</span>
          <span>Espalda</span>
        </figcaption>
      )}
    </figure>
  );
}
