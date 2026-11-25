import clsx from 'clsx';
import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowDown, ArrowLeft, ArrowUp, Check, Copy, Plus, Trash2 } from 'lucide-react';
import { sonidos } from '@/lib/sonido';
import type { ErrorRegla } from '@/domain/reglas';
import { asignarPlanAVarios, ErrorDominio, guardarPlan, nuevoItemId, planVacio } from '@/data/api';
import { useAlumnosDe } from '@/data/consultas';
import { useAlumno, useCatalogo, usePlan } from '@/data/consultas';
import { NOMBRE_GRUPO } from '@/domain/clasificacion';
import { validarPlan } from '@/domain/reglas';
import type { DiaPlan, Ejercicio, ItemPlan, NumeroDia, Plan } from '@/domain/tipos';
import { useEntrenador } from '@/lib/sesion-usuario';
import { Boton, Campo, Entrada, Errores, Vacio } from '@/ui/base';
import { BARRA_TIPO } from '@/ui/tipo';
import { SelectorEjercicio } from './SelectorEjercicio';

export function PlanEditorPage() {
  const { planId, alumnoId } = useParams();
  const existente = usePlan(planId);
  const entrenador = useEntrenador();
  const alumno = useAlumno(existente?.alumnoId ?? alumnoId);

  if (planId && !existente) return <Vacio titulo="Ese plan no existe" />;
  if (!alumno) return <Vacio titulo="Ese alumno no existe" />;

  return (
    <Editor
      key={planId ?? 'nuevo'}
      inicial={existente ?? planVacio(entrenador.id, alumno.id)}
      alumnoNombre={alumno.nombre}
      esNuevo={!existente}
    />
  );
}

function Editor({ inicial, alumnoNombre, esNuevo }: { inicial: Plan; alumnoNombre: string; esNuevo: boolean }) {
  const navegar = useNavigate();
  const { lista: catalogo, porId } = useCatalogo();
  const [plan, setPlan] = useState<Plan>(inicial);
  const [eligiendoPara, setEligiendoPara] = useState<NumeroDia | null>(null);
  const [intentoGuardar, setIntentoGuardar] = useState(false);
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null);
  const [otros, setOtros] = useState<Set<string>>(new Set());
  const entrenador = useEntrenador();
  const companeros = useAlumnosDe(entrenador.id).filter((a) => a.id !== inicial.alumnoId);

  const errores = useMemo(() => validarPlan(plan, catalogo), [plan, catalogo]);
  const erroresDe = (campo: string) => errores.filter((e) => e.campo === campo);

  const cambiarDia = (numero: NumeroDia, cambio: (d: DiaPlan) => DiaPlan) =>
    setPlan((p) => ({ ...p, dias: p.dias.map((d) => (d.numero === numero ? cambio(d) : d)) as Plan['dias'] }));

  const agregar = (ej: Ejercicio) => {
    if (!eligiendoPara) return;
    const item: ItemPlan =
      ej.medicion === 'TIEMPO'
        ? { id: nuevoItemId(), ejercicioId: ej.id, series: ej.tipo === 'CARDIO' ? 1 : 3, tiempoSeg: ej.tipo === 'CARDIO' ? 900 : 30, descansoSeg: ej.tipo === 'CARDIO' ? 0 : 45 }
        : { id: nuevoItemId(), ejercicioId: ej.id, series: 3, repeticiones: 10, descansoSeg: 90, cargaKg: ej.tipo === 'CARDIO' || !ej.equipo ? undefined : 20 };
    cambiarDia(eligiendoPara, (d) => ({ ...d, items: [...d.items, item] }));
    sonidos.toque();
    setEligiendoPara(null);
  };

  const copiarDia = (desde: NumeroDia, hacia: NumeroDia) => {
    const origen = plan.dias[desde - 1];
    cambiarDia(hacia, (d) => ({ ...d, items: origen.items.map((i) => ({ ...i, id: nuevoItemId() })) }));
  };

  const guardar = (asignar: boolean) => {
    setIntentoGuardar(true);
    setErrorGuardado(null);
    if (errores.length) {
      sonidos.error();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    try {
      if (asignar) asignarPlanAVarios(plan, [...otros]);
      else guardarPlan(plan, { asignar: false });
      sonidos.ok();
      navegar(`/entrenador/alumnos/${plan.alumnoId}`);
    } catch (e) {
      sonidos.error();
      setErrorGuardado(e instanceof ErrorDominio ? e.message : 'No se pudo guardar el plan.');
    }
  };

  const total = plan.dias.reduce((t, d) => t + d.items.length, 0);

  return (
    <div className="mx-auto max-w-7xl pb-28">
      <Link
        to={`/entrenador/alumnos/${plan.alumnoId}`}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-tinta-suave hover:text-tinta"
      >
        <ArrowLeft size={16} aria-hidden /> {alumnoNombre}
      </Link>
      <h1 className="mt-4 text-3xl">{esNuevo ? `Plan nuevo para ${alumnoNombre}` : 'Editar plan'}</h1>
      <p className="mt-1 max-w-2xl text-tinta-suave">
        Tres días, cada uno con su propia lista ordenada de ejercicios. Los días no pueden ser iguales entre sí.
      </p>

      <div className="mt-8 grid gap-4 rounded-2xl bg-white p-5 shadow-hoja md:grid-cols-[2fr_1fr_1fr]">
        <Campo etiqueta="Nombre del plan" error={intentoGuardar ? erroresDe('nombre')[0]?.mensaje : undefined}>
          {(p) => (
            <Entrada {...p} value={plan.nombre} placeholder="Por ejemplo: Fuerza base, bloque 1" onChange={(e) => setPlan({ ...plan, nombre: e.target.value })} />
          )}
        </Campo>
        <Campo etiqueta="Vigente desde" error={intentoGuardar ? erroresDe('vigencia')[0]?.mensaje : undefined}>
          {(p) => <Entrada {...p} type="date" value={plan.vigenciaDesde} onChange={(e) => setPlan({ ...plan, vigenciaDesde: e.target.value })} />}
        </Campo>
        <Campo etiqueta="Hasta">
          {(p) => <Entrada {...p} type="date" value={plan.vigenciaHasta} onChange={(e) => setPlan({ ...plan, vigenciaHasta: e.target.value })} />}
        </Campo>
      </div>

      <ReglasPlan plan={plan} errores={errores} />

      {companeros.length > 0 && (
        <section aria-labelledby="titulo-destino" className="mt-4 rounded-2xl bg-white p-4 shadow-hoja">
          <h2 id="titulo-destino" className="text-lg">¿A quién se lo asignás?</h2>
          <p className="text-sm text-tinta-suave">El plan es para {alumnoNombre}. También podés asignárselo a otros alumnos: cada uno recibe su copia.</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            <li className="rounded-full bg-goma px-3 py-1.5 text-sm font-semibold text-white">{alumnoNombre}</li>
            {companeros.map((a) => {
              const marcado = otros.has(a.id);
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    aria-pressed={marcado}
                    onClick={() => setOtros((s) => { const n = new Set(s); if (marcado) n.delete(a.id); else n.add(a.id); return n; })}
                    className={clsx('rounded-full border-2 px-3 py-1 text-sm font-semibold', marcado ? 'border-goma bg-tiza-200 text-goma' : 'border-tiza-300 text-tinta-suave hover:border-goma/40')}
                  >
                    {marcado ? '✓ ' : '+ '}{a.nombre}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {intentoGuardar && errores.length > 0 && (
        <div className="mt-4">
          <Errores errores={errores} />
        </div>
      )}
      {errorGuardado && (
        <div className="mt-4">
          <Errores errores={[{ mensaje: errorGuardado }]} />
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 items-start gap-4 xl:grid-cols-3">
        {plan.dias.map((dia) => (
          <ColumnaDia
            key={dia.numero}
            dia={dia}
            porId={porId}
            errores={intentoGuardar ? erroresDe(`dia-${dia.numero}`).map((e) => e.mensaje) : []}
            itemsConError={new Set(intentoGuardar ? errores.filter((e) => e.campo.startsWith('item-')).map((e) => e.campo.slice(5)) : [])}
            onCambiar={(c) => cambiarDia(dia.numero, c)}
            onAgregar={() => setEligiendoPara(dia.numero)}
            onCopiarDe={(desde) => copiarDia(desde, dia.numero)}
          />
        ))}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-tiza-300 bg-white/95 backdrop-blur md:left-60">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-10">
          <p className="text-sm text-tinta-suave">
            {total === 1 ? '1 ejercicio' : `${total} ejercicios`} en el plan
            {errores.length > 0 && intentoGuardar && <span className="text-peligro">, revisá los avisos de arriba</span>}
          </p>
          <div className="flex gap-2">
            <Boton variante="secundario" onClick={() => guardar(false)}>
              Guardar borrador
            </Boton>
            <Boton onClick={() => guardar(true)}>Asignar a {alumnoNombre.split(' ')[0]}{otros.size > 0 && ` y ${otros.size} más`}</Boton>
          </div>
        </div>
      </div>

      <SelectorEjercicio
        abierto={eligiendoPara !== null}
        onCerrar={() => setEligiendoPara(null)}
        onElegir={agregar}
        catalogo={catalogo}
        titulo={`Agregar al Día ${eligiendoPara ?? ''}`}
      />
    </div>
  );
}

/** Las reglas del plan como lista que se va tildando: el entrenador ve qué falta antes de guardar. */
function ReglasPlan({ plan, errores }: { plan: Plan; errores: ErrorRegla[] }) {
  const hay = (pred: (e: ErrorRegla) => boolean) => errores.some(pred);
  const reglas = [
    { texto: 'Tiene nombre', ok: !hay((e) => e.campo === 'nombre') },
    { texto: 'Los 3 días tienen al menos un ejercicio', ok: plan.dias.every((d) => d.items.length > 0) },
    {
      texto: 'Los 3 días son distintos entre sí',
      ok: plan.dias.every((d) => d.items.length > 0) && !hay((e) => e.mensaje.includes('es igual al')),
    },
    { texto: 'Cada ejercicio tiene series y repeticiones o tiempo', ok: !hay((e) => e.campo.startsWith('item-')) },
    { texto: 'Las fechas de vigencia son correctas', ok: !hay((e) => e.campo === 'vigencia') },
  ];
  const cumplidas = reglas.filter((r) => r.ok).length;

  return (
    <section aria-labelledby="titulo-reglas" className="mt-4 rounded-2xl bg-white p-4 shadow-hoja">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="titulo-reglas" className="text-lg">
          Antes de asignar
        </h2>
        <p className="cifra text-sm text-tinta-suave" aria-live="polite">
          {cumplidas} de {reglas.length} listas
        </p>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-tiza" aria-hidden>
        <div className="h-full rounded-full bg-exito transition-[width] duration-300" style={{ width: `${(cumplidas / reglas.length) * 100}%` }} />
      </div>
      <ul className="mt-3 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2 xl:grid-cols-3">
        {reglas.map((r) => (
          <li key={r.texto} className={clsx('flex items-center gap-2', r.ok ? 'text-tinta' : 'text-tinta-suave')}>
            <span
              className={clsx(
                'grid h-5 w-5 shrink-0 place-items-center rounded-full border-2',
                r.ok ? 'border-exito bg-exito text-white' : 'border-tiza-300',
              )}
              aria-hidden
            >
              {r.ok && <Check size={12} strokeWidth={3} />}
            </span>
            <span>
              {r.texto}
              <span className="sr-only">{r.ok ? ': cumplida' : ': pendiente'}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ColumnaDia({
  dia,
  porId,
  errores,
  itemsConError,
  onCambiar,
  onAgregar,
  onCopiarDe,
}: {
  dia: DiaPlan;
  porId: Map<string, Ejercicio>;
  errores: string[];
  itemsConError: Set<string>;
  onCambiar: (c: (d: DiaPlan) => DiaPlan) => void;
  onAgregar: () => void;
  onCopiarDe: (desde: NumeroDia) => void;
}) {
  const otros = ([1, 2, 3] as NumeroDia[]).filter((n) => n !== dia.numero);
  const mover = (i: number, delta: number) =>
    onCambiar((d) => {
      const items = [...d.items];
      const [x] = items.splice(i, 1);
      items.splice(i + delta, 0, x);
      return { ...d, items };
    });
  const actualizar = (id: string, cambio: Partial<ItemPlan>) =>
    onCambiar((d) => ({ ...d, items: d.items.map((it) => (it.id === id ? { ...it, ...cambio } : it)) }));

  return (
    <section
      aria-label={`Día ${dia.numero}`}
      className={clsx('min-w-0 rounded-2xl bg-tiza-200/60 p-3', errores.length && 'ring-2 ring-peligro/50')}
    >
      <header className="flex items-center gap-3 px-1 pb-3 pt-1">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-goma display text-lg text-white">{dia.numero}</span>
        <input
          aria-label={`Título del Día ${dia.numero}`}
          value={dia.titulo ?? ''}
          placeholder={`Día ${dia.numero}: sin título`}
          onChange={(e) => onCambiar((d) => ({ ...d, titulo: e.target.value }))}
          className="min-w-0 flex-1 rounded-lg bg-transparent px-2 py-1 display text-lg placeholder:text-tinta-suave/70 hover:bg-white/60 focus:bg-white focus:outline-none"
        />
      </header>

      {errores.map((m) => (
        <p key={m} role="alert" className="mb-2 rounded-lg bg-peligro-claro px-3 py-2 text-sm text-peligro-oscuro">
          {m}
        </p>
      ))}

      {dia.items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-tiza-300 bg-white/50 px-4 py-6 text-center text-sm text-tinta-suave">
          <p>Sin ejercicios todavía.</p>
          <p className="mt-2 flex flex-wrap justify-center gap-x-3">
            {otros.map((n) => (
              <button key={n} onClick={() => onCopiarDe(n)} className="inline-flex items-center gap-1 font-semibold text-goma hover:underline">
                <Copy size={13} aria-hidden /> Copiar del Día {n}
              </button>
            ))}
          </p>
        </div>
      ) : (
        <ol className="space-y-2">
          {dia.items.map((it, i) => (
            <EditorItem
              key={it.id}
              item={it}
              ejercicio={porId.get(it.ejercicioId)}
              conError={itemsConError.has(it.id)}
              primero={i === 0}
              ultimo={i === dia.items.length - 1}
              onSubir={() => mover(i, -1)}
              onBajar={() => mover(i, 1)}
              onQuitar={() => onCambiar((d) => ({ ...d, items: d.items.filter((x) => x.id !== it.id) }))}
              onCambiar={(c) => actualizar(it.id, c)}
            />
          ))}
        </ol>
      )}

      <button
        onClick={onAgregar}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-goma/30 bg-white py-2.5 font-semibold text-goma hover:bg-tiza-200"
      >
        <Plus size={18} aria-hidden /> Agregar ejercicio
      </button>
    </section>
  );
}

function numeroOVacio(v: string): number | undefined {
  if (v.trim() === '') return undefined;
  const n = Number(v.replace(',', '.'));
  return Number.isFinite(n) ? n : undefined;
}

function EditorItem({
  item,
  ejercicio,
  conError,
  primero,
  ultimo,
  onSubir,
  onBajar,
  onQuitar,
  onCambiar,
}: {
  item: ItemPlan;
  ejercicio: Ejercicio | undefined;
  conError: boolean;
  primero: boolean;
  ultimo: boolean;
  onSubir: () => void;
  onBajar: () => void;
  onQuitar: () => void;
  onCambiar: (c: Partial<ItemPlan>) => void;
}) {
  if (!ejercicio) return null;
  const porTiempo = ejercicio.medicion === 'TIEMPO';
  const claseNum =
    'cifra w-full rounded-lg border border-tiza-300 bg-white px-2 py-1.5 text-center text-base focus:border-goma focus:outline-none focus:ring-2 focus:ring-chispa/40';

  return (
    <li className={clsx('relative rounded-xl bg-white py-3 pl-5 pr-3', conError && 'ring-2 ring-peligro/60')}>
      <span className={clsx('absolute inset-y-2.5 left-2 w-1.5 rounded-full', BARRA_TIPO[ejercicio.tipo])} aria-hidden />
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-snug">{ejercicio.nombre}</p>
          <p className="text-xs text-tinta-suave">{NOMBRE_GRUPO[ejercicio.grupo]}</p>
        </div>
        <div className="flex shrink-0 text-tinta-suave">
          <button onClick={onSubir} disabled={primero} className="rounded p-1 hover:bg-tiza disabled:opacity-30" aria-label={`Subir ${ejercicio.nombre}`}>
            <ArrowUp size={16} />
          </button>
          <button onClick={onBajar} disabled={ultimo} className="rounded p-1 hover:bg-tiza disabled:opacity-30" aria-label={`Bajar ${ejercicio.nombre}`}>
            <ArrowDown size={16} />
          </button>
          <button onClick={onQuitar} className="rounded p-1 hover:bg-peligro-claro hover:text-peligro" aria-label={`Quitar ${ejercicio.nombre}`}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className={clsx('mt-2.5 grid gap-2 text-xs text-tinta-suave', porTiempo ? 'grid-cols-4' : 'grid-cols-[1fr_1.8fr_1fr_1fr]')}>
        <label className="flex flex-col gap-1">
          Series
          <input type="number" inputMode="numeric" min={1} className={claseNum} value={item.series} onChange={(e) => onCambiar({ series: numeroOVacio(e.target.value) ?? 0 })} />
        </label>
        {porTiempo ? (
          <label className="flex flex-col gap-1">
            Segundos
            <input type="number" inputMode="numeric" min={1} className={claseNum} value={item.tiempoSeg ?? ''} onChange={(e) => onCambiar({ tiempoSeg: numeroOVacio(e.target.value) })} />
          </label>
        ) : (
          <fieldset className="flex flex-col gap-1">
            <legend className="mb-1">Reps (rango)</legend>
            <div className="flex items-center gap-1">
              <input
                type="number"
                inputMode="numeric"
                min={1}
                aria-label="Repeticiones mínimas"
                className={claseNum}
                value={item.repeticiones ?? ''}
                onChange={(e) => onCambiar({ repeticiones: numeroOVacio(e.target.value) })}
              />
              <span aria-hidden>–</span>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                placeholder="—"
                aria-label="Repeticiones máximas (opcional)"
                title="Opcional: tope del rango, por ejemplo 8 a 12"
                className={claseNum}
                value={item.repeticionesMax ?? ''}
                onChange={(e) => onCambiar({ repeticionesMax: numeroOVacio(e.target.value) })}
              />
            </div>
          </fieldset>
        )}
        <label className="flex flex-col gap-1">
          Kg
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step={2.5}
            placeholder="—"
            className={claseNum}
            value={item.cargaKg ?? ''}
            disabled={porTiempo}
            onChange={(e) => onCambiar({ cargaKg: numeroOVacio(e.target.value) })}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span>Descanso<span className="sr-only"> en segundos</span></span>
          <input type="number" inputMode="numeric" min={0} step={15} className={claseNum} value={item.descansoSeg} onChange={(e) => onCambiar({ descansoSeg: numeroOVacio(e.target.value) ?? 0 })} />
        </label>
      </div>
      <input
        aria-label={`Nota técnica para ${ejercicio.nombre}`}
        placeholder="Nota técnica (opcional)"
        value={item.notas ?? ''}
        onChange={(e) => onCambiar({ notas: e.target.value || undefined })}
        className="mt-2 w-full rounded-lg border border-transparent bg-tiza/60 px-2.5 py-1.5 text-sm placeholder:text-tinta-suave/70 focus:border-goma focus:bg-white focus:outline-none"
      />
    </li>
  );
}
