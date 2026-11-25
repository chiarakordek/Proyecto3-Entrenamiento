import clsx from 'clsx';
import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useCatalogo, useSesionesDe } from '@/data/consultas';
import { NOMBRE_TIPO } from '@/domain/clasificacion';
import { calcularLogros } from '@/domain/logros';
import { records, tonelajeSesion, tonelajeTotal } from '@/domain/metricas';
import type { Ejercicio, Sesion } from '@/domain/tipos';
import { useAlumnoActual } from '@/lib/sesion-usuario';
import { fecha, mes, numero, resumenSeries } from '@/lib/formato';
import { composicionSesiones, rachaSemanas } from '@/lib/resumenes';
import { Vacio } from '@/ui/base';
import { HEX_TIPO } from '@/ui/colores';
import { Termino } from '@/ui/didactico';
import { Medalla } from '@/ui/Medalla';
import { BarraCategorias, Cabecera, Cifra, Contador, Seccion } from '@/ui/pagina';
import { BARRA_TIPO } from '@/ui/tipo';

const diaSemana = new Intl.DateTimeFormat('es-AR', { weekday: 'short' });

export function HistorialPage() {
  const alumno = useAlumnoActual();
  const sesiones = useSesionesDe(alumno.id);
  const { porId } = useCatalogo();
  const cerradas = useMemo(() => sesiones.filter((s) => s.cerradaEn), [sesiones]);
  const marcas = useMemo(() => [...records(cerradas).values()].sort((a, b) => b.pesoKg - a.pesoKg), [cerradas]);
  const logros = useMemo(() => calcularLogros(cerradas), [cerradas]);
  const ganados = logros.filter((l) => l.ganadoEn);
  const [verTodos, setVerTodos] = useState(false);

  const porMes = useMemo(() => {
    const grupos = new Map<string, Sesion[]>();
    for (const s of cerradas) {
      const d = new Date(s.cerradaEn!);
      const clave = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
      grupos.set(clave, [...(grupos.get(clave) ?? []), s]);
    }
    return [...grupos.entries()];
  }, [cerradas]);

  const cantRecords = logros.find((l) => l.definicion.id === 'cinco-records')?.progreso ?? 0;

  if (cerradas.length === 0) {
    return (
      <div>
        <Cabecera titulo="Tu historial" bajada="Acá vas a ver tus sesiones, tus récords y los logros que vayas ganando." />
        <div className="mt-8">
          <Vacio titulo="Todavía no cerraste ninguna sesión">Cuando cierres la primera, ganás tu primer logro.</Vacio>
        </div>
      </div>
    );
  }

  const ordenados = [...ganados, ...logros.filter((l) => !l.ganadoEn)];
  const visiblesLogros = verTodos ? ordenados : ordenados.slice(0, 6);

  return (
    <div>
      <Cabecera titulo="Tu historial" bajada="Todo lo que entrenaste, tus mejores marcas y tus logros.">
        <dl className="grid grid-cols-4 gap-3 border-t border-white/15 pt-4">
          <Cifra valor={<Contador valor={cerradas.length} />} etiqueta="sesiones" />
          <Cifra valor={<Contador valor={Math.round(tonelajeTotal(cerradas) / 1000)} />} etiqueta="toneladas" />
          <Cifra valor={<Contador valor={cantRecords} />} etiqueta="récords" acento />
          <Cifra valor={<Contador valor={rachaSemanas(cerradas)} />} etiqueta="semanas seguidas" />
        </dl>
      </Cabecera>

      <Seccion
        id="logros"
        titulo="Logros"
        bajada={`${ganados.length} de ${logros.length} ganados. Los grises te dicen cómo conseguirlos.`}
        accion={
          <button onClick={() => setVerTodos(!verTodos)} className="shrink-0 text-sm font-semibold text-goma underline underline-offset-4">
            {verTodos ? 'Ver menos' : 'Ver todos'}
          </button>
        }
      >
        <ul className="grid grid-cols-3 gap-2.5">
          {visiblesLogros.map(({ definicion: l, ganadoEn, progreso }) => (
            <li key={l.id} className={clsx('flex flex-col items-center rounded-2xl px-2 pb-3 pt-3 text-center', ganadoEn ? 'bg-white shadow-hoja' : 'bg-white/50')}>
              <Medalla logro={l} ganada={!!ganadoEn} tamano={52} />
              <p className={clsx('mt-1 text-sm font-bold leading-tight', !ganadoEn && 'text-tinta-suave')}>{l.titulo}</p>
              {ganadoEn ? (
                <p className="mt-0.5 text-xs text-tinta-suave">{fecha(ganadoEn)}</p>
              ) : (
                <>
                  <p className="mt-0.5 text-[0.7rem] leading-tight text-tinta-suave">{l.comoSeGana}</p>
                  <div
                    className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-tiza-200"
                    role="img"
                    aria-label={`Progreso: ${numero(progreso)} de ${numero(l.meta)}`}
                  >
                    <div className="h-full rounded-full bg-chispa" style={{ width: `${(progreso / l.meta) * 100}%` }} />
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </Seccion>

      <Seccion id="marcas" titulo="Tus mejores marcas" bajada={<>El mayor peso que levantaste en cada ejercicio, tu <Termino clave="record">récord</Termino>.</>}>
        <ul className="-mx-5 flex snap-x scroll-px-5 gap-3 overflow-x-auto px-5 pb-2">
          {marcas.map((r) => {
            const ej = porId.get(r.ejercicioId);
            if (!ej) return null;
            const c = HEX_TIPO[ej.tipo];
            return (
              <li key={r.ejercicioId} className="w-40 shrink-0 snap-start overflow-hidden rounded-2xl bg-white">
                <div className="px-4 pb-3 pt-3" style={{ background: c.base, color: ej.tipo === 'ZONA_MEDIA' ? '#12302A' : '#fff' }}>
                  <p className="text-xs font-semibold opacity-85">{NOMBRE_TIPO[ej.tipo]}</p>
                  <p className="marcador text-[1.7rem] leading-none">
                    {numero(r.pesoKg)}
                    <span className="ml-1 text-sm">kg</span>
                  </p>
                </div>
                <div className="px-4 pb-3 pt-2.5">
                  <p className="text-sm font-bold leading-snug">{ej.nombre}</p>
                  <p className="text-xs text-tinta-suave">{fecha(r.fecha)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </Seccion>

      <Seccion id="sesiones" titulo="Sesiones" bajada="Tocá una para ver serie por serie y tu comentario.">
        <div className="space-y-7">
          {porMes.map(([clave, ss]) => (
            <div key={clave}>
              <h3 className="mb-2 flex items-baseline justify-between text-base">
                <span className="first-letter:uppercase">{mes(clave)}</span>
                <span className="cifra text-sm font-normal text-tinta-suave" style={{ fontStretch: '100%' }}>
                  {ss.length} {ss.length === 1 ? 'sesión' : 'sesiones'}
                </span>
              </h3>
              <ol className="space-y-2.5">
                {ss.map((s) => (
                  <FilaSesion key={s.id} sesion={s} porId={porId} />
                ))}
              </ol>
            </div>
          ))}
        </div>
      </Seccion>
    </div>
  );
}

function FilaSesion({ sesion: s, porId }: { sesion: Sesion; porId: Map<string, Ejercicio> }) {
  const d = new Date(s.cerradaEn!);
  const esfuerzo = s.esfuerzo ?? 0;
  return (
    <li>
      <details className="group overflow-hidden rounded-2xl bg-white [&_summary::-webkit-details-marker]:hidden">
        <summary className="flex cursor-pointer list-none items-stretch">
          <span className="flex w-16 shrink-0 flex-col items-center justify-center bg-goma py-3 text-white">
            <span className="text-[0.7rem] text-tiza/70">{diaSemana.format(d)}</span>
            <span className="marcador text-2xl leading-none">{d.getDate()}</span>
          </span>
          <span className="min-w-0 flex-1 px-4 py-3">
            <span className="flex items-baseline justify-between gap-2">
              <span className="font-bold">Día {s.dia}</span>
              <span className="cifra shrink-0 text-sm text-tinta-suave">{numero(tonelajeSesion(s))} kg</span>
            </span>
            <span className="mt-2 block">
              <BarraCategorias cantidades={composicionSesiones([s], porId)} alto="h-1.5" />
            </span>
            {s.esfuerzo && (
              <span className="mt-2 flex items-center gap-2 text-xs text-tinta-suave">
                Esfuerzo
                <span className="flex gap-0.5" role="img" aria-label={`${esfuerzo} de 10`}>
                  {Array.from({ length: 10 }, (_, i) => (
                    <span
                      key={i}
                      className={clsx('h-2 w-1.5 rounded-sm', i < esfuerzo ? (esfuerzo <= 4 ? 'bg-exito' : esfuerzo <= 7 ? 'bg-aviso' : 'bg-peligro') : 'bg-tiza-200')}
                    />
                  ))}
                </span>
                <span className="cifra font-semibold text-tinta">{esfuerzo}</span>
              </span>
            )}
          </span>
          <ChevronDown size={20} className="mr-3 shrink-0 self-center text-tinta-suave transition-transform group-open:rotate-180" aria-hidden />
        </summary>

        <div className="space-y-3 border-t border-tiza-200 px-4 pb-4 pt-3">
          {s.comentario && (
            <p className="rounded-2xl bg-tiza px-3.5 py-2 text-sm">
              <span className="block text-xs font-semibold text-tinta-suave">Tu comentario para el entrenador</span>
              {s.comentario}
            </p>
          )}
          <ul className="space-y-1.5">
            {s.ejercicios
              .filter((e) => e.series.length)
              .map((e) => {
                const ej = porId.get(e.ejercicioId);
                if (!ej) return null;
                return (
                  <li key={e.itemId} className="flex items-start gap-2.5 text-sm">
                    <span className={clsx('mt-1.5 h-3 w-1.5 shrink-0 rounded-full', BARRA_TIPO[ej.tipo])} aria-hidden />
                    <span>
                      <span className="font-semibold">{ej.nombre}</span>
                      <span className="cifra block text-tinta-suave">{resumenSeries(e.series, ej.medicion)}</span>
                    </span>
                  </li>
                );
              })}
          </ul>
        </div>
      </details>
    </li>
  );
}
