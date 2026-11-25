import clsx from 'clsx';
import { Award, CalendarCheck, Flame, Footprints, Hash, Mountain, MessageCircle, Construction, Star, Trophy, Weight, Zap } from 'lucide-react';
import type { DefinicionLogro, IconoLogro } from '@/domain/logros';
import { HEX_TIPO } from './colores';

const ICONOS: Record<IconoLogro, typeof Star> = {
  paso: Footprints,
  calendario: CalendarCheck,
  fuego: Flame,
  estrella: Star,
  trofeo: Trophy,
  pesa: Weight,
  montana: Mountain,
  grua: Construction,
  charla: MessageCircle,
  rayo: Zap,
  tres: Hash,
  medalla: Award,
};

const COLORES = [HEX_TIPO.TREN_SUPERIOR, HEX_TIPO.TREN_INFERIOR, HEX_TIPO.ZONA_MEDIA, HEX_TIPO.CARDIO, { base: '#F7C04A', claro: '#FFF3D6', oscuro: '#7A5300' }];

/** Medalla redonda con cinta: a color si está ganada, en gris si no. */
export function Medalla({ logro, ganada, tamano = 64, animar }: { logro: DefinicionLogro; ganada: boolean; tamano?: number; animar?: boolean }) {
  const c = COLORES[logro.color];
  const Icono = ICONOS[logro.icono];
  return (
    <span className={clsx('relative inline-block shrink-0', animar && 'medalla-entra')} style={{ width: tamano, height: tamano * 1.15 }} aria-hidden>
      <svg viewBox="0 0 64 74" width={tamano} height={tamano * 1.15}>
        {/* Cinta */}
        <path d="M20 46 L14 72 L24 66 L30 73 L32 50 Z" fill={ganada ? c.oscuro : '#C9D8D0'} />
        <path d="M44 46 L50 72 L40 66 L34 73 L32 50 Z" fill={ganada ? c.base : '#D9E5DE'} />
        {/* Disco */}
        <circle cx="32" cy="30" r="27" fill={ganada ? c.base : '#E3ECE7'} />
        <circle cx="32" cy="30" r="21" fill="none" stroke={ganada ? '#ffffff' : '#C9D8D0'} strokeOpacity={ganada ? 0.6 : 1} strokeWidth="2" strokeDasharray={ganada ? '0' : '3 3'} />
        {ganada && <path d="M14 18 A 22 22 0 0 1 30 8" stroke="#fff" strokeOpacity="0.5" strokeWidth="3" fill="none" strokeLinecap="round" />}
      </svg>
      <Icono
        className="absolute left-1/2 -translate-x-1/2"
        style={{ top: tamano * 0.26, color: ganada ? (logro.color === 2 || logro.color === 4 ? '#12302A' : '#fff') : '#9DB5AA' }}
        size={tamano * 0.38}
        strokeWidth={2.4}
      />
    </span>
  );
}
