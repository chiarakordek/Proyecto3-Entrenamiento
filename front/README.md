# Proyecto 3 – Front del MVP de entrenamiento físico

Front para que el entrenador arme planes de 3 días y el alumno registre cada serie. Necesita el back (`../back`) corriendo: ver el [README de la raíz](../README.md).

```powershell
npm install
npm run dev      # http://localhost:5174 (le pasa /api al back en :3010)
npm test         # reglas, métricas, capa HTTP y flujos de pantallas
npm run build
```

## Qué hay

**Entrenador** (escritorio)
- `/entrenador`: lista de alumnos con estado de adherencia (barra verde, amarilla o roja según días sin entrenar), próximo día, último feedback y alta de alumno.
- `/entrenador/alumnos/:id`: objetivo y peso, plan activo en 3 columnas, sesiones con cumplimiento, mejores marcas.
- `/entrenador/alumnos/:id/plan/nuevo` y `/entrenador/planes/:id`: editor del plan (3 días fijos, orden, series, reps o tiempo, carga, descanso y notas). Valida las reglas del dominio antes de asignar.
- `/entrenador/alumnos/:id` también muestra el gráfico de evolución de cargas por ejercicio y los logros del alumno.
- `/entrenador/sesiones/:id`: lo prescrito contra lo realizado, con el esfuerzo y el comentario del alumno, y un acceso para ajustar cargas o sustituir ejercicios del plan.
- `/entrenador/catalogo`: catálogo precargado, con alta, edición y la ficha animada de cada ejercicio (punto todavía a definir con el cliente).

**Alumno** (celular)
- `/alumno/objetivo`: objetivo y peso actual. El peso ideal aparece solo si el objetivo es bajar de peso.
- `/alumno`: el día que toca (con su composición por categoría y duración estimada), la semana y el recorrido del día.
- `/alumno/sesion`: registro serie por serie con autocompletado, animación de cómo se hace, barra con discos, descanso con cuenta regresiva y cierre con esfuerzo y comentario. Al cerrar: logros, récords, trompeta y papelitos.
- `/alumno/aprender`: guía de ejercicios por categoría con el mapa de colores del cuerpo y cada ejercicio animado.
- `/alumno/plan`, `/alumno/historial`, `/alumno/resumen`: plan con la ficha de cada ejercicio, historial con logros, marcas y sesiones por mes, y resumen del mes con calendario (también a definir).

## Diseño

- **Colores de la presentación**: verde pino `#0F3D2E` y menta `#EAF5EE` de base; las categorías con los colores de la diapositiva 3 (tren superior verde, tren inferior azul petróleo, zona media amarillo, cardio rojo coral). El semáforo (éxito, aviso, peligro) tiene tokens propios. Todo en `tailwind.config.js` y `src/ui/colores.ts`.
- **Tipografía**: Archivo (variable, con eje de ancho). Títulos y números expandidos (`.marcador`), texto en ancho normal.
- **Animaciones de ejercicios** (`src/domain/animaciones.ts` + `src/ui/AnimacionEjercicio.tsx`): una figura articulada en SVG interpola entre poses clave; la parte que trabaja se pinta del color de su categoría y cada fase muestra su indicación. Hay 30 patrones de movimiento; los ejercicios nuevos usan uno según su grupo muscular.
- **Didáctico**: glosario tocable (`<Termino>`), mapa del cuerpo por categoría (`MapaMuscular`), barra con los discos a cargar, escala de esfuerzo explicada, tarjetas "Cómo funciona" y lista de reglas en el editor de planes.
- **Logros** (`src/domain/logros.ts`): 12 logros calculados del historial, con progreso visible.
- **Festejo**: papelitos en canvas (`src/ui/Festejo.tsx`, `festejar()`), respetan "reducir movimiento".
- **Sonido**: sintetizado con Web Audio (`src/lib/sonido.ts`), incluida la trompeta de victoria. Se silencia con el botón del parlante.

## Estructura

```
src/domain/    tipos, clasificación y reglas del dominio (sin React; con tests)
src/data/      semilla, almacén local y api.ts (casos de uso)
src/features/  pantallas por rol
src/ui/        componentes compartidos
```

## Datos y back

Nada se guarda en el navegador salvo el token de sesión. Al entrar, `GET /api/datos` trae todo lo que el usuario puede ver y queda en una copia en memoria (`src/data/almacen.ts`). Cada operación de `src/data/api.ts` llama al back y actualiza esa copia con la respuesta.

Las reglas de `src/domain/reglas.ts` se validan acá para avisar al instante y el back las vuelve a validar (`back/src/dominio/reglas.ts` es la misma copia).

Los tests de pantallas usan un servidor falso (`src/test/servidor-falso.ts`) con los mismos datos de prueba que el back. Las reglas y permisos reales se prueban en `back/test`.
