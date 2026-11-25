import clsx from 'clsx';
import { useMemo, useState } from 'react';
import { Check, Search } from 'lucide-react';
import { useCatalogo, usePlanActivo } from '@/data/consultas';
import { GRUPOS_POR_TIPO, NOMBRE_GRUPO, TIPOS } from '@/domain/clasificacion';
import type { Ejercicio, TipoEjercicio } from '@/domain/tipos';
import { useAlumnoActual } from '@/lib/sesion-usuario';
import { sonidos } from '@/lib/sonido';
import { Dialogo, Entrada } from '@/ui/base';
import { Categorias } from '@/ui/Categorias';
import { DetalleEjercicio } from '@/ui/DetalleEjercicio';
import { AnimacionEjercicio } from '@/ui/AnimacionEjercicio';
import { BARRA_TIPO } from '@/ui/tipo';

/** Guía de ejercicios para el alumno: categorías por color y cada ejercicio animado. */
export function AprenderPage() {
  const alumno = useAlumnoActual();
  const plan = usePlanActivo(alumno.id);
  const { lista } = useCatalogo();
  const [tipo, setTipo] = useState<TipoEjercicio | null>(null);
  const [q, setQ] = useState('');
  const [abierto, setAbierto] = useState<Ejercicio | null>(null);
  const [enVista, setEnVista] = useState<string | null>(null);

  const enPlan = useMemo(() => new Set(plan?.dias.flatMap((d) => d.items.map((i) => i.ejercicioId)) ?? []), [plan]);
  const conteo = useMemo(() => Object.fromEntries(TIPOS.map((t) => [t, lista.filter((e) => e.tipo === t).length])), [lista]);
  const texto = q.trim().toLowerCase();
  const visibles = lista.filter((e) => (!tipo || e.tipo === tipo) && (!texto || e.nombre.toLowerCase().includes(texto)));

  return (
    <div className="pt-4">
      <h1 className="text-3xl leading-tight">Aprendé los ejercicios</h1>
      <p className="mt-2 text-tinta-suave">
        Cada color es una categoría y pinta la parte del cuerpo que trabaja. Tocá una categoría para ver sus ejercicios, y un ejercicio para ver cómo se hace.
      </p>

      <div className="mt-6">
        <Categorias
          seleccion={tipo}
          conteo={conteo}
          onElegir={(t) => {
            sonidos.toque();
            setTipo(t);
          }}
        />
      </div>

      <div className="relative mt-6">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-tinta-suave" size={18} aria-hidden />
        <Entrada type="search" placeholder="Buscar un ejercicio" aria-label="Buscar ejercicio" value={q} onChange={(e) => setQ(e.target.value)} className="pl-10" />
      </div>

      <div className="mt-6 space-y-7">
        {(tipo ? [tipo] : TIPOS).flatMap((t) =>
          GRUPOS_POR_TIPO[t].map((g) => {
            const del = visibles.filter((e) => e.grupo === g);
            if (!del.length) return null;
            return (
              <section key={g} aria-labelledby={`ap-${g}`}>
                <h2 id={`ap-${g}`} className="mb-2 flex items-center gap-2 text-lg">
                  <span className={clsx('h-4 w-1.5 rounded-full', BARRA_TIPO[t])} aria-hidden />
                  {NOMBRE_GRUPO[g]}
                </h2>
                <ul className="grid grid-cols-2 gap-2.5">
                  {del.map((e) => (
                    <li key={e.id}>
                      <button
                        onClick={() => {
                          sonidos.toque();
                          setAbierto(e);
                        }}
                        onMouseEnter={() => setEnVista(e.id)}
                        onMouseLeave={() => setEnVista(null)}
                        onFocus={() => setEnVista(e.id)}
                        onBlur={() => setEnVista(null)}
                        className="group w-full overflow-hidden rounded-2xl bg-white text-left transition-transform hover:-translate-y-0.5"
                      >
                        <AnimacionEjercicio ejercicio={e} compacta controlada={enVista === e.id} />
                        <span className="block px-3 pb-3 pt-2">
                          <span className="block text-sm font-semibold leading-snug">{e.nombre}</span>
                          {enPlan.has(e.id) && (
                            <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-exito-oscuro">
                              <Check size={12} aria-hidden /> En tu plan
                            </span>
                          )}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            );
          }),
        )}
        {visibles.length === 0 && <p className="py-8 text-center text-tinta-suave">No hay ejercicios con ese nombre.</p>}
      </div>

      <Dialogo abierto={abierto !== null} onCerrar={() => setAbierto(null)} titulo={abierto?.nombre ?? ''} ancho="max-w-3xl">
        {abierto && <DetalleEjercicio ejercicio={abierto} />}
      </Dialogo>
    </div>
  );
}
