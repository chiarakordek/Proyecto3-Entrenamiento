import { IsEmail, IsIn, IsNumber, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import type { Objetivo } from '../dominio/tipos';

export class AltaAlumnoDto {
  @IsString()
  @MinLength(2, { message: 'Ingresá el nombre del alumno.' })
  @MaxLength(120, { message: 'El nombre es demasiado largo.' })
  nombre: string;

  @IsEmail({}, { message: 'Ingresá un email válido.' })
  email: string;

  /** Contraseña inicial con la que el alumno va a entrar (se la pasa el entrenador). */
  @IsString()
  @MinLength(8, { message: 'La contraseña inicial tiene que tener al menos 8 caracteres.' })
  @MaxLength(72, { message: 'La contraseña es demasiado larga.' })
  password: string;
}

export class EmailDto {
  @IsEmail({}, { message: 'Ingresá un email válido.' })
  email: string;
}

export class MetaDto {
  @IsIn(['BAJAR_PESO', 'HIPERTROFIA', 'FUERZA', 'SALUD_GENERAL'], { message: 'Elegí un objetivo.' })
  objetivo: Objetivo;

  @IsNumber({}, { message: 'El peso actual es obligatorio.' })
  pesoActualKg: number;

  @IsOptional()
  @IsNumber({}, { message: 'El peso ideal tiene que ser un número.' })
  pesoIdealKg?: number;
}
