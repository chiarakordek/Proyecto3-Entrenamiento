/**
 * `npm run seed`: borra todos los datos y vuelve a cargar los de prueba.
 * Útil después de probar mucho; no se usa en producción.
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { prepararBase } from '../config/base-datos';
import { SembradorService } from './sembrador.service';

async function main() {
  await prepararBase();
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  await app.get(SembradorService).reiniciar();
  await app.close();
  console.log('Datos de prueba recargados.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
