import { IsIn, IsInt, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import type { NumeroDia } from '../dominio/tipos';

export class IniciarSesionDto {
  @IsString({ message: 'Falta el plan.' })
  planId: string;

  @IsIn([1, 2, 3], { message: 'El día tiene que ser 1, 2 o 3.' })
  dia: NumeroDia;
}

export class SerieDto {
  @IsString({ message: 'Falta el ejercicio.' })
  itemId: string;

  @IsOptional()
  @IsNumber({}, { message: 'El peso tiene que ser un número.' })
  pesoKg?: number;

  @IsOptional()
  @IsInt({ message: 'Las repeticiones tienen que ser un número entero.' })
  repeticiones?: number;

  @IsOptional()
  @IsInt({ message: 'El tiempo tiene que ser un número entero de segundos.' })
  tiempoSeg?: number;
}

export class CerrarSesionDto {
  @IsOptional()
  @IsInt({ message: 'El esfuerzo va de 1 a 10.' })
  esfuerzo?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'El comentario puede tener hasta 500 caracteres.' })
  comentario?: string;
}
