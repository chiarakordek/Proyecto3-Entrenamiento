import clsx from 'clsx';
import { useMemo, useState, type FormEvent } from 'react';
import { ChevronLeft, ChevronRight, Quote, Scale, Star } from 'lucide-react';
import { definirMeta, ErrorDominio } from '@/data/api';
import { useCatalogo, useSesionesDe } from '@/data/consultas';
import { calcularLogros } from '@/domain/logros';
import { limitesCiclo, limitesMes, resumenPeriodo } from '@/domain/metricas';
import { useAlumnoActual } from '@/lib/sesion-usuario';
import { fecha, kg, mes, numero } from '@/lib/formato';
import { composicionSesiones } from '@/lib/resumenes';
import { sonidos } from '@/lib/sonido';
import { Boton, Entrada } from '@/ui/base';
import { Termino } from '@/ui/didactico';
import { festejar } from '@/ui/Festejo';
import { Medalla } from '@/ui/Medalla';
import { GraficoPeso } from '@/ui/GraficoPeso';
import { BarraCategorias, Cabecera, Cifra, Contador, Seccion } from '@/ui/pagina';
import { BARRA_TIPO } from '@/ui/tipo';

const FRASES = [
  'La disciplina es el puente entre tus metas y tus logros.',
  'No hace falta que sea perfecto, hace falta que sea constante.',
  'Cada serie anotada es una prueba de que viniste.',
  'El progreso lento sigue siendo progreso.',
  'Lo que hacés seguido te define más que lo que hacés a veces.',
  'Volviste una vez más. Eso es lo que cuenta.',
];

const DIAS_SEMANA = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

/** Para dimensionar el tonelaje con algo cotidiano. */
function equivalencia(kgTotales: number): string | null {
  const AUTO = 1200;
  const ELEFANTE = 5000;
  if (kgTotales >= ELEFANTE * 2) return `Es como levantar ${numero(Math.round(kgTotales / ELEFANTE))} elefantes 🐘`;
  if (kgTotales >= AUTO) return `Es como levantar ${numero(Math.round(kgTotales / AUTO))} autos chicos`;
  return null;
}

/** Resumen del mes (a definir con el cliente): evolución de cargas, récords, tonelaje y una frase. */
export function ResumenMesPage() {
  const alumno = useAlumnoActual();
  const sesiones = useSesionesDe(alumno.id);
  const { porId } = useCatalogo();
  const [desfase, setDesfase] = useState(0);
  // El documento admite "cada mes o ciclo de 4 semanas": se puede ver de las dos formas.
  const [periodo, setPeriodo] = useState<'mes' | 'ciclo'>('mes');

  const { desde, hasta } = useMemo(() => (periodo === 'mes' ? limitesMes(new Date(), desfase) : limitesCiclo(new Date(), desfase)), [desfase, periodo]);
  const resumen = useMemo(() => resumenPeriodo(sesiones, desde, hasta), [sesiones, desde, hasta]);
  const delMes = useMemo(() => sesiones.filter((s) => s.cerradaEn && s.cerradaEn >= desde && s.cerradaEn < hasta), [sesiones, desde, hasta]);
  const logrosMes = useMemo(
    () => calcularLogros(sesiones).filter((l) => l.ganadoEn && l.ganadoEn >= desde && l.ganadoEn < hasta),
    [sesiones, desde, hasta],
  );
  const frase = FRASES[(new Date(desde).getMonth() + alumno.nombre.length) % FRASES.length];
  const hayAnterior = sesiones.some((s) => s.cerradaEn && s.cerradaEn < desde);
  const recordsDelMes = resumen.evolucion.filter((e) => e.esRecord).length;
  const maxEscala = Math.max(1, ...resumen.evolucion.map((e) => e.maximoKg));
  const comparacion = equivalencia(resumen.tonelajeKg);
  const [mesTexto, anio] = mes(desde).split(' de ');
  const nombreMes = mesTexto.charAt(0).toUpperCase() + mesTexto.slice(1);
  const finCiclo = new Date(new Date(hasta).getTime() - 86_400_000).toISOString();
  const etiquetaDesfase =
    periodo === 'mes'
      ? desfase === 0 ? 'Este mes' : desfase === -1 ? 'El mes pasado' : `Hace ${-desfase} meses`
      : desfase === 0 ? 'Ciclo actual' : `Hace ${-desfase * 4} semanas`;
  const titulo =
    periodo === 'mes' ? (
      <span className="flex flex-wrap items-baseline gap-x-3">
        {nombreMes}
        <span className="marcador text-xl text-tiza/60">{anio}</span>
      </span>
    ) : (
      <span className="block">
        Ciclo de 4 semanas
        <span className="mt-1 block text-lg text-tiza/70" style={{ fontStretch: '100%' }}>
          Del {fecha(desde)} al {fecha(finCiclo)}
        </span>
      </span>
    );

  const navegacion = (
    <div className="mb-3 flex items-center gap-1">
      <button
        onClick={() => setDesfase(desfase - 1)}
        disabled={!hayAnterior}
        className="grid h-9 w-9 place-items-center rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30"
        aria-label="Mes anterior"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={() => setDesfase(desfase + 1)}
        disabled={desfase >= 0}
        className="grid h-9 w-9 place-items-center rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30"
        aria-label="Mes siguiente"
      >
        <ChevronRight size={20} />
      </button>
      <span className="ml-2 text-sm text-tiza/75">{etiquetaDesfase}</span>
      <div role="group" aria-label="Período" className="ml-auto flex rounded-full bg-white/10 p-0.5 text-xs font-semibold">
        {(['mes', 'ciclo'] as const).map((p) => (
          <button
            key={p}
            aria-pressed={periodo === p}
            onClick={() => {
              setPeriodo(p);
              setDesfase(0);
            }}
            className={clsx('rounded-full px-3 py-1.5', periodo === p ? 'bg-chispa text-goma' : 'text-tiza/80')}
          >
            {p === 'mes' ? 'Mes' : '4 semanas'}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <Cabecera arriba={navegacion} titulo={titulo}>
        {resumen.sesiones === 0 ? (
          <p className="text-tiza/80">No registraste sesiones en este período.</p>
        ) : (
          <>
            <p className="text-tiza/80">
              Moviste en total (<Termino clave="tonelaje" oscuro>tonelaje</Termino>)
            </p>
            <p className="marcador mt-1 text-[3.2rem] leading-none text-chispa">
              <Contador key={desde} valor={resumen.tonelajeKg} duracion={1300} />
              <span className="ml-2 text-2xl text-white">kg</span>
            </p>
            {comparacion && <p className="mt-2 text-sm text-white">{comparacion}</p>}
            <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-white/15 pt-4">
              <Cifra valor={resumen.sesiones} etiqueta="sesiones" />
              <Cifra valor={recordsDelMes} etiqueta="récords" acento />
              <Cifra valor={resumen.esfuerzoPromedio ? numero(resumen.esfuerzoPromedio) : '–'} etiqueta="esfuerzo medio" />
            </dl>
          </>
        )}
      </Cabecera>

      {resumen.sesiones > 0 && (
        <>
          <Seccion id="calendario" titulo="Tus días de entrenamiento" bajada="Cada círculo es una sesión cerrada, con el número del día del plan.">
            <Calendario desde={desde} hasta={hasta} sesiones={delMes} />
          </Seccion>

          <Seccion id="categorias" titulo="En qué trabajaste" bajada="Cuántas series hiciste de cada categoría.">
            <div className="rounded-2xl bg-white p-4">
              <BarraCategorias cantidades={composicionSesiones(delMes, porId)} leyenda alto="h-4" />
            </div>
          </Seccion>

          <Seccion
            id="evolucion"
            titulo="Cómo subieron tus cargas"
            bajada={
              <>
                En gris, tu primera sesión del mes; en color, lo que subiste. Eso es la <Termino clave="sobrecarga">sobrecarga progresiva</Termino>.
              </>
            }
          >
            <ul className="space-y-2.5">
              {resumen.evolucion.map((e) => {
                const ej = porId.get(e.ejercicioId);
                if (!ej) return null;
                const subio = e.maximoKg - e.inicialKg;
                return (
                  <li key={e.ejercicioId} className="rounded-2xl bg-white px-4 py-3.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="font-bold">{ej.nombre}</p>
                      <p className="cifra shrink-0 text-sm text-tinta-suave">
                        {kg(e.inicialKg)} a <span className="marcador text-lg text-tinta">{kg(e.maximoKg)}</span>
                      </p>
                    </div>
                    <div className="relative mt-2 h-3 rounded-full bg-tiza" aria-hidden>
                      <div className="absolute inset-y-0 left-0 rounded-full bg-tiza-300" style={{ width: `${(e.inicialKg / maxEscala) * 100}%` }} />
                      <div
                        className={clsx('absolute inset-y-0 rounded-full', BARRA_TIPO[ej.tipo])}
                        style={{ left: `${(e.inicialKg / maxEscala) * 100}%`, width: `${(subio / maxEscala) * 100}%` }}
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                      {subio > 0 ? (
                        <span className="font-semibold text-exito-oscuro">+{kg(subio)} este mes</span>
                      ) : (
                        <span className="text-tinta-suave">Sin cambios: buen momento para pedir más carga.</span>
                      )}
                      {e.esRecord && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-chispa px-2 py-0.5 font-semibold text-goma">
                          <Star size={13} fill="currentColor" aria-hidden /> Récord personal
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </Seccion>

          {logrosMes.length > 0 && (
            <Seccion id="logros-mes" titulo="Logros del mes" bajada="Los que ganaste en este período.">
              <ul className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-2">
                {logrosMes.map(({ definicion: l }) => (
                  <li key={l.id} className="flex w-28 shrink-0 flex-col items-center rounded-2xl bg-white px-2 py-3 text-center shadow-hoja">
                    <Medalla logro={l} ganada tamano={50} />
                    <p className="mt-1 text-sm font-bold leading-tight">{l.titulo}</p>
                  </li>
                ))}
              </ul>
            </Seccion>
          )}
        </>
      )}

      {desfase === 0 && <PesoDelMes />}

      <figure className="relative mt-10 overflow-hidden rounded-3xl bg-chispa-claro px-6 pb-6 pt-8">
        <Quote size={64} className="absolute -left-1 -top-2 text-chispa" aria-hidden />
        <blockquote className="relative">
          <p className="display text-2xl leading-snug">{frase}</p>
        </blockquote>
        {resumen.sesiones > 0 && <figcaption className="relative mt-3 font-semibold text-tinta-suave">¡Gran mes de trabajo, a mantener el ritmo!</figcaption>}
      </figure>
    </div>
  );
}

/** Calendario del período (mes o ciclo de 4 semanas), con lunes como primer día. */
function Calendario({ desde, hasta, sesiones }: { desde: string; hasta: string; sesiones: { cerradaEn?: string; dia: number }[] }) {
  const primero = new Date(desde);
  const diasMes = Math.round((new Date(hasta).getTime() - primero.getTime()) / 86_400_000);
  const offset = (primero.getDay() + 6) % 7; // lunes primero
  const hoy = new Date();
  const clave = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const porDia = new Map<string, number>();
  for (const s of sesiones) porDia.set(clave(new Date(s.cerradaEn!)), s.dia);
  return (
    <div className="rounded-2xl bg-white p-3">
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-tinta-suave">
        {DIAS_SEMANA.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <ol className="mt-1.5 grid grid-cols-7 gap-1">
        {Array.from({ length: offset }, (_, i) => (
          <li key={`v${i}`} aria-hidden />
        ))}
        {Array.from({ length: diasMes }, (_, i) => {
          const fechaDia = new Date(primero.getFullYear(), primero.getMonth(), primero.getDate() + i);
          const n = fechaDia.getDate();
          const diaPlan = porDia.get(clave(fechaDia));
          const esHoy = clave(hoy) === clave(fechaDia);
          return (
            <li key={n} className="grid place-items-center">
              <span
                className={clsx(
                  'grid aspect-square w-full max-w-10 place-items-center rounded-full text-sm',
                  diaPlan ? 'marcador bg-goma text-white' : 'text-tinta-suave',
                  esHoy && !diaPlan && 'ring-2 ring-chispa',
                )}
                title={diaPlan ? `Día ${diaPlan} del plan` : undefined}
              >
                {diaPlan ? <span className="text-chispa">{diaPlan}</span> : n}
                <span className="sr-only">{diaPlan ? `: entrenaste el Día ${diaPlan}` : ''}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function PesoDelMes() {
  const alumno = useAlumnoActual();
  const [valor, setValor] = useState('');
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);
  if (!alumno.meta) return null;
  const meta = alumno.meta;
  const faltan = meta.pesoIdealKg !== undefined ? meta.pesoActualKg - meta.pesoIdealKg : undefined;

  const guardar = (e: FormEvent) => {
    e.preventDefault();
    try {
      const n = Number(valor.replace(',', '.'));
      // Si llegó a la meta de peso, el objetivo pasa a salud general (la meta ya no aplica).
      const ideal = meta.pesoIdealKg !== undefined && meta.pesoIdealKg < n ? meta.pesoIdealKg : undefined;
      const objetivo = meta.objetivo === 'BAJAR_PESO' && ideal === undefined ? 'SALUD_GENERAL' : meta.objetivo;
      definirMeta(alumno.id, { objetivo, pesoActualKg: n, pesoIdealKg: ideal });
      const llego = objetivo !== meta.objetivo;
      if (llego) {
        sonidos.victoria();
        festejar({ cantidad: 240 });
      } else sonidos.ok();
      setMensaje({
        ok: true,
        texto: llego
          ? `¡Llegaste a tu meta de peso! Quedó registrado ${kg(n)}. Hablá con tu entrenador para fijar un objetivo nuevo.`
          : `Peso actualizado a ${kg(n)}.`,
      });
      setValor('');
    } catch (err) {
      if (err instanceof ErrorDominio) {
        sonidos.error();
        setMensaje({ ok: false, texto: err.message });
      } else throw err;
    }
  };

  return (
    <Seccion id="peso" titulo="Tu peso de hoy" bajada="Registralo una vez por mes para ver tu evolución.">
      <form onSubmit={guardar} className="rounded-2xl bg-white p-4" noValidate>
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-tiza text-goma">
            <Scale size={22} aria-hidden />
          </span>
          <p className="text-sm text-tinta-suave">
            Último registrado: <span className="cifra font-semibold text-tinta">{kg(meta.pesoActualKg)}</span>
            {faltan !== undefined && faltan > 0 && (
              <>
                . Te faltan <span className="cifra font-semibold text-tinta">{kg(faltan)}</span> para tu meta.
              </>
            )}
          </p>
        </div>
        {(alumno.pesos?.length ?? 0) >= 2 && (
          <div className="mt-4">
            <GraficoPeso alumno={alumno} />
          </div>
        )}
        <div className="mt-3 flex gap-2">
          <label htmlFor="peso-mes" className="sr-only">
            Tu peso de hoy en kilos
          </label>
          <Entrada id="peso-mes" inputMode="decimal" placeholder="Ej: 70,5" value={valor} onChange={(e) => setValor(e.target.value)} className="cifra" />
          <Boton type="submit" disabled={!valor.trim()}>
            Guardar
          </Boton>
        </div>
        {mensaje && (
          <p role="status" className={clsx('mt-2 text-sm', mensaje.ok ? 'text-exito-oscuro' : 'text-peligro')}>
            {mensaje.texto}
          </p>
        )}
      </form>
    </Seccion>
  );
}
