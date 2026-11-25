import { ArrayMaxSize, IsArray, IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';
import type { Plan } from '../dominio/tipos';

export class GuardarPlanDto {
  /** El plan completo (3 días con sus ítems). Se limpia y valida con las reglas del dominio. */
  @IsObject({ message: 'Falta el plan.' })
  plan: Plan;

  /** true: queda activo para el alumno. false: se guarda como borrador. */
  @IsBoolean()
  asignar: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  otrosAlumnoIds?: string[];
}
