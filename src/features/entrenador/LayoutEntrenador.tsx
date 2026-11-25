import clsx from 'clsx';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BookOpen, LogOut, Users } from 'lucide-react';
import { useEntrenador, useUsuario } from '@/lib/sesion-usuario';
import { iniciales } from '@/lib/formato';
import { BotonSonido } from '@/ui/BotonSonido';

const enlaces = [
  { a: '/entrenador', texto: 'Alumnos', icono: Users, fin: true },
  { a: '/entrenador/catalogo', texto: 'Ejercicios', icono: BookOpen, fin: false },
];

export function LayoutEntrenador() {
  const entrenador = useEntrenador();
  const { salir } = useUsuario();
  const navegar = useNavigate();

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[15rem_1fr]">
      <header className="sticky top-0 z-20 flex items-center gap-2 bg-goma px-4 py-3 text-white md:h-dvh md:flex-col md:items-stretch md:gap-0 md:px-4 md:py-6">
        <div className="flex items-center gap-2.5 md:mb-10 md:px-2">
          <img src={`${import.meta.env.BASE_URL}icono.svg`} alt="" className="h-8 w-8" />
          <span className="display text-lg">Plan</span>
        </div>
        <nav aria-label="Principal" className="ml-auto flex gap-1 md:ml-0 md:flex-col">
          {enlaces.map(({ a, texto, icono: Icono, fin }) => (
            <NavLink
              key={a}
              to={a}
              end={fin}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                  isActive ? 'bg-white/10 text-white' : 'text-tiza/70 hover:bg-white/5 hover:text-white',
                )
              }
            >
              <Icono size={18} aria-hidden />
              <span className="hidden sm:inline">{texto}</span>
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2 md:mt-auto md:border-t md:border-white/10 md:px-2 md:pt-4">
          <span className="hidden h-9 w-9 place-items-center rounded-full bg-chispa text-sm font-semibold text-goma md:grid">
            {iniciales(entrenador.nombre)}
          </span>
          <span className="hidden min-w-0 flex-1 md:block">
            <span className="block truncate text-sm font-semibold">{entrenador.nombre}</span>
            <span className="block text-xs text-tiza/60">Entrenadora</span>
          </span>
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
      <main className="min-w-0 px-4 py-6 md:px-10 md:py-10">
        <Outlet />
      </main>
    </div>
  );
}
