import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Rutas } from '@/App';
import { __reemplazarEstado, leer } from '@/data/almacen';
import { crearSemilla } from '@/data/semilla';
import { ProveedorUsuario } from '@/lib/sesion-usuario';

function montar(ruta: string, usuarioId: string) {
  localStorage.setItem('p3-usuario', usuarioId);
  return render(
    <ProveedorUsuario>
      <MemoryRouter initialEntries={[ruta]}>
        <Rutas />
      </MemoryRouter>
    </ProveedorUsuario>,
  );
}

beforeEach(() => {
  __reemplazarEstado(crearSemilla());
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

  it('no deja seguir sin peso actual', async () => {
    const u = userEvent.setup();
    montar('/alumno/objetivo', 'alu-4');
    await u.click(await screen.findByRole('radio', { name: /fuerza/i }));
    await u.click(screen.getByRole('button', { name: 'Empezar' }));
    expect(screen.getByText('El peso actual es obligatorio.')).toBeInTheDocument();
    expect(leer().alumnos.find((a) => a.id === 'alu-4')?.meta).toBeUndefined();
  });

  it('guarda el objetivo y pasa a la pantalla de hoy', async () => {
    const u = userEvent.setup();
    montar('/alumno/objetivo', 'alu-4');
    await u.click(await screen.findByRole('radio', { name: /bajar de peso/i }));
    await u.type(screen.getByLabelText(/peso actual/i), '90');
    await u.type(screen.getByLabelText(/peso al que querés llegar/i), '80');
    await u.click(screen.getByRole('button', { name: 'Empezar' }));
    expect(leer().alumnos.find((a) => a.id === 'alu-4')?.meta).toMatchObject({ objetivo: 'BAJAR_PESO', pesoActualKg: 90, pesoIdealKg: 80 });
    expect(await screen.findByRole('heading', { name: /todavía no tenés plan/i })).toBeInTheDocument();
  });
});

describe('alumno: sesión', () => {
  it('registra una serie, autocompleta con la sesión anterior y cierra con esfuerzo', async () => {
    const u = userEvent.setup();
    montar('/alumno', 'alu-1');
    await u.click(await screen.findByRole('button', { name: /empezar día/i }));

    expect(await screen.findByRole('heading', { name: /serie 1 de/i })).toBeInTheDocument();
    expect(screen.getByText(/la vez anterior:/i)).toBeInTheDocument();
    // Press de banca usa barra: se muestra qué discos cargar.
    expect(screen.getByText(/en cada lado:/i)).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: 'Guardar serie' }));

    const abierta = leer().sesiones.find((s) => s.alumnoId === 'alu-1' && !s.cerradaEn)!;
    expect(abierta.ejercicios.flatMap((e) => e.series)).toHaveLength(1);

    // El descanso aparece tras la serie; se puede saltar.
    await u.click(screen.getByRole('button', { name: 'Saltar descanso' }));
    expect(screen.getByRole('heading', { name: /serie 2 de/i })).toBeInTheDocument();

    await u.click(screen.getByRole('button', { name: 'Terminar sesión' }));
    await u.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    expect(screen.getByText('Indicá cuánto te costó la sesión.')).toBeInTheDocument();

    await u.click(screen.getByRole('button', { name: /^6:/ }));
    expect(screen.getByText(/te quedaban unas 4 repeticiones/i)).toBeInTheDocument();
    await u.type(screen.getByRole('textbox'), 'Molestia leve en el hombro');
    await u.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    expect(await screen.findByText('Sesión cerrada')).toBeInTheDocument();
    const cerrada = leer().sesiones.find((s) => s.id === abierta.id)!;
    expect(cerrada).toMatchObject({ esfuerzo: 6, comentario: 'Molestia leve en el hombro' });
    expect(cerrada.cerradaEn).toBeTruthy();
  });
});

describe('entrenador: plan', () => {
  it('no asigna un plan vacío y muestra qué falta', async () => {
    const u = userEvent.setup();
    montar('/entrenador/alumnos/alu-4/plan/nuevo', 'ent-1');
    await u.click(await screen.findByRole('button', { name: /asignar a joaquín/i }));
    const alerta = screen.getAllByRole('alert')[0];
    expect(within(alerta).getByText('Poné un nombre al plan.')).toBeInTheDocument();
    expect(within(alerta).getByText('El Día 1 no tiene ejercicios.')).toBeInTheDocument();
    expect(leer().planes.some((p) => p.alumnoId === 'alu-4')).toBe(false);
  });

  it('arma un plan de 3 días distintos y lo asigna', async () => {
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
    const plan = leer().planes.find((p) => p.alumnoId === 'alu-4');
    expect(plan).toMatchObject({ nombre: 'Inicio', estado: 'ACTIVO' });
    expect(plan?.dias.map((d) => d.items.length)).toEqual([1, 1, 1]);
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
