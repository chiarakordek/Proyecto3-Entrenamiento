import { Body, Controller, Delete, HttpCode, Param, Post, Query } from '@nestjs/common';
import { Roles, UsuarioActual, type UsuarioToken } from '../auth/decoradores';
import { error } from '../comun/errores';
import { CerrarSesionDto, IniciarSesionDto, SerieDto } from './dto';
import { SesionesService } from './sesiones.service';

/** Registro en vivo del alumno: iniciar, anotar series, deshacer, cerrar o descartar. */
@Roles('ALUMNO')
@Controller('sesiones')
export class SesionesController {
  constructor(private readonly sesiones: SesionesService) {}

  @Post()
  iniciar(@UsuarioActual() u: UsuarioToken, @Body() dto: IniciarSesionDto) {
    return this.sesiones.iniciar(u.id, dto.planId, dto.dia);
  }

  @Post(':id/series')
  serie(@UsuarioActual() u: UsuarioToken, @Param('id') id: string, @Body() dto: SerieDto) {
    return this.sesiones.registrarSerie(u.id, id, dto);
  }

  @Delete(':id/series/ultima')
  deshacer(@UsuarioActual() u: UsuarioToken, @Param('id') id: string, @Query('itemId') itemId: string) {
    if (!itemId) throw error('itemId', 'Falta el ejercicio.');
    return this.sesiones.deshacerSerie(u.id, id, itemId);
  }

  @Post(':id/cerrar')
  @HttpCode(200)
  cerrar(@UsuarioActual() u: UsuarioToken, @Param('id') id: string, @Body() dto: CerrarSesionDto) {
    return this.sesiones.cerrar(u.id, id, dto.esfuerzo, dto.comentario);
  }

  @Delete(':id')
  @HttpCode(204)
  descartar(@UsuarioActual() u: UsuarioToken, @Param('id') id: string) {
    return this.sesiones.descartar(u.id, id);
  }
}
