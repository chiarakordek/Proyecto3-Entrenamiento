// Arma back/.env de forma guiada: pregunta los datos de tu MySQL, prueba la conexión,
// crea la base si no existe y genera la clave de sesión. Uso: npm run configurar
//
// El .env es personal (cada uno tiene su MySQL): no se sube al repo.

import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { createConnection } from 'mysql2/promise';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const rutaEnv = join(raiz, '.env');
const rutaEjemplo = join(raiz, '.env.example');

const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: process.stdin.isTTY });

// Lee las líneas de a una (sirve tanto escribiendo como con la entrada redirigida).
const pendientes = [];
let esperando = null;
rl.on('line', (l) => (esperando ? (esperando(l), (esperando = null)) : pendientes.push(l)));
const leerLinea = () => new Promise((r) => (pendientes.length ? r(pendientes.shift()) : (esperando = r)));

let ocultar = false;
const escribirOriginal = rl._writeToOutput?.bind(rl);
if (escribirOriginal) rl._writeToOutput = (s) => escribirOriginal(ocultar && !/[\r\n]/.test(s) ? '*'.repeat(s.length) : s);

async function preguntar(texto, defecto = '', { secreto = false } = {}) {
  process.stdout.write(`${texto}${defecto ? ` [${defecto}]` : ''}: `);
  ocultar = secreto && process.stdin.isTTY;
  const r = (await leerLinea()).trim();
  ocultar = false;
  return r || defecto;
}

async function main() {
  console.log('\nConfiguración del back del Proyecto 3');
  console.log('Te voy a pedir los datos de TU MySQL (los mismos que usás en Workbench o phpMyAdmin).\n');

  if (existsSync(rutaEnv)) {
    const r = await preguntar('Ya existe un back/.env. ¿Lo reemplazo? (s/n)', 'n');
    if (!/^s/i.test(r)) {
      console.log('No cambié nada.');
      return 0;
    }
  }

  const host = await preguntar('Servidor de MySQL', 'localhost');
  const puerto = await preguntar('Puerto', '3306');
  const usuario = await preguntar('Usuario', 'root');
  const password = await preguntar('Contraseña (no se muestra)', '', { secreto: true });
  const base = await preguntar('Nombre de la base', 'proyecto3_entrenamiento');

  if (!/^[A-Za-z0-9_]+$/.test(base)) {
    console.error('\nEl nombre de la base solo puede tener letras, números y guion bajo.');
    return 1;
  }

  console.log('\nProbando la conexión...');
  try {
    const conexion = await createConnection({ host, port: Number(puerto), user: usuario, password, connectTimeout: 8000 });
    await conexion.query(`CREATE DATABASE IF NOT EXISTS \`${base}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await conexion.end();
    console.log(`Conexión correcta. La base "${base}" está lista.`);
  } catch (e) {
    const motivos = {
      ER_ACCESS_DENIED_ERROR: 'MySQL rechazó el usuario o la contraseña. Revisalos y volvé a correr npm run configurar.',
      ECONNREFUSED: `No hay un MySQL escuchando en ${host}:${puerto}. Revisá que el servicio esté iniciado y el puerto.`,
      ENOTFOUND: `No encuentro el servidor "${host}".`,
      ETIMEDOUT: `El servidor ${host}:${puerto} no respondió.`,
    };
    console.error(`\nNo pude conectarme: ${motivos[e.code] ?? e.message}`);
    console.error('No escribí el .env.');
    return 1;
  }

  // Parte del .env.example para conservar comentarios y valores por defecto.
  const valores = {
    DB_TIPO: 'mysql',
    DB_HOST: host,
    DB_PORT: puerto,
    DB_USERNAME: usuario,
    DB_PASSWORD: password,
    DB_DATABASE: base,
    JWT_SECRET: randomBytes(32).toString('hex'),
  };
  const ejemplo = readFileSync(rutaEjemplo, 'utf8');
  const contenido = ejemplo
    .split(/\r?\n/)
    .map((linea) => {
      const m = linea.match(/^([A-Z_]+)=/);
      return m && m[1] in valores ? `${m[1]}=${valores[m[1]]}` : linea;
    })
    .join('\n');
  writeFileSync(rutaEnv, contenido, 'utf8');

  console.log('\nListo: escribí back/.env (es tuyo, no se sube al repo).');
  console.log('Ahora levantá el back con:  npm run start:dev');
  console.log('La primera vez crea las tablas y carga los datos de prueba.\n');
  return 0;
}

main()
  .then((codigo) => {
    rl.close();
    process.exit(codigo);
  })
  .catch((e) => {
    console.error(e);
    rl.close();
    process.exit(1);
  });
