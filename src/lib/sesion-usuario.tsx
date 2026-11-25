import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useAlmacen } from '@/data/almacen';
import { borrarClave, guardarClave, leerClave } from './guardado';
import type { Alumno, Entrenador } from '@/domain/tipos';

/**
 * Ingreso de demostración: se elige un usuario de la semilla.
 * Cuando exista el backend, acá va el login real (token, refresh, etc.).
 */

const CLAVE = 'p3-usuario';

interface ContextoUsuario {
  usuarioId: string | null;
  entrenador: Entrenador | null;
  alumno: Alumno | null;
  ingresar: (id: string) => void;
  salir: () => void;
}

const Contexto = createContext<ContextoUsuario | null>(null);

export function ProveedorUsuario({ children }: { children: ReactNode }) {
  const [usuarioId, setUsuarioId] = useState<string | null>(() => leerClave(CLAVE));
  const entrenadores = useAlmacen((d) => d.entrenadores);
  const alumnos = useAlmacen((d) => d.alumnos);

  const ingresar = useCallback((id: string) => {
    guardarClave(CLAVE, id);
    setUsuarioId(id);
  }, []);
  const salir = useCallback(() => {
    borrarClave(CLAVE);
    setUsuarioId(null);
  }, []);

  const valor = useMemo<ContextoUsuario>(
    () => ({
      usuarioId,
      entrenador: entrenadores.find((e) => e.id === usuarioId) ?? null,
      alumno: alumnos.find((a) => a.id === usuarioId) ?? null,
      ingresar,
      salir,
    }),
    [usuarioId, entrenadores, alumnos, ingresar, salir],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useUsuario() {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error('useUsuario fuera de ProveedorUsuario');
  return ctx;
}

export function useEntrenador(): Entrenador {
  const { entrenador } = useUsuario();
  if (!entrenador) throw new Error('Se requiere un entrenador');
  return entrenador;
}

export function useAlumnoActual(): Alumno {
  const { alumno } = useUsuario();
  if (!alumno) throw new Error('Se requiere un alumno');
  return alumno;
}
