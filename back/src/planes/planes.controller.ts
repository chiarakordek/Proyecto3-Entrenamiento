import { Body, Controller, Post } from '@nestjs/common';
import { Roles, UsuarioActual, type UsuarioToken } from '../auth/decoradores';
import { GuardarPlanDto } from './dto';
import { PlanesService } from './planes.service';

@Controller('planes')
export class PlanesController {
  constructor(private readonly planes: PlanesService) {}

  /** Crea o edita un plan; con asignar=true lo activa (para el alumno y, si se piden, otros). */
  @Roles('ENTRENADOR')
  @Post()
  async guardar(@UsuarioActual() u: UsuarioToken, @Body() dto: GuardarPlanDto) {
    return { planes: await this.planes.guardar(u.id, dto) };
  }
}
