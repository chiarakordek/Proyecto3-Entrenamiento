import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { prepararBase } from './config/base-datos';
import { configurarApp } from './configurar';

async function arrancar() {
  // AppModule ya cargó el .env (ConfigModule.forRoot), así que acá están las credenciales.
  await prepararBase();
  const app = await NestFactory.create(AppModule);
  configurarApp(app);
  const puerto = Number(process.env.PORT || 3010);
  await app.listen(puerto);
  new Logger('API').log(`Lista en http://localhost:${puerto}/api (base: ${process.env.DB_TIPO || 'mysql'})`);
}

arrancar().catch((e: Error & { code?: string }) => {
  const log = new Logger('API');
  if (e.code === 'ER_ACCESS_DENIED_ERROR') log.error('MySQL rechazó el usuario o la contraseña: revisá DB_USERNAME y DB_PASSWORD en back/.env.');
  else if (e.code === 'ECONNREFUSED') log.error('No se pudo conectar a MySQL: revisá que esté corriendo y DB_HOST/DB_PORT en back/.env.');
  else log.error(e.message);
  process.exit(1);
});
