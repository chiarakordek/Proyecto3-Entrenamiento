import { Body, Controller, Get, Post, Put, Query } from '@nestjs/common';
import { Roles, UsuarioActual, type UsuarioToken } from '../auth/decoradores';
import { AlumnosService } from './alumnos.service';
import { AltaAlumnoDto, EmailDto, MetaDto } from './dto';

@Controller()
export class AlumnosController {
  constructor(private readonly alumnos: AlumnosService) {}

  @Roles('ENTRENADOR')
  @Post('alumnos')
  alta(@UsuarioActual() u: UsuarioToken, @Body() dto: AltaAlumnoDto) {
    return this.alumnos.alta(u.id, dto);
  }

  @Roles('ENTRENADOR')
  @Get('alumnos/buscar')
  async buscar(@UsuarioActual() u: UsuarioToken, @Query() q: EmailDto) {
    return { alumno: await this.alumnos.buscar(u.id, q.email) };
  }

  @Roles('ENTRENADOR')
  @Post('alumnos/vincular')
  vincular(@UsuarioActual() u: UsuarioToken, @Body() dto: EmailDto) {
    return this.alumnos.vincular(u.id, dto.email);
  }

  @Roles('ALUMNO')
  @Put('yo/meta')
  meta(@UsuarioActual() u: UsuarioToken, @Body() dto: MetaDto) {
    return this.alumnos.definirMeta(u.id, dto);
  }
}
