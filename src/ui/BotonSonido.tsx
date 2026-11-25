import clsx from 'clsx';
import { Volume2, VolumeX } from 'lucide-react';
import { setSonido, useSonidoActivo } from '@/lib/sonido';

export function BotonSonido({ oscuro, className }: { oscuro?: boolean; className?: string }) {
  const activo = useSonidoActivo();
  return (
    <button
      onClick={() => setSonido(!activo)}
      aria-pressed={activo}
      aria-label={activo ? 'Silenciar sonidos' : 'Activar sonidos'}
      title={activo ? 'Silenciar sonidos' : 'Activar sonidos'}
      className={clsx(
        'rounded-lg p-2',
        oscuro ? 'text-tiza/70 hover:bg-white/10 hover:text-white' : 'text-tinta-suave hover:bg-tiza-200 hover:text-tinta',
        className,
      )}
    >
      {activo ? <Volume2 size={18} /> : <VolumeX size={18} />}
    </button>
  );
}
