import { Controller, Get } from '@nestjs/common';
import { UsuarioActual, type UsuarioToken } from '../auth/decoradores';
import { DatosService } from './datos.service';

@Controller('datos')
export class DatosController {
  constructor(private readonly datos: DatosService) {}

  /** Todo lo que el usuario puede ver, para cargar la app de una vez. */
  @Get()
  de(@UsuarioActual() u: UsuarioToken) {
    return this.datos.de(u);
  }
}
