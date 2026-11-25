import clsx from 'clsx';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { BookOpen, Check, History, Minus, Plus, Star, Undo2, X } from 'lucide-react';
import { cerrarSesion, descartarSesion, deshacerSerie, ErrorDominio, registrarSerie } from '@/data/api';
import { useCatalogo, usePlan, useSesionesDe } from '@/data/consultas';
import { usaBarra } from '@/domain/discos';
import { records, tonelajeSesion, ultimaEjecucion } from '@/domain/metricas';
import type { ErrorRegla } from '@/domain/reglas';
import type { Ejercicio, ItemPlan, Sesion } from '@/domain/tipos';
import { useAlumnoActual } from '@/lib/sesion-usuario';
import { duracion, kg, numero, prescripcion, resumenSeries, serieTexto } from '@/lib/formato';
import { sonidos, vibrar } from '@/lib/sonido';
import { Area, Boton, Errores } from '@/ui/base';
import { BarraDiscos } from '@/ui/BarraDiscos';
import { BotonSonido } from '@/ui/BotonSonido';
import { EscalaEsfuerzo, Termino } from '@/ui/didactico';
import { DetalleEjercicio } from '@/ui/DetalleEjercicio';
import { festejar } from '@/ui/Festejo';
import { Medalla } from '@/ui/Medalla';
import { Contador } from '@/ui/pagina';
import { logrosNuevos } from '@/domain/logros';
import { BARRA_TIPO, EtiquetaTipo } from '@/ui/tipo';

export function SesionEnCursoPage() {
  const alumno = useAlumnoActual();
  const sesiones = useSesionesDe(alumno.id);
  const abierta = sesiones.find((s) => !s.cerradaEn);
  const [cerradaId, setCerradaId] = useState<string | null>(null);
  const cerrada = sesiones.find((s) => s.id === cerradaId);

  if (cerrada) return <SesionTerminada sesion={cerrada} historial={sesiones} />;
  if (!abierta) return <Navigate to="/alumno" replace />;
  return <Registro sesion={abierta} historial={sesiones} onCerrada={setCerradaId} />;
}

function Registro({ sesion, historial, onCerrada }: { sesion: Sesion; historial: Sesion[]; onCerrada: (id: string) => void }) {
  const plan = usePlan(sesion.planId);
  const { porId } = useCatalogo();
  const navegar = useNavigate();
  const items = plan?.dias[sesion.dia - 1].items ?? [];

  const hechas = (it: ItemPlan) => sesion.ejercicios.find((e) => e.itemId === it.id)?.series ?? [];
  const primerPendiente = Math.max(0, items.findIndex((it) => hechas(it).length < it.series));
  const [indice, setIndice] = useState(primerPendiente);
  const [cerrando, setCerrando] = useState(false);
  const [descanso, setDescanso] = useState<{ hasta: number; total: number } | null>(null);
  const finDescanso = useCallback(() => setDescanso(null), []);

  const item = items[indice];
  const ejercicio = item ? porId.get(item.ejercicioId) : undefined;
  const todoHecho = items.length > 0 && items.every((it) => hechas(it).length >= it.series);
  const totalSeries = items.reduce((t, it) => t + it.series, 0);
  const seriesHechas = items.reduce((t, it) => t + Math.min(it.series, hechas(it).length), 0);

  if (!plan || !item || !ejercicio) return <Navigate to="/alumno" replace />;

  const alGuardar = () => {
    const series = hechas(item).length + 1;
    if (series >= item.series) {
      // Terminado este ejercicio: festejar y pasar al siguiente pendiente.
      const siguiente = items.findIndex((it, i) => i > indice && hechas(it).length < it.series);
      const quedaAlgo = items.some((it, i) => i !== indice && hechas(it).length < it.series);
      if (series === item.series) sonidos.ejercicio();
      else sonidos.serie();
      if (siguiente >= 0) setIndice(siguiente);
      else if (!quedaAlgo) setCerrando(true);
    } else {
      sonidos.serie();
    }
    vibrar(30);
    if (item.descansoSeg > 0 && series < item.series) {
      setDescanso({ hasta: Date.now() + item.descansoSeg * 1000, total: item.descansoSeg });
    }
  };

  return (
    <div className="-mx-5 flex min-h-dvh flex-col">
      <header className="bg-goma px-5 pb-5 pt-4 text-white">
        <div className="flex items-center justify-between gap-2">
          <p className="min-w-0 truncate font-semibold">
            Día {sesion.dia}
            {plan.dias[sesion.dia - 1].titulo && <span className="font-normal text-tiza/70">: {plan.dias[sesion.dia - 1].titulo}</span>}
          </p>
          <div className="flex shrink-0 items-center">
            <BotonSonido oscuro />
            <button
              onClick={() => {
                if (sesion.ejercicios.every((e) => e.series.length === 0)) descartarSesion(sesion.id);
                navegar('/alumno');
              }}
              className="rounded-lg p-2 text-tiza/70 hover:bg-white/10 hover:text-white"
              aria-label="Salir de la sesión"
              title="Salir (lo anotado queda guardado)"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        <p className="mt-3 text-sm text-tiza/70">
          <span className="marcador text-base text-white">{seriesHechas}</span> de {totalSeries} series del día
        </p>
        <nav aria-label="Ejercicios del día" className="mt-2 flex gap-1.5">
          {items.map((it, i) => {
            const ej = porId.get(it.ejercicioId);
            const n = hechas(it).length;
            return (
              <button
                key={it.id}
                onClick={() => {
                  sonidos.toque();
                  setIndice(i);
                  setCerrando(false);
                }}
                aria-current={i === indice && !cerrando ? 'step' : undefined}
                aria-label={`${ej?.nombre}: ${n} de ${it.series} series`}
                className={clsx(
                  'h-3 flex-1 overflow-hidden rounded-full bg-white/15',
                  i === indice && !cerrando && 'ring-2 ring-white ring-offset-2 ring-offset-goma',
                )}
              >
                <span
                  className={clsx('block h-full rounded-full transition-[width] duration-300', ej ? BARRA_TIPO[ej.tipo] : 'bg-chispa')}
                  style={{ width: `${Math.min(100, (n / it.series) * 100)}%` }}
                />
              </button>
            );
          })}
        </nav>
      </header>

      {cerrando ? (
        <Cierre sesion={sesion} todoHecho={todoHecho} onVolver={() => setCerrando(false)} onCerrada={() => onCerrada(sesion.id)} />
      ) : (
        <PantallaEjercicio
          key={item.id}
          sesion={sesion}
          item={item}
          ejercicio={ejercicio}
          historial={historial}
          posicion={`${indice + 1} de ${items.length}`}
          descanso={descanso}
          onFinDescanso={finDescanso}
          onGuardada={alGuardar}
          onSiguiente={indice < items.length - 1 ? () => setIndice(indice + 1) : undefined}
          onTerminar={() => setCerrando(true)}
        />
      )}
    </div>
  );
}

function Paso({
  etiqueta,
  valor,
  unidad,
  onCambiar,
  paso,
  min = 0,
  ayuda,
}: {
  etiqueta: string;
  valor: number;
  unidad?: string;
  onCambiar: (v: number) => void;
  paso: number;
  min?: number;
  ayuda?: ReactNode;
}) {
  const [texto, setTexto] = useState<string | null>(null);
  const cambiar = (v: number) => {
    sonidos.toque();
    onCambiar(v);
  };
  return (
    <div className="flex flex-col items-center rounded-3xl border-2 border-tiza-300 bg-white px-2 pb-3 pt-3">
      <div className="flex items-center gap-1 text-sm font-semibold text-tinta-suave">
        <label htmlFor={`paso-${etiqueta}`}>
          {etiqueta}
          {unidad && <span className="font-normal">, {unidad}</span>}
        </label>
        {ayuda}
      </div>
      <div className="w-full">
        <input
          id={`paso-${etiqueta}`}
          inputMode="decimal"
          value={texto ?? numero(valor)}
          onFocus={(e) => {
            setTexto(String(valor));
            e.target.select();
          }}
          onChange={(e) => setTexto(e.target.value)}
          onBlur={() => {
            const n = Number((texto ?? '').replace(',', '.'));
            if (Number.isFinite(n) && n >= min) onCambiar(n);
            setTexto(null);
          }}
          className={clsx(
            'marcador h-16 w-full min-w-0 bg-transparent text-center text-tinta focus:outline-none',
            (texto ?? numero(valor)).length > 3 ? 'text-[2.3rem]' : 'text-[3.1rem]',
          )}
        />
      </div>
      <div className="mt-1 grid w-full grid-cols-2 gap-2">
        <button
          onClick={() => cambiar(Math.max(min, Math.round((valor - paso) * 100) / 100))}
          className="grid h-12 place-items-center rounded-2xl bg-tiza text-goma active:bg-tiza-300"
          aria-label={`Restar ${String(paso).replace('.', ',')} a ${etiqueta.toLowerCase()}`}
        >
          <Minus size={22} />
        </button>
        <button
          onClick={() => cambiar(Math.round((valor + paso) * 100) / 100)}
          className="grid h-12 place-items-center rounded-2xl bg-tiza text-goma active:bg-tiza-300"
          aria-label={`Sumar ${String(paso).replace('.', ',')} a ${etiqueta.toLowerCase()}`}
        >
          <Plus size={22} />
        </button>
      </div>
    </div>
  );
}

function PantallaEjercicio({
  sesion,
  item,
  ejercicio,
  historial,
  posicion,
  descanso,
  onFinDescanso,
  onGuardada,
  onSiguiente,
  onTerminar,
}: {
  sesion: Sesion;
  item: ItemPlan;
  ejercicio: Ejercicio;
  historial: Sesion[];
  posicion: string;
  descanso: { hasta: number; total: number } | null;
  onFinDescanso: () => void;
  onGuardada: () => void;
  onSiguiente?: () => void;
  onTerminar: () => void;
}) {
  const porTiempo = ejercicio.medicion === 'TIEMPO';
  const hechas = sesion.ejercicios.find((e) => e.itemId === item.id)?.series ?? [];
  const anterior = useMemo(() => ultimaEjecucion(historial, ejercicio.id, sesion.id), [historial, ejercicio.id, sesion.id]);
  const numeroSerie = hechas.length + 1;
  const completo = hechas.length >= item.series;
  const conBarra = !porTiempo && usaBarra(ejercicio.equipo);
  const primeraVez = !anterior;
  const [guia, setGuia] = useState(primeraVez);
  const [errores, setErrores] = useState<ErrorRegla[]>([]);

  // Valores iniciales: la última serie de hoy o lo pautado. Autocompletar con la sesión anterior
  // es una opción del alumno (así lo pide el documento), con el botón "Usar lo de la vez anterior".
  const referencia = hechas.at(-1);
  const [peso, setPeso] = useState(referencia?.pesoKg ?? item.cargaKg ?? 0);
  const [reps, setReps] = useState(referencia?.repeticiones ?? item.repeticiones ?? 10);
  const [tiempo, setTiempo] = useState(referencia?.tiempoSeg ?? item.tiempoSeg ?? 30);
  const serieAnterior = anterior?.series[Math.min(hechas.length, anterior.series.length - 1)];
  const usarAnterior = () => {
    if (!serieAnterior) return;
    sonidos.toque();
    if (serieAnterior.pesoKg !== undefined) setPeso(serieAnterior.pesoKg);
    if (serieAnterior.repeticiones !== undefined) setReps(serieAnterior.repeticiones);
    if (serieAnterior.tiempoSeg !== undefined) setTiempo(serieAnterior.tiempoSeg);
  };
  const yaEsAnterior =
    !!serieAnterior &&
    (porTiempo ? serieAnterior.tiempoSeg === tiempo : serieAnterior.pesoKg === peso && serieAnterior.repeticiones === reps);

  const guardar = () => {
    try {
      registrarSerie(sesion.id, item.id, porTiempo ? { tiempoSeg: tiempo } : { pesoKg: peso, repeticiones: reps });
      setErrores([]);
      onGuardada();
    } catch (e) {
      if (e instanceof ErrorDominio) {
        sonidos.error();
        setErrores(e.errores);
      } else throw e;
    }
  };

  return (
    <div className="flex flex-1 flex-col px-5 pb-8 pt-5">
      <div className="flex items-center gap-2 text-sm text-tinta-suave">
        <span>Ejercicio {posicion}</span>
        <EtiquetaTipo tipo={ejercicio.tipo} />
      </div>
      <div className="mt-1 flex items-start justify-between gap-3">
        <h1 className="text-[1.85rem] leading-tight">{ejercicio.nombre}</h1>
        <button
          onClick={() => setGuia(!guia)}
          aria-expanded={guia}
          className={clsx(
            'mt-0.5 inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold',
            guia ? 'bg-goma text-white' : 'bg-white text-tinta',
          )}
        >
          <BookOpen size={18} aria-hidden /> Cómo se hace
        </button>
      </div>
      <p className="cifra mt-1 text-tinta-suave">
        Pautado: <span className="font-semibold text-tinta">{prescripcion(item)}</span>
        {!porTiempo && item.cargaKg !== undefined && `, ${kg(item.cargaKg)}`}
        {item.descansoSeg > 0 && `, ${duracion(item.descansoSeg)} de descanso`}
      </p>

      {guia && (
        <section aria-label="Cómo se hace" className="aparecer mt-4 rounded-2xl bg-white p-4">
          {primeraVez && (
            <p className="mb-3 rounded-lg bg-chispa-claro px-3 py-2 text-sm">
              <span className="font-semibold">Primera vez con este ejercicio:</span> mirá la animación, empezá liviano y priorizá la técnica.
            </p>
          )}
          <DetalleEjercicio ejercicio={ejercicio} notaEntrenador={item.notas} />
        </section>
      )}

      {descanso ? (
        <Descanso {...descanso} onFin={onFinDescanso} />
      ) : (
        <>
          <h2 className="mt-6 text-xl">
            {completo ? (
              'Series completas'
            ) : (
              <>
                <Termino clave="serie">Serie</Termino> {numeroSerie} de {item.series}
              </>
            )}
          </h2>
          {anterior ? (
            <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
              <p className="cifra text-sm text-tinta-suave">La vez anterior: {resumenSeries(anterior.series, ejercicio.medicion)}</p>
              {serieAnterior && !completo && (
                <button
                  onClick={usarAnterior}
                  disabled={yaEsAnterior}
                  className="inline-flex items-center gap-1.5 rounded-full border-2 border-goma/20 bg-white px-3 py-1 text-sm font-semibold text-goma hover:border-goma/50 disabled:opacity-50"
                >
                  <History size={14} aria-hidden /> {yaEsAnterior ? 'Valores de la vez anterior' : 'Usar lo de la vez anterior'}
                </button>
              )}
            </div>
          ) : (
            <p className="mt-0.5 text-sm text-tinta-suave">Todavía no hay una sesión anterior para comparar.</p>
          )}

          <div className={clsx('mt-4 grid gap-3', porTiempo ? 'grid-cols-1' : 'grid-cols-2')}>
            {porTiempo ? (
              <Paso etiqueta="Segundos" valor={tiempo} onCambiar={setTiempo} paso={5} ayuda={<Termino clave="isometrico">{''}</Termino>} />
            ) : (
              <>
                <Paso etiqueta="Peso" unidad="kg" valor={peso} onCambiar={setPeso} paso={2.5} ayuda={<Termino clave="carga">{''}</Termino>} />
                <Paso etiqueta="Reps" valor={reps} onCambiar={setReps} paso={1} ayuda={<Termino clave="repeticion">{''}</Termino>} />
              </>
            )}
          </div>

          {conBarra && peso > 0 && (
            <div className="mt-3">
              <BarraDiscos totalKg={peso} />
            </div>
          )}

          {errores.length > 0 && (
            <div className="mt-3">
              <Errores errores={errores} />
            </div>
          )}

          <Boton tamano="lg" className="mt-4 w-full" onClick={guardar} icono={<Check size={22} aria-hidden />} variante={completo ? 'secundario' : 'primario'}>
            {completo ? 'Agregar serie extra' : 'Guardar serie'}
          </Boton>
        </>
      )}

      {hechas.length > 0 && (
        <section aria-label="Series registradas" className="mt-5">
          <ol className="flex flex-wrap gap-2">
            {hechas.map((s) => (
              <li key={s.numero} className="cifra inline-flex items-center gap-1.5 rounded-full bg-white py-1.5 pl-1.5 pr-3 text-sm">
                <span
                  className={clsx(
                    'marcador grid h-6 w-6 place-items-center rounded-full text-xs',
                    BARRA_TIPO[ejercicio.tipo],
                    ejercicio.tipo === 'ZONA_MEDIA' ? 'text-goma' : 'text-white',
                  )}
                >
                  {s.numero}
                </span>
                {serieTexto(s, ejercicio.medicion)}
              </li>
            ))}
            <li>
              <button
                onClick={() => {
                  sonidos.deshacer();
                  deshacerSerie(sesion.id, item.id);
                }}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-tinta-suave hover:bg-white"
              >
                <Undo2 size={14} aria-hidden /> Deshacer la última
              </button>
            </li>
          </ol>
        </section>
      )}

      <div className="mt-auto flex gap-2 pt-8">
        {onSiguiente && (
          <Boton variante="secundario" className="flex-1" onClick={onSiguiente}>
            Siguiente
          </Boton>
        )}
        <Boton variante="fantasma" className="flex-1" onClick={onTerminar}>
          Terminar sesión
        </Boton>
      </div>
    </div>
  );
}

function Descanso({ hasta, total, onFin }: { hasta: number; total: number; onFin: () => void }) {
  const [restante, setRestante] = useState(() => Math.max(0, Math.ceil((hasta - Date.now()) / 1000)));
  const ultimoAviso = useRef<number | null>(null);

  useEffect(() => {
    const t = setInterval(() => {
      const r = Math.max(0, Math.ceil((hasta - Date.now()) / 1000));
      setRestante(r);
      if (r !== ultimoAviso.current && r <= 3 && r > 0) {
        ultimoAviso.current = r;
        sonidos.cuenta();
      }
      if (r === 0) {
        sonidos.vamos();
        vibrar([120, 60, 120]);
        onFin();
      }
    }, 200);
    return () => clearInterval(t);
  }, [hasta, onFin]);

  const progreso = 1 - restante / total;
  const R = 54;
  const C = 2 * Math.PI * R;

  return (
    <div className="aparecer mt-6 flex flex-col items-center rounded-3xl bg-goma px-5 py-7 text-white" role="timer" aria-live="off">
      <p className="text-tiza/80">
        <Termino clave="descanso" oscuro>
          Descansá
        </Termino>
      </p>
      <div className="relative mt-3 grid place-items-center">
        <svg viewBox="0 0 120 120" className="h-44 w-44 -rotate-90" aria-hidden>
          <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="8" />
          <circle
            cx="60"
            cy="60"
            r={R}
            fill="none"
            stroke="#FFC83D"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - progreso)}
            style={{ transition: 'stroke-dashoffset 200ms linear' }}
          />
        </svg>
        <p className="marcador absolute text-5xl" aria-label={`${restante} segundos de descanso`}>
          {restante >= 60 ? `${Math.floor(restante / 60)}:${String(restante % 60).padStart(2, '0')}` : restante}
        </p>
      </div>
      <p className="mt-3 max-w-60 text-center text-sm text-tiza/70">Respirá hondo. Te avisamos con un sonido cuando haya que volver.</p>
      <button onClick={onFin} className="mt-4 rounded-xl px-4 py-2 font-semibold text-chispa hover:bg-white/10">
        Saltar descanso
      </button>
      <span className="sr-only">Descanso de {duracion(total)}</span>
    </div>
  );
}

function Cierre({ sesion, todoHecho, onVolver, onCerrada }: { sesion: Sesion; todoHecho: boolean; onVolver: () => void; onCerrada: () => void }) {
  const [esfuerzo, setEsfuerzo] = useState<number | undefined>();
  const [comentario, setComentario] = useState('');
  const [errores, setErrores] = useState<ErrorRegla[]>([]);

  const cerrar = () => {
    try {
      cerrarSesion(sesion.id, esfuerzo, comentario);
      onCerrada();
    } catch (e) {
      if (e instanceof ErrorDominio) {
        sonidos.error();
        setErrores(e.errores);
      } else throw e;
    }
  };

  return (
    <div className="aparecer flex flex-1 flex-col px-5 pb-8 pt-6">
      <h1 className="text-3xl leading-tight">{todoHecho ? `¡Listo el Día ${sesion.dia}!` : 'Cerrar la sesión'}</h1>
      {!todoHecho && <p className="mt-1 text-tinta-suave">Quedaron series sin anotar. Tu entrenador lo va a ver así.</p>}

      <fieldset className="mt-8">
        <legend className="text-lg font-bold">
          ¿Cuánto te costó? <Termino clave="esfuerzo">{''}</Termino>
        </legend>
        <EscalaEsfuerzo valor={esfuerzo} onCambiar={setEsfuerzo} />
      </fieldset>

      <label className="mt-6 block">
        <span className="font-semibold">Comentario para tu entrenador</span>
        <span className="block text-sm text-tinta-suave">Opcional. Molestias, ejercicios que te resultaron fáciles, lo que quieras contarle.</span>
        <Area className="mt-2" value={comentario} onChange={(e) => setComentario(e.target.value)} placeholder="Ej: molestia en el hombro en la 3ra serie" maxLength={500} />
      </label>

      {errores.length > 0 && (
        <div className="mt-4">
          <Errores errores={errores} />
        </div>
      )}

      <div className="mt-auto space-y-2 pt-8">
        <Boton tamano="lg" className="w-full" onClick={cerrar}>
          Cerrar sesión
        </Boton>
        <Boton variante="fantasma" className="w-full" onClick={onVolver}>
          Volver a los ejercicios
        </Boton>
      </div>
    </div>
  );
}

function SesionTerminada({ sesion, historial }: { sesion: Sesion; historial: Sesion[] }) {
  const { porId } = useCatalogo();
  const nuevos = useMemo(() => {
    const previos = records(historial.filter((s) => s.id !== sesion.id));
    const actuales = records([sesion]);
    return [...actuales.values()]
      .filter((r) => r.pesoKg > (previos.get(r.ejercicioId)?.pesoKg ?? Infinity))
      .map((r) => ({ ...r, ejercicio: porId.get(r.ejercicioId) as Ejercicio | undefined }));
  }, [historial, sesion, porId]);

  const logros = useMemo(
    () => logrosNuevos(historial.filter((s) => s.id !== sesion.id), historial),
    [historial, sesion.id],
  );

  // Un solo festejo al llegar: trompeta y lluvia grande si hubo logro o récord; acorde y lluvia chica si no.
  const hayPremio = nuevos.length > 0 || logros.length > 0;
  useEffect(() => {
    if (hayPremio) {
      sonidos.victoria();
      festejar({ cantidad: 240 });
      vibrar([80, 40, 80, 40, 220]);
    } else {
      sonidos.cierre();
      festejar({ cantidad: 90 });
      vibrar(120);
    }
  }, [hayPremio]);

  return (
    <div className="-mx-5 flex min-h-dvh flex-col">
      <div className="relative overflow-hidden bg-goma px-5 pb-10 pt-12 text-center text-white">
        <span className="pointer-events-none absolute -left-12 -top-12 h-40 w-40 rounded-[3rem] bg-superior/60" aria-hidden />
        <span className="pointer-events-none absolute right-6 top-8 h-12 w-12 rounded-full bg-chispa" aria-hidden />
        <span className="pointer-events-none absolute -bottom-16 -right-10 h-40 w-40 rounded-full bg-inferior/50" aria-hidden />
        <p className="relative text-tiza/80">Sesión cerrada</p>
        <h1 className="relative mt-1 text-4xl leading-none">¡Día {sesion.dia} completo!</h1>
        <p className="marcador relative mt-7 text-5xl text-chispa">
          <Contador valor={tonelajeSesion(sesion)} duracion={1400} /> kg
        </p>
        <p className="relative mt-1 text-tiza/80">
          de <Termino clave="tonelaje" oscuro>tonelaje</Termino> en esta sesión
        </p>
      </div>

      <div className="flex flex-1 flex-col px-5 pb-8">
        {logros.length > 0 && (
          <section aria-label="Logros nuevos" className="mt-7">
            <h2 className="text-center text-xl">{logros.length === 1 ? '¡Ganaste un logro!' : `¡Ganaste ${logros.length} logros!`}</h2>
            <ul className="mt-4 grid gap-3">
              {logros.map((l, i) => (
                <li key={l.id} className="subir flex items-center gap-4 rounded-2xl bg-white p-4 shadow-hoja" style={{ animationDelay: `${300 + i * 180}ms` }}>
                  <Medalla logro={l} ganada animar tamano={56} />
                  <span>
                    <span className="display block text-lg leading-tight">{l.titulo}</span>
                    <span className="text-sm text-tinta-suave">{l.comoSeGana}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {nuevos.length > 0 && (
          <section aria-label="Récords nuevos" className="mt-7">
            <h2 className="text-center text-xl">
              <Termino clave="record">{nuevos.length === 1 ? 'Récord personal' : 'Récords personales'}</Termino>
            </h2>
            <ul className="mt-4 space-y-2">
              {nuevos.map((r, i) => (
                <li
                  key={r.ejercicioId}
                  className="subir destello flex items-center gap-3 rounded-2xl bg-chispa px-4 py-3 text-left font-semibold text-goma"
                  style={{ animationDelay: `${500 + i * 150}ms` }}
                >
                  <Star size={22} className="shrink-0" fill="currentColor" aria-hidden />
                  <span className="flex-1">{r.ejercicio?.nombre}</span>
                  <span className="marcador text-lg">{kg(r.pesoKg)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {!hayPremio && (
          <p className="mx-auto mt-8 max-w-xs text-center text-tinta-suave">
            Cada sesión anotada suma. Tu entrenador ya puede ver cómo te fue.
          </p>
        )}

        <Link
          to="/alumno"
          className="mx-auto mt-auto inline-flex min-h-14 w-full max-w-sm items-center justify-center rounded-xl bg-goma text-lg font-semibold text-white hover:bg-goma-700"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
