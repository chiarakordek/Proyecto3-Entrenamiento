import type { Alumno } from '@/domain/tipos';
import { fecha, kg, numero } from '@/lib/formato';
import { HEX } from './colores';

/**
 * Evolución del peso corporal. Si hay peso ideal (objetivo bajar de peso),
 * se dibuja como línea de meta para contrastar el avance, como pide el documento.
 */
export function GraficoPeso({ alumno, oscuro }: { alumno: Alumno; oscuro?: boolean }) {
  const puntos = [...(alumno.pesos ?? [])].sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
  const ideal = alumno.meta?.pesoIdealKg;
  if (puntos.length < 2) {
    return <p className="text-sm text-tinta-suave">Con dos registros de peso vas a ver tu evolución acá.</p>;
  }
  const W = 320;
  const H = 120;
  const M = { izq: 34, der: 10, arr: 12, aba: 22 };
  const valores = [...puntos.map((p) => p.kg), ...(ideal !== undefined ? [ideal] : [])];
  const min = Math.floor(Math.min(...valores)) - 1;
  const max = Math.ceil(Math.max(...valores)) + 1;
  const x = (i: number) => M.izq + (i / (puntos.length - 1)) * (W - M.izq - M.der);
  const y = (v: number) => M.arr + (1 - (v - min) / (max - min)) * (H - M.arr - M.aba);
  const linea = puntos.map((p, i) => `${i ? 'L' : 'M'} ${x(i)} ${y(p.kg)}`).join(' ');
  const cambio = puntos.at(-1)!.kg - puntos[0].kg;
  const texto = oscuro ? '#EAF5EE' : HEX.suave;
  const trazo = oscuro ? '#F7C04A' : HEX.goma;

  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Peso: de ${kg(puntos[0].kg)} a ${kg(puntos.at(-1)!.kg)}`}>
        {[min, max].map((m) => (
          <text key={m} x={M.izq - 6} y={y(m) + 4} textAnchor="end" fontSize="10" fill={texto}>
            {m}
          </text>
        ))}
        {ideal !== undefined && (
          <g>
            <line x1={M.izq} x2={W - M.der} y1={y(ideal)} y2={y(ideal)} stroke="#1E9E5A" strokeWidth="2" strokeDasharray="5 4" />
            <text x={W - M.der} y={y(ideal) - 5} textAnchor="end" fontSize="10" fontWeight="700" fill="#1E9E5A">
              Meta {numero(ideal)} kg
            </text>
          </g>
        )}
        <path d={linea} fill="none" stroke={trazo} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        {puntos.map((p, i) => (
          <circle key={i} cx={x(i)} cy={y(p.kg)} r={i === puntos.length - 1 ? 4.5 : 3} fill="#fff" stroke={trazo} strokeWidth="2">
            <title>
              {fecha(p.fecha)}: {kg(p.kg)}
            </title>
          </circle>
        ))}
        <text x={M.izq} y={H - 6} fontSize="10" fill={texto}>
          {fecha(puntos[0].fecha)}
        </text>
        <text x={W - M.der} y={H - 6} fontSize="10" fill={texto} textAnchor="end">
          {fecha(puntos.at(-1)!.fecha)}
        </text>
      </svg>
      <figcaption className="mt-1 text-sm text-tinta-suave">
        {cambio === 0 ? 'Sin cambios' : `${cambio > 0 ? '+' : '−'}${kg(Math.abs(cambio))}`} desde {fecha(puntos[0].fecha)}
        {ideal !== undefined && puntos.at(-1)!.kg > ideal && `. Faltan ${kg(puntos.at(-1)!.kg - ideal)} para la meta.`}
      </figcaption>
    </figure>
  );
}
