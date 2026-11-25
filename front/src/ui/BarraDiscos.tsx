import { calcularCarga, describirLado, PESO_BARRA_KG, type Disco } from '@/domain/discos';
import { numero } from '@/lib/formato';

const COLOR: Record<Disco['color'], { relleno: string; borde: string }> = {
  rojo: { relleno: '#D93A3A', borde: '#A12424' },
  azul: { relleno: '#2366D1', borde: '#164A9C' },
  amarillo: { relleno: '#F2B600', borde: '#B78900' },
  verde: { relleno: '#1E9E5A', borde: '#146E3E' },
  blanco: { relleno: '#FFFFFF', borde: '#9AA3B2' },
  gris: { relleno: '#E9ECF1', borde: '#5B6475' },
};

/**
 * Dibuja la barra con los discos de cada lado para el peso elegido.
 * Didáctico: el alumno ve qué cargar sin hacer la cuenta.
 */
export function BarraDiscos({ totalKg }: { totalKg: number }) {
  const carga = calcularCarga(totalKg);
  const ALTO = 74;
  const CENTRO_Y = 44;
  const ANCHO_BASE = 12;
  const TOPE_DER = 196;
  const TOPE_IZQ = 124;

  // Posiciones de los discos del lado derecho, desde el tope hacia afuera.
  // La barra es simétrica respecto de x = 160 (viewBox de 320).
  let x = TOPE_DER + 9;
  const der = carga.porLado.map((d, i) => {
    const w = ANCHO_BASE * d.ancho;
    const h = ALTO * d.alto;
    const pos = { d, x, w, h, i };
    x += w + 1.5;
    return pos;
  });

  return (
    <figure className="rounded-2xl bg-white px-3 pb-3 pt-2">
      <svg viewBox="0 0 320 88" className="h-auto w-full" role="img" aria-label={`Barra con ${numero(totalKg)} kg`}>
        {/* Agarre (centro, fino), topes y mangas (donde van los discos) */}
        <rect x={TOPE_IZQ} y={CENTRO_Y - 3} width={TOPE_DER - TOPE_IZQ} height="6" rx="3" fill="#9AA3B2" />
        <rect x="10" y={CENTRO_Y - 5} width={TOPE_IZQ - 18} height="10" rx="3" fill="#C5CAD3" />
        <rect x={TOPE_DER + 8} y={CENTRO_Y - 5} width={310 - TOPE_DER - 8} height="10" rx="3" fill="#C5CAD3" />
        <rect x={TOPE_IZQ - 8} y={CENTRO_Y - 10} width="8" height="20" rx="2" fill="#3A4258" />
        <rect x={TOPE_DER} y={CENTRO_Y - 10} width="8" height="20" rx="2" fill="#3A4258" />
        {der.map(({ d, x: dx, w, h, i }) => (
          <g key={`${i}-${d.kg}`}>
            {/* Lado derecho */}
            <rect
              className="disco"
              style={{ ['--desde' as string]: '10px' }}
              x={dx}
              y={CENTRO_Y - h / 2}
              width={w}
              height={h}
              rx="2.5"
              fill={COLOR[d.color].relleno}
              stroke={COLOR[d.color].borde}
              strokeWidth="1.2"
            />
            {/* Espejo izquierdo */}
            <rect
              className="disco"
              style={{ ['--desde' as string]: '-10px' }}
              x={320 - dx - w}
              y={CENTRO_Y - h / 2}
              width={w}
              height={h}
              rx="2.5"
              fill={COLOR[d.color].relleno}
              stroke={COLOR[d.color].borde}
              strokeWidth="1.2"
            />
          </g>
        ))}
      </svg>
      <figcaption className="text-center text-sm leading-snug">
        {carga.menorQueBarra ? (
          <span className="text-tinta-suave">
            Es menos que la barra sola ({PESO_BARRA_KG} kg). Probá con una barra más liviana o con mancuernas.
          </span>
        ) : (
          <>
            <span className="text-tinta-suave">En cada lado: </span>
            <span className="font-semibold">{describirLado(carga.porLado)}</span>
            <span className="block text-xs text-tinta-suave">
              Barra de {PESO_BARRA_KG} kg
              {carga.resto > 0 && `. Faltan ${numero(carga.resto)} kg que no se arman con discos estándar`}
            </span>
          </>
        )}
      </figcaption>
    </figure>
  );
}
