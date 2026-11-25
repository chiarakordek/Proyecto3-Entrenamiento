import clsx from 'clsx';
import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { GRUPOS_POR_TIPO, NOMBRE_GRUPO, NOMBRE_TIPO, TIPOS } from '@/domain/clasificacion';
import type { Ejercicio, TipoEjercicio } from '@/domain/tipos';
import { Dialogo, Entrada } from '@/ui/base';
import { BARRA_TIPO, FONDO_TIPO } from '@/ui/tipo';

export function SelectorEjercicio({
  abierto,
  onCerrar,
  onElegir,
  catalogo,
  titulo,
}: {
  abierto: boolean;
  onCerrar: () => void;
  onElegir: (e: Ejercicio) => void;
  catalogo: Ejercicio[];
  titulo: string;
}) {
  const [q, setQ] = useState('');
  const [tipo, setTipo] = useState<TipoEjercicio | null>(null);

  const grupos = useMemo(() => {
    const texto = q.trim().toLowerCase();
    const visibles = catalogo.filter(
      (e) => (!tipo || e.tipo === tipo) && (!texto || e.nombre.toLowerCase().includes(texto) || NOMBRE_GRUPO[e.grupo].toLowerCase().includes(texto)),
    );
    return TIPOS.flatMap((t) =>
      GRUPOS_POR_TIPO[t]
        .map((g) => ({ tipo: t, grupo: g, ejercicios: visibles.filter((e) => e.grupo === g) }))
        .filter((x) => x.ejercicios.length),
    );
  }, [catalogo, q, tipo]);

  return (
    <Dialogo abierto={abierto} onCerrar={onCerrar} titulo={titulo} ancho="max-w-2xl">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-tinta-suave" size={18} aria-hidden />
        <Entrada
          type="search"
          autoFocus
          placeholder="Buscar ejercicio o grupo muscular"
          aria-label="Buscar ejercicio"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-10"
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filtrar por tipo">
        {TIPOS.map((t) => (
          <button
            key={t}
            aria-pressed={tipo === t}
            onClick={() => setTipo(tipo === t ? null : t)}
            className={clsx(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold',
              tipo === t ? clsx(FONDO_TIPO[t], 'border-transparent') : 'border-tiza-300 text-tinta-suave hover:bg-tiza',
            )}
          >
            <span className={clsx('h-2 w-2 rounded-full', BARRA_TIPO[t])} aria-hidden />
            {NOMBRE_TIPO[t]}
          </button>
        ))}
      </div>

      <div className="mt-4 max-h-[55dvh] space-y-5 overflow-y-auto pr-1">
        {grupos.length === 0 && <p className="py-8 text-center text-tinta-suave">No hay ejercicios con ese nombre.</p>}
        {grupos.map(({ tipo: t, grupo, ejercicios }) => (
          <section key={grupo}>
            <h3 className="mb-1.5 flex items-center gap-2 font-sans text-sm font-semibold text-tinta-suave">
              <span className={clsx('h-3 w-1.5 rounded-full', BARRA_TIPO[t])} aria-hidden />
              {NOMBRE_GRUPO[grupo]}
            </h3>
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {ejercicios.map((e) => (
                <li key={e.id}>
                  <button
                    onClick={() => onElegir(e)}
                    className="w-full rounded-xl border border-tiza-200 px-3 py-2 text-left hover:border-goma/40 hover:bg-tiza"
                  >
                    <span className="block font-semibold">{e.nombre}</span>
                    <span className="block text-xs text-tinta-suave">
                      {e.medicion === 'TIEMPO' ? 'Por tiempo' : 'Por repeticiones'}
                      {e.equipo ? `, ${e.equipo.toLowerCase()}` : ''}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Dialogo>
  );
}
