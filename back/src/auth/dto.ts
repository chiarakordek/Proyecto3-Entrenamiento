import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Ingresá un email válido.' })
  email: string;

  @IsString({ message: 'Ingresá tu contraseña.' })
  @MinLength(1, { message: 'Ingresá tu contraseña.' })
  password: string;
}

/** Registro de alumno: se crea sin entrenador; después un entrenador lo vincula por email. */
export class RegistroDto {
  @IsString()
  @MinLength(2, { message: 'Ingresá tu nombre.' })
  @MaxLength(120, { message: 'El nombre es demasiado largo.' })
  nombre: string;

  @IsEmail({}, { message: 'Ingresá un email válido.' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña tiene que tener al menos 8 caracteres.' })
  @MaxLength(72, { message: 'La contraseña es demasiado larga.' })
  password: string;
}
