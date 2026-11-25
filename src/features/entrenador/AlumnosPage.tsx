import clsx from 'clsx';
import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Plus, Search } from 'lucide-react';
import { useAlmacen } from '@/data/almacen';
import { altaAlumno, buscarAlumnoPorEmail, ErrorDominio, vincularAlumno } from '@/data/api';
import { tiposDelPlan, useAlumnosDe, useCatalogo } from '@/data/consultas';
import { NOMBRE_OBJETIVO } from '@/domain/clasificacion';
import { proximoDia } from '@/domain/metricas';
import type { ErrorRegla } from '@/domain/reglas';
import type { Alumno, Plan, Sesion } from '@/domain/tipos';
import { useEntrenador } from '@/lib/sesion-usuario';
import { haceCuanto, iniciales } from '@/lib/formato';
import { Boton, Campo, Dialogo, Entrada, Vacio } from '@/ui/base';
import { HuellaPlan } from '@/ui/tipo';
import { ComoFunciona } from '@/ui/didactico';
import { sonidos } from '@/lib/sonido';

type Estado = 'al-dia' | 'atencion' | 'inactivo' | 'sin-plan';

const ESTADO: Record<Estado, { barra: string; texto: string }> = {
  'al-dia': { barra: 'bg-exito', texto: 'Al día' },
  atencion: { barra: 'bg-aviso', texto: 'Hace varios días que no entrena' },
  inactivo: { barra: 'bg-peligro', texto: 'Más de una semana sin entrenar' },
  'sin-plan': { barra: 'bg-tiza-300', texto: 'Sin plan asignado' },
};

function estadoDe(plan: Plan | undefined, ultima: Sesion | undefined): Estado {
  if (!plan) return 'sin-plan';
  if (!ultima?.cerradaEn) return 'inactivo';
  const dias = (Date.now() - new Date(ultima.cerradaEn).getTime()) / 86_400_000;
  if (dias <= 4) return 'al-dia';
  if (dias <= 8) return 'atencion';
  return 'inactivo';
}

export function AlumnosPage() {
  const entrenador = useEntrenador();
  const alumnos = useAlumnosDe(entrenador.id);
  const planes = useAlmacen((d) => d.planes);
  const sesiones = useAlmacen((d) => d.sesiones);
  const { porId } = useCatalogo();
  const [busqueda, setBusqueda] = useState('');
  const [altaAbierta, setAltaAbierta] = useState(false);

  const filas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return alumnos
      .filter((a) => !q || a.nombre.toLowerCase().includes(q) || a.email.includes(q))
      .map((alumno) => {
        const plan = planes.find((p) => p.alumnoId === alumno.id && p.estado === 'ACTIVO');
        const propias = sesiones
          .filter((s) => s.alumnoId === alumno.id && s.cerradaEn)
          .sort((a, b) => (a.cerradaEn! < b.cerradaEn! ? 1 : -1));
        const ultima = propias[0];
        const feedback = propias.find((s) => s.comentario);
        return { alumno, plan, ultima, feedback, estado: estadoDe(plan, ultima), propias };
      })
      .sort((a, b) => a.alumno.nombre.localeCompare(b.alumno.nombre));
  }, [alumnos, planes, sesiones, busqueda]);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl">Alumnos</h1>
          <p className="mt-1 text-tinta-suave">
            {alumnos.length === 1 ? 'Un alumno a tu cargo.' : `${alumnos.length} alumnos a tu cargo.`}
          </p>
        </div>
        <Boton icono={<Plus size={18} />} onClick={() => setAltaAbierta(true)}>
          Agregar alumno
        </Boton>
      </div>

      <div className="mt-6">
        <ComoFunciona
          clave="entrenador"
          titulo="Cómo funciona"
          pasos={[
            'Agregá al alumno. Al entrar define su objetivo y su peso.',
            'Armale un plan de 3 días distintos y asignáselo.',
            'Él anota cada serie y cierra contando cuánto le costó.',
            'Revisá lo pautado contra lo real y ajustá las cargas.',
          ]}
        />
      </div>

      <div className="relative mt-6">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-tinta-suave" size={18} aria-hidden />
        <Entrada
          type="search"
          placeholder="Buscar por nombre o email"
          aria-label="Buscar alumno"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="pl-10"
        />
      </div>

      {filas.length === 0 ? (
        <div className="mt-6">
          <Vacio
            titulo={busqueda ? 'Nadie coincide con la búsqueda' : 'Todavía no tenés alumnos'}
            accion={!busqueda && <Boton onClick={() => setAltaAbierta(true)}>Agregar el primero</Boton>}
          >
            {busqueda ? 'Probá con otro nombre o email.' : 'Agregá un alumno para armarle su plan de 3 días.'}
          </Vacio>
        </div>
      ) : (
        <ul className="mt-6 space-y-2.5">
          {filas.map(({ alumno, plan, ultima, feedback, estado, propias }) => (
            <li key={alumno.id}>
              <Link
                to={`/entrenador/alumnos/${alumno.id}`}
                className="group relative grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 rounded-2xl bg-white py-4 pl-6 pr-4 shadow-hoja transition-colors hover:bg-white/80 sm:grid-cols-[auto_1fr_auto]"
              >
                <span className={clsx('absolute inset-y-3 left-2.5 w-1.5 rounded-full', ESTADO[estado].barra)} aria-hidden />
                <span className="grid h-11 w-11 place-items-center rounded-full bg-tiza-200 font-semibold text-goma">
                  {iniciales(alumno.nombre)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{alumno.nombre}</span>
                  <span className="block text-sm text-tinta-suave">
                    {plan ? `Le toca el Día ${proximoDia(plan, propias)}` : 'Sin plan asignado'}
                    {ultima?.cerradaEn && `, entrenó ${haceCuanto(ultima.cerradaEn)}`}
                    <span className="sr-only">. {ESTADO[estado].texto}</span>
                  </span>
                </span>
                <span className="col-span-2 flex items-center gap-4 sm:col-span-1 sm:justify-end">
                  {feedback?.comentario && <Nota alumno={alumno} texto={feedback.comentario} />}
                  {alumno.meta ? (
                    <span className="rounded-full bg-tiza px-2.5 py-1 text-xs font-semibold text-goma">
                      {NOMBRE_OBJETIVO[alumno.meta.objetivo]}
                    </span>
                  ) : (
                    <span className="rounded-full border border-dashed border-tiza-300 px-2.5 py-1 text-xs text-tinta-suave">
                      Sin objetivo
                    </span>
                  )}
                  {plan && <HuellaPlan dias={tiposDelPlan(plan, porId)} />}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Leyenda />
      <DialogoAlta abierto={altaAbierta} onCerrar={() => setAltaAbierta(false)} entrenadorId={entrenador.id} />
    </div>
  );
}

function Nota({ alumno, texto }: { alumno: Alumno; texto: string }) {
  return (
    <span className="hidden max-w-56 items-center gap-1.5 truncate text-sm text-tinta-suave lg:flex" title={`${alumno.nombre}: ${texto}`}>
      <MessageSquare size={14} className="shrink-0" aria-hidden />
      <span className="truncate">{texto}</span>
    </span>
  );
}

function Leyenda() {
  return (
    <dl className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-tinta-suave">
      {(['al-dia', 'atencion', 'inactivo'] as const).map((e) => (
        <div key={e} className="flex items-center gap-2">
          <dt className={clsx('h-3 w-1.5 rounded-full', ESTADO[e].barra)} aria-hidden />
          <dd>{e === 'al-dia' ? 'Entrenó en los últimos 4 días' : e === 'atencion' ? 'Entre 5 y 8 días' : 'Más de 8 días o nunca'}</dd>
        </div>
      ))}
    </dl>
  );
}

/** "Dar de alta o vincular alumnos a su cargo" (documento del Proyecto 3). */
function DialogoAlta({ abierto, onCerrar, entrenadorId }: { abierto: boolean; onCerrar: () => void; entrenadorId: string }) {
  const [modo, setModo] = useState<'alta' | 'vincular'>('alta');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [errores, setErrores] = useState<ErrorRegla[]>([]);
  const encontrado = modo === 'vincular' && email.includes('@') ? buscarAlumnoPorEmail(email) : undefined;

  const cerrar = () => {
    setNombre('');
    setEmail('');
    setErrores([]);
    setModo('alta');
    onCerrar();
  };

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    try {
      if (modo === 'alta') altaAlumno(entrenadorId, { nombre, email });
      else vincularAlumno(entrenadorId, email);
      sonidos.ok();
      cerrar();
    } catch (err) {
      if (err instanceof ErrorDominio) {
        sonidos.error();
        setErrores(err.errores);
      } else throw err;
    }
  };

  const error = (campo: string) => errores.find((x) => x.campo === campo)?.mensaje;

  return (
    <Dialogo abierto={abierto} onCerrar={cerrar} titulo="Agregar alumno">
      <div role="tablist" aria-label="Cómo agregarlo" className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-tiza p-1">
        {(['alta', 'vincular'] as const).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={modo === m}
            onClick={() => {
              setModo(m);
              setErrores([]);
            }}
            className={clsx('rounded-lg py-2 text-sm font-semibold', modo === m ? 'bg-white shadow-hoja' : 'text-tinta-suave')}
          >
            {m === 'alta' ? 'Dar de alta' : 'Vincular existente'}
          </button>
        ))}
      </div>
      <form onSubmit={enviar} className="space-y-4" noValidate>
        {modo === 'alta' && (
          <Campo etiqueta="Nombre y apellido" error={error('nombre')}>
            {(p) => <Entrada {...p} value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus autoComplete="off" />}
          </Campo>
        )}
        <Campo
          etiqueta="Email"
          error={error('email')}
          ayuda={modo === 'alta' ? 'Con este email va a entrar a ver su plan.' : 'El email con el que el alumno ya tiene cuenta.'}
        >
          {(p) => <Entrada {...p} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" autoFocus={modo === 'vincular'} />}
        </Campo>
        {modo === 'vincular' && encontrado && (
          <div className="flex items-center gap-3 rounded-xl bg-tiza px-3 py-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-goma text-sm font-semibold text-white">{iniciales(encontrado.nombre)}</span>
            <span className="text-sm">
              <span className="block font-semibold">{encontrado.nombre}</span>
              <span className="text-tinta-suave">
                {encontrado.entrenadorId
                  ? encontrado.entrenadorId === entrenadorId
                    ? 'Ya está en tu lista'
                    : 'Ya entrena con otro entrenador'
                  : encontrado.meta
                    ? `Sin entrenador. Objetivo: ${NOMBRE_OBJETIVO[encontrado.meta.objetivo]}`
                    : 'Sin entrenador'}
              </span>
            </span>
          </div>
        )}
        {modo === 'alta' && <p className="text-sm text-tinta-suave">Cuando entre por primera vez, va a definir su objetivo y su peso actual.</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Boton variante="fantasma" onClick={cerrar}>
            Cancelar
          </Boton>
          <Boton type="submit">{modo === 'alta' ? 'Dar de alta' : 'Vincular alumno'}</Boton>
        </div>
      </form>
    </Dialogo>
  );
}
