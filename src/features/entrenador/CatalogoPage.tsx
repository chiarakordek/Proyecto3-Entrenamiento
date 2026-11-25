import clsx from 'clsx';
import { useMemo, useState, type FormEvent } from 'react';
import { Pencil, PlayCircle, Plus, Search } from 'lucide-react';
import { DetalleEjercicio } from '@/ui/DetalleEjercicio';
import { Categorias } from '@/ui/Categorias';
import { eliminarEjercicio, ErrorDominio, guardarEjercicio } from '@/data/api';
import { sonidos } from '@/lib/sonido';
import { useCatalogo } from '@/data/consultas';
import { GRUPOS_POR_TIPO, NOMBRE_GRUPO, NOMBRE_TIPO, TIPOS, tipoDeGrupo } from '@/domain/clasificacion';
import type { ErrorRegla } from '@/domain/reglas';
import type { Ejercicio, GrupoMuscular, Medicion, TipoEjercicio } from '@/domain/tipos';
import { Area, Boton, Campo, Dialogo, Entrada, Selector } from '@/ui/base';
import { BARRA_TIPO, FONDO_TIPO } from '@/ui/tipo';
import { MapaMuscular } from '@/ui/MapaMuscular';

export function CatalogoPage() {
  const { lista } = useCatalogo();
  const [q, setQ] = useState('');
  const [tipo, setTipo] = useState<TipoEjercicio>('TREN_SUPERIOR');
  const [editando, setEditando] = useState<Ejercicio | 'nuevo' | null>(null);
  const [viendo, setViendo] = useState<Ejercicio | null>(null);

  const texto = q.trim().toLowerCase();
  const visibles = useMemo(
    () => lista.filter((e) => (texto ? e.nombre.toLowerCase().includes(texto) : e.tipo === tipo)),
    [lista, texto, tipo],
  );

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl">Ejercicios</h1>
          <p className="mt-1 max-w-xl text-tinta-suave">
            El catálogo viene precargado con {lista.length} ejercicios. Podés sumar los tuyos o ajustar la descripción técnica que ve el alumno.
          </p>
        </div>
        <Boton icono={<Plus size={18} />} onClick={() => setEditando('nuevo')}>
          Nuevo ejercicio
        </Boton>
      </div>

      <div className="mt-8 rounded-3xl bg-white/60 p-4">
        <Categorias
          seleccion={texto ? null : tipo}
          conteo={Object.fromEntries(TIPOS.map((t) => [t, lista.filter((e) => e.tipo === t).length]))}
          onElegir={(t) => {
            if (t) {
              setTipo(t);
              setQ('');
            }
          }}
        />
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div role="tablist" aria-label="Tipo de ejercicio" className="flex flex-wrap gap-1 rounded-2xl bg-tiza-200/70 p-1">
          {TIPOS.map((t) => {
            const activo = !texto && tipo === t;
            return (
              <button
                key={t}
                role="tab"
                aria-selected={activo}
                onClick={() => {
                  setTipo(t);
                  setQ('');
                }}
                className={clsx(
                  'flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold',
                  activo ? 'bg-white shadow-hoja' : 'text-tinta-suave hover:text-tinta',
                )}
              >
                <span className={clsx('h-3.5 w-1.5 rounded-full', BARRA_TIPO[t])} aria-hidden />
                {NOMBRE_TIPO[t]}
                <span className="cifra text-xs font-normal text-tinta-suave">{lista.filter((e) => e.tipo === t).length}</span>
              </button>
            );
          })}
        </div>
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-tinta-suave" size={18} aria-hidden />
          <Entrada type="search" placeholder="Buscar en todo el catálogo" aria-label="Buscar ejercicio" value={q} onChange={(e) => setQ(e.target.value)} className="pl-10" />
        </div>
      </div>

      <div className="mt-6 space-y-8">
        {(texto ? TIPOS : [tipo]).flatMap((t) =>
          GRUPOS_POR_TIPO[t].map((g) => {
            const del = visibles.filter((e) => e.grupo === g);
            if (!del.length) return null;
            return (
              <section key={g} aria-labelledby={`grupo-${g}`}>
                <h2 id={`grupo-${g}`} className="mb-3 flex items-center gap-2 text-xl">
                  {NOMBRE_GRUPO[g]}
                  {texto && <span className={clsx('rounded-full px-2 py-0.5 font-sans text-xs font-semibold', FONDO_TIPO[t])}>{NOMBRE_TIPO[t]}</span>}
                </h2>
                <ul className="grid gap-3 md:grid-cols-2">
                  {del.map((e) => (
                    <li key={e.id} className="relative rounded-2xl bg-white py-4 pl-6 pr-4">
                      <span className={clsx('absolute inset-y-3.5 left-2.5 w-1.5 rounded-full', BARRA_TIPO[e.tipo])} aria-hidden />
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-sans text-base font-semibold">{e.nombre}</h3>
                          <p className="text-xs text-tinta-suave">
                            {e.medicion === 'TIEMPO' ? 'Por tiempo' : 'Por repeticiones'}
                            {e.equipo && `, ${e.equipo.toLowerCase()}`}
                          </p>
                        </div>
                        <button onClick={() => setEditando(e)} className="rounded-lg p-1.5 text-tinta-suave hover:bg-tiza hover:text-tinta" aria-label={`Editar ${e.nombre}`}>
                          <Pencil size={16} />
                        </button>
                      </div>
                      <div className="mt-2 flex items-start gap-3">
                        <p className="flex-1 text-sm leading-relaxed text-tinta-suave">{e.descripcion}</p>
                        <MapaMuscular grupo={e.grupo} tipo={e.tipo} conEtiquetas={false} className="w-20 shrink-0" />
                      </div>
                      <button
                        onClick={() => setViendo(e)}
                        className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-semibold text-goma hover:bg-tiza"
                      >
                        <PlayCircle size={16} aria-hidden /> Ver cómo se hace
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            );
          }),
        )}
        {visibles.length === 0 && <p className="py-10 text-center text-tinta-suave">No hay ejercicios que coincidan con “{q}”.</p>}
      </div>

      <Dialogo abierto={viendo !== null} onCerrar={() => setViendo(null)} titulo={viendo?.nombre ?? ''} ancho="max-w-3xl">
        {viendo && <DetalleEjercicio ejercicio={viendo} />}
      </Dialogo>

      <FormEjercicio
        key={editando === 'nuevo' ? 'nuevo' : editando?.id ?? 'cerrado'}
        ejercicio={editando === 'nuevo' ? null : editando}
        abierto={editando !== null}
        tipoInicial={tipo}
        onCerrar={() => setEditando(null)}
      />
    </div>
  );
}

function FormEjercicio({
  ejercicio,
  abierto,
  tipoInicial,
  onCerrar,
}: {
  ejercicio: Ejercicio | null;
  abierto: boolean;
  tipoInicial: TipoEjercicio;
  onCerrar: () => void;
}) {
  const [nombre, setNombre] = useState(ejercicio?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(ejercicio?.descripcion ?? '');
  const [grupo, setGrupo] = useState<GrupoMuscular>(ejercicio?.grupo ?? GRUPOS_POR_TIPO[tipoInicial][0]);
  const [medicion, setMedicion] = useState<Medicion>(ejercicio?.medicion ?? 'REPETICIONES');
  const [equipo, setEquipo] = useState(ejercicio?.equipo ?? '');
  const [video, setVideo] = useState(ejercicio?.videoUrl ?? '');
  const [confirmarBaja, setConfirmarBaja] = useState(false);
  const borrar = () => {
    if (!ejercicio) return;
    try {
      eliminarEjercicio(ejercicio.id);
      sonidos.ok();
      onCerrar();
    } catch (err) {
      if (err instanceof ErrorDominio) {
        sonidos.error();
        setConfirmarBaja(false);
        setErrores(err.errores);
      } else throw err;
    }
  };
  const [errores, setErrores] = useState<ErrorRegla[]>([]);
  const error = (c: string) => errores.find((e) => e.campo === c)?.mensaje;

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    try {
      guardarEjercicio({
        id: ejercicio?.id,
        nombre,
        descripcion: descripcion.trim(),
        grupo,
        tipo: tipoDeGrupo(grupo),
        medicion,
        equipo: equipo.trim() || undefined,
        videoUrl: video.trim() || undefined,
      });
      onCerrar();
    } catch (err) {
      if (err instanceof ErrorDominio) setErrores(err.errores);
      else throw err;
    }
  };

  return (
    <Dialogo abierto={abierto} onCerrar={onCerrar} titulo={ejercicio ? `Editar ${ejercicio.nombre}` : 'Nuevo ejercicio'}>
      <form onSubmit={enviar} noValidate className="space-y-4">
        <Campo etiqueta="Nombre" error={error('nombre')}>
          {(p) => <Entrada {...p} value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus />}
        </Campo>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Grupo muscular" ayuda={`Tipo: ${NOMBRE_TIPO[tipoDeGrupo(grupo)]}`}>
            {(p) => (
              <Selector {...p} value={grupo} onChange={(e) => setGrupo(e.target.value as GrupoMuscular)}>
                {TIPOS.map((t) => (
                  <optgroup key={t} label={NOMBRE_TIPO[t]}>
                    {GRUPOS_POR_TIPO[t].map((g) => (
                      <option key={g} value={g}>
                        {NOMBRE_GRUPO[g]}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </Selector>
            )}
          </Campo>
          <Campo etiqueta="Se mide por">
            {(p) => (
              <Selector {...p} value={medicion} onChange={(e) => setMedicion(e.target.value as Medicion)}>
                <option value="REPETICIONES">Repeticiones y peso</option>
                <option value="TIEMPO">Tiempo</option>
              </Selector>
            )}
          </Campo>
        </div>
        <Campo etiqueta="Equipo" ayuda="Opcional. Por ejemplo: barra, mancuernas, polea.">
          {(p) => <Entrada {...p} value={equipo} onChange={(e) => setEquipo(e.target.value)} />}
        </Campo>
        <Campo etiqueta="Video explicativo" error={error('videoUrl')} ayuda="Opcional. Link a un video que muestre la técnica (por ejemplo, de YouTube).">
          {(p) => <Entrada {...p} type="url" inputMode="url" placeholder="https://" value={video} onChange={(e) => setVideo(e.target.value)} />}
        </Campo>
        <Campo etiqueta="Descripción técnica" error={error('descripcion')} ayuda="El alumno la lee durante la sesión: postura, respiración y precauciones.">
          {(p) => <Area {...p} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />}
        </Campo>
        {error('ejercicio') && <p role="alert" className="rounded-xl bg-peligro-claro px-3 py-2 text-sm text-peligro-oscuro">{error('ejercicio')}</p>}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
          {ejercicio ? (
            confirmarBaja ? (
              <span className="flex items-center gap-2 text-sm">
                ¿Borrar del catálogo?
                <Boton variante="peligro" tamano="sm" onClick={borrar}>
                  Sí, borrar
                </Boton>
                <Boton variante="fantasma" tamano="sm" onClick={() => setConfirmarBaja(false)}>
                  No
                </Boton>
              </span>
            ) : (
              <Boton variante="peligro" tamano="sm" onClick={() => setConfirmarBaja(true)}>
                Dar de baja
              </Boton>
            )
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Boton variante="fantasma" onClick={onCerrar}>
              Cancelar
            </Boton>
            <Boton type="submit">{ejercicio ? 'Guardar cambios' : 'Crear ejercicio'}</Boton>
          </div>
        </div>
      </form>
    </Dialogo>
  );
}
