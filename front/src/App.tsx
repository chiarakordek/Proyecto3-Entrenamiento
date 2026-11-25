import { BrowserRouter, MemoryRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ProveedorUsuario, useUsuario } from '@/lib/sesion-usuario';
import { IngresoPage } from '@/features/ingreso/IngresoPage';
import { LayoutEntrenador } from '@/features/entrenador/LayoutEntrenador';
import { AlumnosPage } from '@/features/entrenador/AlumnosPage';
import { AlumnoDetallePage } from '@/features/entrenador/AlumnoDetallePage';
import { PlanEditorPage } from '@/features/entrenador/PlanEditorPage';
import { CatalogoPage } from '@/features/entrenador/CatalogoPage';
import { SesionRevisionPage } from '@/features/entrenador/SesionRevisionPage';
import { LayoutAlumno } from '@/features/alumno/LayoutAlumno';
import { HoyPage } from '@/features/alumno/HoyPage';
import { ObjetivoPage } from '@/features/alumno/ObjetivoPage';
import { MiPlanPage } from '@/features/alumno/MiPlanPage';
import { SesionEnCursoPage } from '@/features/alumno/SesionEnCursoPage';
import { HistorialPage } from '@/features/alumno/HistorialPage';
import { ResumenMesPage } from '@/features/alumno/ResumenMesPage';
import { AprenderPage } from '@/features/alumno/AprenderPage';
import { CapaFestejo } from '@/ui/Festejo';

/** Mientras se recupera una sesión guardada (token) y se cargan los datos del back. */
function Cargando() {
  return (
    <div className="grid min-h-dvh place-items-center bg-goma text-white" role="status">
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-1.5" aria-hidden>
          {['bg-superior', 'bg-inferior', 'bg-media', 'bg-cardio'].map((c, i) => (
            <span key={c} className={`h-9 w-2.5 animate-pulse rounded-full ${c}`} style={{ animationDelay: `${i * 120}ms` }} />
          ))}
        </div>
        <p className="text-tiza/80">Cargando tu plan…</p>
      </div>
    </div>
  );
}

function Inicio() {
  const { estado, entrenador, alumno } = useUsuario();
  if (estado === 'cargando') return <Cargando />;
  if (entrenador) return <Navigate to="/entrenador" replace />;
  if (alumno) return <Navigate to="/alumno" replace />;
  return <IngresoPage />;
}

function SoloEntrenador() {
  const { estado, entrenador } = useUsuario();
  if (estado === 'cargando') return <Cargando />;
  return entrenador ? <LayoutEntrenador /> : <Navigate to="/" replace />;
}

function SoloAlumno() {
  const { estado, alumno } = useUsuario();
  if (estado === 'cargando') return <Cargando />;
  return alumno ? <LayoutAlumno /> : <Navigate to="/" replace />;
}

export function Rutas() {
  return (
    <Routes>
      <Route path="/" element={<Inicio />} />
      <Route path="/entrenador" element={<SoloEntrenador />}>
        <Route index element={<AlumnosPage />} />
        <Route path="alumnos/:alumnoId" element={<AlumnoDetallePage />} />
        <Route path="alumnos/:alumnoId/plan/nuevo" element={<PlanEditorPage />} />
        <Route path="planes/:planId" element={<PlanEditorPage />} />
        <Route path="sesiones/:sesionId" element={<SesionRevisionPage />} />
        <Route path="catalogo" element={<CatalogoPage />} />
      </Route>
      <Route path="/alumno" element={<SoloAlumno />}>
        <Route index element={<HoyPage />} />
        <Route path="objetivo" element={<ObjetivoPage />} />
        <Route path="plan" element={<MiPlanPage />} />
        <Route path="sesion" element={<SesionEnCursoPage />} />
        <Route path="historial" element={<HistorialPage />} />
        <Route path="resumen" element={<ResumenMesPage />} />
        <Route path="aprender" element={<AprenderPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/**
 * En la versión de demostración (publicada como página embebida) la navegación es interna:
 * el visor no admite rutas en la URL.
 */
const Enrutador = import.meta.env.VITE_ROUTER === 'memoria' ? MemoryRouter : BrowserRouter;

export function App() {
  return (
    <ProveedorUsuario>
      <Enrutador>
        <Rutas />
      </Enrutador>
      <CapaFestejo />
    </ProveedorUsuario>
  );
}
