import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { errorDeValidacion } from './comun/errores';

/** Configuración común del servidor y de los tests e2e. */
export function configurarApp(app: INestApplication) {
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: errorDeValidacion,
    }),
  );
  app.enableCors({ origin: process.env.FRONT_URL || 'http://localhost:5174' });
}
