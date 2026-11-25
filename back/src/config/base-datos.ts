import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { createConnection } from 'mysql2/promise';
import { EjercicioEntidad } from '../entidades/ejercicio.entidad';
import { PlanEntidad } from '../entidades/plan.entidad';
import { SesionEntidad } from '../entidades/sesion.entidad';
import { UsuarioEntidad } from '../entidades/usuario.entidad';

export const ENTIDADES = [UsuarioEntidad, EjercicioEntidad, PlanEntidad, SesionEntidad];

const env = (clave: string, defecto = '') => process.env[clave] ?? defecto;

/**
 * mysql: el MySQL configurado en .env.
 * sqljs: base en memoria (se pierde al cerrar). Sirve para los tests y para probar sin MySQL.
 */
export function opcionesTypeOrm(): TypeOrmModuleOptions {
  if (env('DB_TIPO', 'mysql') === 'sqljs') {
    return { type: 'sqljs', entities: ENTIDADES, synchronize: true, autoSave: false, logging: false };
  }
  return {
    type: 'mysql',
    host: env('DB_HOST', 'localhost'),
    port: Number(env('DB_PORT', '3306')),
    username: env('DB_USERNAME', 'root'),
    password: env('DB_PASSWORD'),
    database: env('DB_DATABASE', 'proyecto3_entrenamiento'),
    charset: 'utf8mb4',
    entities: ENTIDADES,
    synchronize: env('DB_SYNC', 'true') !== 'false',
    logging: false,
  };
}

/** Crea la base en MySQL si todavía no existe, así alcanza con completar el usuario y la contraseña. */
export async function prepararBase(): Promise<void> {
  if (env('DB_TIPO', 'mysql') !== 'mysql') return;
  const nombre = env('DB_DATABASE', 'proyecto3_entrenamiento');
  if (!/^[A-Za-z0-9_]+$/.test(nombre)) {
    throw new Error('DB_DATABASE solo puede tener letras, números y guion bajo.');
  }
  const conexion = await createConnection({
    host: env('DB_HOST', 'localhost'),
    port: Number(env('DB_PORT', '3306')),
    user: env('DB_USERNAME', 'root'),
    password: env('DB_PASSWORD'),
  });
  try {
    await conexion.query(`CREATE DATABASE IF NOT EXISTS \`${nombre}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  } finally {
    await conexion.end();
  }
}
