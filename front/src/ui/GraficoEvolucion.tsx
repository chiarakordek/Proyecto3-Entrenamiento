import { useMemo, useState } from 'react';
import { pesoMaximo } from '@/domain/metricas';
import type { Ejercicio, Sesion } from '@/domain/tipos';
import { fecha, kg } from '@/lib/formato';
import { Selector } from './base';
import { HEX, HEX_TIPO } from './colores';

/** Peso máximo por sesión para un ejercicio, en una línea con el color de su categoría. */
export function GraficoEvolucion({ sesiones, porId }: { sesiones: Sesion[]; porId: Map<string, Ejercicio> }) {
  const cerradas = useMemo(() => sesiones.filter((s) => s.cerradaEn).sort((a, b) => (a.cerradaEn! < b.cerradaEn! ? -1 : 1)), [sesiones]);

  const conDatos = useMemo(() => {
    const cuenta = new Map<string, number>();
    for (const s of cerradas) for (const e of s.ejercicios) if (pesoMaximo(e.series) > 0) cuenta.set(e.ejercicioId, (cuenta.get(e.ejercicioId) ?? 0) + 1);
    return [...cuenta.entries()].filter(([, n]) => n >= 2).map(([id]) => porId.get(id)).filter((e): e is Ejercicio => !!e);
  }, [cerradas, porId]);

  const [elegido, setElegido] = useState<string | undefined>(undefined);
  const ej = conDatos.find((e) => e.id === elegido) ?? conDatos[0];

  if (!ej) return <p className="rounded-2xl bg-white p-5 text-tinta-suave">Aparece cuando el alumno registre el mismo ejercicio en al menos dos sesiones.</p>;

  const puntos = cerradas
    .map((s) => ({ fecha: s.cerradaEn!, kg: pesoMaximo(s.ejercicios.find((e) => e.ejercicioId === ej.id)?.series ?? []) }))
    .filter((p) => p.kg > 0);

  const W = 560;
  const H = 200;
  const M = { izq: 44, der: 16, arr: 16, aba: 28 };
  const min = Math.floor(Math.min(...puntos.map((p) => p.kg)) / 5) * 5 - 5;
  const max = Math.ceil(Math.max(...puntos.map((p) => p.kg)) / 5) * 5 + 5;
  const x = (i: number) => M.izq + (i / Math.max(1, puntos.length - 1)) * (W - M.izq - M.der);
  const y = (v: number) => M.arr + (1 - (v - min) / (max - min || 1)) * (H - M.arr - M.aba);
  const linea = puntos.map((p, i) => `${i ? 'L' : 'M'} ${x(i)} ${y(p.kg)}`).join(' ');
  const area = `${linea} L ${x(puntos.length - 1)} ${H - M.aba} L ${x(0)} ${H - M.aba} Z`;
  const color = HEX_TIPO[ej.tipo];
  const marcas = [min, (min + max) / 2, max];
  const subida = puntos.at(-1)!.kg - puntos[0].kg;

  return (
    <div className="rounded-2xl bg-white p-5 shadow-hoja">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Ejercicio
          <Selector value={ej.id} onChange={(e) => setElegido(e.target.value)} className="min-w-56">
            {conDatos.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </Selector>
        </label>
        <p className="text-sm text-tinta-suave">
          De <span className="cifra font-semibold text-tinta">{kg(puntos[0].kg)}</span> a{' '}
          <span className="marcador text-lg" style={{ color: color.oscuro }}>
            {kg(puntos.at(-1)!.kg)}
          </span>
          {subida > 0 && <span className="ml-2 rounded-full bg-exito-claro px-2 py-0.5 font-semibold text-exito-oscuro">+{kg(subida)}</span>}
        </p>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 h-auto w-full" role="img" aria-label={`Evolución del peso en ${ej.nombre}: de ${kg(puntos[0].kg)} a ${kg(puntos.at(-1)!.kg)}`}>
        <defs>
          <linearGradient id={`area-${ej.id}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={color.base} stopOpacity="0.28" />
            <stop offset="1" stopColor={color.base} stopOpacity="0" />
          </linearGradient>
        </defs>
        {marcas.map((m) => (
          <g key={m}>
            <line x1={M.izq} x2={W - M.der} y1={y(m)} y2={y(m)} stroke={HEX.tiza} strokeWidth="1.5" />
            <text x={M.izq - 8} y={y(m) + 4} textAnchor="end" fontSize="11" fill={HEX.suave}>
              {Math.round(m)}
            </text>
          </g>
        ))}
        <path d={area} fill={`url(#area-${ej.id})`} />
        <path d={linea} fill="none" stroke={color.base} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        {puntos.map((p, i) => (
          <circle key={i} cx={x(i)} cy={y(p.kg)} r={i === puntos.length - 1 ? 5.5 : 3.5} fill="#fff" stroke={color.base} strokeWidth="2.5">
            <title>
              {fecha(p.fecha)}: {kg(p.kg)}
            </title>
          </circle>
        ))}
        <text x={M.izq} y={H - 8} fontSize="11" fill={HEX.suave}>
          {fecha(puntos[0].fecha)}
        </text>
        <text x={W - M.der} y={H - 8} fontSize="11" fill={HEX.suave} textAnchor="end">
          {fecha(puntos.at(-1)!.fecha)}
        </text>
      </svg>
    </div>
  );
}
