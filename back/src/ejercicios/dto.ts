import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import type { GrupoMuscular, Medicion } from '../dominio/tipos';

export class EjercicioDto {
  @IsString({ message: 'Ingresá el nombre.' })
  @MaxLength(120, { message: 'El nombre es demasiado largo.' })
  nombre: string;

  @IsString({ message: 'Describí la técnica.' })
  @MaxLength(2000, { message: 'La descripción es demasiado larga.' })
  descripcion: string;

  @IsString({ message: 'Elegí un grupo muscular.' })
  grupo: GrupoMuscular;

  @IsIn(['REPETICIONES', 'TIEMPO'], { message: 'Elegí si se mide por repeticiones o por tiempo.' })
  medicion: Medicion;

  @IsOptional()
  @IsString()
  @MaxLength(80, { message: 'El equipo es demasiado largo.' })
  equipo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'El link es demasiado largo.' })
  videoUrl?: string;
}
