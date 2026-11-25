# Back – API del MVP de entrenamiento físico

NestJS 11 + TypeORM + MySQL, como el back del Proyecto 1. Prefijo de todas las rutas: `/api`.

## Configuración (`.env`)

Copiá `.env.example` como `.env`. Lo mínimo es `DB_USERNAME`, `DB_PASSWORD` y `JWT_SECRET`.

| Variable | Para qué |
|---|---|
| `DB_TIPO` | `mysql` (por defecto) o `sqljs` (base en memoria, para probar sin MySQL) |
| `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE` | Conexión a MySQL. La base se crea sola si no existe |
| `DB_SYNC` | `true`: crea y actualiza las tablas según las entidades al arrancar (desarrollo) |
| `JWT_SECRET`, `JWT_EXPIRA` | Firma y duración de los tokens de sesión |
| `SEMILLA_PASSWORD` | Contraseña de los usuarios de prueba |
| `PORT`, `FRONT_URL` | Puerto del back y origen permitido por CORS |

Al arrancar con la base vacía se cargan los datos de prueba. `npm run seed` los vuelve a cargar desde cero.

## Modelo

Cuatro tablas: `usuarios` (entrenadores y alumnos, con su objetivo e historial de peso), `ejercicios`, `planes` y `sesiones`. Los 3 días de un plan, y las series de una sesión, se guardan como JSON dentro de su fila: son agregados que siempre se leen y escriben enteros, y así la API devuelve exactamente la forma que usa el front.

Las reglas del documento están en `src/dominio/reglas.ts` (la misma copia que `front/src/domain/reglas.ts`): el front las usa para avisar al instante y el back para que no se puedan saltear.

## Seguridad

- Login con email y contraseña (bcrypt). El token (JWT) va en `Authorization: Bearer ...`.
- Todas las rutas requieren sesión, salvo login y registro.
- El entrenador solo ve y modifica a sus alumnos, sus planes y las sesiones de esos alumnos. El alumno, solo lo suyo.
- Una sesión cerrada no se puede modificar (registro inmutable).
- Los planes se reconstruyen en el servidor solo con los campos conocidos: lo que sobra en el cuerpo se descarta.

## Rutas

| Método y ruta | Quién | Qué hace |
|---|---|---|
| `POST /auth/login` | Cualquiera | Email y contraseña → `{ token, usuario }` |
| `POST /auth/registro` | Cualquiera | Crea una cuenta de alumno (sin entrenador) |
| `GET /auth/yo` | Con sesión | Usuario actual |
| `GET /datos` | Con sesión | Todo lo que el usuario puede ver, en una respuesta |
| `POST /alumnos` | Entrenador | Da de alta un alumno con contraseña inicial |
| `GET /alumnos/buscar?email=` | Entrenador | Busca un alumno para vincular (y si ya tiene entrenador) |
| `POST /alumnos/vincular` | Entrenador | Vincula un alumno sin entrenador |
| `PUT /yo/meta` | Alumno | Objetivo y peso (se suma al historial de peso) |
| `GET /ejercicios` | Con sesión | Catálogo |
| `POST /ejercicios`, `PUT /ejercicios/:id`, `DELETE /ejercicios/:id` | Entrenador | Alta, modificación y baja (solo si nunca se usó) |
| `POST /planes` | Entrenador | Crea o edita un plan; `asignar: true` lo activa; `otrosAlumnoIds` asigna copias |
| `POST /sesiones` | Alumno | Inicia un día del plan activo (o devuelve la sesión abierta) |
| `POST /sesiones/:id/series` | Alumno | Registra una serie |
| `DELETE /sesiones/:id/series/ultima?itemId=` | Alumno | Deshace la última serie de un ejercicio |
| `POST /sesiones/:id/cerrar` | Alumno | Cierra con esfuerzo (1 a 10) y comentario |
| `DELETE /sesiones/:id` | Alumno | Descarta una sesión abierta |

Los errores de reglas responden 400 con `{ mensaje, errores: [{ campo, mensaje }] }`.

## Tests

`npm test`: reglas del dominio (`src/**/*.spec.ts`) y la API completa contra una base en memoria (`test/api.e2e-spec.ts`): login, permisos por rol, planes, sesiones, vincular, objetivo y catálogo.
