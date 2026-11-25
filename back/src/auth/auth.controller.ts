import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Publico, UsuarioActual, type UsuarioToken } from './decoradores';
import { LoginDto, RegistroDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Publico()
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  /** Registro de alumnos. Los entrenadores se crean por semilla o por administración. */
  @Publico()
  @Post('registro')
  registro(@Body() dto: RegistroDto) {
    return this.auth.registro(dto);
  }

  @Get('yo')
  yo(@UsuarioActual() usuario: UsuarioToken) {
    return this.auth.yo(usuario.id);
  }
}
