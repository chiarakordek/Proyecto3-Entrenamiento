import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { cargarDatos, iniciarSesionUsuario, registrarAlumno, usuarioActual } from '@/data/api';
import { useAlmacen, vaciar } from '@/data/almacen';
import { borrarToken, cuandoExpireLaSesion, leerToken } from '@/data/http';
import type { Alumno, Entrenador } from '@/domain/tipos';

/**
 * Sesión del usuario: login con email y contraseña contra el back (JWT).
 * Al entrar se cargan sus datos; al salir se borran de la memoria y del navegador.
 */

type Estado = 'cargando' | 'fuera' | 'dentro';

interface ContextoUsuario {
  estado: Estado;
  usuarioId: string | null;
  entrenador: Entrenador | null;
  alumno: Alumno | null;
  ingresar: (email: string, password: string) => Promise<void>;
  registrarse: (datos: { nombre: string; email: string; password: string }) => Promise<void>;
  salir: () => void;
}

const Contexto = createContext<ContextoUsuario | null>(null);

export function ProveedorUsuario({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<Estado>(() => (leerToken() ? 'cargando' : 'fuera'));
  const [usuarioId, setUsuarioId] = useState<string | null>(null);
  const entrenadores = useAlmacen((d) => d.entrenadores);
  const alumnos = useAlmacen((d) => d.alumnos);

  const salir = useCallback(() => {
    borrarToken();
    vaciar();
    setUsuarioId(null);
    setEstado('fuera');
  }, []);

  const entrar = useCallback(async (id: string) => {
    await cargarDatos();
    setUsuarioId(id);
    setEstado('dentro');
  }, []);

  // Si ya había un token guardado, se recupera la sesión.
  useEffect(() => {
    cuandoExpireLaSesion(salir);
    if (!leerToken()) return;
    usuarioActual()
      .then((u) => entrar(u.id))
      .catch(salir);
  }, [entrar, salir]);

  const ingresar = useCallback(
    async (email: string, password: string) => {
      const s = await iniciarSesionUsuario(email, password);
      await entrar(s.usuario.id);
    },
    [entrar],
  );

  const registrarse = useCallback(
    async (datos: { nombre: string; email: string; password: string }) => {
      const s = await registrarAlumno(datos);
      await entrar(s.usuario.id);
    },
    [entrar],
  );

  const valor = useMemo<ContextoUsuario>(
    () => ({
      estado,
      usuarioId,
      entrenador: entrenadores.find((e) => e.id === usuarioId) ?? null,
      alumno: alumnos.find((a) => a.id === usuarioId) ?? null,
      ingresar,
      registrarse,
      salir,
    }),
    [estado, usuarioId, entrenadores, alumnos, ingresar, registrarse, salir],
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
