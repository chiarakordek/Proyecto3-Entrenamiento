import clsx from 'clsx';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { definirMeta, ErrorDominio } from '@/data/api';
import { DESCRIPCION_OBJETIVO, NOMBRE_OBJETIVO } from '@/domain/clasificacion';
import { validarMeta, type ErrorRegla } from '@/domain/reglas';
import type { Objetivo } from '@/domain/tipos';
import { useAlumnoActual } from '@/lib/sesion-usuario';
import { Boton, Campo, Entrada } from '@/ui/base';
import { sonidos } from '@/lib/sonido';

const OBJETIVOS: Objetivo[] = ['BAJAR_PESO', 'HIPERTROFIA', 'FUERZA', 'SALUD_GENERAL'];

function aNumero(v: string): number | undefined {
  if (!v.trim()) return undefined;
  const n = Number(v.replace(',', '.'));
  return Number.isFinite(n) ? n : Number.NaN;
}

/** Paso 1 del flujo: el alumno define su objetivo y su peso. */
export function ObjetivoPage() {
  const alumno = useAlumnoActual();
  const navegar = useNavigate();
  const [objetivo, setObjetivo] = useState<Objetivo | undefined>(alumno.meta?.objetivo);
  const [pesoActual, setPesoActual] = useState(alumno.meta?.pesoActualKg?.toString() ?? '');
  const [pesoIdeal, setPesoIdeal] = useState(alumno.meta?.pesoIdealKg?.toString() ?? '');
  const [errores, setErrores] = useState<ErrorRegla[]>([]);
  const [enviado, setEnviado] = useState(false);

  const datos = { objetivo, pesoActualKg: aNumero(pesoActual), pesoIdealKg: aNumero(pesoIdeal) };
  const visibles = enviado ? validarMeta(datos) : errores;
  const error = (c: string) => visibles.find((e) => e.campo === c)?.mensaje;

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    setEnviado(true);
    try {
      definirMeta(alumno.id, {
        objetivo: objetivo!,
        pesoActualKg: datos.pesoActualKg!,
        pesoIdealKg: objetivo === 'BAJAR_PESO' ? datos.pesoIdealKg : undefined,
      });
      sonidos.ok();
      navegar('/alumno', { replace: true });
    } catch (err) {
      if (err instanceof ErrorDominio) setErrores(err.errores);
      else throw err;
    }
  };

  return (
    <form onSubmit={enviar} noValidate className="pt-4">
      <h1 className="text-3xl leading-tight">{alumno.meta ? 'Tu objetivo' : '¿Qué querés lograr?'}</h1>
      <p className="mt-2 text-tinta-suave">Tu entrenador lo va a ver para ajustar el plan. Lo podés cambiar cuando empieces un ciclo nuevo.</p>

      <fieldset className="mt-8">
        <legend className="text-sm font-semibold">Objetivo principal</legend>
        <div className="mt-3 grid gap-2.5">
          {OBJETIVOS.map((o) => (
            <label
              key={o}
              className={clsx(
                'flex cursor-pointer items-center gap-4 rounded-2xl border-2 bg-white px-4 py-3.5 transition-colors',
                objetivo === o ? 'border-goma' : 'border-transparent hover:border-tiza-300',
              )}
            >
              <input type="radio" name="objetivo" value={o} checked={objetivo === o} onChange={() => setObjetivo(o)} className="peer sr-only" />
              <span
                className={clsx(
                  'grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 peer-focus-visible:ring-2 peer-focus-visible:ring-chispa',
                  objetivo === o ? 'border-goma' : 'border-tiza-300',
                )}
                aria-hidden
              >
                {objetivo === o && <span className="h-2.5 w-2.5 rounded-full bg-goma" />}
              </span>
              <span>
                <span className="block font-semibold">{NOMBRE_OBJETIVO[o]}</span>
                <span className="block text-sm text-tinta-suave">{DESCRIPCION_OBJETIVO[o]}</span>
              </span>
            </label>
          ))}
        </div>
        {error('objetivo') && <p className="mt-2 text-sm text-peligro">{error('objetivo')}</p>}
      </fieldset>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Peso actual (kg)" error={error('pesoActualKg')}>
          {(p) => <Entrada {...p} inputMode="decimal" value={pesoActual} onChange={(e) => setPesoActual(e.target.value)} placeholder="Ej: 70" className="cifra text-lg" />}
        </Campo>
        {objetivo === 'BAJAR_PESO' && (
          <Campo etiqueta="Peso al que querés llegar (kg)" error={error('pesoIdealKg')} className="aparecer">
            {(p) => <Entrada {...p} inputMode="decimal" value={pesoIdeal} onChange={(e) => setPesoIdeal(e.target.value)} placeholder="Ej: 64" className="cifra text-lg" />}
          </Campo>
        )}
      </div>

      <Boton type="submit" tamano="lg" className="mt-10 w-full">
        {alumno.meta ? 'Guardar objetivo' : 'Empezar'}
      </Boton>
    </form>
  );
}
