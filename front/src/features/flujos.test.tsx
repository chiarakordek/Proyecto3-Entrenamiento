import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Rutas } from '@/App';
import { vaciar } from '@/data/almacen';
import { ProveedorUsuario } from '@/lib/sesion-usuario';
import { instalarServidorFalso, PASSWORD_PRUEBA, tokenDe, type ServidorFalso } from '@/test/servidor-falso';

let servidor: ServidorFalso;

/** Monta la app con la sesión de un usuario ya iniciada (o sin sesión si no se pasa usuario). */
function montar(ruta: string, usuarioId?: string) {
  if (usuarioId) localStorage.setItem('p3-token', tokenDe(usuarioId));
  return render(
    <ProveedorUsuario>
      <MemoryRouter initialEntries={[ruta]}>
        <Rutas />
      </MemoryRouter>
    </ProveedorUsuario>,
  );
}

beforeEach(() => {
  vaciar();
  servidor = instalarServidorFalso();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ingreso', () => {
  it('entra con email y contraseña y va a la vista de su rol', async () => {
    const u = userEvent.setup();
    montar('/');
    await u.type(await screen.findByLabelText('Email'), 'martina@entrenamiento.test');
    await u.type(screen.getByLabelText('Contraseña'), PASSWORD_PRUEBA);
    await u.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByRole('heading', { name: 'Alumnos' })).toBeInTheDocument();
    expect(localStorage.getItem('p3-token')).toBe(tokenDe('ent-1'));
  });

  it('muestra el error del servidor si la contraseña no es correcta', async () => {
    const u = userEvent.setup();
    montar('/');
    await u.type(await screen.findByLabelText('Email'), 'martina@entrenamiento.test');
    await u.type(screen.getByLabelText('Contraseña'), 'otra-cosa');
    await u.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByText('El email o la contraseña no son correctos.')).toBeInTheDocument();
  });
});

describe('alumno: objetivo', () => {
  it('un alumno sin objetivo es llevado a definirlo y el peso ideal aparece solo al elegir bajar de peso', async () => {
    const u = userEvent.setup();
    montar('/alumno', 'alu-4');

    expect(await screen.findByRole('heading', { name: '¿Qué querés lograr?' })).toBeInTheDocument();
    expect(screen.queryByLabelText(/peso al que querés llegar/i)).not.toBeInTheDocument();

    await u.click(screen.getByRole('radio', { name: /bajar de peso/i }));
    expect(screen.getByLabelText(/peso al que querés llegar/i)).toBeInTheDocument();

    await u.click(screen.getByRole('radio', { name: /fuerza/i }));
    expect(screen.queryByLabelText(/peso al que querés llegar/i)).not.toBeInTheDocument();
  });

  it('no deja seguir sin peso actual y no llama al servidor', async () => {
    const u = userEvent.setup();
    montar('/alumno/objetivo', 'alu-4');
    await u.click(await screen.findByRole('radio', { name: /fuerza/i }));
    await u.click(screen.getByRole('button', { name: 'Empezar' }));
    expect(screen.getByText('El peso actual es obligatorio.')).toBeInTheDocument();
    expect(servidor.pedidos.some((p) => p.ruta === '/yo/meta')).toBe(false);
  });

  it('guarda el objetivo en el servidor y pasa a la pantalla de hoy', async () => {
    const u = userEvent.setup();
    montar('/alumno/objetivo', 'alu-4');
    await u.click(await screen.findByRole('radio', { name: /bajar de peso/i }));
    await u.type(screen.getByLabelText(/peso actual/i), '90');
    await u.type(screen.getByLabelText(/peso al que querés llegar/i), '80');
    await u.click(screen.getByRole('button', { name: 'Empezar' }));
    expect(await screen.findByRole('heading', { name: /todavía no tenés plan/i })).toBeInTheDocument();
    expect(servidor.datos.alumnos.find((a) => a.id === 'alu-4')?.meta).toMatchObject({ objetivo: 'BAJAR_PESO', pesoActualKg: 90, pesoIdealKg: 80 });
  });
});

describe('alumno: sesión', () => {
  it('registra una serie, ofrece usar la sesión anterior y cierra con esfuerzo', async () => {
    const u = userEvent.setup();
    montar('/alumno', 'alu-1');
    await u.click(await screen.findByRole('button', { name: /empezar día/i }));

    expect(await screen.findByRole('heading', { name: /serie 1 de/i })).toBeInTheDocument();
    expect(screen.getByText(/la vez anterior:/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /usar lo de la vez anterior/i })).toBeInTheDocument();
    // Press de banca usa barra: se muestra qué discos cargar.
    expect(screen.getByText(/en cada lado:/i)).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: 'Guardar serie' }));

    const abierta = await waitFor(() => {
      const s = servidor.datos.sesiones.find((x) => x.alumnoId === 'alu-1' && !x.cerradaEn)!;
      expect(s.ejercicios.flatMap((e) => e.series)).toHaveLength(1);
      return s;
    });

    // El descanso aparece tras la serie; se puede saltar.
    await u.click(await screen.findByRole('button', { name: 'Saltar descanso' }));
    expect(screen.getByRole('heading', { name: /serie 2 de/i })).toBeInTheDocument();

    await u.click(screen.getByRole('button', { name: 'Terminar sesión' }));
    await u.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    expect(await screen.findByText('Indicá cuánto te costó la sesión.')).toBeInTheDocument();

    await u.click(screen.getByRole('button', { name: /^6:/ }));
    expect(screen.getByText(/te quedaban unas 4 repeticiones/i)).toBeInTheDocument();
    await u.type(screen.getByRole('textbox'), 'Molestia leve en el hombro');
    await u.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    expect(await screen.findByText('Sesión cerrada')).toBeInTheDocument();
    const cerrada = servidor.datos.sesiones.find((s) => s.id === abierta.id)!;
    expect(cerrada).toMatchObject({ esfuerzo: 6, comentario: 'Molestia leve en el hombro' });
    expect(cerrada.cerradaEn).toBeTruthy();
  });
});

describe('entrenador: plan', () => {
  it('no asigna un plan vacío, muestra qué falta y no llama al servidor', async () => {
    const u = userEvent.setup();
    montar('/entrenador/alumnos/alu-4/plan/nuevo', 'ent-1');
    await u.click(await screen.findByRole('button', { name: /asignar a joaquín/i }));
    const alerta = screen.getAllByRole('alert')[0];
    expect(within(alerta).getByText('Poné un nombre al plan.')).toBeInTheDocument();
    expect(within(alerta).getByText('El Día 1 no tiene ejercicios.')).toBeInTheDocument();
    expect(servidor.pedidos.some((p) => p.ruta === '/planes')).toBe(false);
  });

  it('arma un plan de 3 días distintos y lo asigna en el servidor', async () => {
    const u = userEvent.setup();
    montar('/entrenador/alumnos/alu-4/plan/nuevo', 'ent-1');
    await u.type(await screen.findByLabelText('Nombre del plan'), 'Inicio');

    const elegir = async (dia: number, ejercicio: string) => {
      const columna = screen.getByRole('region', { name: `Día ${dia}` });
      await u.click(within(columna).getByRole('button', { name: 'Agregar ejercicio' }));
      const dialogo = screen.getByRole('dialog');
      await u.click(within(dialogo).getByRole('button', { name: new RegExp(ejercicio) }));
    };
    await elegir(1, 'Press de banca');
    await elegir(2, 'Sentadilla');
    await elegir(3, 'Remo con barra');

    await u.click(screen.getByRole('button', { name: /asignar a joaquín/i }));
    await waitFor(() => {
      const plan = servidor.datos.planes.find((p) => p.alumnoId === 'alu-4');
      expect(plan).toMatchObject({ nombre: 'Inicio', estado: 'ACTIVO' });
      expect(plan?.dias.map((d) => d.items.length)).toEqual([1, 1, 1]);
    });
  });

  it('avisa si dos días son iguales', async () => {
    const u = userEvent.setup();
    montar('/entrenador/alumnos/alu-4/plan/nuevo', 'ent-1');
    await u.type(await screen.findByLabelText('Nombre del plan'), 'Repetido');
    const col1 = screen.getByRole('region', { name: 'Día 1' });
    await u.click(within(col1).getByRole('button', { name: 'Agregar ejercicio' }));
    await u.click(within(screen.getByRole('dialog')).getByRole('button', { name: /Press de banca/ }));
    for (const dia of [2, 3]) {
      await u.click(within(screen.getByRole('region', { name: `Día ${dia}` })).getByRole('button', { name: /copiar del día 1/i }));
    }
    await u.click(screen.getByRole('button', { name: /asignar a joaquín/i }));
    expect(screen.getAllByText(/es igual al Día 1/).length).toBeGreaterThan(0);
  });
});
