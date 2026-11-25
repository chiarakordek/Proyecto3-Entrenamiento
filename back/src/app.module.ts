import { randomBytes } from 'node:crypto';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlumnosController } from './alumnos/alumnos.controller';
import { AlumnosService } from './alumnos/alumnos.service';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { GuardiaRoles, GuardiaSesion } from './auth/guardias';
import { ENTIDADES, opcionesTypeOrm } from './config/base-datos';
import { DatosController } from './datos/datos.controller';
import { DatosService } from './datos/datos.service';
import { EjerciciosController } from './ejercicios/ejercicios.controller';
import { EjerciciosService } from './ejercicios/ejercicios.service';
import { PlanesController } from './planes/planes.controller';
import { PlanesService } from './planes/planes.service';
import { SembradorService } from './semilla/sembrador.service';
import { SesionesController } from './sesiones/sesiones.controller';
import { SesionesService } from './sesiones/sesiones.service';

function secretoJwt(): string {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  // Sin JWT_SECRET se usa uno al azar: anda, pero las sesiones se pierden al reiniciar el back.
  new Logger('Auth').warn('Falta JWT_SECRET en .env: se usa uno temporal.');
  return randomBytes(32).toString('hex');
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({ useFactory: opcionesTypeOrm }),
    TypeOrmModule.forFeature(ENTIDADES),
    JwtModule.registerAsync({
      useFactory: () => ({ secret: secretoJwt(), signOptions: { expiresIn: (process.env.JWT_EXPIRA || '7d') as `${number}d` } }),
    }),
  ],
  controllers: [AuthController, DatosController, AlumnosController, EjerciciosController, PlanesController, SesionesController],
  providers: [
    AuthService,
    DatosService,
    AlumnosService,
    EjerciciosService,
    PlanesService,
    SesionesService,
    SembradorService,
    { provide: APP_GUARD, useClass: GuardiaSesion },
    { provide: APP_GUARD, useClass: GuardiaRoles },
  ],
})
export class AppModule {}
