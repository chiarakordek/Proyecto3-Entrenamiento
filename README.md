# Proyecto 3 – MVP de entrenamiento físico

El entrenador arma planes de 3 días y los asigna; el alumno registra cada serie y cierra con su esfuerzo y comentarios; el entrenador compara lo prescrito con lo real.

```
front/   React 19 + TypeScript + Vite + Tailwind   (la app)
back/    NestJS 11 + TypeORM + MySQL               (la API: /api)
```

## Cómo levantarlo

Necesitás Node 20 o más y un MySQL corriendo.

**1. Back**

```powershell
cd back
npm install
copy .env.example .env
```

Abrí `back/.env` y completá `DB_USERNAME` y `DB_PASSWORD` con los de tu MySQL (y `JWT_SECRET` con cualquier texto largo). La base `proyecto3_entrenamiento` se crea sola, con sus tablas y los datos de prueba, la primera vez que arranca:

```powershell
npm run start:dev
```

Queda en http://localhost:3010/api.

**2. Front** (en otra terminal)

```powershell
cd front
npm install
npm run dev
```

Abrí http://localhost:5174. En desarrollo, el front le pasa las llamadas a `/api` al back (proxy de Vite).

### Sin MySQL

Para probar rápido, en `back/.env` poné `DB_TIPO=sqljs`: la base vive en memoria y se pierde al cerrar el back.

## Usuarios de prueba

Todos con la contraseña `entrenar123` (se cambia con `SEMILLA_PASSWORD` en `back/.env`):

| Email | Quién |
|---|---|
| martina@entrenamiento.test | Entrenadora |
| lucia@entrenamiento.test | Alumna con plan e historial |
| tomas@entrenamiento.test | Alumno que quiere bajar de peso |
| valentina@entrenamiento.test | Alumna con plan |
| joaquin@entrenamiento.test | Alumno nuevo, sin objetivo ni plan |
| sofia@entrenamiento.test | Alumna con cuenta pero sin entrenador (para probar "vincular") |

Para volver a los datos de prueba: `cd back` y `npm run seed` (borra todo y los carga de nuevo).

## Tests

```powershell
cd back;  npm test     # reglas del dominio + API completa (base en memoria)
cd front; npm test     # reglas, métricas, capa HTTP y flujos de pantallas
```

Más detalle en [back/README.md](back/README.md) y [front/README.md](front/README.md).
