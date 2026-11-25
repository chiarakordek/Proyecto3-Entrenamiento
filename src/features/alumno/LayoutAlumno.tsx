import clsx from 'clsx';
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { CalendarDays, Dumbbell, GraduationCap, History, LogOut, Trophy } from 'lucide-react';
import { useAlumnoActual, useUsuario } from '@/lib/sesion-usuario';
import { nombreDePila } from '@/lib/formato';
import { BotonSonido } from '@/ui/BotonSonido';

const pestanas = [
  { a: '/alumno', texto: 'Hoy', icono: Dumbbell, fin: true },
  { a: '/alumno/plan', texto: 'Mi plan', icono: CalendarDays, fin: false },
  { a: '/alumno/aprender', texto: 'Aprender', icono: GraduationCap, fin: false },
  { a: '/alumno/historial', texto: 'Historial', icono: History, fin: false },
  { a: '/alumno/resumen', texto: 'Mi mes', icono: Trophy, fin: false },
];

export function LayoutAlumno() {
  const alumno = useAlumnoActual();
  const { salir } = useUsuario();
  const navegar = useNavigate();
  const { pathname } = useLocation();

  // Primera vez: el alumno define su objetivo antes de cualquier otra cosa.
  if (!alumno.meta && pathname !== '/alumno/objetivo') return <Navigate to="/alumno/objetivo" replace />;

  const enSesion = pathname === '/alumno/sesion';
  const sinNavegacion = enSesion || !alumno.meta;

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col">
      {!enSesion && (
        <header className="flex items-center justify-between bg-goma px-5 pb-1 pt-4 text-white">
          <div className="flex items-center gap-2.5">
            <img src={`${import.meta.env.BASE_URL}icono.svg`} alt="" className="h-8 w-8" />
            <span className="font-semibold">Hola, {nombreDePila(alumno.nombre)}</span>
          </div>
          <div className="flex items-center">
          <BotonSonido oscuro />
          <button
            onClick={() => {
              salir();
              navegar('/');
            }}
            className="rounded-lg p-2 text-tiza/70 hover:bg-white/10 hover:text-white"
            aria-label="Salir"
            title="Salir"
          >
            <LogOut size={18} />
          </button>
          </div>
        </header>
      )}
      <main className={clsx('flex-1 px-5', sinNavegacion ? 'pb-8' : 'pb-28')}>
        <Outlet />
      </main>
      {!sinNavegacion && (
        <nav
          aria-label="Principal"
          className="pb-seguro fixed inset-x-0 bottom-0 z-20 border-t border-tiza-300 bg-white/95 backdrop-blur"
        >
          <ul className="mx-auto grid max-w-xl grid-cols-5">
            {pestanas.map(({ a, texto, icono: Icono, fin }) => (
              <li key={a}>
                <NavLink
                  to={a}
                  end={fin}
                  className={({ isActive }) =>
                    clsx(
                      'flex flex-col items-center gap-1 pb-1 pt-2.5 text-xs font-semibold',
                      isActive ? 'text-goma' : 'text-tinta-suave hover:text-tinta',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className={clsx('rounded-full px-3.5 py-1', isActive && 'bg-tiza-200')}>
                        <Icono size={20} aria-hidden />
                      </span>
                      {texto}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
