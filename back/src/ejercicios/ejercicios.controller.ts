import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put } from '@nestjs/common';
import { Roles } from '../auth/decoradores';
import { EjercicioDto } from './dto';
import { EjerciciosService } from './ejercicios.service';

@Controller('ejercicios')
export class EjerciciosController {
  constructor(private readonly ejercicios: EjerciciosService) {}

  @Get()
  listar() {
    return this.ejercicios.listar();
  }

  @Roles('ENTRENADOR')
  @Post()
  crear(@Body() dto: EjercicioDto) {
    return this.ejercicios.guardar(dto);
  }

  @Roles('ENTRENADOR')
  @Put(':id')
  modificar(@Param('id') id: string, @Body() dto: EjercicioDto) {
    return this.ejercicios.guardar(dto, id);
  }

  @Roles('ENTRENADOR')
  @Delete(':id')
  @HttpCode(204)
  eliminar(@Param('id') id: string) {
    return this.ejercicios.eliminar(id);
  }
}
